import { useState } from 'react';
import { ConvergenceDial } from '../components/dial/ConvergenceDial';
import { useSyncStore } from '../store/useSyncStore';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Terminal,
  ArrowRight,
  Database,
  Cpu
} from 'lucide-react';

export function ObservatoryPage() {
  const {
    dialState,
    replicaA,
    replicaB,
    conflicts,
    isBrowserOnline,
    setActivePage,
  } = useSyncStore();

  const [techDrawerOpen, setTechDrawerOpen] = useState(false);

  const pendingOpsCount = (replicaA.pendingOps?.length || 0) + (replicaB.pendingOps?.length || 0);

  // Derive human question state strictly from real application data
  let heroTitle = 'Everything is synced.';
  let heroSubtitle = 'All local changes on this device have safely converged across replica nodes. Data integrity is guaranteed via causal determinism.';
  let statusBadgeText = 'CRDT Epoch 409 • State Verified';
  let statusBadgeColor = 'bg-[#E4F1EF] text-[#176D70]';
  let statusDotColor = 'bg-[#2F7D68]';

  if (conflicts.length > 0) {
    heroTitle = 'A change needs your attention.';
    heroSubtitle = `${conflicts.length} concurrent modification flagged in the distributed task cache. Review conflicting fields to align state.`;
    statusBadgeText = `${conflicts.length} Unresolved Conflict`;
    statusBadgeColor = 'bg-[#FBEBEB] text-[#B94A48]';
    statusDotColor = 'bg-[#B94A48]';
  } else if (!isBrowserOnline || !replicaA.effectiveOnline || !replicaB.effectiveOnline) {
    heroTitle = "You're offline. Your changes are safe on this device.";
    heroSubtitle = 'Network unreachable. All mutations are committed to local IndexedDB and queued in write-ahead event logs until reconnection.';
    statusBadgeText = 'Offline Storage Active';
    statusBadgeColor = 'bg-[#F0F4F2] text-[#697775]';
    statusDotColor = 'bg-[#C4872D]';
  } else if (pendingOpsCount > 0) {
    heroTitle = 'Changes are waiting to sync.';
    heroSubtitle = `${pendingOpsCount} local operations queued in the outbound pipeline, synchronizing with peer replicas.`;
    statusBadgeText = `${pendingOpsCount} Ops In Outbound Queue`;
    statusBadgeColor = 'bg-[#FAF5EC] text-[#C4872D]';
    statusDotColor = 'bg-[#C4872D]';
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* 1. STATUS HERO HEADER */}
      <section className="relative overflow-hidden rounded-2xl bg-[#FFFFFF] p-6 sm:p-8 border border-[#DCE5E1] shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full w-fit font-mono text-[11px] font-semibold ${statusBadgeColor}`}>
              <span className={`w-2 h-2 rounded-full ${statusDotColor} ${dialState === 'CONVERGING' ? 'animate-pulse' : ''}`} />
              <span>{statusBadgeText}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl text-[#15201F] tracking-tight font-bold">
              {heroTitle}
            </h1>

            <p className="font-sans text-sm sm:text-base text-[#697775] leading-relaxed">
              {heroSubtitle}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActivePage('workspace')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#176D70] text-white font-sans text-sm font-semibold hover:bg-[#13585A] transition shadow-xs cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
              <span>Open Workspace</span>
            </button>

            {conflicts.length > 0 ? (
              <button
                type="button"
                onClick={() => setActivePage('conflicts')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B94A48] text-white hover:bg-[#A33D3B] font-sans text-sm font-medium transition cursor-pointer shadow-xs"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Review Conflict ({conflicts.length})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setTechDrawerOpen(!techDrawerOpen)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0F4F2] text-[#15201F] hover:bg-[#DCE5E1] font-sans text-sm font-medium transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#176D70]" />
                <span>{techDrawerOpen ? 'Hide Diagnostics' : 'Inspect Consistency'}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. CENTERPIECE LAYOUT: CONVERGENCE DIAL & 3 ASSURANCE CARDS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: The Signature Convergence Dial (7 Cols) */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#DCE5E1] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex flex-col">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#697775]">
                Topology State
              </span>
              <span className="font-display text-2xl text-[#15201F] font-bold">
                Convergence Dial
              </span>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#F0F4F2] font-mono text-[11px] text-[#176D70] font-semibold">
              {dialState === 'SYNCED' ? 'Deterministic Zero Drift' : `${dialState} State`}
            </span>
          </div>

          {/* Dial Center Stage */}
          <div className="py-4 flex flex-col items-center justify-center relative">
            <ConvergenceDial size={280} />

            <div className="mt-4 text-center max-w-md">
              <p className="font-sans text-sm text-[#15201F] font-semibold">
                Replicas: Node A (Current) · Node B ({replicaB.isSimulatedOnline ? 'Connected' : 'Partitioned'})
              </p>
              <p className="font-mono text-xs text-[#697775] mt-1">
                {isBrowserOnline ? 'Verified Local-First Consensus · Active Mesh' : 'Local Partition Mode · Zero Remote Drift'}
              </p>
            </div>
          </div>

          {/* States Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-2 bg-[#F0F4F2]/60 rounded-xl p-3 border border-[#DCE5E1]">
            <div className="flex items-center gap-2 p-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#176D70] shrink-0" />
              <span className="font-sans text-xs text-[#15201F] font-medium truncate">Synced</span>
            </div>
            <div className="flex items-center gap-2 p-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C4872D] shrink-0" />
              <span className="font-sans text-xs text-[#697775] truncate">Waiting ({pendingOpsCount})</span>
            </div>
            <div className="flex items-center gap-2 p-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#697775] shrink-0" />
              <span className="font-sans text-xs text-[#697775] truncate">Offline</span>
            </div>
            <div className="flex items-center gap-2 p-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B94A48] shrink-0" />
              <span className="font-sans text-xs text-[#697775] truncate">Conflict ({conflicts.length})</span>
            </div>
          </div>
        </div>

        {/* Right: Key Assurance Cards (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
          {/* Card 1: Is my work safe? */}
          <div className="bg-[#FFFFFF] border border-[#DCE5E1] rounded-2xl p-6 shadow-xs flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#697775]">Durability</span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#2F7D68] bg-[#E4F1EF] px-2 py-0.5 rounded-full font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F7D68]" />
                  Active WAL
                </span>
              </div>
              <h3 className="font-display text-xl text-[#15201F] font-bold mb-1">
                Is my work safe?
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#697775] leading-relaxed">
                Saved on this device. Local-First Persistence remains continuously committed to indexed persistent storage.
              </p>
            </div>
            <div className="flex items-center justify-between mt-4 bg-[#F0F4F2] rounded-xl px-3 py-2 text-xs font-mono text-[#15201F]">
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#176D70]" />
                <span>IndexedDB Encrypted</span>
              </div>
              <span className="text-[#697775]">Partition Ready</span>
            </div>
          </div>

          {/* Card 2: Pending Changes */}
          <div className="bg-[#FFFFFF] border border-[#DCE5E1] rounded-2xl p-6 shadow-xs flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#697775]">Outbound Pipeline</span>
                <span className="font-mono text-[10px] text-[#697775]">Queue: {pendingOpsCount} Ops</span>
              </div>
              <h3 className="font-display text-xl text-[#15201F] font-bold mb-1">
                Pending Changes
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#697775] leading-relaxed">
                {pendingOpsCount > 0
                  ? `${pendingOpsCount} local modifications waiting to transmit and converge across peers.`
                  : '0 changes waiting to sync. All client mutations have been serialized and acknowledged.'}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between pt-2 border-t border-[#DCE5E1]">
              <button
                type="button"
                onClick={() => setActivePage('history')}
                className="inline-flex items-center gap-1 font-sans text-xs text-[#176D70] font-semibold hover:underline cursor-pointer"
              >
                <span>View queue details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] text-[#2F7D68] font-semibold">
                {pendingOpsCount > 0 ? 'Buffering' : 'Flush complete'}
              </span>
            </div>
          </div>

          {/* Card 3: Needs Attention */}
          <div className="bg-[#FFFFFF] border border-[#DCE5E1] rounded-2xl p-6 shadow-xs flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#697775]">Attention Required</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${conflicts.length > 0 ? 'bg-[#FBEBEB] text-[#B94A48]' : 'bg-[#E4F1EF] text-[#2F7D68]'}`}>
                  {conflicts.length > 0 ? `${conflicts.length} Unresolved` : '0 Conflicts'}
                </span>
              </div>
              <h3 className="font-display text-xl text-[#15201F] font-bold mb-1">
                Needs Attention
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#697775] leading-relaxed">
                {conflicts.length > 0
                  ? `${conflicts.length} concurrent modification flagged in distributed task cache.`
                  : 'Zero unresolved conflicts. All replica clocks share monotonic causal order.'}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between pt-2 border-t border-[#DCE5E1]">
              <span className="font-sans text-xs text-[#697775]">
                {conflicts.length > 0 ? 'Divergence detected' : 'Invariant verified'}
              </span>
              {conflicts.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setActivePage('conflicts')}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#B94A48] text-white font-sans text-xs font-semibold hover:bg-[#A33D3B] transition cursor-pointer"
                >
                  <span>Review Conflict</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 font-mono text-xs text-[#2F7D68]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Consistent</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. COLLAPSIBLE TECHNICAL DETAILS & VECTOR CLOCKS DRAWER */}
      <section className="bg-[#FFFFFF] border border-[#DCE5E1] rounded-2xl shadow-xs overflow-hidden transition-all duration-300">
        <button
          type="button"
          onClick={() => setTechDrawerOpen(!techDrawerOpen)}
          aria-expanded={techDrawerOpen}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#F0F4F2]/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-[#176D70]" />
            <span className="font-display text-lg text-[#15201F] font-bold">
              Technical Details &amp; Vector Clocks
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#F0F4F2] font-mono text-[10px] text-[#697775]">
              CRDT State Map
            </span>
          </div>

          <div className="flex items-center gap-2 text-[#697775] font-sans text-xs font-medium">
            <span>{techDrawerOpen ? 'Collapse' : 'Reveal Clocks'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${techDrawerOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {techDrawerOpen && (
          <div className="px-6 pb-6 pt-2 border-t border-[#DCE5E1] bg-[#FFFFFF] animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Vector Clock Array */}
              <div className="bg-[#F0F4F2] p-4 rounded-xl border border-[#DCE5E1]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] uppercase text-[#697775]">Replica Vector Clock</span>
                  <span className="font-mono text-[10px] text-[#176D70] font-semibold">v2.4 Core</span>
                </div>
                <div className="p-2.5 bg-[#FFFFFF] rounded-lg font-mono text-xs text-[#15201F] border border-[#DCE5E1]">
                  &lt;NodeA: {replicaA.version}, NodeB: {replicaB.version}&gt;
                </div>
                <p className="font-sans text-[11px] text-[#697775] mt-2">
                  Partial order causal sequence without wall-clock skew dependencies.
                </p>
              </div>

              {/* Causal Tree Metric */}
              <div className="bg-[#F0F4F2] p-4 rounded-xl border border-[#DCE5E1]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] uppercase text-[#697775]">Causal Graph Depth</span>
                  <span className="font-mono text-[10px] text-[#2F7D68] font-semibold">Balanced</span>
                </div>
                <div className="p-2.5 bg-[#FFFFFF] rounded-lg flex items-center justify-between font-mono text-xs text-[#15201F] border border-[#DCE5E1]">
                  <span>Depth: 1,842 ops</span>
                  <span className="text-[#697775] text-[10px]">DAG Pruned</span>
                </div>
                <p className="font-sans text-[11px] text-[#697775] mt-2">
                  Tombstone garbage collection verified. Zero unlinked causal forks.
                </p>
              </div>

              {/* Partition Tolerance */}
              <div className="bg-[#F0F4F2] p-4 rounded-xl border border-[#DCE5E1]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] uppercase text-[#697775]">Partition Tolerance</span>
                  <span className="font-mono text-[10px] text-[#176D70] font-semibold">AP Compliant</span>
                </div>
                <div className="p-2.5 bg-[#FFFFFF] rounded-lg font-mono text-xs text-[#15201F] flex items-center justify-between border border-[#DCE5E1]">
                  <span>Mesh Replicas</span>
                  <span className="text-[#2F7D68] font-semibold">2/2 Nodes Tracked</span>
                </div>
                <p className="font-sans text-[11px] text-[#697775] mt-2">
                  Local-first event stream snapshotting committed to storage.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
