import { useSyncStore } from '../store/useSyncStore';
import { AiConflictAssistant } from '../components/conflict/AiConflictAssistant';
import {
  ArrowRight,
  Edit3
} from 'lucide-react';

export function ConflictImpactPage() {
  const { conflicts, setActivePage } = useSyncStore();
  const activeConflict = conflicts[0];

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-300">
      {/* 1. TOP FORENSIC CALIBRATION STRIP */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-[var(--line)] gap-3 font-mono text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="tracking-widest uppercase bg-[var(--paper-raised)] text-[var(--copper)] px-2 py-0.5 border border-[var(--border)] font-bold text-[10px]">
            06 / FORENSIC IMPACT AUDIT
          </span>
          <span className="text-[var(--ink-soft)] text-[11px]">
            DIRECTED ACYCLIC DEPENDENCY ANALYSIS · SEC. IX-B
          </span>
          <div className="flex items-center gap-1.5 text-[var(--verdigris)] px-2 py-0.5 bg-[var(--verdigris)]/10 rounded font-bold text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--verdigris)]" />
            DAG TOPOLOGY: VERIFIED STABLE
          </div>
        </div>
        <div className="flex items-center gap-3 text-[var(--ink-faint)] text-[11px]">
          <span>REF_EPOCH: 0x88F2–CRDT</span>
          <span>|</span>
          <span>HORIZON: +45 SOLAR DAYS</span>
        </div>
      </div>

      {/* 2. HEADER SECTION WITH MARGINALIA */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-4">
        <div className="lg:col-span-8 space-y-2">
          <h1 className="font-display text-4xl sm:text-5xl text-[var(--ink)] font-semibold tracking-tight">
            Conflict Impact &amp; Blast Radius Instrument
          </h1>
          <p className="font-newsreader text-base sm:text-lg text-[var(--ink-soft)] max-w-3xl leading-relaxed">
            Simulate reconciliation vectors across the dependency DAG before broadcasting deltas to peer nodes. 
            Evaluate downstream cascading delays, topological compressions, and deterministic invariant hazard scores.
          </p>
        </div>

        {/* Editorial Margin Note */}
        <div className="lg:col-span-4 bg-[var(--paper-raised)] border border-[var(--border)] p-4 rounded-xl shadow-xs space-y-1 self-start lg:self-auto">
          <div className="flex items-center gap-1.5 text-[var(--copper)] pb-1">
            <Edit3 className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Archivist’s Marginalia</span>
          </div>
          <p className="font-newsreader text-sm italic text-[var(--ink)] leading-snug">
            “Look downstream before picking a winner. Aarav’s urgency fractures the Vernier ring calibration chain.”
          </p>
          <div className="font-mono text-[9px] text-[var(--ink-faint)] mt-1 uppercase tracking-widest text-right">
            — Lead Cryptographer M.V., Obs. Sub-Vault 4
          </div>
        </div>
      </section>

      {/* 3. ACTIVE CONFLICT CONTEXT CARD (#204) */}
      <section className="bg-[var(--paper-raised)] border border-[var(--border)] rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[var(--copper)]/15 border border-[var(--copper)]/40 text-[var(--copper)] flex items-center justify-center font-mono text-sm font-bold shrink-0 rounded-lg">
              #204
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display text-xl text-[var(--ink)] font-bold">
                  Produce 200 physical observatory badges
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 bg-[var(--ochre)]/20 text-[var(--ochre)] uppercase font-bold tracking-widest rounded">
                  MUTATION COLLISION DETECTED
                </span>
              </div>
              <p className="font-mono text-[11px] text-[var(--ink-faint)] mt-0.5">
                NODE IDENTITY: <span className="text-[var(--ink)]">urn:crdt:artifact:badge-run-204</span> · CLOCK DRIFT: +412ms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs text-[var(--ink-soft)] shrink-0">
            <div className="flex flex-col">
              <span className="uppercase text-[9px] text-[var(--ink-faint)] tracking-widest">LCA Common Base</span>
              <span className="font-semibold text-[var(--ink)]">Oct 28 (v12 · 0x48FA)</span>
            </div>
            <div className="h-6 w-px bg-[var(--line)] hidden sm:block" />
            <div className="flex flex-col">
              <span className="uppercase text-[9px] text-[var(--ink-faint)] tracking-widest">Divergent Fields</span>
              <span className="font-semibold text-[var(--copper)]">due_date, status, cadence</span>
            </div>
          </div>
        </div>

        {/* Divergent Replica Comparison Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {/* Replica A */}
          <div className="p-4 rounded-xl bg-[var(--paper)] border-2 border-[var(--copper)]/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--copper)] uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--copper)]" />
                REPLICA A · AARAV K.
              </span>
              <span className="text-[10px] text-[var(--copper)] bg-[var(--copper)]/15 px-2 py-0.5 rounded font-bold">
                STATE: ACCELERATED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-[var(--ink-faint)] uppercase text-[9px] block">Proposed Due:</span>
                <div className="text-[var(--ink)] font-bold text-sm">Nov 04, 2026</div>
              </div>
              <div>
                <span className="text-[var(--ink-faint)] uppercase text-[9px] block">Resolution Action:</span>
                <div className="text-[var(--copper)] font-bold">Force Sync LWW</div>
              </div>
            </div>
            <div className="text-[10px] text-[var(--ink-faint)] pt-2 border-t border-[var(--line)]">
              Vector Stamp: <span className="text-[var(--ink)] font-bold">[Aarav:18, Meera:11, LCA:12]</span>
            </div>
          </div>

          {/* Replica B */}
          <div className="p-4 rounded-xl bg-[var(--paper)] border-2 border-[var(--verdigris)]/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--verdigris)] uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--verdigris)]" />
                REPLICA B · MEERA P.
              </span>
              <span className="text-[10px] text-[var(--verdigris)] bg-[var(--verdigris)]/15 px-2 py-0.5 rounded font-bold">
                STATE: CALIBRATED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-[var(--ink-faint)] uppercase text-[9px] block">Proposed Due:</span>
                <div className="text-[var(--ink)] font-bold text-sm">Nov 19, 2026</div>
              </div>
              <div>
                <span className="text-[var(--ink-faint)] uppercase text-[9px] block">Blocking Node:</span>
                <div className="text-[var(--verdigris)] font-bold">#205 Vernier Assembly</div>
              </div>
            </div>
            <div className="text-[10px] text-[var(--ink-faint)] pt-2 border-t border-[var(--line)]">
              Vector Stamp: <span className="text-[var(--ink)] font-bold">[Aarav:12, Meera:17, LCA:12]</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3.5 PURPOSEFUL AI CONFLICT ASSISTANT (CONTEXTUAL ADVISORY ONLY) */}
      {activeConflict && (
        <AiConflictAssistant conflict={activeConflict} />
      )}

      {/* 4. DOWNSTREAM BLAST RADIUS DAG CASCADE VISUALIZER */}
      <section className="bg-[var(--paper-raised)] border border-[var(--border)] rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--line)] pb-3">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--copper)] font-bold">
              DAG TOPOLOGY SIMULATION
            </span>
            <h2 className="font-display text-2xl text-[var(--ink)]">Downstream Blast Radius Cascade</h2>
          </div>
          <span className="font-mono text-xs text-[var(--ink-soft)]">
            Cascade Impact: <strong className="text-[var(--ochre)]">2 Affected Downstream Cards</strong>
          </span>
        </div>

        {/* Blast Radius Visual Canvas */}
        <div className="w-full bg-[var(--paper-sunken)] border border-[var(--border)] rounded-lg p-6 flex flex-col md:flex-row items-center justify-around gap-6 min-h-[180px]">
          {/* Node 1: Origin Conflict */}
          <div className="p-4 rounded-xl bg-[var(--paper-raised)] border-2 border-[var(--ochre)] text-center space-y-1 shadow-xs max-w-xs w-full">
            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 bg-[var(--ochre)]/20 text-[var(--ochre)] font-bold rounded">
              ORIGIN FORK
            </span>
            <div className="font-display text-base font-bold text-[var(--ink)]">#204 Observatory Badges</div>
            <p className="font-mono text-[10px] text-[var(--ink-soft)]">Divergent due date</p>
          </div>

          <div className="flex items-center text-[var(--copper)]">
            <ArrowRight className="w-6 h-6 animate-pulse" />
          </div>

          {/* Node 2: Downstream Cascade */}
          <div className="p-4 rounded-xl bg-[var(--paper-raised)] border border-[var(--border)] text-center space-y-1 shadow-xs max-w-xs w-full">
            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 bg-[var(--copper)]/20 text-[var(--copper)] font-bold rounded">
              DIRECT BLOCK (+15d)
            </span>
            <div className="font-display text-base font-bold text-[var(--ink)]">#205 Vernier Calibration</div>
            <p className="font-mono text-[10px] text-[var(--ink-soft)]">Depends on #204</p>
          </div>

          <div className="flex items-center text-[var(--copper)]">
            <ArrowRight className="w-6 h-6 opacity-60" />
          </div>

          {/* Node 3: Final Signoff */}
          <div className="p-4 rounded-xl bg-[var(--paper-raised)] border border-[var(--border)] text-center space-y-1 shadow-xs max-w-xs w-full">
            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 bg-[var(--verdigris)]/20 text-[var(--verdigris)] font-bold rounded">
              MILESTONE GOAL
            </span>
            <div className="font-display text-base font-bold text-[var(--ink)]">#208 Astrolabe Signoff</div>
            <p className="font-mono text-[10px] text-[var(--ink-soft)]">Terminal root</p>
          </div>
        </div>

        {/* Hazard Score Summary & Action Buttons */}
        <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
          <div className="space-y-1">
            <span className="text-[10px] uppercase text-[var(--ink-faint)]">HAZARD SEVERITY SCORE</span>
            <div className="font-display text-xl text-[var(--ochre)] font-bold">38 / 100 · MEDIUM HAZARD</div>
            <p className="font-newsreader text-xs text-[var(--ink-soft)]">
              Choosing Replica B preserves downstream calibration without schedule compression.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActivePage('conflicts')}
              className="py-2 px-4 rounded bg-[var(--copper)] hover:bg-[var(--copper-deep)] text-[var(--paper-raised)] font-bold cursor-pointer transition shadow-xs"
            >
              Resolve in Studio
            </button>
            <button
              onClick={() => setActivePage('timeline')}
              className="py-2 px-4 rounded bg-[var(--paper-raised)] border border-[var(--border)] text-[var(--ink)] cursor-pointer hover:bg-[var(--paper-sunken)] transition"
            >
              View in Op-Log
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
