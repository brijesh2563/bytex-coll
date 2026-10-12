import { describe, it, expect } from 'vitest';
import {
  compareVectors,
  evaluateCausality,
  validateVectorStrict,
  dominates,
  precedes,
  isEqual,
  isConcurrent,
  incrementVector,
  mergeVectors,
  cloneVector
} from '../src/vector-clock.js';

describe('Vector Clock Utility', () => {
  it('should identify identical vectors', () => {
    const v1 = { 'client-A': 2, 'client-B': 3 };
    const v2 = { 'client-A': 2, 'client-B': 3 };

    expect(compareVectors(v1, v2)).toBe('IDENTICAL');
    expect(evaluateCausality(v1, v2)).toBe('EQUAL');
    expect(isEqual(v1, v2)).toBe(true);
    expect(dominates(v1, v2)).toBe(false);
    expect(precedes(v1, v2)).toBe(false);
    expect(isConcurrent(v1, v2)).toBe(false);
  });

  it('should treat missing keys as 0 in identical checks', () => {
    const v1 = { 'client-A': 2, 'client-B': 0 };
    const v2 = { 'client-A': 2 };

    expect(compareVectors(v1, v2)).toBe('IDENTICAL');
    expect(evaluateCausality(v1, v2)).toBe('EQUAL');
  });

  it('should identify when v1 dominates v2 (AFTER)', () => {
    const v1 = { 'client-A': 3, 'client-B': 4 };
    const v2 = { 'client-A': 2, 'client-B': 4 };

    expect(compareVectors(v1, v2)).toBe('DOMINATES');
    expect(evaluateCausality(v1, v2)).toBe('AFTER');
    expect(dominates(v1, v2)).toBe(true);
    expect(precedes(v1, v2)).toBe(false);
    expect(isConcurrent(v1, v2)).toBe(false);
  });

  it('should identify when v1 precedes v2 (BEFORE)', () => {
    const v1 = { 'client-A': 1, 'client-B': 2 };
    const v2 = { 'client-A': 2, 'client-B': 2 };

    expect(compareVectors(v1, v2)).toBe('PRECEDES');
    expect(evaluateCausality(v1, v2)).toBe('BEFORE');
    expect(dominates(v1, v2)).toBe(false);
    expect(precedes(v1, v2)).toBe(true);
    expect(isConcurrent(v1, v2)).toBe(false);
  });

  it('should identify concurrent vectors (CONCURRENT)', () => {
    // Client-A made an edit without knowing Client-B's edit
    const v1 = { 'client-A': 2, 'client-B': 1 };
    const v2 = { 'client-A': 1, 'client-B': 2 };

    expect(compareVectors(v1, v2)).toBe('CONCURRENT');
    expect(evaluateCausality(v1, v2)).toBe('CONCURRENT');
    expect(dominates(v1, v2)).toBe(false);
    expect(precedes(v1, v2)).toBe(false);
    expect(isConcurrent(v1, v2)).toBe(true);
  });

  it('should identify concurrency when one vector has disjoint keys', () => {
    const v1 = { 'client-A': 1 };
    const v2 = { 'client-B': 1 };

    expect(compareVectors(v1, v2)).toBe('CONCURRENT');
    expect(evaluateCausality(v1, v2)).toBe('CONCURRENT');
    expect(isConcurrent(v1, v2)).toBe(true);
  });

  it('should reject invalid vector counters strictly', () => {
    expect(() => validateVectorStrict(null)).toThrow(/non-null object/);
    expect(() => validateVectorStrict({ 'client-A': -1 })).toThrow(/finite, non-negative integer/);
    expect(() => validateVectorStrict({ 'client-A': 1.5 })).toThrow(/finite, non-negative integer/);
    expect(() => validateVectorStrict({ 'client-A': Infinity })).toThrow(/finite, non-negative integer/);
    expect(() => validateVectorStrict({ '': 1 })).toThrow(/non-empty string/);
  });

  it('should immutably increment replica sequence', () => {
    const original = { 'client-A': 1, 'client-B': 2 };
    const incremented = incrementVector(original, 'client-A');

    expect(incremented).toEqual({ 'client-A': 2, 'client-B': 2 });
    expect(original).toEqual({ 'client-A': 1, 'client-B': 2 }); // immutability check

    const newReplica = incrementVector(original, 'client-C');
    expect(newReplica).toEqual({ 'client-A': 1, 'client-B': 2, 'client-C': 1 });
  });

  it('should correctly merge two version vectors with component-wise maximum', () => {
    const v1 = { 'client-A': 5, 'client-B': 2, 'server': 10 };
    const v2 = { 'client-A': 3, 'client-B': 6, 'client-C': 1, 'server': 10 };

    const merged = mergeVectors(v1, v2);
    expect(merged).toEqual({
      'client-A': 5,
      'client-B': 6,
      'client-C': 1,
      'server': 10
    });
  });

  it('should clone vector shallowly', () => {
    const v = { 'client-A': 4 };
    const copy = cloneVector(v);
    expect(copy).toEqual(v);
    copy['client-A'] = 99;
    expect(v['client-A']).toBe(4);
  });
});
