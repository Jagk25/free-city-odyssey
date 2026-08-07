import { formatTime } from '../game/world-clock';

export interface HudData {
  day: number;
  minute: number;
  energy: number;
  cash: number;
  rep: number;
  district: string;
  weather: string;
  level: number;
  xp: number;
  xpNext: number;
  fragments: number;
  fragmentsTotal: number;
  questTitle: string;
  questDesc: string;
  sides: { label: string; done: boolean }[];
  inventory: string[];
  prompt: string;
}

/** DOM HUD — updated from world state. Game logic never touches the DOM; this is the only UI writer. */
export class Hud {
  private readonly el = (id: string): HTMLElement => document.getElementById(id)!;
  private readonly mini: CanvasRenderingContext2D;

  constructor() {
    this.mini = (document.getElementById('mini') as HTMLCanvasElement).getContext('2d')!;
  }

  update(d: HudData): void {
    this.el('hud-day').textContent = String(d.day);
    this.el('hud-time').textContent = formatTime(d.minute);
    this.el('hud-cash').textContent = String(d.cash);
    this.el('hud-rep').textContent = String(d.rep);
    this.el('hud-district').textContent = d.district;

    const ebar = this.el('hud-energy');
    ebar.style.width = `${d.energy}%`;
    ebar.style.background = d.energy < 25 ? '#e0605c' : '#61e08a';

    this.el('ws-weather').textContent = d.weather;
    this.el('ws-level').textContent = String(d.level);
    this.el('ws-xp').textContent = `${Math.floor(d.xp)}/${d.xpNext}`;
    this.el('ws-frag').textContent = `${d.fragments}/${d.fragmentsTotal}`;

    this.el('q-main').textContent = `${d.questTitle} — ${d.questDesc}`;
    this.el('q-sides').innerHTML = d.sides
      .map((s) => `<div class="side">${s.done ? `<span class="done">${s.label}</span>` : s.label}</div>`)
      .join('');

    this.el('inv-list').textContent = d.inventory.length ? d.inventory.join(', ') : '(empty)';

    const prompt = this.el('prompt');
    if (d.prompt) {
      prompt.textContent = `E · ${d.prompt}`;
      prompt.classList.add('on');
    } else {
      prompt.classList.remove('on');
    }
  }

  drawMinimap(
    buildings: { x: number; y: number; w: number; d: number; color: string }[],
    player: { x: number; y: number },
    npcs: { x: number; y: number; color: string }[],
    questTarget: { x: number; y: number } | null,
    mapSize: number,
  ): void {
    const g = this.mini;
    const scale = 96 / mapSize;
    g.fillStyle = '#0b1930';
    g.fillRect(0, 0, 96, 96);
    for (const b of buildings) {
      g.fillStyle = b.color;
      g.fillRect(b.x * scale, b.y * scale, b.w * scale, b.d * scale);
    }
    if (questTarget) {
      g.fillStyle = '#ffdf70';
      g.fillRect(questTarget.x * scale - 2, questTarget.y * scale - 2, 4, 4);
    }
    for (const n of npcs) {
      g.fillStyle = n.color;
      g.beginPath();
      g.arc(n.x * scale, n.y * scale, 1.5, 0, 7);
      g.fill();
    }
    g.fillStyle = '#ffdf70';
    g.beginPath();
    g.arc(player.x * scale, player.y * scale, 2.4, 0, 7);
    g.fill();
  }
}
