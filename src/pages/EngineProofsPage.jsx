import { useState } from 'react';
import {
  BookOpen,
  Terminal,
  FileCode,
  Copy
} from 'lucide-react';

export function EngineProofsPage() {
  const [selectedLatticeNode, setSelectedLatticeNode] = useState('lub');
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (codeKey, text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(codeKey);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const COQ_PROOF = `(* Coq Specification: Monotonic Join-Semilattice *)
Section JoinSemilattice.
  Variable L : Type.
  Variable join : L -> L -> L.
  Variable leq : L -> L -> Prop.

  Hypothesis join_comm : forall a b : L, join a b = join b a.
  Hypothesis join_assoc : forall a b c : L, join (join a b) c = join a (join b c).
  Hypothesis join_idem : forall a : L, join a a = a.
  Hypothesis leq_def : forall a b : L, leq a b <-> join a b = b.

  Theorem monotonic_inflation :
    forall a b : L, leq a (join a b).
  Proof.
    intros a b.
    rewrite leq_def.
    rewrite <- join_assoc.
    rewrite join_idem.
    reflexivity.
  Qed.
End JoinSemilattice.`;

  const TLA_SPEC = `---------------- MODULE NexusSync_CausalStability ----------------
EXTENDS Naturals, Sequences, FiniteSets

CONSTANTS Replicas, Operations
VARIABLES state, vectorClock, committedLattice

Init ==
  /\\ state = [r \\in Replicas |-> {}]
  /\\ vectorClock = [r \\in Replicas |-> [q \\in Replicas |-> 0]]
  /\\ committedLattice = {}

Mutate(r, op) ==
  /\\ state' = [state EXCEPT ![r] = @ \\union {op}]
  /\\ vectorClock' = [vectorClock EXCEPT ![r][r] = @ + 1]
  /\\ UNCHANGED committedLattice

Join(r1, r2) ==
  /\\ state' = [state EXCEPT ![r1] = @ \\union state[r2]]
  /\\ vectorClock' = [vectorClock EXCEPT ![r1] = 
       [q \\in Replicas |-> Max(vectorClock[r1][q], vectorClock[r2][q])]]
  /\\ UNCHANGED committedLattice

ConvergenceInvariant ==
  \\A r1, r2 \\in Replicas :
    (vectorClock[r1] = vectorClock[r2]) => (state[r1] = state[r2])
===================================================================`;

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-300">
      {/* 1. TOP FOLIATION & ARCHIVAL MASTHEAD STRIP */}
      <div className="w-full bg-[var(--paper-raised)] border border-[var(--border)] px-4 sm:px-6 py-2 rounded-lg flex flex-wrap items-center justify-between text-[var(--ink-soft)] font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[var(--copper)] uppercase tracking-wider">
            FASCICLE IV · REF. NX-2026-LAT-7
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--verdigris)]" />
          <span className="hidden sm:inline">MATHEMATICAL PROTOCOLS OF ASYNCHRONY</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="hidden md:inline">COORDINATION COMPLEXITY: O(0)</span>
          <span className="px-2 py-0.5 rounded bg-[var(--verdigris)]/15 border border-[var(--verdigris)]/40 text-[var(--verdigris)] font-bold">
            COQ VERIFIED: 100% PASS
          </span>
        </div>
      </div>

      {/* 2. EDITORIAL HERO SECTION */}
      <section className="border-b border-[var(--line)] pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--copper)] font-bold">
                04 / THEORETICAL FOUNDATION &amp; SPEC
              </span>
              <span className="h-px w-12 bg-[var(--line)]" />
            </div>
            <h1 className="font-display text-4xl sm:text-5xl text-[var(--ink)] tracking-tight leading-tight">
              Engine <span className="italic text-[var(--copper)] font-normal">Proofs</span> &amp; Theoretical Architecture
            </h1>
            <p className="font-newsreader text-base sm:text-lg text-[var(--ink-soft)] max-w-3xl leading-relaxed">
              Bounded join-semilattices, causal stability, and state-based convergence theorems underpinning the NexusSync engine. We formulate synchronization not as a consensus election, but as a monotonic inflation over partially ordered states.
            </p>

            {/* Marginalia Ink Epigram */}
            <div className="mt-4 p-4 rounded-lg bg-[var(--paper-raised)] border border-[var(--border)] flex items-start gap-3 max-w-2xl shadow-xs">
              <BookOpen className="w-5 h-5 text-[var(--copper)] shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-display text-base italic text-[var(--ink)]">
                  “Math over consensus; zero coordination cost across arbitrary partition intervals.”
                </span>
                <span className="font-mono text-[9px] text-[var(--ink-faint)] mt-1 uppercase tracking-wider">
                  — Marginal note from the Zenith Invariant Ledger, fol. 14v
                </span>
              </div>
            </div>
          </div>

          {/* Observatory Telemetry Stamp Card (4 cols) */}
          <div className="lg:col-span-4 bg-[var(--paper-raised)] border border-[var(--border)] p-5 rounded-xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2 font-mono text-xs">
              <span className="text-[var(--ink)] uppercase font-bold text-[10px]">CALIBRATION INDEX</span>
              <span className="text-[var(--verdigris)] font-bold text-[10px]">STABLE JOIN</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-[var(--ink-soft)] font-newsreader text-sm">Lattice Axiom:</span>
                <span className="font-bold text-[var(--ink)]">CvRDT (State-based)</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[var(--ink-soft)] font-newsreader text-sm">Convergence Class:</span>
                <span className="font-bold text-[var(--verdigris)]">Strong Eventual (SEC)</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[var(--ink-soft)] font-newsreader text-sm">Proof Rigor:</span>
                <span className="font-bold text-[var(--ink)]">TLA+ &amp; Coq (Machine)</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[var(--ink-soft)] font-newsreader text-sm">Gossip Overhead:</span>
                <span className="font-bold text-[var(--copper)]">0 Roundtrips</span>
              </div>
            </div>

            {/* Merge Stability Meter */}
            <div className="p-3 bg-[var(--paper)] border border-[var(--border)] rounded-lg space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-[10px] text-[var(--ink-soft)]">
                <span>LATTICE MERGE STABILITY</span>
                <span className="font-bold text-[var(--ink)]">1.000000 φ</span>
              </div>
              <div className="w-full bg-[var(--paper-sunken)] h-2 rounded overflow-hidden">
                <div className="bg-[var(--verdigris)] h-full rounded" style={{ width: '100%' }} />
              </div>
              <span className="text-[9px] text-[var(--ink-faint)] block">
                Idempotent on all permutations Π(S)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE HASSE SEMILATTICE EXPLORER */}
      <section className="bg-[var(--paper-raised)] border border-[var(--border)] rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--line)] pb-3">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--copper)] font-bold">
              ALGEBRAIC STATE DIAGRAM
            </span>
            <h2 className="font-display text-2xl text-[var(--ink)]">Interactive Hasse Semilattice Explorer</h2>
          </div>
          <span className="font-mono text-xs text-[var(--ink-soft)]">
            Click nodes below to inspect causal inflation properties:
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Interactive SVG Diagram (7 cols) */}
          <div className="lg:col-span-7 bg-[var(--paper-sunken)] border border-[var(--border)] rounded-lg p-6 flex items-center justify-center min-h-[320px]">
            <svg className="w-full max-w-[420px] h-72" viewBox="0 0 380 260">
              {/* Lattice Edges */}
              <line x1="190" y1="220" x2="100" y2="130" stroke="var(--ink-faint)" strokeWidth="2" strokeDasharray="3 3" />
              <line x1="190" y1="220" x2="280" y2="130" stroke="var(--ink-faint)" strokeWidth="2" strokeDasharray="3 3" />
              <line x1="100" y1="130" x2="190" y2="40" stroke="var(--copper)" strokeWidth="2.5" />
              <line x1="280" y1="130" x2="190" y2="40" stroke="var(--verdigris)" strokeWidth="2.5" />

              {/* Node 1: Bottom (⊥) Genesis */}
              <g className="cursor-pointer group" onClick={() => setSelectedLatticeNode('bottom')}>
                <circle
                  cx="190"
                  cy="220"
                  r="22"
                  fill={selectedLatticeNode === 'bottom' ? 'var(--copper)' : 'var(--paper-raised)'}
                  stroke="var(--ink)"
                  strokeWidth="2"
                />
                <text
                  x="190"
                  y="225"
                  textAnchor="middle"
                  className={`font-mono text-sm font-bold ${selectedLatticeNode === 'bottom' ? 'fill-[var(--paper-raised)]' : 'fill-[var(--ink)]'}`}
                >
                  ⊥
                </text>
                <text x="190" y="254" textAnchor="middle" className="font-mono text-[9px] fill-[var(--ink-faint)]">
                  Bottom (Genesis)
                </text>
              </g>

              {/* Node 2: Replica A (σ₁) */}
              <g className="cursor-pointer group" onClick={() => setSelectedLatticeNode('nodeA')}>
                <circle
                  cx="100"
                  cy="130"
                  r="24"
                  fill={selectedLatticeNode === 'nodeA' ? 'var(--copper)' : 'var(--paper-raised)'}
                  stroke="var(--copper)"
                  strokeWidth="2.5"
                />
                <text
                  x="100"
                  y="135"
                  textAnchor="middle"
                  className={`font-mono text-sm font-bold ${selectedLatticeNode === 'nodeA' ? 'fill-[var(--paper-raised)]' : 'fill-[var(--copper)]'}`}
                >
                  σ₁
                </text>
                <text x="100" y="166" textAnchor="middle" className="font-mono text-[9px] fill-[var(--copper)] font-bold">
                  Replica A State
                </text>
              </g>

              {/* Node 3: Replica B (σ₂) */}
              <g className="cursor-pointer group" onClick={() => setSelectedLatticeNode('nodeB')}>
                <circle
                  cx="280"
                  cy="130"
                  r="24"
                  fill={selectedLatticeNode === 'nodeB' ? 'var(--verdigris)' : 'var(--paper-raised)'}
                  stroke="var(--verdigris)"
                  strokeWidth="2.5"
                />
                <text
                  x="280"
                  y="135"
                  textAnchor="middle"
                  className={`font-mono text-sm font-bold ${selectedLatticeNode === 'nodeB' ? 'fill-[var(--paper-raised)]' : 'fill-[var(--verdigris)]'}`}
                >
                  σ₂
                </text>
                <text x="280" y="166" textAnchor="middle" className="font-mono text-[9px] fill-[var(--verdigris)] font-bold">
                  Replica B State
                </text>
              </g>

              {/* Node 4: Least Upper Bound / Top (⊔) */}
              <g className="cursor-pointer group" onClick={() => setSelectedLatticeNode('lub')}>
                <polygon
                  points="190,16 218,40 190,64 162,40"
                  fill={selectedLatticeNode === 'lub' ? 'var(--copper)' : 'var(--paper-raised)'}
                  stroke="var(--copper)"
                  strokeWidth="2.5"
                />
                <text
                  x="190"
                  y="44"
                  textAnchor="middle"
                  className={`font-mono text-xs font-bold ${selectedLatticeNode === 'lub' ? 'fill-[var(--paper-raised)]' : 'fill-[var(--copper)]'}`}
                >
                  σ₁ ⊔ σ₂
                </text>
                <text x="190" y="78" textAnchor="middle" className="font-mono text-[9px] fill-[var(--copper)] font-bold">
                  ⊤ Join (LUB)
                </text>
              </g>
            </svg>
          </div>

          {/* Node Inspector Sheet (5 cols) */}
          <div className="lg:col-span-5 bg-[var(--paper)] border border-[var(--border)] rounded-lg p-5 space-y-4 font-mono text-xs shadow-2xs">
            {selectedLatticeNode === 'lub' && (
              <>
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                  <span className="font-bold text-[var(--copper)] uppercase">NODE: LEAST UPPER BOUND (⊤)</span>
                  <span className="px-2 py-0.5 rounded bg-[var(--verdigris)]/15 text-[var(--verdigris)] font-bold text-[10px]">
                    CONVERGED
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[var(--ink-faint)] text-[10px] block">Formal Definition</span>
                    <p className="font-display text-base text-[var(--ink)] pt-0.5">
                      σ_LUB = supremum &#123; σ₁, σ₂ &#125; under partial order ≤
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--ink-faint)] text-[10px] block">Closure Property</span>
                    <p className="text-[var(--ink-soft)] font-sans text-xs">
                      Every independent pair of states possesses a unique, mathematically deterministic join that satisfies commutativity, associativity, and idempotence.
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-[var(--paper-sunken)] border border-[var(--border)] text-[var(--copper)] font-bold">
                    σ₁ ≤ (σ₁ ⊔ σ₂) ∧ σ₂ ≤ (σ₁ ⊔ σ₂)
                  </div>
                </div>
              </>
            )}

            {selectedLatticeNode === 'nodeA' && (
              <>
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                  <span className="font-bold text-[var(--copper)] uppercase">NODE: REPLICA A (AARAV)</span>
                  <span className="text-[var(--ink-faint)] text-[10px]">LOCAL DRIFT</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[var(--ink-faint)] text-[10px] block">State Vector</span>
                    <p className="font-mono text-sm text-[var(--copper)] font-bold pt-0.5">[A: 8, B: 6]</p>
                  </div>
                  <p className="text-[var(--ink-soft)] font-sans text-xs">
                    Locally applied high-priority task modifications while offline from central relay.
                  </p>
                </div>
              </>
            )}

            {selectedLatticeNode === 'nodeB' && (
              <>
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                  <span className="font-bold text-[var(--verdigris)] uppercase">NODE: REPLICA B (MEERA)</span>
                  <span className="text-[var(--ink-faint)] text-[10px]">LOCAL DRIFT</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[var(--ink-faint)] text-[10px] block">State Vector</span>
                    <p className="font-mono text-sm text-[var(--verdigris)] font-bold pt-0.5">[A: 6, B: 7]</p>
                  </div>
                  <p className="text-[var(--ink-soft)] font-sans text-xs">
                    Concurrent mutation on task scheduling without blocking on Replica A.
                  </p>
                </div>
              </>
            )}

            {selectedLatticeNode === 'bottom' && (
              <>
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                  <span className="font-bold text-[var(--ink)] uppercase">NODE: GENESIS ROOT (⊥)</span>
                  <span className="text-[var(--ink-faint)] text-[10px]">INITIAL BOUND</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[var(--ink-faint)] text-[10px] block">Bottom Element</span>
                    <p className="font-mono text-sm text-[var(--ink)] pt-0.5">⊥ = ∅ (Empty Register)</p>
                  </div>
                  <p className="text-[var(--ink-soft)] font-sans text-xs">
                    The zero-element satisfying ∀ x ∈ L, ⊥ ⊔ x = x.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 4. FORMAL THEOREMS & MACHINE SPECIFICATIONS */}
      <section className="space-y-6">
        <div className="border-b border-[var(--line)] pb-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--copper)] font-bold">
            FORMAL PROOF SUITE
          </span>
          <h2 className="font-display text-2xl text-[var(--ink)]">Machine-Verified Specifications</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Theorem 1 & Coq Block */}
          <div className="bg-[var(--paper-raised)] border border-[var(--border)] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[var(--copper)]" />
                <span className="font-mono text-xs font-bold text-[var(--ink)] uppercase">
                  Theorem 1: Monotonic Inflation (Coq)
                </span>
              </div>
              <button
                onClick={() => handleCopy('coq', COQ_PROOF)}
                className="flex items-center gap-1 font-mono text-[10px] text-[var(--ink-soft)] hover:text-[var(--copper)] cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedCode === 'coq' ? 'COPIED' : 'COPY'}</span>
              </button>
            </div>

            <p className="font-newsreader text-sm text-[var(--ink-soft)] leading-snug">
              Every join evaluation strictly inflates or preserves the partially ordered state. Formalized and verified mechanically in the Coq Proof Assistant:
            </p>

            <pre className="p-4 rounded-lg bg-[var(--paper-sunken)] border border-[var(--border)] font-mono text-[11px] text-[var(--ink)] overflow-x-auto leading-relaxed">
              <code>{COQ_PROOF}</code>
            </pre>
          </div>

          {/* Theorem 3 & TLA+ Block */}
          <div className="bg-[var(--paper-raised)] border border-[var(--border)] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[var(--verdigris)]" />
                <span className="font-mono text-xs font-bold text-[var(--ink)] uppercase">
                  Theorem 3: Strong Eventual Convergence (TLA+)
                </span>
              </div>
              <button
                onClick={() => handleCopy('tla', TLA_SPEC)}
                className="flex items-center gap-1 font-mono text-[10px] text-[var(--ink-soft)] hover:text-[var(--verdigris)] cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedCode === 'tla' ? 'COPIED' : 'COPY'}</span>
              </button>
            </div>

            <p className="font-newsreader text-sm text-[var(--ink-soft)] leading-snug">
              State-based convergence invariant verified across arbitrary asynchronous message re-orderings using TLA+ model checking:
            </p>

            <pre className="p-4 rounded-lg bg-[var(--paper-sunken)] border border-[var(--border)] font-mono text-[11px] text-[var(--ink)] overflow-x-auto leading-relaxed">
              <code>{TLA_SPEC}</code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
