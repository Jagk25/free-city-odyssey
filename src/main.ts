import { GameLoop } from './engine/game-loop';
import { Input } from './engine/input';
import { PixiRenderer } from './render/pixi-renderer';
import { World } from './game/world';

async function boot(): Promise<void> {
  const renderer = new PixiRenderer();
  await renderer.init();

  const input = new Input();
  input.attach();

  const world = new World(renderer, input);
  world.init();

  const loop = new GameLoop({
    update: (dt) => world.update(dt),
    render: (alpha) => world.render(alpha),
  });

  document.getElementById('boot')?.remove();
  loop.start();
}

void boot();
