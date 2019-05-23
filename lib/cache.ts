interface CacheItem {
  key: string;
  payload: string;
  updatedAt: number;
  computeTime: number;
  recompute?: () => string;
}

export class Cache {
  private items = new Array<CacheItem>();
  private access = new Map<string, number>();
  private rusty = new Set<string>();
  public sets: number = 0;
  public gets: number = 0;

  public constructor(public targetCount: number, public expireSec: number) {
  }

  public get length() {
    return this.items.length;
  }

  public get(key: string): string | undefined {
    const at = this.access.get(key);
    if (at === undefined) { return; }
    if (this._expireIfOld(at)) { return; }
    this.gets++;
    const item = this.items[at];
    if (this._isRusty(item)) {
      this.rusty.add(item.key);
    }
    return item.payload;
  }

  public add<T>(key: string, compute: () => T, use: (result: T) => string,
                allowRecompute: boolean): T {
    const hrStart = process.hrtime();
    const result = compute();
    const hrStop = process.hrtime(hrStart);
    const payload = use(result);
    const computeTime = hrStop[0] * 1e9 + hrStop[1];
    const updatedAt = Date.now();
    const recompute = allowRecompute ? (() => use(compute())) : undefined;
    this.addWithTimes(key, payload, computeTime, updatedAt, recompute);
    return result;
  }
  
  public addWithTimes(key: string, payload: string, computeTime: number, updatedAt: number,
                      recompute?: () => string) {
    const item = { key, payload, updatedAt, computeTime, recompute };
    let at = this.access.get(key);
    if (at === undefined) {
      if (this.items.length >= this.targetCount && this.items.length > 0) {
        for (let sample = 0; sample < 20; sample++) {
          const at = Math.floor(Math.random() * this.items.length);
          if (this.items[at].computeTime < computeTime) {
            this._removeItem(at);
            break;
          }
        }
      }
      if (this.items.length >= this.targetCount) {
        return;
      }
      at = this.items.length;
    }
    this.items[at] = item;
    this.access.set(key, at);
    this.sets++;
  }

  public update() {
    // Keep expiration moving.
    const di = 20;
    while (this.items.length > 0) {
      let ct: number = 0;
      for (let sample = 0; sample < di && this.items.length > 0; sample++) {
        const at = Math.floor(Math.random() * this.items.length);
        if (this._expireIfOld(at)) { ct++; }
      }
      if (ct * 4 < di) {
        break;
      }
    }
    // Keep rusty keys moving.
    for (const key of this.rusty) {
      const at = this.access.get(key);
      if (at === undefined) { continue; }
      const item = this.items[at];
      if (!item.recompute) { continue; }
      item.payload = item.recompute();
      this.add(key, item.recompute, (x) => x, true);
    }
    this.rusty.clear();
  }

  public testAddTime(sec: number) {
    for (const item of this.items) {
      item.computeTime += sec * 1e9;
    }
  }

  public clear() {
    this.items.length = 0;
    this.access.clear();
    this.gets = this.sets = 0;
    this.rusty.clear();
  }

  private _isRusty(item: CacheItem): boolean {
    const last = Date.now() - this.expireSec * 0.5 * 1000;
    return (item.updatedAt < last)
  }

  private _expireIfOld(at: number): boolean {
    const last = Date.now() - this.expireSec * 1000;
    const item = this.items[at];
    if (item.updatedAt >= last) {
      return false;
    }
    this._removeItem(at);
    return true;
  }

  private _removeItem(at: number) {
    const item = this.items[at];
    this.access.delete(item.key);
    const target = this.items.length - 1;
    if (at !== target) {
      this.items[at] = this.items[target];
      this.access.set(this.items[target].key, at);
    }
    this.items.length = this.items.length - 1;
  }
}
