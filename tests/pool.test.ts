import { describe, expect, it } from 'vitest';
import { Pool } from '../src/engine/pool';

describe('Pool', () => {
  it('reuses released instances instead of allocating', () => {
    let created = 0;
    const pool = new Pool(
      () => {
        created += 1;
        return { v: 0 };
      },
      (item) => {
        item.v = 0;
      },
      1,
    );
    const a = pool.acquire();
    a.v = 5;
    pool.release(a);
    const b = pool.acquire();
    expect(b).toBe(a);
    expect(b.v).toBe(0);
    expect(created).toBe(1);
  });
});
