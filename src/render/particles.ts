import { Pool } from '../engine/pool';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: number;
}

function makeParticle(): Particle {
  return { x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 2, color: 0xffffff };
}

function resetParticle(p: Particle): void {
  p.x = 0;
  p.y = 0;
  p.vx = 0;
  p.vy = 0;
  p.life = 0;
  p.max = 1;
  p.size = 2;
  p.color = 0xffffff;
}

/** Pooled particles — zero allocation in the hot loop. Renderer-agnostic; drawing happens in pixi-renderer. */
export class ParticleSystem {
  private readonly pool: Pool<Particle>;
  private readonly live: Particle[] = [];

  constructor(
    private readonly capacity = 256,
    private readonly rng: () => number = Math.random,
  ) {
    this.pool = new Pool<Particle>(makeParticle, resetParticle, capacity);
  }

  get activeCount(): number {
    return this.live.length;
  }

  get active(): readonly Particle[] {
    return this.live;
  }

  get pooledCount(): number {
    return this.pool.size;
  }

  emit(x: number, y: number, vx: number, vy: number, life: number, color: number, size = 2): void {
    if (this.live.length >= this.capacity) return;
    const p = this.pool.acquire();
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.life = life;
    p.max = life;
    p.color = color;
    p.size = size;
    this.live.push(p);
  }

  burst(x: number, y: number, color: number, count: number, speed = 50): void {
    for (let i = 0; i < count; i += 1) {
      const angle = this.rng() * Math.PI * 2;
      const velocity = speed * (0.4 + this.rng() * 0.6);
      this.emit(
        x,
        y,
        Math.cos(angle) * velocity,
        Math.sin(angle) * velocity - 20,
        0.6 + this.rng() * 0.5,
        color,
        2 + this.rng() * 2,
      );
    }
  }

  update(dt: number, gravity = 30): void {
    for (let i = this.live.length - 1; i >= 0; i -= 1) {
      const p = this.live[i]!;
      p.life -= dt;
      if (p.life <= 0) {
        this.live.splice(i, 1);
        this.pool.release(p);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += gravity * dt;
    }
  }
}
