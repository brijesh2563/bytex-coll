import { useSyncStore } from '../store/useSyncStore';
import { PageHeader } from '../components/layout/PageHeader';
import { ConvergenceDial } from '../components/dial/ConvergenceDial';
import {
  Layers,
  Clock,
  GitFork,
  Database,
  ArrowRight,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

/**
 * WorkspacePage
 * Authenticated Workspace landing view.
 * Provides a clean overview of current tasks, local storage integrity,
 * and distributed synchronization state via ConvergenceDial.
 */
export function WorkspacePage() {
  const {
    replicaA,
    replicaB,
    conflicts,
    setActivePage,
    toggleReplicaOnline,
  } = useSyncStore();

  const currentReplica = replicaA;
  const pendingOpsCount = (replicaA.pendingOps?.length || 0) + (replicaB.pendingOps?.length || 0);
  const totalTasks = currentReplica.tasks?.length || 0;
  const conflictsCount = conflicts?.length || 0;

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* 1. UNIFIED PAGE HEADER */}
      <PageHeader
        breadcrumbs={['Workspace']}
        title="Workspace Overview"
        badge={
          <span className="px-2.5 py-0.5 rounded-full bg-[#E4F1EF] text-[#176D70] font-mono text-xs font-semibold">
            Local Replica Active
          </span>
        }
        description="General overview of current tasks, local storage persistence, and causal convergence health for this device."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActivePage('my-tasks')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#176D70] text-white hover:bg-[#13585A] font-sans text-xs font-semibold transition shadow-2xs cursor-pointer"
            >
              <span>View My Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {conflictsCount > 0 && (
              <button
                type="button"
                onClick={() => setActivePage('conflicts')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FBEBEB] text-[#B94A48] hover:bg-[#F7D8D8] font-sans text-xs font-semibold transition border border-[#B94A48]/30 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Resolve Conflicts ({conflictsCount})</span>
              </button>
            )}
          </div>
        }
      />

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tasks */}
        <div
          onClick={() => setActivePage('my-tasks')}
          className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#DCE5E1] shadow-2xs flex flex-col justify-between gap-3 hover:border-[#176D70]/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-medium text-[#697775]">Workspace Tasks</span>
            <div className="w-7 h-7 rounded-lg bg-[#F0F4F2] text-[#176D70] flex items-center justify-center group-hover:bg-[#E4F1EF] transition-colors">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="font-display text-2xl font-bold text-[#15201F] tracking-tight">
              {totalTasks}
            </div>
            <p className="font-sans text-[11px] text-[#697775] mt-0.5">
              Across Backlog, Progress &amp; Done
            </p>
          </div>
        </div>

        {/* Card 2: Pending Operations */}
        <div
          onClick={() => setActivePage('pending')}
          className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#DCE5E1] shadow-2xs flex flex-col justify-between gap-3 hover:border-[#C4872D]/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-medium text-[#697775]">Pending Changes</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              pendingOpsCount > 0 ? 'bg-[#FAF5EC] text-[#C4872D]' : 'bg-[#F0F4F2] text-[#697775]'
            }`}>
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className={`font-display text-2xl font-bold tracking-tight ${
              pendingOpsCount > 0 ? 'text-[#C4872D]' : 'text-[#15201F]'
            }`}>
              {pendingOpsCount}
            </div>
            <p className="font-sans text-[11px] text-[#697775] mt-0.5">
              {pendingOpsCount > 0 ? 'Saved locally · waiting to sync' : 'All local changes clean'}
            </p>
          </div>
        </div>

        {/* Card 3: Active Conflicts */}
        <div
          onClick={() => setActivePage('conflicts')}
          className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#DCE5E1] shadow-2xs flex flex-col justify-between gap-3 hover:border-[#B94A48]/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-medium text-[#697775]">Conflicts</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              conflictsCount > 0 ? 'bg-[#FBEBEB] text-[#B94A48]' : 'bg-[#E4F1EF] text-[#2F7D68]'
            }`}>
              <GitFork className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className={`font-display text-2xl font-bold tracking-tight ${
              conflictsCount > 0 ? 'text-[#B94A48]' : 'text-[#2F7D68]'
            }`}>
              {conflictsCount}
            </div>
            <p className="font-sans text-[11px] text-[#697775] mt-0.5">
              {conflictsCount > 0 ? 'Decision required' : 'Zero concurrent conflicts'}
            </p>
          </div>
        </div>

        {/* Card 4: Local Storage Engine */}
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#DCE5E1] shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-medium text-[#697775]">Device Storage</span>
            <div className="w-7 h-7 rounded-lg bg-[#E4F1EF] text-[#2F7D68] flex items-center justify-center">
              <Database className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="font-display text-2xl font-bold text-[#15201F] tracking-tight">
              IndexedDB
            </div>
            <p className="font-sans text-[11px] text-[#2F7D68] mt-0.5 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Verified local persistence</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. CONVERGENCE & SYNC INSTRUMENT DIAL */}
      <section className="bg-[#FFFFFF] border border-[#DCE5E1] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE5E1]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#176D70] font-bold">
                Causal State
              </span>
              <span className="text-[#DCE5E1]">•</span>
              <span className="font-mono text-xs text-[#697775]">
                Epoch 409
              </span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#15201F]">
              Synchronization Status
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleReplicaOnline('replicaA')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-sans font-medium transition cursor-pointer ${
                currentReplica.isSimulatedOnline
                  ? 'bg-[#FFFFFF] border-[#DCE5E1] text-[#15201F] hover:bg-[#F0F4F2]'
                  : 'bg-[#FAF5EC] border-[#C4872D]/40 text-[#C4872D]'
              }`}
            >
              {currentReplica.isSimulatedOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-[#2F7D68]" />
                  <span>Simulate Partition</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-[#C4872D]" />
                  <span>Offline Mode (Active)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Convergence Dial Container */}
        <div className="flex flex-col items-center justify-center py-4">
          <ConvergenceDial />
        </div>
      </section>

      {/* 4. CURRENT WORK SNAPSHOT */}
      <section className="bg-[#FFFFFF] border border-[#DCE5E1] rounded-2xl p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE5E1]">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-[#176D70]" />
            <h3 className="font-display text-base font-bold text-[#15201F]">
              Current Tasks on This Device
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setActivePage('my-tasks')}
            className="text-xs font-semibold text-[#176D70] hover:text-[#13585A] transition flex items-center gap-1 cursor-pointer"
          >
            <span>Open Kanban Board</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="divide-y divide-[#DCE5E1]">
          {(currentReplica.tasks || []).slice(0, 5).map((task) => (
            <div
              key={task.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F6F8F6] px-2 rounded-lg transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[#F0F4F2] text-[#697775] font-semibold shrink-0">
                  {task.id.startsWith('NX-') ? task.id : `NX-${task.id.replace('card-', '10')}`}
                </span>
                <span className="font-sans text-xs font-medium text-[#15201F] truncate">
                  {task.title}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="px-2 py-0.5 rounded-full font-sans text-[10px] font-semibold bg-[#F0F4F2] text-[#697775]">
                  {task.status || 'BACKLOG'}
                </span>
                {task.syncStatus === 'PENDING_SYNC' && (
                  <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-[#FAF5EC] text-[#C4872D] font-medium">
                    Waiting to sync
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
