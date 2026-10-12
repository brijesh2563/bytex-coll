import { useState } from 'react';
import { useSyncStore } from '../store/useSyncStore';
import { hasAdminAccess } from '../core/authAdapter';
import { ScrambleText } from '../components/ui/ScrambleText';
import {
  ShieldAlert,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  Lock,
  Layers,
  Activity,
  Cpu,
  Radio,
  Sliders,
  AlertTriangle,
  Download,
  Flame,
  Zap
} from 'lucide-react';

export function AdminPage() {
  const {
    user,
    replicaA,
    replicaB,
    conflicts,
    toggleReplicaOnline,
    setActivePage,
    elevateToAdmin
  } = useSyncStore();

  const [emergencyIsolation, setEmergencyIsolation] = useState(false);
  const [gcRunning, setGcRunning] = useState(false);
  const [gcComplete, setGcComplete] = useState(false);

  // Invariant toggles
  const [monotonicityStrict, setMonotonicityStrict] = useState(true);
  const [disallowBlindLww, setDisallowBlindLww] = useState(true);
  const [requireEd25519, setRequireEd25519] = useState(true);

  // Check admin authorization
  const isAdmin = hasAdminAccess(user);

  const handleRunGC = () => {
    setGcRunning(true);
    setGcComplete(false);
    setTimeout(() => {
      setGcRunning(false);
      setGcComplete(true);
      setTimeout(() => setGcComplete(false), 3500);
    }, 1100);
  };

  // --------------------------------------------------------------------------
  // UNAUTHORIZED ACCESS PLATE
  // --------------------------------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] py-10 w-full animate-mech-fade">
        <div className="max-w-md w-full bg-[var(--paper-raised)] border-2 border-[var(--rust)]/60 rounded-2xl p-6 sm:p-8 shadow-md text-center space-y-6 animate-mech-plate relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--rust)]" />

          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[var(--rust)]/10 border border-[var(--rust)]/30 flex items-center justify-center text-[var(--rust)]">
              <Lock className="w-8 h-8" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--rust)] font-bold block">
              ACCESS RESTRICTED // TIER-0 CLEARANCE REQUIRED
            </span>
            <h1 className="font-display text-2xl text-[var(--ink)]">
              Cluster Control Locked
            </h1>
          </div>

          <p className="font-newsreader text-sm text-[var(--ink-soft)] leading-relaxed">
            The active operator session <span className="font-mono font-bold text-[var(--ink)]">[{user?.name || 'UNAUTHENTICATED'}]</span> holds role <span className="font-mono text-[var(--copper)]">[{user?.role || 'GUEST'}]</span>, which lacks Tier-0 Arbiter cluster orchestration privileges.
          </p>

          <div className="p-3 rounded-lg bg-[var(--paper)] border border-[var(--line)] font-mono text-[10px] text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-[var(--ink-faint)]">SECURITY GATE:</span>
              <span className="text-[var(--rust)] font-bold">REJECTED (UI BOUNDARY)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-faint)]">BOUNDARY:</span>
              <span className="text-[var(--ink)]">UI AUTHORIZATION ONLY</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={elevateToAdmin}
              className="w-full py-2.5 px-4 rounded-xl bg-[var(--copper)] hover:bg-[var(--copper-deep)] text-[var(--paper-raised)] font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Elevate To Chief Operator (Demo)</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePage('observatory')}
              className="w-full py-2 px-4 rounded-xl bg-[var(--paper)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--ink-soft)] hover:text-[var(--ink)] font-mono text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Return to Observatory
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // FULL AUTHORIZED MASTER ADMIN & CLUSTER CONTROL VIEW
  // --------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-8 w-full animate-mech-fade">
      {/* 1. TOP REGISTRY & EDITORIAL TITLE (Entrance 0-550ms) */}
      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--line)] animate-mech-rise delay-mech-1">
        <div className="flex flex-col gap-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[var(--ink-faint)]">
            <span className="text-[var(--copper)] font-bold">ADMINISTRATION // CLUSTER CONTROL &amp; ORCHESTRATION BENCH</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--border)]" />
            <span className="bg-[var(--paper-raised)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[var(--ink)] font-bold">
              SECURITY PROTOCOL: TIER-0 ARBITER
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--border)]" />
            <span className="text-[var(--verdigris)]">
              RETICLE POS: LAT 47.3769 / LON 8.5417
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl text-[var(--ink)] tracking-tight">
            Master Control &amp; <span className="italic text-[var(--copper)]">Cluster</span> Diagnostics
          </h1>

          <p className="font-newsreader text-base text-[var(--ink-soft)] max-w-2xl leading-relaxed">
            Global replica orchestration, consensus-free partition governor, cryptographic tombstone pruning, and cluster-wide invariant assertion across asynchronous peers.
          </p>
        </div>

        {/* Astrological / Calibrated Stamp Badge */}
        <div className="flex flex-col items-start md:items-end gap-2 shrink-0 animate-mech-rise-sm delay-mech-2">
          <div className="bg-[var(--paper-raised)] border border-[var(--border)] px-4 py-2 rounded-xl shadow-xs flex items-center gap-3">
            <div className="flex flex-col text-left md:text-right font-mono">
              <span className="text-[9px] text-[var(--ink-faint)] uppercase tracking-wider">SYNCHRONOUS APERTURE</span>
              <span className="text-xs text-[var(--ink)] font-bold">CALIBRATION: 0.0418 ms/rad</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[var(--paper)] border border-[var(--border)] flex items-center justify-center text-[var(--copper)]">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
          <span className="font-mono text-[10px] text-[var(--ink-faint)] tracking-wider">
            SPEC_HASH: <ScrambleText text="0x9AF4·118D·EC32" />
          </span>
        </div>
      </div>

      {/* Marginalia Note Interstitial (Entrance 300-750ms) */}
      <div className="flex items-center gap-2 -mt-4 animate-mech-rise-sm delay-mech-3">
        <div className="bg-[var(--paper-raised)] border border-[var(--border)] px-4 py-2 rounded-xl shadow-xs flex items-center gap-2">
          <span className="font-newsreader italic text-sm text-[var(--copper)]">
            “Never force a coordinator election; let the semilattice do the work.”
          </span>
          <span className="font-mono text-[9px] text-[var(--ink-faint)] tracking-widest uppercase ml-1">
            — ARCHIVIST MARGIN NOTE #44
          </span>
        </div>
      </div>

      {/* 2. 4 EXECUTIVE TELEMETRY METRICS (Entrance 500-1100ms) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        {/* Metric 1: Active Mesh Peers */}
        <div className="bg-[var(--paper-raised)] border border-[var(--border)] p-5 rounded-xl shadow-xs flex flex-col justify-between relative overflow-hidden group animate-mech-rise delay-mech-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[var(--ink-faint)]">ACTIVE MESH PEERS</span>
            <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-[var(--verdigris)]/15 text-[var(--verdigris)] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--verdigris)] animate-ping" />
              2 LOCAL / 2 STAGING
            </span>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl text-[var(--ink)]">4</span>
              <span className="font-newsreader text-base text-[var(--copper)] italic">Replicas</span>
            </div>
            <p className="text-[10px] text-[var(--ink-soft)]">Tokyo, London, Zurich Core, NY</p>
          </div>
          <div className="mt-3 flex items-center gap-1">
            <div className="h-1 flex-1 bg-[var(--verdigris)] rounded-full" />
            <div className="h-1 flex-1 bg-[var(--verdigris)] rounded-full" />
            <div className="h-1 flex-1 bg-[var(--ochre)] rounded-full" />
            <div className="h-1 w-3 bg-[var(--line)] rounded-full" />
          </div>
        </div>

        {/* Metric 2: Global Lamport Epoch */}
        <div className="bg-[var(--paper-raised)] border border-[var(--border)] p-5 rounded-xl shadow-xs flex flex-col justify-between relative overflow-hidden animate-mech-rise delay-mech-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[var(--ink-faint)]">GLOBAL LAMPORT EPOCH</span>
            <span className="text-[9px] text-[var(--copper)] uppercase font-bold">RING SYNC</span>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl text-[var(--ink)]">#14,892</span>
            </div>
            <p className="text-[10px] text-[var(--ink-soft)]">Deterministic monotonically increasing</p>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--ink-faint)]">
            <span>TICK DELTA: ±0.004μs</span>
            <span className="text-[var(--verdigris)] font-bold">STABLE</span>
          </div>
        </div>

        {/* Metric 3: Pending Unresolved Forks */}
        <div className="bg-[var(--paper-raised)] border border-[var(--border)] p-5 rounded-xl shadow-xs flex flex-col justify-between relative overflow-hidden animate-mech-rise delay-mech-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[var(--ink-faint)]">UNRESOLVED FORKS</span>
            <span className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-bold ${
              conflicts.length > 0
                ? 'bg-[var(--ochre)]/15 text-[var(--ochre)]'
                : 'bg-[var(--verdigris)]/15 text-[var(--verdigris)]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${conflicts.length > 0 ? 'bg-[var(--ochre)] animate-ping' : 'bg-[var(--verdigris)]'}`} />
              {conflicts.length > 0 ? `${conflicts.length} PENDING` : '0 FORKS'}
            </span>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl text-[var(--ink)]">{conflicts.length}</span>
              <span className="font-newsreader text-base text-[var(--ink-soft)] italic">Forks Active</span>
            </div>
            <p className="text-[10px] text-[var(--ink-soft)]">
              {conflicts.length > 0 ? 'Semantic conflict on task card' : 'All replica branches converged'}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--ink-faint)]">
            <span>RESOLVER: 3-WAY AST</span>
            <button
              type="button"
              onClick={() => setActivePage('conflicts')}
              className="text-[var(--copper)] hover:underline uppercase font-bold cursor-pointer"
            >
              Inspect
            </button>
          </div>
        </div>

        {/* Metric 4: Lattice Pruning Health */}
        <div className="bg-[var(--paper-raised)] border border-[var(--border)] p-5 rounded-xl shadow-xs flex flex-col justify-between relative overflow-hidden animate-mech-rise delay-mech-7">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[var(--ink-faint)]">LATTICE PRUNING HEALTH</span>
            <span className="text-[9px] text-[var(--verdigris)] font-bold">42ms CYCLE</span>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl text-[var(--ink)]">99.8%</span>
              <span className="font-newsreader text-base text-[var(--ink-soft)] italic">Purged</span>
            </div>
            <p className="text-[10px] text-[var(--ink-soft)]">Tombstones swept down to epoch</p>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--ink-faint)]">
            <span>GC STATUS: READY</span>
            <span className="text-[var(--verdigris)] font-bold">NOMINAL</span>
          </div>
        </div>
      </div>

      {/* 3. MASTER CONTROL GRID (Entrance 900-1800ms) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Cluster Topology & Partition Governor (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Replica Node Table Section */}
          <div className="bg-[var(--paper-raised)] border border-[var(--border)] p-6 rounded-2xl shadow-xs flex flex-col gap-4 animate-mech-rise delay-mech-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--paper)] border border-[var(--border)] flex items-center justify-center text-[var(--copper)]">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display text-xl text-[var(--ink)]">Interactive Replica Topology</h2>
                  <p className="font-newsreader text-xs text-[var(--ink-soft)]">Real-time status of local partitions and peer relays</p>
                </div>
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <span className="text-[var(--ink-faint)]">TELEMETRY:</span>
                <span className="px-2 py-0.5 rounded bg-[var(--verdigris)]/15 text-[var(--verdigris)] font-bold">
                  LOCAL ONLY (OFFLINE CAPABLE)
                </span>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--paper)] text-[var(--ink-faint)] uppercase text-[10px] border-b border-[var(--line)]">
                    <th className="py-2.5 px-3">Node / Region</th>
                    <th className="py-2.5 px-3">Vector Clock</th>
                    <th className="py-2.5 px-3">Storage State</th>
                    <th className="py-2.5 px-3">Ed25519 FP</th>
                    <th className="py-2.5 px-3 text-right">Intervention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {/* Node 1: Replica A */}
                  <tr className="hover:bg-[var(--paper)] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${replicaA.effectiveOnline ? 'bg-[var(--verdigris)]' : 'bg-[var(--rust)]'}`} />
                        <div>
                          <div className="font-bold text-[var(--ink)]">Replica A (Aarav)</div>
                          <div className="text-[10px] text-[var(--ink-faint)]">ap-northeast-1 (Tokyo)</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--paper)] border border-[var(--border)] text-[10px]">
                        ⟨A:14, B:14⟩
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-[10px]">
                        <span className="font-bold text-[var(--ink)]">{replicaA.tasks.length} tasks</span>
                        <div className="text-[var(--copper)]">{replicaA.pendingOps.length} pending ops</div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[10px] text-[var(--ink-faint)] font-mono">
                      7F8C...D91
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => toggleReplicaOnline('replicaA')}
                        className={`px-2 py-1 rounded text-[10px] uppercase font-bold transition cursor-pointer border ${
                          replicaA.effectiveOnline
                            ? 'bg-[var(--paper)] hover:bg-[var(--rust)]/10 text-[var(--ink-soft)] hover:text-[var(--rust)] border-[var(--border)]'
                            : 'bg-[var(--verdigris)] text-white border-[var(--verdigris)]'
                        }`}
                      >
                        {replicaA.effectiveOnline ? 'Isolate' : 'Connect'}
                      </button>
                    </td>
                  </tr>

                  {/* Node 2: Replica B */}
                  <tr className="hover:bg-[var(--paper)] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${replicaB.effectiveOnline ? 'bg-[var(--verdigris)]' : 'bg-[var(--rust)]'}`} />
                        <div>
                          <div className="font-bold text-[var(--ink)]">Replica B (Meera)</div>
                          <div className="text-[10px] text-[var(--ink-faint)]">eu-west-2 (London)</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--paper)] border border-[var(--border)] text-[10px]">
                        ⟨A:14, B:14⟩
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-[10px]">
                        <span className="font-bold text-[var(--ink)]">{replicaB.tasks.length} tasks</span>
                        <div className="text-[var(--copper)]">{replicaB.pendingOps.length} pending ops</div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[10px] text-[var(--ink-faint)] font-mono">
                      3B12...EA4
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => toggleReplicaOnline('replicaB')}
                        className={`px-2 py-1 rounded text-[10px] uppercase font-bold transition cursor-pointer border ${
                          replicaB.effectiveOnline
                            ? 'bg-[var(--paper)] hover:bg-[var(--rust)]/10 text-[var(--ink-soft)] hover:text-[var(--rust)] border-[var(--border)]'
                            : 'bg-[var(--verdigris)] text-white border-[var(--verdigris)]'
                        }`}
                      >
                        {replicaB.effectiveOnline ? 'Isolate' : 'Connect'}
                      </button>
                    </td>
                  </tr>

                  {/* Node 3: Zurich Core Invariant */}
                  <tr className="hover:bg-[var(--paper)] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[var(--copper)]" />
                        <div>
                          <div className="font-bold text-[var(--ink)]">Zurich Core Governor</div>
                          <div className="text-[10px] text-[var(--ink-faint)]">ch-central-1 (Zurich)</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--paper)] border border-[var(--border)] text-[10px]">
                        ⟨A:14, B:14, C:14⟩
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-[10px]">
                        <span className="text-[var(--copper)] font-bold">ORCHESTRATOR</span>
                        <div className="text-[var(--ink-faint)]">LOCAL ONLY</div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[10px] text-[var(--ink-faint)] font-mono">
                      4C99...66F
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-1 rounded bg-[var(--paper)] text-[var(--ink-faint)] text-[9px] uppercase font-bold">
                        CORE
                      </span>
                    </td>
                  </tr>

                  {/* Node 4: Staging NY Node (Awaiting Backend) */}
                  <tr className="hover:bg-[var(--paper)] transition-colors opacity-75">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[var(--border)]" />
                        <div>
                          <div className="font-bold text-[var(--ink)]">New York Gateway</div>
                          <div className="text-[10px] text-[var(--ink-faint)]">us-east-1 (New York)</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--paper)] border border-[var(--border)] text-[10px] text-[var(--ink-faint)]">
                        ⟨A:--, B:--⟩
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-[10px] text-[var(--ink-faint)] font-bold">
                        AWAITING BACKEND
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[10px] text-[var(--ink-faint)] font-mono">
                      NOT CONNECTED
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-1 rounded bg-[var(--paper)] text-[var(--ink-faint)] text-[9px] uppercase">
                        QUEUED
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Fault Injection Switchboard */}
          <div className="bg-[var(--paper-raised)] border border-[var(--border)] p-6 rounded-2xl shadow-xs flex flex-col gap-4 animate-mech-rise delay-mech-9">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[var(--copper)]" />
                <h3 className="font-display text-lg text-[var(--ink)]">Fault Injection Switchboard</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-[var(--rust)]/10 text-[var(--rust)] font-mono text-[9px] font-bold uppercase">
                CALIBRATED STRESS DRILL
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <button
                type="button"
                onClick={() => toggleReplicaOnline('replicaB')}
                className="p-3 rounded-xl bg-[var(--paper)] hover:border-[var(--copper)] border border-[var(--border)] text-left space-y-1 cursor-pointer transition"
              >
                <div className="text-[var(--rust)] font-bold text-[10px] uppercase flex items-center gap-1">
                  <Flame className="w-3 h-3" /> SPLIT-BRAIN DRILL
                </div>
                <div className="text-[11px] text-[var(--ink)]">Toggle 50/50 partition</div>
                <div className="text-[9px] text-[var(--ink-faint)]">TIMEOUT: 12,000ms</div>
              </button>

              <button
                type="button"
                onClick={() => setEmergencyIsolation(!emergencyIsolation)}
                className="p-3 rounded-xl bg-[var(--paper)] hover:border-[var(--copper)] border border-[var(--border)] text-left space-y-1 cursor-pointer transition"
              >
                <div className="text-[var(--ochre)] font-bold text-[10px] uppercase flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> SAFE ISOLATION
                </div>
                <div className="text-[11px] text-[var(--ink)]">{emergencyIsolation ? 'Active' : 'Engage safety airgap'}</div>
                <div className="text-[9px] text-[var(--ink-faint)]">PACKET LOSS: 100%</div>
              </button>

              <button
                type="button"
                onClick={() => setActivePage('lab')}
                className="p-3 rounded-xl bg-[var(--paper)] hover:border-[var(--copper)] border border-[var(--border)] text-left space-y-1 cursor-pointer transition"
              >
                <div className="text-[var(--copper)] font-bold text-[10px] uppercase flex items-center gap-1">
                  <Radio className="w-3 h-3" /> CONVERGENCE LAB
                </div>
                <div className="text-[11px] text-[var(--ink)]">Open Chaos Simulator</div>
                <div className="text-[9px] text-[var(--ink-faint)]">STOCHASTIC DRIFT</div>
              </button>
            </div>
          </div>

          {/* Lamport Vector Wavefront SVG Graph */}
          <div className="bg-[var(--paper-raised)] border border-[var(--border)] p-6 rounded-2xl shadow-xs space-y-3 animate-mech-rise delay-mech-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--copper)]" />
                <h3 className="font-display text-lg text-[var(--ink)]">Lamport Vector Divergence Stream</h3>
              </div>
              <span className="font-mono text-[10px] text-[var(--verdigris)] font-bold uppercase">
                ZERO_CONFLICT_STATE
              </span>
            </div>

            <div className="w-full bg-[var(--paper)] border border-[var(--border)] rounded-xl p-3 flex flex-col gap-2">
              <svg className="w-full h-20 text-[var(--copper)]" fill="none" preserveAspectRatio="none" viewBox="0 0 500 100">
                <line stroke="currentColor" strokeDasharray="2 4" strokeOpacity="0.15" strokeWidth="1" x1="0" x2="500" y1="25" y2="25" />
                <line stroke="currentColor" strokeDasharray="2 4" strokeOpacity="0.15" strokeWidth="1" x1="0" x2="500" y1="50" y2="50" />
                <line stroke="currentColor" strokeDasharray="2 4" strokeOpacity="0.15" strokeWidth="1" x1="0" x2="500" y1="75" y2="75" />
                <path d="M0,50 Q60,20 120,45 T240,30 T360,55 T500,48" stroke="currentColor" strokeWidth="1.5" />
                <path d="M0,55 Q60,65 120,50 T240,42 T360,49 T500,48" opacity="0.6" stroke="var(--verdigris)" strokeWidth="1.5" />
                <circle cx="500" cy="48" fill="currentColor" r="4" />
              </svg>
              <div className="flex justify-between font-mono text-[9px] text-[var(--ink-faint)]">
                <span>T-60s [ORIGIN]</span>
                <span>SYNCHRONIZATION APERTURE: CONVERGED</span>
                <span>T-0s [NOW: EPOCH #14,892]</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Cryptographic Security & GC Bench (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Operator Quorum & Keys */}
          <div className="bg-[var(--paper-raised)] border border-[var(--border)] p-6 rounded-2xl shadow-xs space-y-4 animate-mech-rise delay-mech-9">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--copper)]" />
                <h3 className="font-display text-lg text-[var(--ink)]">Operator Quorum &amp; Keys</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-[var(--verdigris)]/15 text-[var(--verdigris)] font-mono text-[9px] font-bold">
                TIER-0 ACTIVE
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {/* Active Operator Card */}
              <div className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--border)] flex items-center justify-between">
                <div>
                  <div className="font-bold text-[var(--ink)]">{user?.name || 'Operator'}</div>
                  <div className="text-[10px] text-[var(--copper)]">{user?.role || 'OPERATOR'} (CURRENT SESSION)</div>
                  <div className="text-[9px] text-[var(--ink-faint)] mt-0.5">FP: {user?.ed25519Fingerprint || '7F8C·914B'}</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[var(--verdigris)]/15 text-[var(--verdigris)] text-[9px] font-bold">
                  AUTHENTICATED
                </span>
              </div>

              {/* Governor Node Key */}
              <div className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--border)] flex items-center justify-between">
                <div>
                  <div className="font-bold text-[var(--ink)]">Dr. Althea Vogel</div>
                  <div className="text-[10px] text-[var(--ink-soft)]">TIER-0 ARBITER (Zurich Core)</div>
                  <div className="text-[9px] text-[var(--ink-faint)] mt-0.5">FP: 4C99·B12A·66F0 (VALID)</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[var(--paper-raised)] text-[var(--ink-soft)] text-[9px] font-bold">
                  REGISTERED
                </span>
              </div>
            </div>
          </div>

          {/* Deterministic Tombstone Compactor */}
          <div className="bg-[var(--paper-raised)] border border-[var(--border)] p-6 rounded-2xl shadow-xs space-y-4 animate-mech-rise delay-mech-10">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-[var(--copper)]" />
                <h3 className="font-display text-lg text-[var(--ink)]">Tombstone Compactor</h3>
              </div>
              <span className="text-[10px] font-mono text-[var(--copper)] font-bold">GC BENCH</span>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--paper)] border border-[var(--border)]">
              {/* Radial Dial Gauge SVG */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[var(--border)]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="text-[var(--copper)] stroke-current"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeDasharray="88, 100"
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center font-mono text-xs">
                  <span className="font-bold text-[var(--ink)] text-[11px]">88%</span>
                  <span className="text-[8px] text-[var(--ink-faint)]">PRUNED</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 font-newsreader text-xs text-[var(--ink-soft)]">
                <span className="font-sans font-semibold text-[var(--ink)]">Heap Overhead Reclaimed</span>
                <span>Safely prune causally dominated deletion records across acknowledged vector clocks.</span>
                <span className="font-mono text-[9px] text-[var(--verdigris)] font-bold mt-0.5">NEXT SWEEP: 00:03:42</span>
              </div>
            </div>

            {gcComplete && (
              <div className="p-3 rounded-lg bg-[var(--verdigris)]/15 border border-[var(--verdigris)] text-[var(--verdigris)] font-mono text-xs flex items-center gap-2 animate-mech-fade">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Deterministic GC sweep complete. 48 tombstones safely pruned.</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleRunGC}
              disabled={gcRunning}
              className="w-full py-2.5 px-4 rounded-xl bg-[var(--copper)] hover:bg-[var(--copper-deep)] text-[var(--paper-raised)] font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{gcRunning ? 'Compacting Tombstones...' : 'Execute Deterministic Compaction'}</span>
            </button>
          </div>

          {/* Cluster Invariant Assertions (Switchboard) */}
          <div className="bg-[var(--paper-raised)] border border-[var(--border)] p-6 rounded-2xl shadow-xs space-y-3 animate-mech-rise delay-mech-11">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--line)]">
              <Layers className="w-4 h-4 text-[var(--copper)]" />
              <h3 className="font-display text-lg text-[var(--ink)]">Cluster Invariant Assertions</h3>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {/* Toggle 1: Strict Monotonicity Proofs */}
              <label className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--paper)] border border-[var(--border)] cursor-pointer hover:border-[var(--copper)] transition">
                <div className="flex flex-col pr-2">
                  <span className="font-bold text-[var(--ink)] text-[11px]">Strict Monotonicity Proofs</span>
                  <span className="text-[9px] text-[var(--ink-faint)]">Reject mutations that decrease Lamport timestamps</span>
                </div>
                <input
                  type="checkbox"
                  checked={monotonicityStrict}
                  onChange={(e) => setMonotonicityStrict(e.target.checked)}
                  className="w-4 h-4 accent-[var(--copper)] cursor-pointer"
                />
              </label>

              {/* Toggle 2: Disallow Blind LWW */}
              <label className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--paper)] border border-[var(--border)] cursor-pointer hover:border-[var(--copper)] transition">
                <div className="flex flex-col pr-2">
                  <span className="font-bold text-[var(--ink)] text-[11px]">Disallow Blind LWW Register</span>
                  <span className="text-[9px] text-[var(--ink-faint)]">Mandate three-way semilattice merge for concurrent fields</span>
                </div>
                <input
                  type="checkbox"
                  checked={disallowBlindLww}
                  onChange={(e) => setDisallowBlindLww(e.target.checked)}
                  className="w-4 h-4 accent-[var(--copper)] cursor-pointer"
                />
              </label>

              {/* Toggle 3: Require Ed25519 Payload Signature */}
              <label className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--paper)] border border-[var(--border)] cursor-pointer hover:border-[var(--copper)] transition">
                <div className="flex flex-col pr-2">
                  <span className="font-bold text-[var(--ink)] text-[11px]">Require Ed25519 Signature</span>
                  <span className="text-[9px] text-[var(--ink-faint)]">Drop unsigned deltas arriving from unverified subnets</span>
                </div>
                <input
                  type="checkbox"
                  checked={requireEd25519}
                  onChange={(e) => setRequireEd25519(e.target.checked)}
                  className="w-4 h-4 accent-[var(--copper)] cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 4. CLUSTER SOVEREIGN BOTTOM BAR / SECURITY VERIFICATION STRIP (Entrance 1400-2200ms) */}
      <div className="bg-[var(--paper-raised)] border border-[var(--border)] p-4 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs animate-mech-rise delay-mech-12">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--verdigris)]" />
            <span className="font-bold text-[var(--ink)]">CLUSTER MERKLE ROOT:</span>
            <span className="bg-[var(--paper)] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--copper)] font-bold select-all">
              0x4F0B88...19ECC7410B
            </span>
          </div>
          <span className="text-[var(--border)] hidden sm:inline">|</span>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--ink-faint)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--verdigris)]" />
            <span>BACKEND STATUS: LOCAL ONLY (NO REMOTE CLUSTER CONNECTED)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => alert('Audit trail exported to local causal ledger.')}
            className="px-3 py-1.5 rounded-lg bg-[var(--paper)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--ink)] uppercase tracking-wider text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Trail</span>
          </button>
          <button
            type="button"
            onClick={() => setEmergencyIsolation(!emergencyIsolation)}
            className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1 border ${
              emergencyIsolation
                ? 'bg-[var(--rust)] text-[var(--paper-raised)] border-[var(--rust)] animate-pulse'
                : 'bg-[var(--paper)] text-[var(--rust)] border-[var(--rust)]/30 hover:bg-[var(--rust)]/10'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{emergencyIsolation ? 'Isolation Active' : 'Emergency Safe-Mode'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
