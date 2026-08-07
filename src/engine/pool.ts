/** Generic object pool — no per-frame allocation in hot loops. */
export class Pool<T> {
  private free: T[] = [];

  constructor(
    private readonly factory: () => T,
    private readonly reset: (item: T) => void,
    size = 0,
  ) {
    for (let i = 0; i < size; i += 1) this.free.push(factory());
  }

  acquire(): T {
    return this.free.pop() ?? this.factory();
  }

  release(item: T): void {
    this.reset(item);
    this.free.push(item);
  }

  get size(): number {
    return this.free.length;
  }
}
