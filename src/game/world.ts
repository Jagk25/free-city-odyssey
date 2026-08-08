import type { IRenderer, RenderWorldState } from '../render/renderer';
import type { Input } from '../engine/input';
import { defaultSave, load, save, type SaveGame } from '../engine/save-system';
import { advanceClock } from './world-clock';
import { advanceWeather, initialWeather, type WeatherState, WEATHER_KINDS } from './weather';
import { mulberry32 } from '../engine/rng';
import { createPlayer, updatePlayer, type Player } from './player';
import { spawnNpcs, updateNpc, type Npc } from './npc';
import { updateSeekers } from './seekers';
import { createCat, updateCat, type Cat } from './cat';
import { createRobberyState, updateRobbery, startRobbery, type RobberyState } from './events';
import { advanceMainQuest, mainQuestTarget, mainQuestTitle, sideStageLabel, sideIsDone } from './quests';
import { createCutscene, type Slide } from './cutscenes';
import { pickFragment, allCollected, FRAGMENTS } from './vision';
import type { DialogueTree } from './dialogue';
import { createRoom, moveInRoom, nearPoint, ROOM_H, type FurnItem, type RoomState } from '../interiors/interior-runtime';
import { addItem, canTrade, executeTrade, hasItem, removeItem, type Trade } from './inventory';
import type { MinigameConfig } from '../minigames/runtime';
import type { HudData } from '../ui/hud';
import buildings from '../data/buildings.json';
import interiors from '../data/interiors.json';
import trades from '../data/items.json';
import cutscenes from '../data/cutscenes.json';
import dialogueTrees from '../data/dialogue-trees.json';
import map from '../data/map.json';

const AUTOSAVE_SECONDS = 15;
const DOOR_RADIUS = 1.1;
const NPC_RADIUS = 1.4;
const PHOTO_SPOTS: readonly [number, number][] = [[1.5, 6.5], [26.5, 6.5], [13.5, 26.5]];

export interface GameUi {
  notify(msg: string): void;
  sfx(id: 'door' | 'coin' | 'fail' | 'blip' | 'fragment' | 'level' | 'alert'): void;
  openMinigame(config: MinigameConfig, onSolved: () => void, onExit: () => void): void;
  openDialogue(tree: DialogueTree, startId: string, onChoice: (fx: string | undefined) => void, onClose: () => void): void;
  playCutscene(slides: Slide[], onDone: () => void): void;
  setHud(data: HudData): void;
  drawMinimap(questTarget: { x: number; y: number } | null): void;
}

interface InteriorDef {
  id: string;
  name: string;
  color: string;
  puzzle: string;
  terminal: [number, number];
  npc: { name: string; x: number; y: number };
  item: { name: string; x: number; y: number };
  furn: [string, number, number, number, number][];
  reward: { cash?: number; rep?: number; xp?: number; energy?: number; flag?: string };
  combo?: number[];
  climax?: boolean;
}

const RIDDLES: Record<string, { q: string; a: string[]; c: number }> = {
  library: {
    q: 'I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?',
    a: ['An echo', 'A shadow', 'A river', 'A song'],
    c: 0,
  },
  museum: {
    q: 'The more of me you take, the more you leave behind. What am I?',
    a: ['Time', 'Footsteps', 'Breath', 'Memories'],
    c: 1,
  },
};

const LINEUP = {
  clues:
    'Three suspects. The evidence: the thief wore a red scarf; the thief wore NO gloves; no witness saw an umbrella. Who do you charge?',
  suspects: [
    { label: 'Rex - tall, red scarf, bare hands', guilty: true },
    { label: 'Bex - heavy gloves, slight limp', guilty: false },
    { label: 'Juno - never without an umbrella', guilty: false },
  ],
};

const QUEST_DESCS: Record<string, string> = {
  routine: 'Visit the Cafe - someone needs help.',
  glasses: 'Reach the Dev Office - a signal is calling.',
  bank: 'Head to the Bank - something is wrong.',
  garden: 'Investigate the Warehouse flicker.',
  server: 'Enter the Warehouse, solve the core.',
  done: 'Day One complete - the city is yours.',
};

export class World {
  private state: SaveGame = defaultSave();
  private weather: WeatherState = initialWeather();
  private autosave = 0;
  private readonly rng = mulberry32(Date.now() % 2147483647);

  private player: Player = createPlayer(map.playerSpawn.x, map.playerSpawn.y);
  private npcs: Npc[] = [];
  private cat: Cat = createCat();
  private robbery: RobberyState = createRobberyState();

  private mode: 'city' | 'interior' = 'city';
  private room: RoomState | null = null;
  private overlayOpen = false;
  private visionOn = false;
  private fragments: number[] = [];

  constructor(
    private readonly renderer: IRenderer,
    private readonly input: Input,
    private readonly ui: GameUi,
  ) {}

  init(): void {
    const had = load();
    const isNew = had.day === 1 && had.minute === 480 && had.quest === 'routine' && !had.flags.metMaya;
    this.state = had;
    this.player = createPlayer(this.state.player.x, this.state.player.y);
    this.npcs = spawnNpcs(this.rng);
    if (typeof this.state.flags.catHome === 'boolean') this.cat.home = this.state.flags.catHome as boolean;
    if (Array.isArray(this.state.flags.fragments)) this.fragments = this.state.flags.fragments as number[];
    if (isNew) {
      this.overlayOpen = true;
      this.ui.playCutscene(createCutscene(cutscenes.intro as Slide[]).slides, () => {
        this.overlayOpen = false;
      });
    }
  }

  setMinute(minute: number): void {
    this.state.minute = minute;
  }

  teleport(x: number, y: number): void {
    this.player.x = x;
    this.player.y = y;
    this.state.player.x = x;
    this.state.player.y = y;
  }

  setFlag(key: string, value: unknown): void {
    this.state.flags[key] = value;
  }

  npcPositions(): { id: string; x: number; y: number }[] {
    return this.npcs.map((n) => ({ id: n.def.id, x: n.x, y: n.y }));
  }

  debugStartRobbery(): void {
    this.robbery = startRobbery(this.robbery);
  }

  getMode(): string {
    return this.mode;
  }

  getInventory(): string[] {
    return Object.keys(this.state.inventory);
  }

  getQuest(): string {
    return this.state.quest;
  }

  setRoomPos(x: number, y: number): void {
    if (this.room) {
      this.room.px = x;
      this.room.py = y;
    }
  }

  leaveInterior(): void {
    if (this.mode === 'interior') {
      this.mode = 'city';
      this.room = null;
    }
  }

  setWeather(kind: string): void {
    if ((WEATHER_KINDS as readonly string[]).includes(kind)) {
      this.weather = { kind: kind as WeatherState['kind'], timer: 40 };
    }
  }

  addXp(n: number): void {
    this.gainXp(n);
  }

  unlockVision(): void {
    this.state.flags.vision = true;
  }

  giveAllItems(): void {
    for (const def of interiors as InteriorDef[]) {
      if (def.item) this.state.inventory = addItem(this.state.inventory, def.item.name);
    }
  }

  replayIntro(): void {
    this.overlayOpen = true;
    this.ui.playCutscene(cutscenes.intro as Slide[], () => {
      this.overlayOpen = false;
    });
  }

  saveState(): SaveGame {
    return this.state;
  }

  playerPos(): { x: number; y: number } {
    return { x: this.player.x, y: this.player.y };
  }

  private interiorDef(id: string): InteriorDef | undefined {
    return (interiors as InteriorDef[]).find((i) => i.id === id);
  }

  private roomFurn(def: InteriorDef): FurnItem[] {
    return def.furn.map(([type, x, y, w, h]) => ({ type, x, y, w, h, blocking: type !== 'rug' }));
  }

  private enterInterior(id: string): void {
    const def = this.interiorDef(id);
    if (!def) return;
    this.mode = 'interior';
    this.room = createRoom(id);
    this.ui.sfx('door');
  }

  private minigameConfig(def: InteriorDef): MinigameConfig {
    const base = { title: def.name, desc: '' };
    switch (def.puzzle) {
      case 'memory':
        return { ...base, type: 'memory', desc: 'Watch the sequence, then repeat it.' };
      case 'lock':
        return { ...base, type: 'lock', combo: def.combo ?? [1, 2, 3], desc: `A rumor passes through your mind: the code is ${(def.combo ?? []).join('-')}.` };
      case 'wire':
        return { ...base, type: 'wire', desc: 'Connect each left node to its matching color on the right.' };
      case 'mastermind':
        return { ...base, type: 'mastermind', desc: 'Deduce the 4-digit code (digits 1-6). 6 attempts.' };
      case 'riddle':
        return { ...base, type: 'riddle', riddle: RIDDLES.library, desc: RIDDLES.library!.q };
      case 'riddle2':
        return { ...base, type: 'riddle', riddle: RIDDLES.museum, desc: RIDDLES.museum!.q };
      case 'reaction':
        return { ...base, type: 'reaction', desc: 'Stop the marker inside the green zone. Land 3 hits.' };
      case 'haggle':
        return { ...base, type: 'haggle', desc: '' };
      case 'lineup':
        return { ...base, type: 'lineup', lineup: LINEUP, desc: LINEUP.clues };
      default:
        return { ...base, type: 'memory', desc: 'Solve the terminal.' };
    }
  }

  private solveTerminal(def: InteriorDef): void {
    if (!this.state.solvedTerminals.includes(def.id)) {
      this.state.solvedTerminals.push(def.id);
    }
    const r = def.reward;
    if (r.cash) this.state.cash += r.cash;
    if (r.rep) this.state.rep += r.rep;
    if (r.energy) this.state.energy = Math.max(0, Math.min(100, this.state.energy + r.energy));
    if (r.xp) this.gainXp(r.xp);
    if (r.flag) this.state.flags[r.flag] = true;
    this.ui.sfx('coin');
    this.ui.notify(`${def.name} terminal solved!`);

    if (def.id === 'dev' && this.state.quest === 'glasses') {
      this.state.flags.vision = true;
      this.state.quest = advanceMainQuest(this.state.quest);
      this.playCine('vision');
    } else if (def.id === 'bank' && this.state.quest === 'bank') {
      this.state.quest = advanceMainQuest(this.state.quest);
    } else if (def.id === 'warehouse' && this.state.quest === 'server') {
      this.endingChoice();
    }
    save(this.state);
  }

  private playCine(id: keyof typeof cutscenes, onDone?: () => void): void {
    this.overlayOpen = true;
    this.ui.playCutscene(cutscenes[id] as Slide[], () => {
      this.overlayOpen = false;
      onDone?.();
    });
  }

  private endingChoice(): void {
    this.overlayOpen = true;
    const tree: DialogueTree = {
      start: {
        sp: 'THE CORE',
        t: 'The loop trembles, waiting for your decision. This choice is permanent.',
        c: [
          { t: 'Preserve the Loop - keep Free City safe and familiar', fx: 'endPreserve' },
          { t: 'Awaken the City - free every citizen from the loop', fx: 'endAwaken' },
        ],
      },
    };
    this.ui.openDialogue(
      tree,
      'start',
      (fx) => {
        if (fx === 'endPreserve' || fx === 'endAwaken') {
          this.state.flags.ending = fx === 'endPreserve' ? 'preserve' : 'awaken';
          this.state.quest = 'done';
          if (fx === 'endAwaken') this.state.flags.boardAwakens = true;
          this.playCine(fx);
        }
      },
      () => {
        this.overlayOpen = false;
      },
    );
  }

  private gainXp(n: number): void {
    this.state.xp += n;
    while (this.state.xp >= this.state.level * 100) {
      this.state.xp -= this.state.level * 100;
      this.state.level += 1;
      this.ui.notify(`LEVEL UP! Level ${this.state.level}`);
      this.ui.sfx('level');
    }
  }

  private applyDialogueFx(fx: string | undefined): void {
    if (!fx) return;
    for (const part of fx.split('+')) {
      if (part === 'metMaya') this.state.flags.metMaya = true;
      else if (part === 'metZed') this.state.flags.metZed = true;
      else if (part === 'rep') this.state.rep += 1;
      else if (part === 'note') {
        this.state.inventory = addItem(this.state.inventory, 'Strange Note');
        this.ui.notify('Received: Strange Note');
      } else if (part === 'ivyHint') this.gainXp(10);
    }
  }

  private openNpcDialogue(npc: Npc): void {
    this.overlayOpen = true;
    const seekerTree = (dialogueTrees as Record<string, DialogueTree>)[npc.def.seeker ?? ''];
    if (npc.seeking && seekerTree) {
      this.ui.openDialogue(seekerTree, 'start', (fx) => this.applyDialogueFx(fx), () => {
        this.overlayOpen = false;
      });
      return;
    }
    const mood =
      npc.needs.energy < 25
        ? 'Honestly? Exhausted. The loop never lets me rest.'
        : npc.needs.social < 25
          ? 'A little lonely. Most days everyone just walks past.'
          : 'Strangely good. Like something in the air is changing.';
    const lore = [
      'They say the northwest park used to be a real garden - wild, unscripted.',
      'The Architect watches through the lamps. Or so the rumor goes.',
      'The Dev Office knows more than they say. They always do.',
      'Six fragments of the First World are hidden in the city. Nobody remembers why.',
    ][Math.floor(this.rng() * 4)]!;
    const tree: DialogueTree = {
      start: {
        sp: npc.def.name,
        t: 'Oh - hello, Noa.',
        c: [
          { t: 'How are you feeling today?', next: 'mood' },
          { t: 'What do you know about this city?', next: 'lore' },
          { t: 'Just saying hi.', next: 'bye', fx: 'greet' },
        ],
      },
      mood: { sp: npc.def.name, t: mood, c: [{ t: 'Hang in there.', next: 'bye' }] },
      lore: { sp: npc.def.name, t: lore, c: [{ t: 'Interesting...', next: 'bye' }] },
      bye: { sp: npc.def.name, t: 'See you around, Noa.' },
    };
    this.ui.openDialogue(
      tree,
      'start',
      (fx) => {
        if (fx === 'greet') npc.memory = Math.min(2, npc.memory + 0.3);
      },
      () => {
        this.overlayOpen = false;
      },
    );
  }

  private applyInteriorFx(fx: string | undefined, def: InteriorDef): void {
    if (!fx) return;
    if (fx === 'questRoutine') {
      this.state.rep += 2;
      this.state.energy = Math.min(100, this.state.energy + 15);
      this.state.quest = advanceMainQuest(this.state.quest);
      this.gainXp(30);
      this.ui.notify('You stepped off the script for the first time.');
    } else if (fx === 'coffee') {
      this.state.energy = Math.min(100, this.state.energy + 10);
      this.ui.sfx('coin');
    } else if (fx === 'takeLens') {
      this.state.flags.vision = true;
      this.state.quest = advanceMainQuest(this.state.quest);
      this.gainXp(35);
      this.playCine('vision');
    } else if (fx === 'startCat') {
      this.state.side.cat = 1;
      this.ui.notify('Side quest started: find the lost cat.');
    } else if (fx === 'startPack') {
      this.state.side.pack = 1;
      this.state.inventory = addItem(this.state.inventory, 'Sealed Package');
      this.ui.notify('Side quest started: deliver the package.');
    } else if (fx === 'deliverPack') {
      this.state.inventory = removeItem(this.state.inventory, 'Sealed Package');
      this.state.side.pack = 2;
      this.state.cash += 10;
      this.gainXp(25);
      this.ui.sfx('coin');
    } else if (fx === 'startPhoto') {
      this.state.side.photo = 1;
      this.ui.notify('Side quest started: find 3 glowing photo spots.');
    } else if (fx.startsWith('trade:')) {
      const trade = (trades as Trade[]).find((t) => t.location === def.id);
      if (trade && canTrade(this.state.inventory, trade)) {
        this.state.inventory = executeTrade(this.state.inventory, trade);
        const e = trade.effect;
        if (e.cash) this.state.cash += e.cash;
        if (e.rep) this.state.rep += e.rep;
        if (e.energy) this.state.energy = Math.max(0, Math.min(100, this.state.energy + e.energy));
        if (e.xp) this.gainXp(e.xp);
        if (e.flag) this.state.flags[e.flag] = true;
        this.ui.sfx('coin');
        this.ui.notify(`Traded ${trade.want} for ${trade.give}!`);
      }
    }
  }

  private interact(): void {
    if (this.overlayOpen) return;

    if (this.mode === 'city') {
      if (
        this.state.side.cat === 1 &&
        !this.cat.following &&
        !this.cat.home &&
        Math.hypot(this.player.x - this.cat.x, this.player.y - this.cat.y) < 1.2
      ) {
        this.cat.following = true;
        this.state.side.cat = 2;
        this.ui.notify('The cat is following you - lead her back to the Old Inn.');
        this.ui.sfx('fragment');
        return;
      }

      const npc = this.npcs.find((n) => Math.hypot(this.player.x - n.x, this.player.y - n.y) < NPC_RADIUS);
      const b = buildings.find((bb) => Math.hypot(this.player.x - bb.door.x, this.player.y - bb.door.y) < DOOR_RADIUS);
      if (npc && (!b || Math.hypot(this.player.x - npc.x, this.player.y - npc.y) < Math.hypot(this.player.x - b.door.x, this.player.y - b.door.y))) {
        this.openNpcDialogue(npc);
        return;
      }

      if (b) {
        if (b.id === 'warehouse' && this.state.quest === 'garden') {
          this.state.quest = advanceMainQuest(this.state.quest);
          this.gainXp(40);
          this.ui.sfx('alert');
          this.playCine('storm');
          return;
        }
        this.enterInterior(b.id);
      }
      return;
    }

    const room = this.room;
    if (!room) return;
    const def = this.interiorDef(room.id);
    if (!def) return;

    if (nearPoint(room, def.npc.x, def.npc.y, 1.2)) {
      this.interiorNpcDialogueWithFx(def);
      return;
    }

    if (def.item && !hasItem(this.state.inventory, def.item.name) && nearPoint(room, def.item.x, def.item.y, 1.2)) {
      this.state.inventory = addItem(this.state.inventory, def.item.name);
      this.ui.sfx('coin');
      this.ui.notify(`Picked up: ${def.item.name}`);
      this.gainXp(10);
      return;
    }

    if (nearPoint(room, def.terminal[0] + 0.5, def.terminal[1] + 0.5, 1.3)) {
      if (this.state.solvedTerminals.includes(def.id)) {
        this.ui.notify('This terminal has already been resolved.');
        return;
      }
      this.overlayOpen = true;
      this.ui.openMinigame(
        this.minigameConfig(def),
        () => {
          this.overlayOpen = false;
          this.solveTerminal(def);
        },
        () => {
          this.overlayOpen = false;
        },
      );
      return;
    }

    this.ui.notify('Move closer to the terminal, NPC, or item.');
  }

  private interiorNpcDialogueWithFx(def: InteriorDef): void {
    this.overlayOpen = true;
    const quest = this.state.quest;
    const side = this.state.side;

    let tree: DialogueTree;
    if (def.id === 'cafe' && quest === 'routine') {
      tree = {
        start: {
          sp: 'BARISTA',
          t: 'You look like you need more than coffee today. Someone outside was asking for help - maybe break your routine?',
          c: [
            { t: "I'll go help them (+2 rep)", fx: 'questRoutine' },
            { t: 'Just coffee, thanks (+10 energy)', fx: 'coffee' },
          ],
        },
      };
    } else if (def.id === 'dev' && quest === 'glasses') {
      tree = {
        start: {
          sp: 'DEV-AVATAR',
          t: "The city has layers you haven't seen. Take this lens - it reveals what's hidden.",
          c: [{ t: 'Take the Glitch Lens', fx: 'takeLens' }],
        },
      };
    } else if (def.id === 'inn' && side.cat === 0) {
      tree = {
        start: {
          sp: 'INNKEEPER',
          t: "My cat ran off into the city! If you find her, she'll follow you back. Please!",
          c: [
            { t: "I'll find her (start quest)", fx: 'startCat' },
            { t: 'Sorry, busy', fx: undefined },
          ],
        },
      };
    } else if (def.id === 'shop' && side.pack === 0) {
      tree = {
        start: {
          sp: 'SHOPKEEPER',
          t: 'I have a package that needs to reach the Dev Office. Five minutes of your time, ten of my dollars.',
          c: [
            { t: 'Deliver it (start quest)', fx: 'startPack' },
            { t: 'Not now', fx: undefined },
          ],
        },
      };
    } else if (def.id === 'dev' && side.pack === 1 && hasItem(this.state.inventory, 'Sealed Package')) {
      tree = {
        start: {
          sp: 'DEV-AVATAR',
          t: 'Ah, my parts! Right on time.',
          c: [{ t: 'Hand over the package (+$10, +25 XP)', fx: 'deliverPack' }],
        },
      };
    } else if (def.id === 'market' && side.photo === 0) {
      tree = {
        start: {
          sp: 'VENDOR',
          t: "Three spots in this city glow golden at the right angle. Stand in each and I'll pay for the memories.",
          c: [
            { t: "I'll find them (start quest)", fx: 'startPhoto' },
            { t: 'Maybe later', fx: undefined },
          ],
        },
      };
    } else {
      const trade = (trades as Trade[]).find((t) => t.location === def.id);
      if (trade && canTrade(this.state.inventory, trade)) {
        tree = {
          start: {
            sp: def.npc.name,
            t: `You have something I need. Trade your ${trade.want} for my ${trade.give}?`,
            c: [
              { t: 'Trade', fx: `trade:${def.id}` },
              { t: 'Not now', fx: undefined },
            ],
          },
        };
      } else {
        tree = {
          start: {
            sp: def.npc.name,
            t: "Welcome. The terminal over there runs a challenge - solve it and there's a reward in it for you.",
          },
        };
      }
    }

    this.ui.openDialogue(tree, 'start', (fx) => this.applyInteriorFx(fx, def), () => {
      this.overlayOpen = false;
    });
  }

  private district(): string {
    const x = this.player.x;
    const y = this.player.y;
    return y < 9.33 ? (x < 9.33 ? 'Downtown' : x < 18.66 ? 'Midtown' : 'Civic Heights') : x < 9.33 ? 'Old Quarter' : x < 18.66 ? 'Market Row' : 'Harbor';
  }

  private promptText(): string {
    if (this.overlayOpen) return '';
    if (this.mode === 'interior' && this.room) {
      const def = this.interiorDef(this.room.id);
      if (!def) return '';
      if (nearPoint(this.room, def.npc.x, def.npc.y, 1.2)) return `Talk to ${def.npc.name}`;
      if (def.item && !hasItem(this.state.inventory, def.item.name) && nearPoint(this.room, def.item.x, def.item.y, 1.2)) return `Pick up ${def.item.name}`;
      if (nearPoint(this.room, def.terminal[0] + 0.5, def.terminal[1] + 0.5, 1.3)) {
        return this.state.solvedTerminals.includes(def.id) ? 'Terminal (solved)' : 'Use the terminal';
      }
      return '';
    }
    if (this.state.side.cat === 1 && !this.cat.following && !this.cat.home && Math.hypot(this.player.x - this.cat.x, this.player.y - this.cat.y) < 1.2) {
      return 'Pick up the cat';
    }
    const b = buildings.find((bb) => Math.hypot(this.player.x - bb.door.x, this.player.y - bb.door.y) < DOOR_RADIUS);
    const npc = this.npcs.find((n) => Math.hypot(this.player.x - n.x, this.player.y - n.y) < NPC_RADIUS);
    if (b && npc) {
      const db = Math.hypot(this.player.x - b.door.x, this.player.y - b.door.y);
      const dn = Math.hypot(this.player.x - npc.x, this.player.y - npc.y);
      return db <= dn ? `Enter ${b.name}` : `Talk to ${npc.def.name}`;
    }
    if (b) return `Enter ${b.name}`;
    if (npc) return `Talk to ${npc.def.name}`;
    return '';
  }

  update(dt: number): void {
    this.input.pollGamepad();
    const axis = this.input.axis();

    if (this.input.wasPressed('vision') && this.state.flags.vision) {
      this.visionOn = !this.visionOn;
      this.ui.notify(this.visionOn ? 'Glitch Vision engaged.' : 'Vision disengaged.');
    }

    if (this.overlayOpen) {
      this.input.endFrame();
      return;
    }

    if (this.mode === 'interior' && this.room) {
      const def = this.interiorDef(this.room.id);
      if (def) moveInRoom(this.room, this.roomFurn(def), axis, dt);
      if (this.room.py >= ROOM_H - 0.38 && Math.abs(this.room.px - 4) < 1.1) {
        this.leaveInterior();
        this.ui.sfx('door');
        this.ui.notify('You step back out into the city.');
      }
      if (this.input.wasPressed('interact')) this.interact();
      this.input.endFrame();
      return;
    }

    const move = updatePlayer(this.player, axis, dt);
    this.state.player.x = this.player.x;
    this.state.player.y = this.player.y;
    if (move.moved) {
      this.state.energy = Math.max(0, Math.min(100, this.state.energy + move.energyDelta));
    }

    if (this.input.wasPressed('interact')) this.interact();

    for (const npc of this.npcs) {
      updateNpc(npc, dt, { rng: this.rng, others: this.npcs });
    }
    updateSeekers(this.npcs, this.player, this.state.flags, this.state.side, dt);

    const catResult = updateCat(this.cat, dt, this.player, this.rng, map.width, map.height);
    if (catResult === 'home') {
      this.state.side.cat = 3;
      this.state.rep += 3;
      this.gainXp(60);
      this.ui.notify('You returned the lost cat to the Inn! +3 rep');
      this.ui.sfx('coin');
    }
    this.state.flags.catHome = this.cat.home;

    const rob = updateRobbery(this.robbery, dt, this.player);
    this.robbery = rob.state;
    if (rob.arrested) {
      this.state.rep += 2;
      this.gainXp(25);
      this.ui.notify('The cop caught the robber. +2 rep');
      this.ui.sfx('coin');
    }
    if (rob.started) {
      this.ui.notify('ALERT: A robbery just broke out at the Bank!');
      this.ui.sfx('alert');
    }

    if (this.visionOn) {
      const picked = pickFragment(this.fragments, this.player.x, this.player.y);
      if (picked !== null) {
        this.fragments.push(picked);
        this.state.flags.fragments = [...this.fragments];
        this.gainXp(20);
        this.ui.sfx('fragment');
        this.ui.notify(`Fragment recovered (${this.fragments.length}/${FRAGMENTS.length})`);
        if (allCollected(this.fragments)) {
          this.state.flags.boardAwakens = true;
          this.gainXp(120);
          this.ui.notify('All fragments found - The Board Awakens.');
        }
      }
    }

    if (this.state.side.photo === 1) {
      PHOTO_SPOTS.forEach(([sx, sy], i) => {
        const key = `photoSpot${i}`;
        if (this.state.flags[key]) return;
        if (Math.hypot(this.player.x - sx, this.player.y - sy) < 0.8) {
          this.state.flags[key] = true;
          this.state.side.photoSpots += 1;
          this.gainXp(20);
          this.ui.sfx('fragment');
          this.ui.notify(`Photo captured (${this.state.side.photoSpots}/3)`);
          if (this.state.side.photoSpots >= 3) {
            this.state.side.photo = 2;
            this.state.cash += 30;
            this.gainXp(40);
            this.ui.notify('Photo Tour complete! +$30');
          }
        }
      });
    }

    const clock = advanceClock({ day: this.state.day, minute: this.state.minute }, dt);
    this.state.day = clock.day;
    this.state.minute = clock.minute;
    this.weather = advanceWeather(this.weather, dt, this.rng).state;

    this.autosave += dt;
    if (this.autosave >= AUTOSAVE_SECONDS) {
      this.autosave = 0;
      save(this.state);
    }
    this.input.endFrame();
  }

  render(_alpha: number): void {
    const questTargetId = mainQuestTarget(this.state.quest);
    const questBuilding = questTargetId ? buildings.find((b) => b.id === questTargetId) : null;

    const renderState: RenderWorldState = {
      minute: this.state.minute,
      weather: this.weather.kind,
      playerX: this.player.x,
      playerY: this.player.y,
      playerDir: this.player.dir,
      playerMoving: this.player.moving,
      playerMovePhase: this.player.movePhase,
      playerGlow: Boolean(this.state.flags.boardAwakens),
      npcs: this.npcs.map((n) => ({
        id: n.def.id,
        name: n.def.name,
        x: n.x,
        y: n.y,
        dir: n.dir,
        moving: n.moving,
        movePhase: n.movePhase,
        color: n.def.color,
        skin: n.def.skin,
        hair: n.def.hair,
        hat: n.def.hat,
        seeking: n.seeking,
        memory: n.memory,
      })),
      cat: this.cat.home ? null : { x: this.cat.x, y: this.cat.y, moving: this.cat.moving },
      robbery: this.robbery.active ? { robber: this.robbery.robber!, cop: this.robbery.cop! } : null,
      mode: this.mode,
      interior: this.buildInteriorRender(),
      visionOn: this.visionOn,
      fragments: [...this.fragments],
      questTarget: questBuilding ? { x: questBuilding.x + questBuilding.w / 2, y: questBuilding.y + questBuilding.d / 2 } : null,
      photoSpots: this.state.side.photo === 1 ? PHOTO_SPOTS.filter((_, i) => !this.state.flags[`photoSpot${i}`]).map(([x, y]) => ({ x, y })) : [],
    };
    this.renderer.setWorldState(renderState);
    this.renderer.begin();
    this.renderer.end();

    const hud: HudData = {
      day: this.state.day,
      minute: this.state.minute,
      energy: this.state.energy,
      cash: this.state.cash,
      rep: this.state.rep,
      district: this.district(),
      weather: this.weather.kind === 'clear' ? 'Clear skies' : this.weather.kind === 'rain' ? 'Neon rain' : 'Fog bank',
      level: this.state.level,
      xp: this.state.xp,
      xpNext: this.state.level * 100,
      fragments: this.fragments.length,
      fragmentsTotal: FRAGMENTS.length,
      questTitle: mainQuestTitle(this.state.quest),
      questDesc: QUEST_DESCS[this.state.quest] ?? '',
      sides: (['cat', 'pack', 'photo'] as const).map((id) => ({
        label: sideStageLabel(id, this.state.side[id], this.state.side.photoSpots),
        done: sideIsDone(id, this.state.side[id]),
      })),
      inventory: Object.keys(this.state.inventory),
      prompt: this.promptText(),
    };
    this.ui.setHud(hud);
    this.ui.drawMinimap(questBuilding ? { x: questBuilding.x + questBuilding.w / 2, y: questBuilding.y + questBuilding.d / 2 } : null);
  }

  private buildInteriorRender(): RenderWorldState['interior'] {
    if (this.mode !== 'interior' || !this.room) return null;
    const def = this.interiorDef(this.room.id);
    if (!def) return null;
    return {
      id: def.id,
      name: def.name,
      color: def.color,
      px: this.room.px,
      py: this.room.py,
      dir: this.room.dir,
      moving: this.room.moving,
      movePhase: this.room.movePhase,
      furn: this.roomFurn(def),
      npc: def.npc,
      item: def.item && !hasItem(this.state.inventory, def.item.name) ? def.item : null,
      terminal: { x: def.terminal[0], y: def.terminal[1] },
      solved: this.state.solvedTerminals.includes(def.id),
    };
  }
}
