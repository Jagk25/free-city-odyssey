import { AudioBus } from './engine/audio';
import { GameLoop } from './engine/game-loop';
import { Input, type Action } from './engine/input';
import { PixiRenderer } from './render/pixi-renderer';
import { World, type GameUi } from './game/world';
import { createMinigameHost } from './minigames/runtime';

async function boot(): Promise<void> {
  const renderer = new PixiRenderer();
  await renderer.init();

  const input = new Input();
  input.attach();

  const audio = new AudioBus();
  const unlock = (): void => {
    void audio.unlock();
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });

  document.querySelectorAll<HTMLElement>('[data-action]').forEach((el) => {
    input.bindTouchButton(el, el.dataset.action as Action);
  });
  document.getElementById('music')?.addEventListener('click', () => {
    void audio.unlock().then(() => audio.toggleMusic());
  });

  const mgRoot = document.getElementById('mg')!;
  const mgHost = createMinigameHost(mgRoot, (id) => audio.sfx(id));

  const feed = document.getElementById('feed')!;
  const ui: GameUi = {
    notify: (msg) => {
      const d = document.createElement('div');
      d.className = 'feedmsg';
      d.textContent = msg;
      feed.appendChild(d);
      while (feed.children.length > 3) feed.removeChild(feed.firstChild!);
      setTimeout(() => {
        d.style.opacity = '0';
        setTimeout(() => d.remove(), 700);
      }, 4200);
    },
    sfx: (id) => audio.sfx(id),
    openMinigame: (config, onSolved, onExit) => mgHost.open(config, onSolved, onExit),
  };

  const world = new World(renderer, input, ui);
  world.init();

  document.getElementById('leave')?.addEventListener('click', () => world.leaveInterior());

  (window as unknown as { __FCO_DEBUG__: Record<string, unknown> }).__FCO_DEBUG__ = {
    setMinute: (m: number) => world.setMinute(m),
    teleport: (x: number, y: number) => world.teleport(x, y),
    setFlag: (k: string, v: unknown) => world.setFlag(k, v),
    npcPositions: () => world.npcPositions(),
    startRobbery: () => world.debugStartRobbery(),
    mode: () => world.getMode(),
    inventory: () => world.getInventory(),
    setRoomPos: (x: number, y: number) => world.setRoomPos(x, y),
    closeMinigame: () => mgHost.close(),
  };

  const loop = new GameLoop({
    update: (dt) => world.update(dt),
    render: (alpha) => world.render(alpha),
  });

  document.getElementById('boot')?.remove();
  loop.start();
}

void boot();
