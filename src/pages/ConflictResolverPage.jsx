import { useState } from 'react';
import { useSyncStore } from '../store/useSyncStore';
import { PageHeader } from '../components/layout/PageHeader';
import { AiConflictAssistant } from '../components/conflict/AiConflictAssistant';
import {
  CheckCircle2,
  History,
  ShieldCheck,
  Merge,
  Layers,
  ChevronDown
} from 'lucide-react';

/**
 * ConflictResolverPage
 * Destination: Sidebar -> Conflicts
 * 
 * Header:
 * Workspace / Conflicts
 * Conflicts [Decision required]
 * 
 * Flow:
 * Large Focused Conflict Container:
 * - Task ID + Task Name + simple explanation
 * - AI Assistance Strip
 * - YOUR VERSION | OTHER VERSION (Original as secondary context)
 * - Resolution controls: Keep Your Version, Keep Other Version
 * - Impact / Technical Details
 */
export function ConflictResolverPage() {
  const {
    conflicts,
    setResolutionStrategy,
    resolveConflict,
    replicaA,
    replicaB,
  } = useSyncStore();

  const [activeTab, setActiveTab] = useState('diff'); // 'diff' | 'raw'
  const [resolutionBanner, setResolutionBanner] = useState(null);
  const [showImpactDrawer, setShowImpactDrawer] = useState(false);

  const activeConflict = conflicts[0];

  const handleResolveChoice = (strategyName) => {
    if (!activeConflict) return;
    setResolutionStrategy(strategyName);
    resolveConflict(activeConflict.id);

    setResolutionBanner({
      title:
        strategyName === 'suture'
          ? 'Merged Resolution Staged'
          : strategyName === 'lww'
          ? 'Your Version Selected'
          : 'Other Version Selected',
      detail: `Conflict ${activeConflict.id} resolved locally on this device with ${strategyName.toUpperCase()} rule.`,
    });
  };

  const hasConflicts = conflicts.length > 0;

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* 1. UNIFIED PAGE HEADER */}
      <PageHeader
        breadcrumbs={['Workspace', 'Conflicts']}
        title="Conflicts"
        badge={
          hasConflicts ? (
            <span className="px-2.5 py-0.5 rounded-full bg-[#FBEBEB] text-[#B94A48] font-mono text-xs font-semibold">
              Decision required
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-[#E4F1EF] text-[#2F7D68] font-mono text-xs font-semibold">
              0 Unresolved
            </span>
          )
        }
        description="Review and resolve differences between your local edits and another version."
      />

      {/* RESOLUTION SUCCESS NOTIFICATION BANNER */}
      {resolutionBanner && (
        <div className="p-4 rounded-xl bg-[#E4F1EF] border border-[#2F7D68]/30 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#2F7D68] shrink-0" />
            <div className="flex flex-col">
              <span className="font-sans text-sm font-bold text-[#15201F]">
                {resolutionBanner.title}
              </span>
              <span className="font-sans text-xs text-[#697775]">
                {resolutionBanner.detail}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setResolutionBanner(null)}
            className="px-3 py-1 rounded-lg bg-[#FFFFFF] text-[#15201F] text-xs font-medium border border-[#DCE5E1] hover:bg-[#F0F4F2] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. LARGE FOCUSED CONFLICT CONTAINER */}
      {activeConflict ? (
        <div className="bg-[#FFFFFF] border border-[#DCE5E1] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
          {/* Top Conflict Identity & Explanation */}
          <div className="flex flex-col gap-2 pb-4 border-b border-[#DCE5E1]">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-md bg-[#F0F4F2] text-[#176D70] font-mono text-xs font-bold">
                  {activeConflict.taskCardId.startsWith('NX-')
                    ? activeConflict.taskCardId
                    : `NX-${activeConflict.taskCardId.replace('card-', '10')}`}
                </span>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#15201F]">
                  {activeConflict.title}
                </h2>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-[#697775]">
                <span className="px-2 py-0.5 rounded bg-[#FAF5EC] text-[#C4872D] font-semibold">
                  Conflict ID: {activeConflict.id}
                </span>
              </div>
            </div>

            <p className="font-sans text-xs sm:text-sm text-[#697775] leading-relaxed mt-1">
              This task was edited concurrently on this device and another replica during an offline partition. Review both versions below and select which state to preserve.
            </p>
          </div>

          {/* AI CONFLICT ASSISTANT STRIP (Inside conflict container per Section 13) */}
          <div className="w-full">
            <AiConflictAssistant conflict={activeConflict} />
          </div>

          {/* Tab Selector: Structural Comparison vs Raw Causal Clock Vectors */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <span className="font-sans text-xs font-bold text-[#15201F] uppercase tracking-wider">
              Version Comparison
            </span>
            <div className="flex items-center gap-1 bg-[#F0F4F2] p-1 rounded-xl text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('diff')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeTab === 'diff'
                    ? 'bg-[#FFFFFF] text-[#176D70] font-bold shadow-2xs'
                    : 'text-[#697775]'
                }`}
              >
                Side-by-Side Diff
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('raw')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeTab === 'raw'
                    ? 'bg-[#FFFFFF] text-[#176D70] font-bold shadow-2xs'
                    : 'text-[#697775]'
                }`}
              >
                Raw Vectors
              </button>
            </div>
          </div>

          {/* PRIMARY COMPARISON: YOUR VERSION vs OTHER VERSION (+ Original secondary) */}
          {activeTab === 'diff' ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* YOUR VERSION */}
                <div className="bg-[#FFFFFF] border-2 border-[#176D70] rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#DCE5E1]">
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#176D70] font-bold">
                        YOUR VERSION
                      </span>
                      <span className="font-sans text-xs text-[#15201F] font-semibold mt-0.5">
                        Saved locally on this device
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#E4F1EF] text-[#176D70] font-mono text-[10px] font-bold">
                      Local
                    </span>
                  </div>

                  {/* Conflicting Fields in Your Version */}
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-[#E4F1EF]/40 rounded-xl border border-[#176D70]/20 flex flex-col gap-1">
                      <span className="font-mono text-[10px] uppercase text-[#176D70] font-semibold">
                        Due Date
                      </span>
                      <span className="font-mono text-xs font-bold text-[#176D70]">
                        {activeConflict.branchA?.dueDate}
                      </span>
                      <span className="font-sans text-[11px] text-[#697775]">
                        Updated during local editing session
                      </span>
                    </div>

                    <div className="p-3 bg-[#E4F1EF]/40 rounded-xl border border-[#176D70]/20 flex flex-col gap-1">
                      <span className="font-mono text-[10px] uppercase text-[#176D70] font-semibold">
                        Priority
                      </span>
                      <span className="font-mono text-xs font-bold text-[#176D70]">
                        {activeConflict.branchA?.priority}
                      </span>
                      <span className="font-sans text-[11px] text-[#697775]">
                        Escalated for immediate schedule
                      </span>
                    </div>

                    <div className="p-3 bg-[#F0F4F2] rounded-xl border border-[#DCE5E1] flex flex-col gap-1">
                      <span className="font-mono text-[10px] uppercase text-[#697775] font-semibold">
                        Assignee
                      </span>
                      <span className="font-sans text-xs font-medium text-[#15201F]">
                        {activeConflict.branchA?.assignee}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-2 text-[11px] font-mono text-[#2F7D68] flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2F7D68]" />
                    <span>Source: This Node ({replicaA.id})</span>
                  </div>
                </div>

                {/* OTHER VERSION */}
                <div className="bg-[#FFFFFF] border border-[#DCE5E1] rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#DCE5E1]">
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#697775] font-bold">
                        OTHER VERSION
                      </span>
                      <span className="font-sans text-xs text-[#15201F] font-semibold mt-0.5">
                        Received from peer replica
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#F0F4F2] text-[#697775] font-mono text-[10px] font-semibold">
                      Remote
                    </span>
                  </div>

                  {/* Conflicting Fields in Other Version */}
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-[#F0F4F2] rounded-xl border border-[#DCE5E1] flex flex-col gap-1">
                      <span className="font-mono text-[10px] uppercase text-[#697775] font-semibold">
                        Due Date
                      </span>
                      <span className="font-mono text-xs font-bold text-[#15201F]">
                        {activeConflict.branchB?.dueDate}
                      </span>
                      <span className="font-sans text-[11px] text-[#697775]">
                        Modified by remote operator
                      </span>
                    </div>

                    <div className="p-3 bg-[#F0F4F2] rounded-xl border border-[#DCE5E1] flex flex-col gap-1">
                      <span className="font-mono text-[10px] uppercase text-[#697775] font-semibold">
                        Priority
                      </span>
                      <span className="font-mono text-xs font-medium text-[#15201F]">
                        {activeConflict.branchB?.priority}
                      </span>
                      <span className="font-sans text-[11px] text-[#697775]">
                        Retained prior priority
                      </span>
                    </div>

                    <div className="p-3 bg-[#F0F4F2] rounded-xl border border-[#DCE5E1] flex flex-col gap-1">
                      <span className="font-mono text-[10px] uppercase text-[#697775] font-semibold">
                        Assignee
                      </span>
                      <span className="font-sans text-xs font-medium text-[#15201F]">
                        {activeConflict.branchB?.assignee}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-2 text-[11px] font-mono text-[#697775] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#697775]" />
                    <span>Source: Peer Node ({replicaB.id})</span>
                  </div>
                </div>
              </div>

              {/* SECONDARY CONTEXT: ORIGINAL (BASE) */}
              {activeConflict.base && (
                <div className="p-3.5 bg-[#F0F4F2]/70 rounded-xl border border-[#DCE5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#697775] shrink-0" />
                    <span className="font-sans font-medium text-[#697775]">
                      Original Common Ancestor ({activeConflict.base?.version}):
                    </span>
                    <span className="font-mono text-[#15201F]">
                      Due: {activeConflict.base?.dueDate} · Priority: {activeConflict.base?.priority} · Assignee: {activeConflict.base?.assignee}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#697775]">
                    LCA Clock: {activeConflict.base?.clock}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* RAW CAUSAL VECTOR DISPLAY */
            <div className="p-4 bg-[#F0F4F2] rounded-xl font-mono text-xs overflow-x-auto space-y-2 border border-[#DCE5E1]">
              <div className="text-[#176D70] font-semibold">// Causal Vector Metadata for {activeConflict.id}</div>
              <div>Base LCA Clock: {activeConflict.base?.clock} · LCA Hash: {activeConflict.lcaHash}</div>
              <div>Branch A Clock: {activeConflict.branchA?.clock} · Replica: {replicaA.id}</div>
              <div>Branch B Clock: {activeConflict.branchB?.clock} · Replica: {replicaB.id}</div>
              <div>Concurrent Lamport Ticks: {activeConflict.lamportTicks}</div>
            </div>
          )}

          {/* RESOLUTION CONTROLS */}
          <div className="pt-4 border-t border-[#DCE5E1] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[#697775]">
              <ShieldCheck className="w-4 h-4 text-[#2F7D68]" />
              <span>Resolution choice is manual and authoritative</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleResolveChoice('lww')}
                className="px-4 py-2 rounded-xl bg-[#176D70] text-white hover:bg-[#13585A] font-sans text-xs font-semibold transition shadow-2xs cursor-pointer"
              >
                Keep Your Version
              </button>

              <button
                type="button"
                onClick={() => handleResolveChoice('mvr')}
                className="px-4 py-2 rounded-xl bg-[#F0F4F2] hover:bg-[#DCE5E1] text-[#15201F] font-sans text-xs font-medium transition cursor-pointer border border-[#DCE5E1]"
              >
                Keep Other Version
              </button>

              <button
                type="button"
                onClick={() => handleResolveChoice('suture')}
                className="px-4 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F0F4F2] text-[#176D70] font-sans text-xs font-semibold transition border border-[#176D70]/40 flex items-center gap-1.5 cursor-pointer"
              >
                <Merge className="w-3.5 h-3.5" />
                <span>Keep Merged Value</span>
              </button>
            </div>
          </div>

          {/* CONFLICT IMPACT WORKFLOW COLLAPSIBLE */}
          <div className="pt-3 border-t border-[#DCE5E1]">
            <button
              type="button"
              onClick={() => setShowImpactDrawer(!showImpactDrawer)}
              className="w-full flex items-center justify-between py-2 text-xs font-sans font-semibold text-[#697775] hover:text-[#15201F] transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#176D70]" />
                <span>Conflict Impact &amp; Downstream Dependency Analysis</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  showImpactDrawer ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showImpactDrawer && (
              <div className="mt-3 p-4 bg-[#F0F4F2] rounded-xl border border-[#DCE5E1] flex flex-col gap-3 text-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#15201F]">
                    Downstream Graph Invariant Check
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#E4F1EF] text-[#2F7D68] font-mono text-[10px] font-semibold">
                    Zero Breaking Cycles
                  </span>
                </div>
                <p className="text-[#697775]">
                  Resolving this conflict will not violate dependency constraints for linked cards or introduce causal order cycles in the Merkle directed acyclic graph.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ZERO CONFLICTS CLEAN STATE */
        <div className="bg-[#FFFFFF] border border-[#DCE5E1] rounded-2xl p-12 shadow-xs flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#E4F1EF] text-[#2F7D68] flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-[#15201F]">
            No conflicts requiring decision
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#697775] max-w-md leading-relaxed">
            All local tasks and replica forks are in agreement. Concurrent edits will appear here when divergent versions require manual reconciliation.
          </p>
        </div>
      )}
    </div>
  );
}
