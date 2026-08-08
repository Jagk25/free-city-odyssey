import { AudioBus } from './engine/audio';
import { GameLoop } from './engine/game-loop';
import { Input, type Action } from './engine/input';
import { PixiRenderer } from './render/pixi-renderer';
import { World, type GameUi } from './game/world';
import { createMinigameHost } from './minigames/runtime';
import { createCutscene, tick, advance, isDone, currentText, currentSpeaker, type Slide } from './game/cutscenes';
import type { DialogueTree } from './game/dialogue';
import { Hud } from './ui/hud';
import { save } from './engine/save-system';
import buildings from './data/buildings.json';
import map from './data/map.json';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

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

  const buzz = (ms: number): void => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
  };

  document.querySelectorAll<HTMLElement>('[data-action]').forEach((el) => {
    input.bindTouchButton(el, el.dataset.action as Action);
    el.addEventListener('pointerdown', () => buzz(8));
  });
  document.getElementById('music')?.addEventListener('click', () => {
    void audio.unlock().then(() => {
      const on = audio.toggleMusic();
      document.getElementById('music')!.textContent = on ? '♫ MUSIC: ON' : '♫ MUSIC: OFF';
    });
  });

  // PWA: offline service worker (production only) + install prompt.
  if ('serviceWorker' in navigator && !import.meta.env.DEV) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => undefined);
    });
  }
  let deferredInstall: InstallPromptEvent | null = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e as InstallPromptEvent;
    document.getElementById('install')?.classList.remove('hidden');
  });
  document.getElementById('install')?.addEventListener('click', () => {
    void deferredInstall?.prompt();
    deferredInstall = null;
    document.getElementById('install')?.classList.add('hidden');
  });

  const mgHost = createMinigameHost(document.getElementById('mg')!, (id) => audio.sfx(id));
  const hud = new Hud();

  // ---- cutscene DOM ----
  const cine = document.getElementById('cine')!;
  const cineSpeaker = document.getElementById('cine-speaker')!;
  const cineText = document.getElementById('cine-text')!;
  let cineState: ReturnType<typeof createCutscene> | null = null;
  let cineDone: (() => void) | null = null;
  const cineInterval = setInterval(() => {
    if (cineState && !isDone(cineState)) {
      cineState = tick(cineState, 1);
      cineText.textContent = currentText(cineState);
    }
  }, 22);
  const cineNext = (): void => {
    if (!cineState) return;
    cineState = advance(cineState);
    if (isDone(cineState)) {
      cine.classList.add('hidden');
      const done = cineDone;
      cineState = null;
      cineDone = null;
      done?.();
    } else {
      cineSpeaker.textContent = currentSpeaker(cineState);
      cineText.textContent = currentText(cineState);
    }
  };
  document.getElementById('cine-bg')!.addEventListener('click', cineNext);
  document.getElementById('cine-skip')!.addEventListener('click', () => {
    if (!cineState) return;
    cineState = { ...cineState, index: cineState.slides.length };
    cineNext();
  });

  // ---- dialogue DOM ----
  const dlg = document.getElementById('dlg')!;
  const dlgSpeaker = document.getElementById('dlg-speaker')!;
  const dlgText = document.getElementById('dlg-text')!;
  const dlgChoices = document.getElementById('dlg-choices')!;

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
    openDialogue: (tree: DialogueTree, startId: string, onChoice, onClose) => {
      dlg.classList.remove('hidden');
      const show = (nodeId: string): void => {
        const node = tree[nodeId];
        if (!node) {
          dlg.classList.add('hidden');
          onClose();
          return;
        }
        dlgSpeaker.textContent = node.sp;
        dlgText.textContent = node.t;
        dlgChoices.innerHTML = '';
        const choices = node.c ?? [{ t: 'Leave' }];
        for (const ch of choices) {
          const b = document.createElement('button');
          b.textContent = ch.t;
          b.onclick = () => {
            audio.sfx('blip');
            onChoice(ch.fx);
            if (ch.next) show(ch.next);
            else {
              dlg.classList.add('hidden');
              onClose();
            }
          };
          dlgChoices.appendChild(b);
        }
      };
      show(startId);
    },
    playCutscene: (slides: Slide[], onDone) => {
      cineState = createCutscene(slides);
      cineDone = onDone;
      cineSpeaker.textContent = currentSpeaker(cineState);
      cineText.textContent = '';
      cine.classList.remove('hidden');
    },
    setHud: (data) => hud.update(data),
    drawMinimap: (questTarget) => {
      hud.drawMinimap(
        buildings.map((b) => ({ x: b.x, y: b.y, w: b.w, d: b.d, color: b.color })),
        lastPlayerPos,
        lastNpcPos,
        questTarget,
        map.width,
      );
    },
  };

  const world = new World(renderer, input, ui);
  world.init();

  document.getElementById('leave')?.addEventListener('click', () => world.leaveInterior());

  // Pause menu.
  const pause = document.getElementById('pause')!;
  const togglePause = (): void => pause.classList.toggle('hidden');
  document.getElementById('p-resume')!.onclick = togglePause;
  document.getElementById('p-save')!.onclick = () => {
    save(world.saveState());
    togglePause();
  };
  document.getElementById('p-music')!.onclick = () => {
    void audio.unlock().then(() => audio.toggleMusic());
  };
  document.getElementById('p-reset')!.onclick = () => {
    localStorage.removeItem('freecity.save');
    location.reload();
  };

  // Debug panel.
  document.getElementById('dbg-weather')!.onclick = () => {
    const kinds = ['clear', 'rain', 'fog'];
    world.setWeather(kinds[Math.floor(Math.random() * kinds.length)]!);
  };
  document.getElementById('dbg-robbery')!.onclick = () => world.debugStartRobbery();
  document.getElementById('dbg-xp')!.onclick = () => world.addXp(100);
  document.getElementById('dbg-vision')!.onclick = () => world.unlockVision();
  document.getElementById('dbg-items')!.onclick = () => world.giveAllItems();
  document.getElementById('dbg-intro')!.onclick = () => world.replayIntro();

  let lastPlayerPos = { x: map.playerSpawn.x, y: map.playerSpawn.y };
  let lastNpcPos: { x: number; y: number; color: string }[] = [];

  (window as unknown as { __FCO_DEBUG__: Record<string, unknown> }).__FCO_DEBUG__ = {
    setMinute: (m: number) => world.setMinute(m),
    teleport: (x: number, y: number) => world.teleport(x, y),
    setFlag: (k: string, v: unknown) => world.setFlag(k, v),
    npcPositions: () => world.npcPositions(),
    startRobbery: () => world.debugStartRobbery(),
    mode: () => world.getMode(),
    inventory: () => world.getInventory(),
    quest: () => world.getQuest(),
    setRoomPos: (x: number, y: number) => world.setRoomPos(x, y),
    closeMinigame: () => mgHost.close(),
    skipCutscene: () => {
      if (cineState) {
        cineState = { ...cineState, index: cineState.slides.length };
        cineNext();
      }
    },
  };

  const loop = new GameLoop({
    update: (dt) => {
      if (input.wasPressed('pause')) togglePause();
      if (!pause.classList.contains('hidden')) {
        input.endFrame();
        return;
      }
      world.update(dt);
    },
    render: (alpha) => {
      world.render(alpha);
      lastPlayerPos = world.playerPos();
      lastNpcPos = world.npcPositions().map((n) => ({ x: n.x, y: n.y, color: '#8ddcff' }));
    },
  });

  document.getElementById('boot')?.remove();
  loop.start();

  window.addEventListener('beforeunload', () => clearInterval(cineInterval));
}

void boot();
