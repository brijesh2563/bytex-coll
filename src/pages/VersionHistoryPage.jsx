import { useState, useMemo } from 'react';
import { useSyncStore } from '../store/useSyncStore';
import { PageHeader } from '../components/layout/PageHeader';
import {
  History,
  FileEdit,
  PlusCircle,
  GitFork,
  CheckCircle2
} from 'lucide-react';

/**
 * VersionHistoryPage
 * Destination: Sidebar -> History
 * 
 * Header:
 * Workspace / History
 * History [actual entry count]
 * Description: Complete timeline of workspace actions, local saves, and updates.
 * 
 * Clean vertical list timeline of real events with secondary technical details.
 */
export function VersionHistoryPage() {
  const {
    replicaA,
    conflicts,
    resolvedConflicts,
  } = useSyncStore();

  const [expandedEventId, setExpandedEventId] = useState(null);

  // Synthesize events strictly from actual store activity
  const timelineEvents = useMemo(() => {
    const events = [];

    // 1. Pending operations on this device
    (replicaA.pendingOps || []).forEach((op, idx) => {
      let title = 'You updated task';
      let summary = 'Modified field value saved locally to IndexedDB';

      if (op.type === 'TASK_CREATE') {
        title = `You created task "${op.payload?.title || 'Untitled'}"`;
        summary = `New task created locally with ${op.payload?.priority || 'MEDIUM'} priority`;
      } else if (op.type === 'TASK_UPDATE_STATUS') {
        title = 'You changed task status';
        summary = `Status transitioned to ${op.payload?.newValue || 'updated'}`;
      } else if (op.type === 'TASK_UPDATE_FIELD') {
        title = `You updated task ${op.payload?.field || 'field'}`;
        summary = `Changed ${op.payload?.field} to "${op.payload?.newValue}"`;
      } else if (op.type === 'TASK_DELETE') {
        title = 'You removed task';
        summary = `Task deleted from local storage`;
      }

      events.push({
        id: op.id || `pending_op_${idx}`,
        title,
        summary,
        timestamp: op.meta?.timestamp ? new Date(op.meta.timestamp).toLocaleTimeString() : 'Recent local save',
        badge: 'Local Save',
        badgeColor: 'bg-[#FAF5EC] text-[#C4872D]',
        icon: FileEdit,
        iconColor: 'text-[#C4872D]',
        iconBg: 'bg-[#FAF5EC]',
        technical: {
          opId: op.id,
          replicaId: op.meta?.replicaId || replicaA.id,
          baseVersion: op.meta?.baseVersion,
        },
      });
    });

    // 2. Active conflicts
    (conflicts || []).forEach((c) => {
      events.push({
        id: `conflict_${c.id}`,
        title: `Conflict detected on "${c.title}"`,
        summary: 'Concurrent edits diverged between this node and remote replica',
        timestamp: 'Active state',
        badge: 'Conflict Open',
        badgeColor: 'bg-[#FBEBEB] text-[#B94A48]',
        icon: GitFork,
        iconColor: 'text-[#B94A48]',
        iconBg: 'bg-[#FBEBEB]',
        technical: {
          conflictId: c.id,
          taskCardId: c.taskCardId,
          lcaHash: c.lcaHash,
        },
      });
    });

    // 3. Resolved conflicts
    (resolvedConflicts || []).forEach((rc) => {
      events.push({
        id: `resolved_${rc.id}_${rc.resolvedAt}`,
        title: `Conflict resolved on "${rc.title}"`,
        summary: `Manually reconciled using ${rc.strategy?.toUpperCase() || 'LWW'} strategy`,
        timestamp: rc.resolvedAt ? new Date(rc.resolvedAt).toLocaleTimeString() : 'Earlier',
        badge: 'Resolved',
        badgeColor: 'bg-[#E4F1EF] text-[#2F7D68]',
        icon: CheckCircle2,
        iconColor: 'text-[#2F7D68]',
        iconBg: 'bg-[#E4F1EF]',
        technical: {
          conflictId: rc.id,
          strategy: rc.strategy,
        },
      });
    });

    // 4. Baseline initial tasks
    (replicaA.tasks || []).slice(0, 3).forEach((task) => {
      events.push({
        id: `seed_task_${task.id}`,
        title: `Task checkpoint: "${task.title}"`,
        summary: `Persisted in ${task.category || 'Core Roadmap'} with priority ${task.priority}`,
        timestamp: task.dueDate ? `Due ${task.dueDate}` : 'Baseline checkpoint',
        badge: 'Persisted',
        badgeColor: 'bg-[#E4F1EF] text-[#176D70]',
        icon: PlusCircle,
        iconColor: 'text-[#176D70]',
        iconBg: 'bg-[#E4F1EF]',
        technical: {
          taskId: task.id,
          version: task.version,
        },
      });
    });

    return events;
  }, [replicaA.pendingOps, replicaA.tasks, replicaA.id, conflicts, resolvedConflicts]);

  const totalEntries = timelineEvents.length;

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* 1. UNIFIED PAGE HEADER */}
      <PageHeader
        breadcrumbs={['Workspace', 'History']}
        title="History"
        badge={
          <span className="px-2.5 py-0.5 rounded-full bg-[#E4F1EF] text-[#176D70] font-mono text-xs font-semibold">
            {totalEntries} Entries
          </span>
        }
        description="Complete timeline of workspace actions, local saves, and updates."
      />

      {/* 2. TIMELINE LIST CONTAINER */}
      <section className="bg-[#FFFFFF] border border-[#DCE5E1] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#DCE5E1]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#176D70]" />
            <h2 className="font-display text-base font-bold text-[#15201F]">
              Workspace Action Timeline
            </h2>
          </div>
          <span className="font-mono text-xs text-[#697775]">
            Chronological Order
          </span>
        </div>

        {totalEntries > 0 ? (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-[#DCE5E1] space-y-8 my-2">
            {timelineEvents.map((ev) => {
              const IconComp = ev.icon;
              const isExpanded = expandedEventId === ev.id;

              return (
                <div key={ev.id} className="relative group">
                  {/* Timeline Node Dot */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 rounded-full bg-white border-2 border-[#DCE5E1] group-hover:border-[#176D70] flex items-center justify-center transition-colors">
                    <span className="w-2 h-2 rounded-full bg-[#176D70]" />
                  </div>

                  {/* Event Content Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl bg-[#F6F8F6] border border-[#DCE5E1] hover:bg-[#FFFFFF] hover:border-[#176D70]/40 transition shadow-2xs">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg ${ev.iconBg} ${ev.iconColor} flex items-center justify-center shrink-0`}>
                        <IconComp className="w-4 h-4" />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-sans text-xs sm:text-sm font-bold text-[#15201F]">
                            {ev.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${ev.badgeColor}`}>
                            {ev.badge}
                          </span>
                        </div>

                        <p className="font-sans text-xs text-[#697775] mt-0.5">
                          {ev.summary}
                        </p>

                        {/* Secondary technical info toggle */}
                        {ev.technical && (
                          <div className="mt-2 pt-2 border-t border-[#DCE5E1]/60 flex items-center gap-3 text-[11px] font-mono text-[#697775]">
                            <span>Timestamp: {ev.timestamp}</span>
                            <span className="text-[#DCE5E1]">•</span>
                            <button
                              type="button"
                              onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                              className="text-[#176D70] hover:underline cursor-pointer"
                            >
                              {isExpanded ? 'Hide Details' : 'Op Metadata'}
                            </button>
                          </div>
                        )}

                        {isExpanded && ev.technical && (
                          <div className="mt-2 p-2.5 rounded-lg bg-[#FFFFFF] border border-[#DCE5E1] font-mono text-[11px] text-[#697775] space-y-1">
                            {Object.entries(ev.technical).map(([k, v]) => (
                              <div key={k}>
                                <span className="text-[#15201F] font-semibold">{k}:</span> {String(v)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="font-mono text-xs text-[#697775] self-start sm:self-center shrink-0">
                      {ev.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-[#697775]">
            No timeline events recorded in this session.
          </div>
        )}
      </section>
    </div>
  );
}
