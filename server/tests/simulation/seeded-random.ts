/**
 * NexusSync Deterministic Seeded PRNG
 * Mulberry32 implementation for reproducible test and simulation runs.
 */

export class SeededRandom {
  private state: number;
  private readonly initialSeed: number | string;

  constructor(seed: number | string = 1337) {
    this.initialSeed = seed;
    if (typeof seed === 'string') {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
      }
      this.state = hash >>> 0;
    } else {
      this.state = (seed >>> 0) || 1337;
    }
  }

  public getSeed(): number | string {
    return this.initialSeed;
  }

  /**
   * Generates a pseudo-random floating point number in [0, 1).
   */
  public nextFloat(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates a pseudo-random integer in [min, max] inclusive.
   */
  public nextInt(min: number, max: number): number {
    if (min > max) {
      [min, max] = [max, min];
    }
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  /**
   * Generates a boolean with given probability of being true.
   */
  public nextBool(probability = 0.5): boolean {
    return this.nextFloat() < probability;
  }

  /**
   * Picks a random element from an array.
   */
  public pick<T>(items: T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    return items[this.nextInt(0, items.length - 1)];
  }

  /**
   * Shuffles an array deterministically.
   */
  public shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}
