import type { IRenderer, RenderWorldState } from '../render/renderer';
import type { Input } from '../engine/input';
import { defaultSave, load, save, type SaveGame } from '../engine/save-system';
import { advanceClock } from './world-clock';
import { advanceWeather, initialWeather, type WeatherState } from './weather';
import { mulberry32 } from '../engine/rng';
import { createPlayer, updatePlayer, type Player } from './player';
import { spawnNpcs, updateNpc, type Npc } from './npc';
import { updateSeekers } from './seekers';
import { createCat, updateCat, type Cat } from './cat';
import { createRobberyState, updateRobbery, startRobbery, type RobberyState } from './events';
import { createRoom, moveInRoom, nearPoint, roomBlocked, type FurnItem, type RoomState } from '../interiors/interior-runtime';
import { addItem, canTrade, executeTrade, hasItem, type Trade } from './inventory';
import type { MinigameConfig } from '../minigames/runtime';
import buildings from '../data/buildings.json';
import interiors from '../data/interiors.json';
import trades from '../data/items.json';
import map from '../data/map.json';

const AUTOSAVE_SECONDS = 15;
const DOOR_RADIUS = 1.1;

export interface GameUi {
  notify(msg: string): void;
  sfx(id: 'door' | 'coin' | 'fail' | 'blip' | 'fragment' | 'level' | 'alert'): void;
  openMinigame(config: MinigameConfig, onSolved: () => void, onExit: () => void): void;
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
    { label: 'Rex — tall, red scarf, bare hands', guilty: true },
    { label: 'Bex — heavy gloves, slight limp', guilty: false },
    { label: 'Juno — never without an umbrella', guilty: false },
  ],
};

/** P4 world: city + interiors + mini-games + inventory + trading. */
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
  private minigameOpen = false;

  constructor(
    private readonly renderer: IRenderer,
    private readonly input: Input,
    private readonly ui: GameUi,
  ) {}

  init(): void {
    this.state = load();
    this.player = createPlayer(this.state.player.x, this.state.player.y);
    this.npcs = spawnNpcs(this.rng);
    if (typeof this.state.flags.catHome === 'boolean') this.cat.home = this.state.flags.catHome as boolean;
  }

  // ---- debug/e2e hooks ----
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

  // ---- interiors ----
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
        return { ...base, type: 'mastermind', desc: 'Deduce the 4-digit code (digits 1-6). ● right place, ○ wrong place. 6 attempts.' };
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
    save(this.state);
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

  private interact(): void {
    if (this.minigameOpen) return;

    if (this.mode === 'city') {
      const b = buildings.find((bb) => Math.hypot(this.player.x - bb.door.x, this.player.y - bb.door.y) < DOOR_RADIUS);
      if (b) this.enterInterior(b.id);
      return;
    }

    const room = this.room;
    if (!room) return;
    const def = this.interiorDef(room.id);
    if (!def) return;

    if (nearPoint(room, def.npc.x, def.npc.y, 1.2)) {
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
        save(this.state);
      } else {
        this.ui.notify(`${def.npc.name}: "The terminal runs a challenge — solve it for a reward."`);
      }
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
      this.minigameOpen = true;
      this.ui.openMinigame(
        this.minigameConfig(def),
        () => {
          this.minigameOpen = false;
          this.solveTerminal(def);
        },
        () => {
          this.minigameOpen = false;
        },
      );
      return;
    }

    this.ui.notify('Move closer to the terminal, NPC, or item.');
  }

  update(dt: number): void {
    this.input.pollGamepad();
    const axis = this.input.axis();

    if (this.mode === 'interior' && this.room) {
      const def = this.interiorDef(this.room.id);
      if (def && !this.minigameOpen) {
        moveInRoom(this.room, this.roomFurn(def), axis, dt);
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

    updateCat(this.cat, dt, this.player, this.rng, map.width, map.height);
    this.state.flags.catHome = this.cat.home;

    const rob = updateRobbery(this.robbery, dt, this.player);
    this.robbery = rob.state;
    if (rob.arrested) this.state.rep += 2;

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
    const renderState: RenderWorldState = {
      minute: this.state.minute,
      weather: this.weather.kind,
      playerX: this.player.x,
      playerY: this.player.y,
      playerDir: this.player.dir,
      playerMoving: this.player.moving,
      playerMovePhase: this.player.movePhase,
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
    };
    this.renderer.setWorldState(renderState);
    this.renderer.begin();
    this.renderer.end();
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
