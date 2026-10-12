/**
 * NexusSync Vector Clock Utility
 * Formally handles causality comparisons, dominance, concurrency, and merging.
 */

import type { VersionVector, ReplicaId } from './types.js';

export type VectorRelation = 'DOMINATES' | 'PRECEDES' | 'CONCURRENT' | 'IDENTICAL';
export type CausalRelation = 'BEFORE' | 'AFTER' | 'EQUAL' | 'CONCURRENT';

/**
 * Validates vector clock entries strictly.
 * Rejects negative, non-integer, non-finite, or non-object values.
 */
export function validateVectorStrict(v: unknown): asserts v is VersionVector {
  if (!v || typeof v !== 'object' || Array.isArray(v)) {
    throw new Error('VersionVector must be a non-null object');
  }

  for (const [key, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof key !== 'string' || key.trim().length === 0) {
      throw new Error('ReplicaId key in VersionVector must be a non-empty string');
    }
    if (
      typeof val !== 'number' ||
      !Number.isFinite(val) ||
      !Number.isInteger(val) ||
      val < 0
    ) {
      throw new Error(
        `Invalid counter in VersionVector for replica '${key}': must be a finite, non-negative integer`
      );
    }
  }
}

/**
 * Evaluates causal relation between two version vectors:
 * - 'EQUAL': v1 == v2 across all components
 * - 'AFTER': v1 causally follows v2 (v1 > v2)
 * - 'BEFORE': v1 causally precedes v2 (v1 < v2)
 * - 'CONCURRENT': neither dominates the other (v1 || v2)
 */
export function evaluateCausality(v1: VersionVector, v2: VersionVector): CausalRelation {
  validateVectorStrict(v1);
  validateVectorStrict(v2);

  const allKeys = new Set([...Object.keys(v1), ...Object.keys(v2)]);
  let v1Greater = false;
  let v2Greater = false;

  for (const key of allKeys) {
    const val1 = v1[key] ?? 0;
    const val2 = v2[key] ?? 0;

    if (val1 > val2) {
      v1Greater = true;
    } else if (val2 > val1) {
      v2Greater = true;
    }
  }

  if (v1Greater && v2Greater) {
    return 'CONCURRENT';
  }
  if (v1Greater) {
    return 'AFTER';
  }
  if (v2Greater) {
    return 'BEFORE';
  }
  return 'EQUAL';
}

/**
 * Compare two version vectors (backward-compatible alias):
 * - 'IDENTICAL': EQUAL
 * - 'DOMINATES': AFTER
 * - 'PRECEDES': BEFORE
 * - 'CONCURRENT': CONCURRENT
 */
export function compareVectors(v1: VersionVector, v2: VersionVector): VectorRelation {
  const relation = evaluateCausality(v1, v2);
  switch (relation) {
    case 'AFTER':
      return 'DOMINATES';
    case 'BEFORE':
      return 'PRECEDES';
    case 'EQUAL':
      return 'IDENTICAL';
    case 'CONCURRENT':
      return 'CONCURRENT';
  }
}

/**
 * Returns true if v1 causally dominates v2 (v1 > v2)
 */
export function dominates(v1: VersionVector, v2: VersionVector): boolean {
  return evaluateCausality(v1, v2) === 'AFTER';
}

/**
 * Returns true if v1 causally precedes v2 (v1 < v2)
 */
export function precedes(v1: VersionVector, v2: VersionVector): boolean {
  return evaluateCausality(v1, v2) === 'BEFORE';
}

/**
 * Returns true if v1 and v2 are causally equal (v1 == v2)
 */
export function isEqual(v1: VersionVector, v2: VersionVector): boolean {
  return evaluateCausality(v1, v2) === 'EQUAL';
}

/**
 * Returns true if v1 and v2 are concurrent (v1 || v2)
 */
export function isConcurrent(v1: VersionVector, v2: VersionVector): boolean {
  return evaluateCausality(v1, v2) === 'CONCURRENT';
}

/**
 * Increments the entry for replicaId by 1, returning a new immutable VersionVector
 */
export function incrementVector(v: VersionVector, replicaId: ReplicaId): VersionVector {
  validateVectorStrict(v);
  const next = { ...v };
  next[replicaId] = (next[replicaId] ?? 0) + 1;
  return next;
}

/**
 * Merges two version vectors by taking the component-wise maximum
 */
export function mergeVectors(v1: VersionVector, v2: VersionVector): VersionVector {
  validateVectorStrict(v1);
  validateVectorStrict(v2);

  const merged: VersionVector = {};
  const allKeys = new Set([...Object.keys(v1), ...Object.keys(v2)]);

  for (const key of allKeys) {
    merged[key] = Math.max(v1[key] ?? 0, v2[key] ?? 0);
  }

  return merged;
}

/**
 * Creates a shallow copy of a version vector
 */
export function cloneVector(v: VersionVector): VersionVector {
  validateVectorStrict(v);
  return { ...v };
}
