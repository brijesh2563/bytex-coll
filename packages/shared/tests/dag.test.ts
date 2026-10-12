import { describe, it, expect } from 'vitest';
import {
  detectCycleInTasks,
  validateDependencyAddition,
  isGraphGloballyAcyclic
} from '../src/dag.js';
import type { TaskEntity } from '../src/types.js';

describe('DAG Invariant Engine — Dependency Cycle Detection', () => {
  const createMockTask = (id: string, dependencies: string[] = []): TaskEntity => ({
    id,
    projectId: 'proj-1',
    title: `Task ${id}`,
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: null,
    dependencies,
    version: 1,
    updatedAt: new Date().toISOString(),
    isDeleted: false
  });

  it('allows valid acyclic dependency additions', () => {
    const tasks = [createMockTask('T1'), createMockTask('T2')];
    const res = validateDependencyAddition(tasks, 'T1', 'T2'); // T1 depends on T2
    expect(res.valid).toBe(true);
    expect(res.reason).toBeUndefined();
  });

  it('rejects immediate self-dependency', () => {
    const tasks = [createMockTask('T1')];
    const res = validateDependencyAddition(tasks, 'T1', 'T1');
    expect(res.valid).toBe(false);
    expect(res.reason).toMatch(/SELF_DEPENDENCY_FORBIDDEN/);
  });

  it('rejects direct 2-node cycle (T1 -> T2 and T2 -> T1)', () => {
    // T1 already depends on T2
    const tasks = [createMockTask('T1', ['T2']), createMockTask('T2')];
    // Attempt to make T2 depend on T1
    const res = validateDependencyAddition(tasks, 'T2', 'T1');
    expect(res.valid).toBe(false);
    expect(res.reason).toMatch(/DEPENDENCY_CYCLE/);
  });

  it('rejects multi-node transitive cycle (T1 -> T2 -> T3, then T3 -> T1)', () => {
    // T1 depends on T2, T2 depends on T3
    const tasks = [
      createMockTask('T1', ['T2']),
      createMockTask('T2', ['T3']),
      createMockTask('T3')
    ];

    // Attempt to make T3 depend on T1
    const res = validateDependencyAddition(tasks, 'T3', 'T1');
    expect(res.valid).toBe(false);
    expect(res.reason).toMatch(/DEPENDENCY_CYCLE/);
  });

  it('rejects dependency on non-existent task', () => {
    const tasks = [createMockTask('T1')];
    const res = validateDependencyAddition(tasks, 'T1', 'T_GHOST');
    expect(res.valid).toBe(false);
    expect(res.reason).toMatch(/PREREQUISITE_NOT_FOUND/);
  });

  it('rejects dependency involving deleted task', () => {
    const tasks = [
      createMockTask('T1'),
      { ...createMockTask('T2'), isDeleted: true }
    ];
    const res = validateDependencyAddition(tasks, 'T1', 'T2');
    expect(res.valid).toBe(false);
    expect(res.reason).toMatch(/PREREQUISITE_NOT_FOUND/);
  });

  it('verifies global acyclicity using Kahn algorithm', () => {
    const acyclicTasks = [
      createMockTask('T1', ['T2']),
      createMockTask('T2', ['T3']),
      createMockTask('T3')
    ];
    expect(isGraphGloballyAcyclic(acyclicTasks)).toBe(true);

    const cyclicTasks = [
      createMockTask('T1', ['T2']),
      createMockTask('T2', ['T3']),
      createMockTask('T3', ['T1'])
    ];
    expect(isGraphGloballyAcyclic(cyclicTasks)).toBe(false);
  });
});
