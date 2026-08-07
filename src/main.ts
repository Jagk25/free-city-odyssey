import { AudioBus } from './engine/audio';
import { GameLoop } from './engine/game-loop';
import { Input, type Action } from './engine/input';
import { PixiRenderer } from './render/pixi-renderer';
import { World } from './game/world';

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

  const world = new World(renderer, input);
  world.init();

  (window as unknown as { __FCO_DEBUG__: Record<string, unknown> }).__FCO_DEBUG__ = {
    setMinute: (m: number) => world.setMinute(m),
    teleport: (x: number, y: number) => world.teleport(x, y),
    setFlag: (k: string, v: unknown) => world.setFlag(k, v),
    npcPositions: () => world.npcPositions(),
    startRobbery: () => world.debugStartRobbery(),
  };

  const loop = new GameLoop({
    update: (dt) => world.update(dt),
    render: (alpha) => world.render(alpha),
  });

  document.getElementById('boot')?.remove();
  loop.start();
}

void boot();
