/**
 * NexusSync Task Dependency DAG Invariant Engine
 * Ensures the task dependency graph remains a strict Directed Acyclic Graph (DAG).
 */

import type { TaskEntity, EntityId } from './types.js';

export interface DagValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Checks if adding a dependency edge `taskId -> dependsOnTaskId`
 * (where `taskId` depends on `dependsOnTaskId`) introduces a directed cycle.
 *
 * A cycle is formed if and only if there is already an existing path from
 * `dependsOnTaskId` to `taskId`.
 *
 * Time Complexity: O(V + E) where V = tasks count, E = dependencies count.
 */
export function detectCycleInTasks(
  tasks: TaskEntity[],
  taskId: EntityId,
  dependsOnTaskId: EntityId
): boolean {
  // Self-dependency is an immediate 1-node cycle
  if (taskId === dependsOnTaskId) {
    return true;
  }

  // Build adjacency map: task -> array of tasks it depends on
  const adj = new Map<EntityId, EntityId[]>();
  for (const t of tasks) {
    if (!t.isDeleted) {
      adj.set(t.id, t.dependencies || []);
    }
  }

  // BFS starting from dependsOnTaskId to see if it can reach taskId
  const visited = new Set<EntityId>();
  const queue: EntityId[] = [dependsOnTaskId];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current === taskId) {
      return true; // Cycle detected: dependsOnTaskId can reach taskId!
    }

    if (!visited.has(current)) {
      visited.add(current);
      const neighbors = adj.get(current) || [];
      for (const next of neighbors) {
        if (!visited.has(next)) {
          queue.push(next);
        }
      }
    }
  }

  return false;
}

/**
 * Validates whether adding a dependency edge complies with all graph invariants:
 * 1. Both source and target tasks must exist and not be deleted.
 * 2. Self-dependencies are forbidden.
 * 3. Adding the edge must not create a directed cycle.
 */
export function validateDependencyAddition(
  tasks: TaskEntity[],
  taskId: EntityId,
  dependsOnTaskId: EntityId
): DagValidationResult {
  if (taskId === dependsOnTaskId) {
    return {
      valid: false,
      reason: 'INVARIANT_VIOLATION: SELF_DEPENDENCY_FORBIDDEN (A task cannot depend on itself)'
    };
  }

  const sourceTask = tasks.find((t) => t.id === taskId && !t.isDeleted);
  if (!sourceTask) {
    return {
      valid: false,
      reason: `INVARIANT_VIOLATION: TASK_NOT_FOUND (Source task '${taskId}' does not exist or is deleted)`
    };
  }

  const targetTask = tasks.find((t) => t.id === dependsOnTaskId && !t.isDeleted);
  if (!targetTask) {
    return {
      valid: false,
      reason: `INVARIANT_VIOLATION: PREREQUISITE_NOT_FOUND (Prerequisite task '${dependsOnTaskId}' does not exist or is deleted)`
    };
  }

  // If dependency already exists, it is idempotent
  if (sourceTask.dependencies.includes(dependsOnTaskId)) {
    return { valid: true };
  }

  // Check acyclicity
  if (detectCycleInTasks(tasks, taskId, dependsOnTaskId)) {
    return {
      valid: false,
      reason: `INVARIANT_VIOLATION: DEPENDENCY_CYCLE (Adding dependency ${taskId} -> ${dependsOnTaskId} forms a directed cycle)`
    };
  }

  return { valid: true };
}

/**
 * Validates the entire task collection to ensure global acyclicity (Kahn's Algorithm).
 */
export function isGraphGloballyAcyclic(tasks: TaskEntity[]): boolean {
  const activeTasks = tasks.filter((t) => !t.isDeleted);
  const inDegree = new Map<EntityId, number>();
  const adj = new Map<EntityId, EntityId[]>();

  for (const t of activeTasks) {
    inDegree.set(t.id, 0);
    adj.set(t.id, []);
  }

  // Populate edges and in-degrees
  for (const t of activeTasks) {
    for (const depId of t.dependencies) {
      if (inDegree.has(depId)) {
        adj.get(depId)!.push(t.id);
        inDegree.set(t.id, (inDegree.get(t.id) || 0) + 1);
      }
    }
  }

  const queue: EntityId[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(id);
    }
  }

  let visitedCount = 0;
  while (queue.length > 0) {
    const u = queue.shift()!;
    visitedCount++;

    for (const v of adj.get(u) || []) {
      const newDeg = (inDegree.get(v) || 0) - 1;
      inDegree.set(v, newDeg);
      if (newDeg === 0) {
        queue.push(v);
      }
    }
  }

  return visitedCount === activeTasks.length;
}
