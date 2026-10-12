import { useSyncStore } from '../store/useSyncStore';
import { PageHeader } from '../components/layout/PageHeader';
import {
  ShieldCheck,
  Clock,
  Database,
  ArrowRight,
  FileEdit,
  PlusCircle,
  Trash2,
  CheckCircle2
} from 'lucide-react';

/**
 * PendingChangesPage
 * Destination: Sidebar -> Pending Changes
 * 
 * Header:
 * Workspace / Pending Changes
 * Pending Changes [N waiting to sync]
 * 
 * Description:
 * Changes saved locally on this device that are waiting to be synchronized.
 * 
 * Reassuring Local-First Info Panel:
 * All edits are saved locally. These changes are safely stored on this device
 * and are waiting for a synchronization connection.
 * 
 * Lists actual pending operations from pending_ops store with human information first.
 */
export function PendingChangesPage() {
  const {
    replicaA,
    setActivePage,
  } = useSyncStore();

  const currentReplica = replicaA;
  const pendingOps = currentReplica.pendingOps || [];
  const pendingCount = pendingOps.length;

  const getHumanOpDetails = (op) => {
    const timestamp = op.meta?.timestamp
      ? new Date(op.meta.timestamp).toLocaleTimeString()
      : 'Saved in this session';

    switch (op.type) {
      case 'TASK_UPDATE_FIELD': {
        const fieldName = op.payload?.field || 'field';
        const taskTitle =
          currentReplica.tasks?.find((t) => t.id === op.payload?.taskId)?.title ||
          op.payload?.taskId ||
          'Workspace Task';

        return {
          action: 'Task Updated',
          title: taskTitle,
          details: `Changed ${fieldName} from "${op.payload?.oldValue}" to "${op.payload?.newValue}"`,
          savedAt: timestamp,
          icon: FileEdit,
          iconColor: 'text-[#176D70]',
          iconBg: 'bg-[#E4F1EF]',
        };
      }
      case 'TASK_UPDATE_STATUS': {
        const taskTitle =
          currentReplica.tasks?.find((t) => t.id === op.payload?.taskId)?.title ||
          op.payload?.taskId ||
          'Workspace Task';

        return {
          action: 'Task Status Updated',
          title: taskTitle,
          details: `Moved from ${op.payload?.oldValue || 'previous'} to ${op.payload?.newValue}`,
          savedAt: timestamp,
          icon: FileEdit,
          iconColor: 'text-[#C4872D]',
          iconBg: 'bg-[#FAF5EC]',
        };
      }
      case 'TASK_CREATE': {
        return {
          action: 'Task Created',
          title: op.payload?.title || 'Untitled Task',
          details: `Created in ${op.payload?.category || 'Core Roadmap'} with priority ${op.payload?.priority || 'MEDIUM'}`,
          savedAt: timestamp,
          icon: PlusCircle,
          iconColor: 'text-[#2F7D68]',
          iconBg: 'bg-[#E4F1EF]',
        };
      }
      case 'TASK_DELETE': {
        return {
          action: 'Task Removed',
          title: `Task ID: ${op.payload?.taskId}`,
          details: 'Deleted from local device state',
          savedAt: timestamp,
          icon: Trash2,
          iconColor: 'text-[#B94A48]',
          iconBg: 'bg-[#FBEBEB]',
        };
      }
      default:
        return {
          action: 'Operation Queued',
          title: op.type || 'Generic Mutation',
          details: 'Local state mutation recorded in write-ahead log',
          savedAt: timestamp,
          icon: Clock,
          iconColor: 'text-[#697775]',
          iconBg: 'bg-[#F0F4F2]',
        };
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* 1. UNIFIED PAGE HEADER */}
      <PageHeader
        breadcrumbs={['Workspace', 'Pending Changes']}
        title="Pending Changes"
        badge={
          <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold ${
            pendingCount > 0 ? 'bg-[#FAF5EC] text-[#C4872D]' : 'bg-[#E4F1EF] text-[#2F7D68]'
          }`}>
            {pendingCount > 0 ? `${pendingCount} waiting to sync` : '0 waiting to sync'}
          </span>
        }
        description="Changes saved locally on this device that are waiting to be synchronized."
        action={
          <button
            type="button"
            onClick={() => setActivePage('my-tasks')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#DCE5E1] bg-[#FFFFFF] hover:bg-[#F0F4F2] text-xs font-sans font-medium text-[#15201F] transition cursor-pointer"
          >
            <span>Back to My Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        }
      />

      {/* 2. REASSURING LOCAL-FIRST INFORMATION PANEL */}
      <section className="bg-[#FFFFFF] border border-[#DCE5E1] rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#E4F1EF] text-[#2F7D68] flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-[#15201F]">
                All edits are saved locally.
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#E4F1EF] text-[#2F7D68] font-mono text-[10px] font-semibold">
                IndexedDB Safe
              </span>
            </div>
            <p className="font-sans text-xs sm:text-sm text-[#697775] max-w-2xl leading-relaxed">
              These changes are safely stored on this device and are waiting for a synchronization connection. You can continue editing, creating, and organizing tasks without fear of data loss.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F0F4F2] border border-[#DCE5E1] text-[#15201F] text-xs font-mono shrink-0">
          <Database className="w-4 h-4 text-[#176D70]" />
          <span>Local Partition: {currentReplica.id}</span>
        </div>
      </section>

      {/* 3. PENDING OPERATIONS LIST (Real pending_ops) */}
      <section className="bg-[#FFFFFF] border border-[#DCE5E1] rounded-2xl p-6 shadow-2xs flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE5E1]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#176D70]" />
            <h3 className="font-display text-sm font-bold text-[#15201F]">
              Outbound Operations Queue ({pendingCount})
            </h3>
          </div>
          <span className="font-mono text-xs text-[#697775]">
            FIFO Order
          </span>
        </div>

        {pendingCount > 0 ? (
          <div className="flex flex-col divide-y divide-[#DCE5E1]">
            {pendingOps.map((op, idx) => {
              const info = getHumanOpDetails(op);
              const IconComponent = info.icon;

              return (
                <div
                  key={op.id || idx}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F6F8F6] px-3 rounded-xl transition"
                >
                  {/* Human Information First */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${info.iconBg} ${info.iconColor}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-sans text-xs font-bold text-[#15201F]">
                          {info.action}
                        </span>
                        <span className="text-[#DCE5E1] select-none">•</span>
                        <span className="font-sans text-xs text-[#176D70] font-semibold truncate">
                          {info.title}
                        </span>
                      </div>

                      <p className="font-sans text-xs text-[#697775] mt-0.5">
                        {info.details}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5 font-mono text-[11px] text-[#697775]">
                        <span>Saved locally at {info.savedAt}</span>
                        <span className="text-[#DCE5E1]">•</span>
                        {/* Technical info visually secondary */}
                        <span className="text-[#697775] opacity-75 truncate max-w-[200px]" title={op.id}>
                          Op ID: {op.id || `local_${idx + 1}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator: Truthful WAITING TO SYNC */}
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF5EC] border border-[#C4872D]/30 text-[#C4872D] font-mono text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C4872D] animate-pulse" />
                      <span>WAITING TO SYNC</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 px-4 rounded-xl border border-dashed border-[#DCE5E1] flex flex-col items-center justify-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#E4F1EF] text-[#2F7D68] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="font-sans text-sm font-semibold text-[#15201F]">
              No pending changes waiting to sync
            </p>
            <p className="font-sans text-xs text-[#697775] max-w-sm">
              All edits made on this device have been recorded and there are no outstanding mutations in the outbound queue.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
