import { ReplicaPane } from './ReplicaPane';
import { SyncBridge } from './SyncBridge';
import { useSyncStore } from '../../store/useSyncStore';
import { HardDrive, CheckCircle2, Clock } from 'lucide-react';

/**
 * Ported Collaborative Workspace section from Stitch Screen 3e5e7475...
 */
export function WorkspaceView() {
  const {
    replicaA,
    replicaB,
    isBrowserOnline,
    toggleReplicaOnline,
    updateTaskTitle,
    appendTask,
  } = useSyncStore();

  const totalPendingOps = (replicaA.pendingOps?.length || 0) + (replicaB.pendingOps?.length || 0);
  const isAnyOffline = !replicaA.effectiveOnline || !replicaB.effectiveOnline;

  return (
    <section id="workspace" className="py-8 flex flex-col gap-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--ink-faint)] mb-1">
            02 / LIVE INSTRUMENT WORKSPACE
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink)]">
            Independent Observation Panes
          </h2>
        </div>

        {/* Real Status Legend */}
        <div className="font-mono text-xs text-[var(--ink-soft)] flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--verdigris)]" />
            <span>Persisted in IDB</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[var(--copper)]" />
            <span>Queued Offline ({totalPendingOps})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-[var(--ink-faint)]" />
            <span>IndexedDB Partitioned</span>
          </span>
        </div>
      </div>

      {/* Sync Bridge */}
      <SyncBridge totalPendingOps={totalPendingOps} isOffline={isAnyOffline} />

      {/* Two Replica Panes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative items-start">
        <ReplicaPane
          replica={replicaA}
          replicaKey="replicaA"
          isBrowserOnline={isBrowserOnline}
          onToggleOnline={toggleReplicaOnline}
          onTitleChange={updateTaskTitle}
          onAppendTask={appendTask}
        />

        <ReplicaPane
          replica={replicaB}
          replicaKey="replicaB"
          isBrowserOnline={isBrowserOnline}
          onToggleOnline={toggleReplicaOnline}
          onTitleChange={updateTaskTitle}
          onAppendTask={appendTask}
        />
      </div>

      {/* Architectural Truth Note */}
      <div className="p-4 bg-[var(--paper-raised)] border border-[var(--line)] rounded-lg font-mono text-[11px] text-[var(--ink-faint)] flex items-center justify-between">
        <span>
          LOCAL PERSISTENCE ACTIVE: All edits write to IndexedDB store immediately and persist across reloads.
        </span>
        <span className="text-[var(--copper)] font-semibold">
          {totalPendingOps > 0 ? `${totalPendingOps} LOCAL OPERATIONS PENDING SYNC` : 'LOCAL IDB IN SYNC WITH REPLICA STATE'}
        </span>
      </div>
    </section>
  );
}
