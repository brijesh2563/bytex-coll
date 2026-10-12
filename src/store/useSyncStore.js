import { create } from 'zustand';
import {
  saveTaskLocally,
  deleteTaskLocally,
  seedTasksIfEmpty,
  queuePendingOperation,
  getPendingOperations,
} from '../core/idb';

/**
 * Initial local demo/seed tasks.
 * Clearly marked as local seed data, NOT server truth.
 */
export const SEED_TASKS = [
  {
    id: 'card-1',
    title: 'Formalize state-based convergence proof',
    category: 'CRDT Contract',
    priority: 'HIGH',
    dueDate: 'Oct 28',
    status: 'TODO',
    dependencies: [],
    version: 14,
    syncStatus: 'SYNCED_INITIAL',
    impactMeta: {
      downstreamCount: 1,
      riskLevel: 'LOW',
    },
  },
  {
    id: 'card-2',
    title: 'Produce 200 physical observatory badges',
    category: 'High Priority',
    priority: 'CRITICAL',
    dueDate: 'Nov 04',
    status: 'IN_PROGRESS',
    dependencies: ['card-1'],
    version: 14,
    syncStatus: 'SYNCED_INITIAL',
    impactMeta: {
      downstreamCount: 0,
      riskLevel: 'MEDIUM',
    },
  },
  {
    id: 'card-3',
    title: 'Run simulated 10k-op packet drop storm',
    category: 'Engine Review',
    priority: 'MEDIUM',
    dueDate: 'Nov 12',
    status: 'TODO',
    dependencies: [],
    version: 14,
    syncStatus: 'SYNCED_INITIAL',
    impactMeta: {
      downstreamCount: 0,
      riskLevel: 'LOW',
    },
  },
];

/**
 * Derives the truthful dial state based strictly on real frontend metrics.
 * Rule:
 * - If any replica is offline or has unacknowledged pending operations -> DIVERGING
 * - If active conflicts exist -> CONFLICT
 * - If online, zero pending operations, and no conflicts -> SYNCED
 */
function deriveTruthfulDialState(replicaA, replicaB, conflicts = []) {
  const isOnlineA = replicaA.effectiveOnline;
  const isOnlineB = replicaB.effectiveOnline;
  const pendingCount = (replicaA.pendingOps?.length || 0) + (replicaB.pendingOps?.length || 0);

  if (conflicts.length > 0) {
    return {
      dialState: 'CONFLICT',
      driftOps: pendingCount,
      failingInvariant: 'Semantic conflict detected on active replica state',
    };
  }

  if (!isOnlineA || !isOnlineB || pendingCount > 0) {
    return {
      dialState: 'DIVERGING',
      driftOps: pendingCount,
      failingInvariant: null,
    };
  }

  return {
    dialState: 'SYNCED',
    driftOps: 0,
    failingInvariant: null,
  };
}

// Truthful Session Storage Persistence Helpers
const getStoredSession = () => {
  if (typeof sessionStorage !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('nexussync_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.isAuthenticated) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse nexussync_session from sessionStorage:', e);
    }
  }
  return null;
};

const initialSession = getStoredSession();

const getInitialActivePage = () => {
  if (typeof window !== 'undefined' && window.location.hash) {
    const rawHash = window.location.hash.replace('#', '');
    if (rawHash) {
      const publicRoutes = ['login', 'signin', 'signup', 'register', 'auth', 'gate'];
      // Unauthenticated sessions must land on login unless specifically accessing another public auth route
      if (!initialSession && !publicRoutes.includes(rawHash)) {
        return 'login';
      }
      return rawHash;
    }
  }
  return initialSession ? 'workspace' : 'login';
};

export const useSyncStore = create((set, get) => ({
  // Browser Network State
  isBrowserOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isInitialized: false,

  // Replicas State
  replicaA: {
    id: 'r_aarav-lap',
    name: "Aarav's Laptop (Replica A)",
    partition: 'active_ops_partition_a',
    isSimulatedOnline: true,
    effectiveOnline: true,
    version: 14,
    tasks: [],
    pendingOps: [],
  },
  replicaB: {
    id: 'r_meera-ph',
    name: "Meera's Phone (Replica B)",
    partition: 'active_ops_partition_b',
    isSimulatedOnline: true,
    effectiveOnline: true,
    version: 14,
    tasks: [],
    pendingOps: [],
  },

  // Active Page Navigation
  activePage: getInitialActivePage(),

  // NexusSync Fixed Pearl × Deep Teal Theme
  theme: 'light',

  // Operator Auth & Session State (Truthful Local Demo Enclave)
  user: initialSession,

  // Active Conflicts
  conflicts: [
    {
      id: 'conf_204',
      taskCardId: 'card-2',
      title: 'Produce 200 physical observatory badges',
      lcaHash: '7bf812c',
      deltaSize: '1.42 KB',
      lamportTicks: 2841,
      base: {
        version: 'v12 · LCA',
        clock: '[10, 10]',
        title: 'Produce 200 physical observatory badges',
        dueDate: 'Nov 01, 2026',
        assignee: 'Aarav Sharma',
        priority: 'NORMAL',
        blockingDep: 'Root #101',
      },
      branchA: {
        replica: 'Replica A (Aarav / r_aarav-lap)',
        version: 'v14 · Fork A',
        clock: '[12, 10]',
        dueDate: 'Nov 04, 2026',
        priority: 'HIGH',
        assignee: 'Aarav Sharma',
        blockingDep: 'Root #101',
      },
      branchB: {
        replica: 'Replica B (Meera / r_meera-ph)',
        version: 'v14 · Fork B',
        clock: '[10, 13]',
        dueDate: 'Nov 19, 2026',
        priority: 'NORMAL',
        assignee: 'Meera Patel',
        blockingDep: 'Unlinked Block #205',
      },
    },
  ],

  // Conflict Resolver Interactive State
  resolutionStrategy: 'lww', // 'lww' | 'mvr' | 'suture'
  sutureSelections: {
    dueDate: 'branchA',
    priority: 'branchA',
    assignee: 'branchB',
    blockingDep: 'branchA',
  },
  resolvedConflicts: [],

  // Convergence Lab & Chaos Simulator State
  chaosEngaged: true,
  networkDriftMs: 320,
  chaosFlags: {
    dropPackets: true,
    duplicateOps: true,
    outOfOrder: true,
    asymmetricPartition: false,
  },
  chaosEvents: [
    { id: 'ev-1', time: '12:04:18', type: 'PACKET_DELAY', desc: 'Synthetic 320ms drift injected on Tokyo-London hop', lamport: 14820 },
    { id: 'ev-2', time: '12:05:02', type: 'PACKET_DROP', desc: 'Simulated stochastic link sever (25% loss) on Zurich ingress', lamport: 14825 },
    { id: 'ev-3', time: '12:06:45', type: 'DUPLICATE_OP', desc: 'Ghost duplicate echo [op_7Kq2x] ingested and discarded by idempotent LWW register', lamport: 14829 },
  ],

  // Vector Timeline Scrubber State
  timelineEpoch: 14,
  selectedOpId: 'op_7Kq2x',
  isPlayingTimeline: false,

  // Truthful Dial Parameters
  dialState: 'SYNCED',
  driftOps: 0,
  stateHash: '9f3a1c8e',
  isHashMatching: true,
  failingInvariant: null,

  // --------------------------------------------------------------------------
  // Initialization & IndexedDB Restoration
  // --------------------------------------------------------------------------
  initWorkspace: async () => {
    if (get().isInitialized) return;

    try {
      // 1. Seed or restore tasks from IndexedDB for Replica A
      const tasksA = await seedTasksIfEmpty('r_aarav-lap', SEED_TASKS);
      const pendingOpsA = await getPendingOperations('r_aarav-lap');

      // 2. Seed or restore tasks from IndexedDB for Replica B
      const tasksB = await seedTasksIfEmpty('r_meera-ph', SEED_TASKS);
      const pendingOpsB = await getPendingOperations('r_meera-ph');

      const browserOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      set((state) => {
        const replicaA = {
          ...state.replicaA,
          tasks: tasksA,
          pendingOps: pendingOpsA,
          effectiveOnline: browserOnline && state.replicaA.isSimulatedOnline,
        };
        const replicaB = {
          ...state.replicaB,
          tasks: tasksB,
          pendingOps: pendingOpsB,
          effectiveOnline: browserOnline && state.replicaB.isSimulatedOnline,
        };

        const derived = deriveTruthfulDialState(replicaA, replicaB, state.conflicts);

        return {
          isInitialized: true,
          isBrowserOnline: browserOnline,
          replicaA,
          replicaB,
          ...derived,
        };
      });
    } catch (err) {
      console.error('Failed to initialize IndexedDB workspace:', err);
    }
  },

  // --------------------------------------------------------------------------
  // Real Browser Network Event Listener Action
  // --------------------------------------------------------------------------
  setBrowserOnlineStatus: (isOnline) => {
    set((state) => {
      const replicaA = {
        ...state.replicaA,
        effectiveOnline: isOnline && state.replicaA.isSimulatedOnline,
      };
      const replicaB = {
        ...state.replicaB,
        effectiveOnline: isOnline && state.replicaB.isSimulatedOnline,
      };

      const derived = deriveTruthfulDialState(replicaA, replicaB, state.conflicts);

      return {
        isBrowserOnline: isOnline,
        replicaA,
        replicaB,
        ...derived,
      };
    });
  },

  // --------------------------------------------------------------------------
  // Simulated Replica Toggle
  // --------------------------------------------------------------------------
  toggleReplicaOnline: (replicaKey) => {
    set((state) => {
      const current = state[replicaKey];
      const nextSimulated = !current.isSimulatedOnline;
      const nextEffective = state.isBrowserOnline && nextSimulated;

      const updatedReplica = {
        ...current,
        isSimulatedOnline: nextSimulated,
        effectiveOnline: nextEffective,
      };

      const replicaA = replicaKey === 'replicaA' ? updatedReplica : state.replicaA;
      const replicaB = replicaKey === 'replicaB' ? updatedReplica : state.replicaB;

      const derived = deriveTruthfulDialState(replicaA, replicaB, state.conflicts);

      return {
        [replicaKey]: updatedReplica,
        ...derived,
      };
    });
  },

  // --------------------------------------------------------------------------
  // Local Task Mutations & IndexedDB Persistence (P0)
  // --------------------------------------------------------------------------
  updateTaskTitle: async (replicaKey, taskId, newTitle) => {
    const state = get();
    const replica = state[replicaKey];
    const existingTask = replica.tasks.find((t) => t.id === taskId);
    if (!existingTask) return;

    const updatedTask = {
      ...existingTask,
      title: newTitle,
      syncStatus: 'PENDING_SYNC', // Visibly tagged as pending local change
    };

    // Update in-memory tasks
    const updatedTasks = replica.tasks.map((t) => (t.id === taskId ? updatedTask : t));

    // Construct local pending operation
    const op = {
      id: `${replica.id}:op_${Date.now().toString(36)}`,
      type: 'TASK_UPDATE_FIELD',
      documentId: 'doc_workspace_main',
      payload: {
        taskId,
        field: 'title',
        oldValue: existingTask.title,
        newValue: newTitle,
      },
      meta: {
        replicaId: replica.id,
        baseVersion: existingTask.version,
        timestamp: Date.now(),
      },
    };

    // Persist task and operation to IndexedDB
    try {
      await saveTaskLocally(replica.id, updatedTask);
      const localOpId = await queuePendingOperation(replica.id, op);
      const updatedPendingOps = [...replica.pendingOps, { ...op, localId: localOpId }];

      set((curr) => {
        const nextReplica = {
          ...curr[replicaKey],
          tasks: updatedTasks,
          pendingOps: updatedPendingOps,
        };

        const replicaA = replicaKey === 'replicaA' ? nextReplica : curr.replicaA;
        const replicaB = replicaKey === 'replicaB' ? nextReplica : curr.replicaB;

        const derived = deriveTruthfulDialState(replicaA, replicaB, curr.conflicts);

        return {
          [replicaKey]: nextReplica,
          ...derived,
        };
      });
    } catch (err) {
      console.error('Failed to persist task mutation in IndexedDB:', err);
    }
  },

  appendTask: async (replicaKey) => {
    const state = get();
    const replica = state[replicaKey];
    const newId = `card-${Date.now().toString(36).slice(-4)}`;

    const newTask = {
      id: newId,
      title: 'New local task checkpoint',
      category: 'Local Draft',
      priority: 'MEDIUM',
      dueDate: 'Open Date',
      status: 'TODO',
      dependencies: [],
      version: replica.version,
      syncStatus: 'PENDING_SYNC',
      impactMeta: {
        downstreamCount: 0,
        riskLevel: 'LOW',
      },
    };

    const op = {
      id: `${replica.id}:op_${Date.now().toString(36)}`,
      type: 'TASK_CREATE',
      documentId: 'doc_workspace_main',
      payload: newTask,
      meta: {
        replicaId: replica.id,
        baseVersion: replica.version,
        timestamp: Date.now(),
      },
    };

    try {
      await saveTaskLocally(replica.id, newTask);
      const localOpId = await queuePendingOperation(replica.id, op);

      set((curr) => {
        const nextReplica = {
          ...curr[replicaKey],
          tasks: [...curr[replicaKey].tasks, newTask],
          pendingOps: [...curr[replicaKey].pendingOps, { ...op, localId: localOpId }],
        };

        const replicaA = replicaKey === 'replicaA' ? nextReplica : curr.replicaA;
        const replicaB = replicaKey === 'replicaB' ? nextReplica : curr.replicaB;

        const derived = deriveTruthfulDialState(replicaA, replicaB, curr.conflicts);

        return {
          [replicaKey]: nextReplica,
          ...derived,
        };
      });
    } catch (err) {
      console.error('Failed to append task in IndexedDB:', err);
    }
  },

  updateTaskStatus: async (replicaKey, taskId, newStatus) => {
    const state = get();
    const replica = state[replicaKey];
    const existingTask = replica.tasks.find((t) => t.id === taskId);
    if (!existingTask) return;

    const updatedTask = {
      ...existingTask,
      status: newStatus,
      syncStatus: 'PENDING_SYNC',
    };

    const updatedTasks = replica.tasks.map((t) => (t.id === taskId ? updatedTask : t));

    const op = {
      id: `${replica.id}:op_${Date.now().toString(36)}`,
      type: 'TASK_UPDATE_STATUS',
      documentId: 'doc_workspace_main',
      payload: {
        taskId,
        field: 'status',
        oldValue: existingTask.status,
        newValue: newStatus,
      },
      meta: {
        replicaId: replica.id,
        baseVersion: existingTask.version,
        timestamp: Date.now(),
      },
    };

    try {
      await saveTaskLocally(replica.id, updatedTask);
      const localOpId = await queuePendingOperation(replica.id, op);
      const updatedPendingOps = [...replica.pendingOps, { ...op, localId: localOpId }];

      set((curr) => {
        const nextReplica = {
          ...curr[replicaKey],
          tasks: updatedTasks,
          pendingOps: updatedPendingOps,
        };

        const replicaA = replicaKey === 'replicaA' ? nextReplica : curr.replicaA;
        const replicaB = replicaKey === 'replicaB' ? nextReplica : curr.replicaB;

        const derived = deriveTruthfulDialState(replicaA, replicaB, curr.conflicts);

        return {
          [replicaKey]: nextReplica,
          ...derived,
        };
      });
    } catch (err) {
      console.error('Failed to update task status in IndexedDB:', err);
    }
  },

  deleteTask: async (replicaKey, taskId) => {
    const state = get();
    const replica = state[replicaKey];
    const existingTask = replica.tasks.find((t) => t.id === taskId);
    if (!existingTask) return;

    const remainingTasks = replica.tasks.filter((t) => t.id !== taskId);

    const op = {
      id: `${replica.id}:op_${Date.now().toString(36)}`,
      type: 'TASK_DELETE',
      documentId: 'doc_workspace_main',
      payload: { taskId },
      meta: {
        replicaId: replica.id,
        baseVersion: existingTask.version,
        timestamp: Date.now(),
      },
    };

    try {
      await deleteTaskLocally(replica.id, taskId);
      const localOpId = await queuePendingOperation(replica.id, op);
      const updatedPendingOps = [...replica.pendingOps, { ...op, localId: localOpId }];

      set((curr) => {
        const nextReplica = {
          ...curr[replicaKey],
          tasks: remainingTasks,
          pendingOps: updatedPendingOps,
        };

        const replicaA = replicaKey === 'replicaA' ? nextReplica : curr.replicaA;
        const replicaB = replicaKey === 'replicaB' ? nextReplica : curr.replicaB;

        const derived = deriveTruthfulDialState(replicaA, replicaB, curr.conflicts);

        return {
          [replicaKey]: nextReplica,
          ...derived,
        };
      });
    } catch (err) {
      console.error('Failed to delete task in IndexedDB:', err);
    }
  },

  createCustomTask: async (replicaKey, taskData) => {
    const state = get();
    const replica = state[replicaKey];
    const newId = `NX-${Math.floor(100 + Math.random() * 900)}`;

    const newTask = {
      id: newId,
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      category: taskData.category || 'Core Roadmap',
      priority: taskData.priority || 'MEDIUM',
      dueDate: taskData.dueDate || 'Nov 14',
      status: taskData.status || 'BACKLOG',
      assignee: taskData.assignee || 'Elena Vance',
      dependencies: taskData.dependencies || [],
      version: replica.version,
      syncStatus: 'PENDING_SYNC',
      impactMeta: {
        downstreamCount: 0,
        riskLevel: 'LOW',
      },
    };

    const op = {
      id: `${replica.id}:op_${Date.now().toString(36)}`,
      type: 'TASK_CREATE',
      documentId: 'doc_workspace_main',
      payload: newTask,
      meta: {
        replicaId: replica.id,
        baseVersion: replica.version,
        timestamp: Date.now(),
      },
    };

    try {
      await saveTaskLocally(replica.id, newTask);
      const localOpId = await queuePendingOperation(replica.id, op);

      set((curr) => {
        const nextReplica = {
          ...curr[replicaKey],
          tasks: [...curr[replicaKey].tasks, newTask],
          pendingOps: [...curr[replicaKey].pendingOps, { ...op, localId: localOpId }],
        };

        const replicaA = replicaKey === 'replicaA' ? nextReplica : curr.replicaA;
        const replicaB = replicaKey === 'replicaB' ? nextReplica : curr.replicaB;

        const derived = deriveTruthfulDialState(replicaA, replicaB, curr.conflicts);

        return {
          [replicaKey]: nextReplica,
          ...derived,
        };
      });
    } catch (err) {
      console.error('Failed to create custom task in IndexedDB:', err);
    }
  },

  // --------------------------------------------------------------------------
  // Navigation & Page Switching
  // --------------------------------------------------------------------------
  setActivePage: (page) => {
    if (typeof window !== 'undefined') {
      window.location.hash = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    set({ activePage: page });
  },

  // --------------------------------------------------------------------------
  // Fixed Pearl × Deep Teal Theme
  setTheme: () => {
    set({ theme: 'light' });
  },

  toggleTheme: () => {
    // Theme is fixed to Pearl × Deep Teal
  },

  // --------------------------------------------------------------------------
  // Operator Auth & Session (Isolated Demo Adapter Store)
  // --------------------------------------------------------------------------
  login: (userData) => {
    const isChief = (userData.role || '').toUpperCase().includes('CHIEF') ||
                    (userData.role || '').toUpperCase().includes('ARBITER') ||
                    userData.isAdmin === true;
    const sessionUser = {
      id: userData.id || 'op_custom',
      name: userData.name || 'Station Operator',
      email: userData.email || 'operator@nexussync.org',
      role: userData.role || (isChief ? 'CHIEF OPERATOR' : 'PEER OPERATOR'),
      replicaId: userData.replicaId || 'r_operator_primary',
      region: userData.region || 'local-isolated (Enclave)',
      isAdmin: isChief,
      accessLevel: isChief ? 'TIER-0 ARBITER' : 'PEER QUORUM',
      authMode: 'LOCAL / DEMO',
      sessionType: 'LOCAL OPERATOR',
      ed25519Fingerprint: userData.ed25519Fingerprint || '7F8C·914B·22D1·D91A',
      isAuthenticated: true,
      sessionStartedAt: Date.now(),
    };

    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem('nexussync_session', JSON.stringify(sessionUser));
      } catch (err) {
        console.warn('Could not store session in sessionStorage:', err);
      }
    }

    set({ user: sessionUser });
  },

  signup: (userData) => {
    get().login(userData);
  },

  logout: () => {
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem('nexussync_session');
      } catch (err) {
        console.warn('Could not remove session from sessionStorage:', err);
      }
    }
    set({
      user: null,
      activePage: 'login',
    });
    if (typeof window !== 'undefined') {
      window.location.hash = 'login';
    }
  },

  elevateToAdmin: () => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = {
        ...state.user,
        isAdmin: true,
        role: 'CHIEF OPERATOR',
        accessLevel: 'TIER-0 ARBITER',
      };
      if (typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.setItem('nexussync_session', JSON.stringify(updatedUser));
        } catch {
          // Ignore
        }
      }
      return {
        user: updatedUser,
      };
    });
  },

  // --------------------------------------------------------------------------
  // Conflict Resolver Actions
  // --------------------------------------------------------------------------
  setResolutionStrategy: (strategy) => {
    set({ resolutionStrategy: strategy });
  },

  setSutureSelection: (field, branch) => {
    set((state) => ({
      sutureSelections: {
        ...state.sutureSelections,
        [field]: branch,
      },
    }));
  },

  resolveConflict: (conflictId) => {
    const state = get();
    const conflict = state.conflicts.find((c) => c.id === conflictId);
    if (!conflict) return;

    const remaining = state.conflicts.filter((c) => c.id !== conflictId);
    const resolved = [...state.resolvedConflicts, { ...conflict, resolvedAt: Date.now(), strategy: state.resolutionStrategy }];

    const derived = deriveTruthfulDialState(state.replicaA, state.replicaB, remaining);

    set({
      conflicts: remaining,
      resolvedConflicts: resolved,
      ...derived,
    });
  },

  // --------------------------------------------------------------------------
  // Convergence Lab & Chaos Simulator Actions
  // --------------------------------------------------------------------------
  setNetworkDriftMs: (ms) => {
    set((state) => ({
      networkDriftMs: ms,
      chaosEvents: [
        {
          id: `ev-${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          type: 'LATENCY_DRIFT',
          desc: `Drift adjusted to ${ms}ms across mesh transport`,
          lamport: 14830 + Math.floor(Math.random() * 20),
        },
        ...state.chaosEvents.slice(0, 15),
      ],
    }));
  },

  toggleChaosFlag: (flagKey) => {
    set((state) => {
      const current = state.chaosFlags[flagKey];
      const nextFlags = { ...state.chaosFlags, [flagKey]: !current };
      const eventName = (!current ? 'ENGAGED: ' : 'DISENGAGED: ') + flagKey;
      return {
        chaosFlags: nextFlags,
        chaosEvents: [
          {
            id: `ev-${Date.now()}`,
            time: new Date().toLocaleTimeString(),
            type: 'FLAG_TOGGLE',
            desc: eventName,
            lamport: 14830 + Math.floor(Math.random() * 20),
          },
          ...state.chaosEvents.slice(0, 15),
        ],
      };
    });
  },

  triggerCatastrophe: (type) => {
    const time = new Date().toLocaleTimeString();
    let desc = '';
    if (type === 'duplicate_storm') desc = 'Synthetic Duplicate Storm (10k ops) flooded through mesh';
    else if (type === 'split_brain') desc = 'Bipartite split-brain partition severed Tokyo & London';
    else if (type === 'reorder_cascade') desc = 'Entropy shuffling of Lamport vectors triggered';
    else desc = `Scenario ${type} triggered`;

    set((state) => ({
      chaosEvents: [
        {
          id: `ev-${Date.now()}`,
          time,
          type: 'CATASTROPHE',
          desc,
          lamport: 14850 + Math.floor(Math.random() * 50),
        },
        ...state.chaosEvents.slice(0, 15),
      ],
    }));
  },

  // --------------------------------------------------------------------------
  // Vector Timeline Scrubber Actions
  // --------------------------------------------------------------------------
  setTimelineEpoch: (epoch) => {
    set({ timelineEpoch: Math.max(0, Math.min(14, epoch)) });
  },

  setSelectedOpId: (opId) => {
    set({ selectedOpId: opId });
  },

  setIsPlayingTimeline: (isPlaying) => {
    set({ isPlayingTimeline: isPlaying });
  },

  // --------------------------------------------------------------------------
  // Dial Override (for testing only)
  // --------------------------------------------------------------------------
  setDialState: (dialState) => {
    set({ dialState });
  },
}));
