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
import map from '../data/map.json';

const AUTOSAVE_SECONDS = 15;

/** P3 world: player, citizens, seekers, cat, robbery, clock, weather, autosave. */
export class World {
  private state: SaveGame = defaultSave();
  private weather: WeatherState = initialWeather();
  private autosave = 0;
  private readonly rng = mulberry32(Date.now() % 2147483647);

  private player: Player = createPlayer(map.playerSpawn.x, map.playerSpawn.y);
  private npcs: Npc[] = [];
  private cat: Cat = createCat();
  private robbery: RobberyState = createRobberyState();
  private side: Record<string, unknown> = { photo: 0, photoSpots: 0 };

  constructor(
    private readonly renderer: IRenderer,
    private readonly input: Input,
  ) {}

  init(): void {
    this.state = load();
    this.player = createPlayer(this.state.player.x, this.state.player.y);
    this.npcs = spawnNpcs(this.rng);
    if (typeof this.state.flags.catHome === 'boolean') this.cat.home = this.state.flags.catHome as boolean;
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

  update(dt: number): void {
    this.input.pollGamepad();
    const axis = this.input.axis();

    const move = updatePlayer(this.player, axis, dt);
    this.state.player.x = this.player.x;
    this.state.player.y = this.player.y;
    if (move.moved) {
      this.state.energy = Math.max(0, Math.min(100, this.state.energy + move.energyDelta));
    }

    for (const npc of this.npcs) {
      updateNpc(npc, dt, { rng: this.rng, others: this.npcs });
    }
    updateSeekers(this.npcs, this.player, this.state.flags, this.side, dt);

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
      cat: this.cat.home
        ? null
        : { x: this.cat.x, y: this.cat.y, moving: this.cat.moving },
      robbery: this.robbery.active
        ? { robber: this.robbery.robber!, cop: this.robbery.cop! }
        : null,
    };
    this.renderer.setWorldState(renderState);
    this.renderer.begin();
    this.renderer.end();
  }
}
