import { useSyncStore } from '../store/useSyncStore';
import {
  Wifi,
  WifiOff,
  Database,
  AlertTriangle
} from 'lucide-react';

export function StatusPage() {
  const {
    isBrowserOnline,
    replicaA,
    replicaB,
    dialState,
    conflicts,
    networkDriftMs,
  } = useSyncStore();

  const totalPending = (replicaA.pendingOps?.length || 0) + (replicaB.pendingOps?.length || 0);

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-300">
      {/* Editorial Header */}
      <div className="border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--copper)] font-bold">
            SYSTEM TELEMETRY &amp; CLUSTER PULSE
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--verdigris)]" />
          <span className="font-newsreader text-xs italic text-[var(--ink-soft)]">
            "real-time heartbeat of distributed partition state"
          </span>
        </div>
        <h1 className="font-display text-4xl text-[var(--ink)] tracking-tight">
          Cluster Health &amp; Invariant Status
        </h1>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Dial State */}
        <div className="p-5 rounded-xl bg-[var(--paper-raised)] border border-[var(--border)] space-y-2 shadow-xs">
          <div className="flex justify-between items-center text-xs font-mono text-[var(--ink-faint)]">
            <span>CONVERGENCE DIAL</span>
            <span className="w-2 h-2 rounded-full bg-[var(--copper)]" />
          </div>
          <div className="font-display text-2xl text-[var(--copper)] font-bold">{dialState}</div>
          <p className="font-newsreader text-xs text-[var(--ink-soft)]">
            Derived strictly from pending queue and active partition forks.
          </p>
        </div>

        {/* Metric 2: Network Connectivity */}
        <div className="p-5 rounded-xl bg-[var(--paper-raised)] border border-[var(--border)] space-y-2 shadow-xs">
          <div className="flex justify-between items-center text-xs font-mono text-[var(--ink-faint)]">
            <span>BROWSER NETWORK</span>
            {isBrowserOnline ? <Wifi className="w-3.5 h-3.5 text-[var(--verdigris)]" /> : <WifiOff className="w-3.5 h-3.5 text-[var(--rust)]" />}
          </div>
          <div className={`font-display text-2xl font-bold ${isBrowserOnline ? 'text-[var(--verdigris)]' : 'text-[var(--rust)]'}`}>
            {isBrowserOnline ? 'ONLINE' : 'OFFLINE'}
          </div>
          <p className="font-newsreader text-xs text-[var(--ink-soft)]">
            Real `navigator.onLine` hardware socket listener.
          </p>
        </div>

        {/* Metric 3: Pending Operations */}
        <div className="p-5 rounded-xl bg-[var(--paper-raised)] border border-[var(--border)] space-y-2 shadow-xs">
          <div className="flex justify-between items-center text-xs font-mono text-[var(--ink-faint)]">
            <span>LOCAL OP-LOG QUEUE</span>
            <Database className="w-3.5 h-3.5 text-[var(--copper)]" />
          </div>
          <div className="font-display text-2xl text-[var(--ink)] font-bold">
            {totalPending} <span className="text-sm font-normal text-[var(--ink-soft)]">ops queued</span>
          </div>
          <p className="font-newsreader text-xs text-[var(--ink-soft)]">
            IndexedDB pending transactions waiting for acknowledgment.
          </p>
        </div>

        {/* Metric 4: Active Conflicts */}
        <div className="p-5 rounded-xl bg-[var(--paper-raised)] border border-[var(--border)] space-y-2 shadow-xs">
          <div className="flex justify-between items-center text-xs font-mono text-[var(--ink-faint)]">
            <span>CONCURRENT FORKS</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[var(--ochre)]" />
          </div>
          <div className="font-display text-2xl text-[var(--ochre)] font-bold">
            {conflicts.length} <span className="text-sm font-normal text-[var(--ink-soft)]">forks</span>
          </div>
          <p className="font-newsreader text-xs text-[var(--ink-soft)]">
            3-way LCA branch points currently unresolved.
          </p>
        </div>
      </div>

      {/* Cluster Node Status Detail */}
      <div className="bg-[var(--paper-raised)] border border-[var(--border)] rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <h3 className="font-display text-xl text-[var(--ink)]">Partition Status Breakdown</h3>
          <span className="font-mono text-xs text-[var(--ink-soft)]">Mesh Drift: {networkDriftMs}ms</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {/* Replica A Card */}
          <div className="p-4 rounded-lg bg-[var(--paper)] border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--copper)]">{replicaA.name}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                replicaA.effectiveOnline ? 'bg-[var(--verdigris)]/15 text-[var(--verdigris)]' : 'bg-[var(--rust)]/15 text-[var(--rust)]'
              }`}>
                {replicaA.effectiveOnline ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
            <div className="text-[11px] text-[var(--ink-soft)] space-y-1">
              <div>Partition Store: <strong className="text-[var(--ink)]">{replicaA.partition}</strong></div>
              <div>Local Tasks Count: <strong className="text-[var(--ink)]">{replicaA.tasks.length}</strong></div>
              <div>Pending Ops: <strong className="text-[var(--copper)]">{replicaA.pendingOps.length}</strong></div>
            </div>
          </div>

          {/* Replica B Card */}
          <div className="p-4 rounded-lg bg-[var(--paper)] border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--verdigris)]">{replicaB.name}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                replicaB.effectiveOnline ? 'bg-[var(--verdigris)]/15 text-[var(--verdigris)]' : 'bg-[var(--rust)]/15 text-[var(--rust)]'
              }`}>
                {replicaB.effectiveOnline ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
            <div className="text-[11px] text-[var(--ink-soft)] space-y-1">
              <div>Partition Store: <strong className="text-[var(--ink)]">{replicaB.partition}</strong></div>
              <div>Local Tasks Count: <strong className="text-[var(--ink)]">{replicaB.tasks.length}</strong></div>
              <div>Pending Ops: <strong className="text-[var(--verdigris)]">{replicaB.pendingOps.length}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
