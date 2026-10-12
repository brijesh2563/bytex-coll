import { useSyncStore } from '../store/useSyncStore';
import {
  Radio,
  GitFork,
  CheckCircle2
} from 'lucide-react';

export function ConflictRadarPage() {
  const { conflicts, setActivePage } = useSyncStore();

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-300">
      {/* 1. TOP REGISTRATION & HEADER BLOCK */}
      <section className="bg-[var(--paper-raised)] border border-[var(--border)] p-6 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between font-mono text-xs uppercase tracking-widest text-[var(--ink-soft)] pb-1 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <span className="text-[var(--copper)] font-bold">04 / ANOMALY DETECTION</span>
            <span>·</span>
            <span>DIVERGENCE RADAR &amp; TRIAGE</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[var(--ochre)] flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-[var(--ochre)] animate-ping" />
              REAL-TIME TELEMETRY SCAN
            </span>
            <span className="text-[var(--ink-faint)]">SEC_REG: +42.109 / -71.034</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <h1 className="font-display text-4xl sm:text-5xl text-[var(--ink)] tracking-tight leading-tight">
              Conflict Radar &amp; State Inconsistency Inbox
            </h1>
            <p className="font-newsreader text-base text-[var(--ink-soft)] leading-relaxed">
              Continuous mathematical detection of concurrent forks across asynchronous partition epochs. The CRDT state-vector reticle identifies causal divergence before deterministic lowest-upper-bound (LUB) synthesis.
            </p>
          </div>

          <div className="bg-[var(--paper)] border border-[var(--border)] p-3 rounded-lg shadow-2xs rotate-[-1deg] shrink-0 self-start lg:self-auto">
            <span className="font-display text-base italic text-[var(--copper)] block">
              “divergence is a feature of distributed time, not a bug”
            </span>
            <span className="font-mono text-[9px] text-[var(--ink-faint)] uppercase tracking-wider block mt-1 text-right">
              — H. Minkowski, Archival Note #08
            </span>
          </div>
        </div>
      </section>

      {/* 2. KPI GAUGES (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        {/* Card 1: Active Forks */}
        <div className="bg-[var(--paper-raised)] border border-[var(--border)] p-4 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[10px] uppercase text-[var(--ink-faint)]">
            <span>UNRESOLVED CONFLICTS</span>
            <span className="px-1.5 py-0.5 bg-[var(--ochre)]/15 text-[var(--ochre)] font-bold rounded">
              ATTENTION REQUIRED
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl text-[var(--copper)] font-bold leading-none">{conflicts.length}</span>
            <span className="text-[10px] text-[var(--ink-soft)] uppercase">ACTIVE FORK</span>
          </div>
          <div className="flex justify-between text-[10px] text-[var(--ink-soft)] border-t border-[var(--line)] pt-2">
            <span>LAMPORT LATENCY</span>
            <span className="text-[var(--ochre)] font-bold">+1 DELTA</span>
          </div>
        </div>

        {/* Card 2: Resolved This Epoch */}
        <div className="bg-[var(--paper-raised)] border border-[var(--border)] p-4 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[10px] uppercase text-[var(--ink-faint)]">
            <span>RESOLVED THIS EPOCH</span>
            <span className="px-1.5 py-0.5 bg-[var(--verdigris)]/15 text-[var(--verdigris)] font-bold rounded">
              CONVERGED
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl text-[var(--verdigris)] font-bold leading-none">24</span>
            <span className="text-[10px] text-[var(--ink-soft)] uppercase">LUB MERGES</span>
          </div>
          <div className="flex justify-between text-[10px] text-[var(--ink-soft)] border-t border-[var(--line)] pt-2">
            <span>ALGORITHM</span>
            <span className="text-[var(--ink)] font-bold">SEMILATTICE JOIN</span>
          </div>
        </div>

        {/* Card 3: Hazards */}
        <div className="bg-[var(--paper-raised)] border border-[var(--border)] p-4 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[10px] uppercase text-[var(--ink-faint)]">
            <span>CRITICAL PATH HAZARDS</span>
            <span className="px-1.5 py-0.5 bg-[var(--paper)] border border-[var(--border)] text-[var(--ink-soft)] rounded">
              NOMINAL
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl text-[var(--ink)] font-bold leading-none">0</span>
            <span className="text-[10px] text-[var(--ink-soft)] uppercase">HIGH SEVERITY</span>
          </div>
          <div className="flex justify-between text-[10px] text-[var(--ink-soft)] border-t border-[var(--line)] pt-2">
            <span>TOMBSTONE INTEGRITY</span>
            <span className="text-[var(--verdigris)] font-bold">100% CLEAN</span>
          </div>
        </div>

        {/* Card 4: MTTC */}
        <div className="bg-[var(--paper-raised)] border border-[var(--border)] p-4 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[10px] uppercase text-[var(--ink-faint)]">
            <span>MEAN TIME TO CONVERGE</span>
            <span className="px-1.5 py-0.5 bg-[var(--verdigris)]/15 text-[var(--verdigris)] font-bold rounded">
              P99: 2.1s
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl text-[var(--ink)] font-bold leading-none">1.4</span>
            <span className="text-sm font-newsreader text-[var(--ink-soft)]">seconds</span>
          </div>
          <div className="flex justify-between text-[10px] text-[var(--ink-soft)] border-t border-[var(--line)] pt-2">
            <span>GOSSIP PULSE</span>
            <span className="text-[var(--ink)] font-bold">500ms INTERVAL</span>
          </div>
        </div>
      </div>

      {/* 3. POLAR RADAR VISUALIZER (LEFT) & ACTIVE INBOX (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Radar Reticle Canvas (6 cols) */}
        <div className="lg:col-span-6 bg-[var(--paper-raised)] border border-[var(--border)] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[var(--copper)]" />
              <span className="font-bold text-[var(--ink)] uppercase">Polar Divergence Astrolabe</span>
            </div>
            <span className="text-[10px] text-[var(--copper)] font-bold">SCANNING 360°</span>
          </div>

          {/* SVG Radar Screen */}
          <div className="w-full bg-[var(--paper-sunken)] border border-[var(--border)] rounded-lg p-4 flex items-center justify-center relative min-h-[320px] overflow-hidden">
            <svg className="w-72 h-72" viewBox="0 0 300 300">
              {/* Concentric Polar Coordinate Rings */}
              <circle cx="150" cy="150" r="130" fill="none" stroke="var(--border)" strokeWidth="1" />
              <circle cx="150" cy="150" r="95" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="150" cy="150" r="60" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="150" cy="150" r="25" fill="none" stroke="var(--border)" strokeWidth="1" />

              {/* Crosshair Axes */}
              <line x1="20" y1="150" x2="280" y2="150" stroke="var(--border)" strokeWidth="1" />
              <line x1="150" y1="20" x2="150" y2="280" stroke="var(--border)" strokeWidth="1" />

              {/* Rotating Radar Sweeper Beam */}
              <g className="origin-center">
                <line x1="150" y1="150" x2="270" y2="150" stroke="var(--copper)" strokeWidth="2" opacity="0.8">
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 150 150"
                    to="360 150 150"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </line>
              </g>

              {/* Central Observation Hub */}
              <circle cx="150" cy="150" r="6" fill="var(--copper)" />

              {/* Anomaly Blip 1: Task #204 Collision (Ochre) */}
              <g className="cursor-pointer">
                <circle cx="210" cy="110" r="7" fill="var(--ochre)" className="animate-pulse" />
                <circle cx="210" cy="110" r="14" fill="none" stroke="var(--ochre)" strokeWidth="1" opacity="0.5" />
                <text x="210" y="95" textAnchor="middle" className="font-mono text-[8px] fill-[var(--ochre)] font-bold">
                  #204 FORK (Δ+1)
                </text>
              </g>

              {/* Converged Node Blips */}
              <circle cx="90" cy="90" r="5" fill="var(--verdigris)" />
              <text x="90" y="78" textAnchor="middle" className="font-mono text-[7px] fill-[var(--verdigris)]">
                #101 SYNC
              </text>

              <circle cx="220" cy="200" r="5" fill="var(--verdigris)" />
              <text x="220" y="215" textAnchor="middle" className="font-mono text-[7px] fill-[var(--verdigris)]">
                #202 SYNC
              </text>
            </svg>
          </div>

          <div className="flex justify-between items-center font-mono text-[10px] text-[var(--ink-soft)] px-1">
            <span>POLAR RESOLUTION: 0.12°</span>
            <span className="text-[var(--ochre)] font-bold">1 FORK IN APERTURE</span>
          </div>
        </div>

        {/* Divergence Triage Inbox (6 cols) */}
        <div className="lg:col-span-6 bg-[var(--paper-raised)] border border-[var(--border)] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div>
              <span className="font-mono text-[10px] uppercase text-[var(--copper)] font-bold">
                TRIAGE QUEUE
              </span>
              <h3 className="font-display text-xl text-[var(--ink)]">Divergent Fork Registry</h3>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--ochre)]/15 text-[var(--ochre)] font-bold">
              {conflicts.length} Pending Triage
            </span>
          </div>

          {/* Conflict Item Card */}
          {conflicts.length > 0 ? (
            <div className="space-y-3 font-mono text-xs">
              {conflicts.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-[var(--paper)] border-2 border-[var(--ochre)]/40 space-y-3 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-[var(--ochre)] text-white text-[9px] font-bold uppercase">
                          FORK
                        </span>
                        <span className="font-display text-base font-bold text-[var(--ink)]">
                          {c.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--ink-soft)] font-newsreader">
                        Due Date collision: Nov 04 (Replica A) vs Nov 19 (Replica B).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-[var(--paper-raised)] p-2.5 rounded border border-[var(--border)]">
                    <div>
                      <span className="text-[var(--ink-faint)] uppercase block">LCA BASE</span>
                      <strong className="text-[var(--ink)]">{c.lcaHash}</strong>
                    </div>
                    <div>
                      <span className="text-[var(--ink-faint)] uppercase block">LAMPORT SKEW</span>
                      <strong className="text-[var(--copper)]">Δ +1 TICK</strong>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setActivePage('conflicts')}
                      className="flex-1 py-2 px-3 rounded bg-[var(--copper)] hover:bg-[var(--copper-deep)] text-[var(--paper-raised)] font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs"
                    >
                      <GitFork className="w-3.5 h-3.5" />
                      <span>Launch Resolver Studio</span>
                    </button>
                    <button
                      onClick={() => setActivePage('conflict-impact')}
                      className="py-2 px-3 rounded bg-[var(--paper-raised)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--ink)] text-center cursor-pointer transition"
                    >
                      <span>Blast Radius</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center space-y-2 bg-[var(--paper)] rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-[var(--verdigris)] mx-auto" />
              <p className="font-display text-lg text-[var(--ink)]">Zero Divergent Anomalies</p>
              <p className="font-newsreader text-xs text-[var(--ink-soft)]">All replicas synchronized.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
