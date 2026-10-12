import { useState, useEffect } from 'react';
import { useSyncStore } from '../store/useSyncStore';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  GitFork,
  Sliders,
  Info,
  Award
} from 'lucide-react';

const EPOCH_DATA = {
  0:  { vc: "⟨A:0, B:0⟩", status: "GENESIS", badgeBg: "bg-[var(--border)]", badgeText: "text-[var(--ink)]", opId: "op_0000", lamport: 14780, pct: 0 },
  1:  { vc: "⟨A:1, B:0⟩", status: "TRUNK v1", badgeBg: "bg-[var(--border)]", badgeText: "text-[var(--ink)]", opId: "op_1A09", lamport: 14792, pct: 7 },
  2:  { vc: "⟨A:2, B:0⟩", status: "ANCESTOR v2", badgeBg: "bg-[var(--border)]", badgeText: "text-[var(--ink)]", opId: "op_2F81", lamport: 14800, pct: 14 },
  3:  { vc: "⟨A:3, B:1⟩", status: "FORKED [CONCURRENT]", badgeBg: "bg-[var(--ochre)]/20", badgeText: "text-[var(--ochre)] font-bold", opId: "op_3C88", lamport: 14815, pct: 21 },
  4:  { vc: "⟨A:4, B:2⟩", status: "FORKED [DIVERGENT]", badgeBg: "bg-[var(--ochre)]/20", badgeText: "text-[var(--ochre)] font-bold", opId: "op_7Kq2x", lamport: 14829, pct: 28 },
  5:  { vc: "⟨A:4, B:4⟩", status: "JOIN RESOLVED", badgeBg: "bg-[var(--copper)]/20", badgeText: "text-[var(--copper)] font-bold", opId: "op_9M41", lamport: 14840, pct: 35 },
  6:  { vc: "⟨A:5, B:4⟩", status: "COMMITTED", badgeBg: "bg-[var(--verdigris)]/20", badgeText: "text-[var(--verdigris)]", opId: "op_6E21", lamport: 14860, pct: 42 },
  7:  { vc: "⟨A:5, B:5⟩", status: "COMMITTED", badgeBg: "bg-[var(--verdigris)]/20", badgeText: "text-[var(--verdigris)]", opId: "op_7F19", lamport: 14875, pct: 50 },
  8:  { vc: "⟨A:6, B:5⟩", status: "COMMITTED", badgeBg: "bg-[var(--verdigris)]/20", badgeText: "text-[var(--verdigris)]", opId: "op_8A02", lamport: 14890, pct: 57 },
  9:  { vc: "⟨A:6, B:6⟩", status: "COMMITTED", badgeBg: "bg-[var(--verdigris)]/20", badgeText: "text-[var(--verdigris)]", opId: "op_9B44", lamport: 14910, pct: 64 },
  10: { vc: "⟨A:7, B:6⟩", status: "COMMITTED", badgeBg: "bg-[var(--verdigris)]/20", badgeText: "text-[var(--verdigris)]", opId: "op_8V11", lamport: 14950, pct: 71 },
  11: { vc: "⟨A:7, B:7⟩", status: "COMMITTED", badgeBg: "bg-[var(--verdigris)]/20", badgeText: "text-[var(--verdigris)]", opId: "op_11C2", lamport: 14980, pct: 78 },
  12: { vc: "⟨A:8, B:7⟩", status: "COMMITTED", badgeBg: "bg-[var(--verdigris)]/20", badgeText: "text-[var(--verdigris)]", opId: "op_12D8", lamport: 15000, pct: 85 },
  13: { vc: "⟨A:8, B:8⟩", status: "PRE-TIP", badgeBg: "bg-[var(--verdigris)]/20", badgeText: "text-[var(--verdigris)]", opId: "op_13E9", lamport: 15015, pct: 92 },
  14: { vc: "⟨A:8, B:6⟩", status: "TIP SYNCED", badgeBg: "bg-[var(--verdigris)]/20", badgeText: "text-[var(--verdigris)] font-bold", opId: "op_EE82", lamport: 15024, pct: 100 }
};

const OP_CATALOG = {
  'op_0000': {
    id: 'op_0000',
    version: 'v0',
    title: 'Genesis Lattice Root',
    replica: 'rep_system',
    replicaLabel: 'System Genesis (Seed Root)',
    lamport: '14780',
    vc: '[A: 0, B: 0]',
    deps: '[]',
    hash: '00000000...0000',
    payload: 'Initialize empty CRDT document store',
    badge: 'Genesis'
  },
  'op_1A09': {
    id: 'op_1A09',
    version: 'v1',
    title: 'Task.create',
    replica: 'rep_01',
    replicaLabel: 'Replica A (Aarav / r_aarav-lap)',
    lamport: '14792',
    vc: '[A: 1, B: 0]',
    deps: '[op_0000]',
    hash: '1a09bb82...301f',
    payload: 'Task.create({ id: "card-2", title: "Observatory Badges" })',
    badge: 'Trunk'
  },
  'op_2F81': {
    id: 'op_2F81',
    version: 'v2',
    title: 'Task.title = "Payload Engine"',
    replica: 'rep_01',
    replicaLabel: 'Replica A (Aarav / r_aarav-lap)',
    lamport: '14800',
    vc: '[A: 6, B: 6]',
    deps: '[op_1A09]',
    hash: 'a192ee04...b881',
    payload: 'Task.title = "Produce 200 physical observatory badges"',
    badge: 'Common Base'
  },
  'op_3C88': {
    id: 'op_3C88',
    version: 'v3',
    title: 'Task.tags.add("P0")',
    replica: 'rep_01',
    replicaLabel: 'Replica A (Aarav / r_aarav-lap)',
    lamport: '14815',
    vc: '[A: 7, B: 6]',
    deps: '[op_2F81]',
    hash: '3c88fc91...811d',
    payload: 'Task.tags.add("P0") // Branch A local fork',
    badge: 'Branch A'
  },
  'op_7Kq2x': {
    id: 'op_7Kq2x',
    version: 'v4',
    title: 'Task.priority = "HIGH"',
    replica: 'rep_01',
    replicaLabel: 'Replica A (Aarav / r_aarav-lap)',
    lamport: '14829',
    vc: '[A: 8, B: 6]',
    deps: '[op_3C88]',
    hash: '4e91c784...a02f',
    payload: 'Task.priority = "HIGH"',
    badge: 'Branch A'
  },
  'op_2B14': {
    id: 'op_2B14',
    version: 'v3',
    title: 'Task.assignee = "Meera"',
    replica: 'rep_02',
    replicaLabel: 'Replica B (Meera / r_meera-ph)',
    lamport: '14814',
    vc: '[A: 6, B: 7]',
    deps: '[op_2F81]',
    hash: '2b14aa91...592c',
    payload: 'Task.assignee = "Meera"',
    badge: 'Branch B'
  },
  'op_4D92': {
    id: 'op_4D92',
    version: 'v4',
    title: 'Task.due = "2026-11-01"',
    replica: 'rep_02',
    replicaLabel: 'Replica B (Meera / r_meera-ph)',
    lamport: '14828',
    vc: '[A: 7, B: 7]',
    deps: '[op_2B14]',
    hash: '4d92ee14...118c',
    payload: 'Task.due = "2026-11-01"',
    badge: 'Branch B'
  },
  'op_9M41': {
    id: 'op_9M41',
    version: 'v5',
    title: '3-Way Join Resolution',
    replica: 'rep_engine',
    replicaLabel: 'Convergence Orchestrator (Lattice Join Engine)',
    lamport: '14840',
    vc: '[A: 8, B: 7]',
    deps: '[op_7Kq2x, op_4D92]',
    hash: '7d20bf01...c914',
    payload: '⋈ Merged Fork: [3C88, 7Kq2x] ⊔ [2B14, 4D92]',
    badge: 'Join Node'
  },
  'op_8V11': {
    id: 'op_8V11',
    version: 'v10',
    title: 'Task.status = "REVIEW"',
    replica: 'rep_02',
    replicaLabel: 'Replica B (Meera / r_meera-ph)',
    lamport: '14950',
    vc: '[A: 9, B: 8]',
    deps: '[op_9M41]',
    hash: '8v11b411...7710',
    payload: 'Task.status = "REVIEW"',
    badge: 'Trunk'
  },
  'op_EE82': {
    id: 'op_EE82',
    version: 'v14',
    title: 'Task.status = "VERIFIED"',
    replica: 'rep_01',
    replicaLabel: 'Replica A (Aarav / r_aarav-lap)',
    lamport: '15024',
    vc: '[A: 11, B: 9]',
    deps: '[op_8V11]',
    hash: 'ee82ff33...902a',
    payload: 'Task.status = "VERIFIED"',
    badge: 'Tip Synchronized'
  }
};

export function VectorTimelinePage() {
  const {
    timelineEpoch,
    setTimelineEpoch,
    selectedOpId,
    setSelectedOpId,
    isPlayingTimeline,
    setIsPlayingTimeline
  } = useSyncStore();

  const [replicaFilter, setReplicaFilter] = useState('ALL'); // 'ALL' | 'REP_A' | 'REP_B'

  // Playback timer loop
  useEffect(() => {
    let interval = null;
    if (isPlayingTimeline) {
      interval = setInterval(() => {
        setTimelineEpoch((timelineEpoch + 1) % 15);
      }, 750);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingTimeline, timelineEpoch, setTimelineEpoch]);

  const currentData = EPOCH_DATA[timelineEpoch] || EPOCH_DATA[14];
  const selectedOp = OP_CATALOG[selectedOpId] || OP_CATALOG['op_7Kq2x'];

  const circumference = 264;
  const offset = circumference - (circumference * (timelineEpoch / 14));

  const handleTrackClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetEpoch = Math.round(ratio * 14);
    setTimelineEpoch(targetEpoch);
    const op = EPOCH_DATA[targetEpoch]?.opId;
    if (op) setSelectedOpId(op);
  };

  const handleSelectOp = (opId) => {
    setSelectedOpId(opId);
  };

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-300">
      {/* 1. EDITORIAL HEADER & ARCHIVAL MASTHEAD */}
      <section className="border-b border-[var(--line)] pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-4xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--copper)] font-bold">
                02 / CAUSAL VECTOR TIMELINE
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--copper)]" />
              <span className="font-newsreader text-sm italic text-[var(--ink-soft)]">
                "every keystroke is an immutable causal coordinate"
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl text-[var(--ink)] tracking-tight leading-tight">
              Deterministic <em className="italic text-[var(--copper)] font-normal">Op-Log</em> &amp; Time-Travel Scrubber
            </h1>
            <p className="font-newsreader text-base sm:text-lg text-[var(--ink-soft)] max-w-3xl">
              Causal graph visualization and historical vector state replayer. Inspect branch points, concurrent forks, and join semilattice resolutions across peer replicas.
            </p>
          </div>

          {/* Quick Session Telemetry Badge */}
          <div className="flex items-center gap-4 bg-[var(--paper-raised)] border border-[var(--border)] px-4 py-2.5 rounded-lg shadow-xs shrink-0 self-start lg:self-end">
            <div className="space-y-0.5">
              <div className="font-mono text-[9px] text-[var(--ink-faint)] uppercase">Current Tip</div>
              <div className="font-mono text-xs font-bold text-[var(--ink)]">LAMPORT #{currentData.lamport}</div>
            </div>
            <div className="w-px h-8 bg-[var(--line)]" />
            <div className="space-y-0.5">
              <div className="font-mono text-[9px] text-[var(--ink-faint)] uppercase">Lattice State</div>
              <div className="font-mono text-xs text-[var(--verdigris)] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--verdigris)] inline-block" />
                {currentData.status}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE SCRUBBER RIBBON & SCIENTIFIC DIAL CONSOLE */}
      <section className="w-full">
        <div className="bg-[var(--paper-raised)] border border-[var(--border)] rounded-xl p-6 shadow-xs space-y-6">
          {/* Top Scrubber Meta & Transport Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[var(--copper)] text-[var(--paper-raised)] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[var(--copper-deep)] transition shadow-xs cursor-pointer active:scale-95"
              >
                {isPlayingTimeline ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlayingTimeline ? 'Pause Stream' : 'Replay Stream'}</span>
              </button>

              <button
                onClick={() => setTimelineEpoch(Math.max(0, timelineEpoch - 1))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--paper)] border border-[var(--border)] text-[var(--ink)] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[var(--paper-sunken)] transition active:scale-95 cursor-pointer"
              >
                <SkipBack className="w-3.5 h-3.5" />
                <span>Step Back</span>
              </button>

              <button
                onClick={() => setTimelineEpoch(Math.min(14, timelineEpoch + 1))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--paper)] border border-[var(--border)] text-[var(--ink)] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[var(--paper-sunken)] transition active:scale-95 cursor-pointer"
              >
                <span>Step Fwd</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setTimelineEpoch(3);
                  setSelectedOpId('op_3C88');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--ochre)]/15 border border-[var(--ochre)]/40 text-[var(--ochre)] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[var(--ochre)]/25 transition cursor-pointer"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Jump to Fork (v3)</span>
              </button>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="font-mono text-[9px] text-[var(--ink-faint)] uppercase">Epoch Register</div>
                <div className="font-mono text-sm font-bold text-[var(--copper)]">OP #{timelineEpoch} / 14</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[9px] text-[var(--ink-faint)] uppercase">Temporal Status</div>
                <div className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded inline-block ${currentData.badgeBg} ${currentData.badgeText}`}>
                  {currentData.status}
                </div>
              </div>
            </div>
          </div>

          {/* Scrubber Ribbon Interactive Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center font-mono text-[10px] text-[var(--ink-faint)] uppercase px-1">
              <span>GENESIS (v0)</span>
              <span className="text-[var(--ochre)] font-bold">CONCURRENT FORK (v3 - v4)</span>
              <span>TIP SYNCHRONIZED (v14)</span>
            </div>

            <div
              className="relative w-full py-4 select-none cursor-pointer group"
              onClick={handleTrackClick}
            >
              {/* Background Axis */}
              <div className="w-full h-3 bg-[var(--paper-sunken)] border border-[var(--border)] rounded-full overflow-hidden relative">
                {/* Fork segment highlight v3-v4 */}
                <div className="absolute left-[21.4%] w-[14.28%] h-full bg-[var(--ochre)]/30" />
                {/* Progress Fill */}
                <div
                  className="h-full bg-[var(--copper)] rounded-full transition-all duration-150"
                  style={{ width: `${(timelineEpoch / 14) * 100}%` }}
                />
              </div>

              {/* Tick Marks (15 steps: 0 through 14) */}
              <div className="absolute inset-x-0 top-1.5 flex justify-between px-1 pointer-events-none">
                {[...Array(15)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div
                      className={`w-0.5 ${
                        i === 0 || i === 14
                          ? 'h-6 bg-[var(--copper)]'
                          : i === 3 || i === 4
                          ? 'h-5 bg-[var(--ochre)]'
                          : i === 5
                          ? 'h-5 bg-[var(--verdigris)]'
                          : 'h-3 bg-[var(--border)]'
                      }`}
                    />
                    <span
                      className={`font-mono text-[8px] mt-1 ${
                        i === timelineEpoch
                          ? 'text-[var(--copper)] font-bold'
                          : i === 3 || i === 4
                          ? 'text-[var(--ochre)] font-semibold'
                          : 'text-[var(--ink-faint)]'
                      }`}
                    >
                      {i}
                    </span>
                  </div>
                ))}
              </div>

              {/* Active Needle Indicator */}
              <div
                className="absolute top-1 -ml-3.5 w-7 h-7 bg-[var(--copper)] text-[var(--paper-raised)] rounded-full shadow-md flex items-center justify-center pointer-events-none transition-all duration-150"
                style={{ left: `${(timelineEpoch / 14) * 100}%` }}
              >
                <Sliders className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Reticle & Secondary Gauge Deck */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* SVG Convergence Dial Reticle */}
            <div className="bg-[var(--paper)] border border-[var(--border)] p-4 rounded-lg flex items-center justify-between shadow-2xs">
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--ink-faint)]">Phase Reticle</span>
                <div className="font-display text-xl text-[var(--ink)]">Tick: {Math.round((timelineEpoch / 14) * 100)}%</div>
                <div className="font-mono text-[10px] text-[var(--verdigris)]">Zero Drift</div>
              </div>
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-[var(--border)]"
                    cx="50"
                    cy="50"
                    fill="none"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="5"
                  />
                  <circle
                    className="text-[var(--copper)] transition-all duration-300"
                    cx="50"
                    cy="50"
                    fill="none"
                    r="42"
                    stroke="currentColor"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    strokeWidth="5"
                  />
                  <line
                    className="text-[var(--ink-faint)]/40"
                    stroke="currentColor"
                    strokeWidth="2"
                    x1="50"
                    x2="50"
                    y1="50"
                    y2="15"
                  />
                  <circle className="text-[var(--copper)]" cx="50" cy="50" fill="currentColor" r="4" />
                </svg>
              </div>
            </div>

            {/* Lattice Property */}
            <div className="bg-[var(--paper)] border border-[var(--border)] p-4 rounded-lg space-y-1 shadow-2xs">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--ink-faint)]">Lattice Property</span>
              <div className="font-display text-xl text-[var(--ink)]">Strong Eventual</div>
              <p className="font-newsreader text-xs text-[var(--ink-soft)] leading-snug">
                Commutative &amp; Associative Join Semilattice Verified
              </p>
            </div>

            {/* Lamport Clock Vector */}
            <div className="bg-[var(--paper)] border border-[var(--border)] p-4 rounded-lg space-y-1 shadow-2xs">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--ink-faint)]">Vector Coordinate</span>
              <div className="font-mono text-base font-bold text-[var(--copper)]">{currentData.vc}</div>
              <p className="font-newsreader text-xs text-[var(--ink-soft)] leading-snug">
                Partially ordered vector clocks in sync
              </p>
            </div>

            {/* Concurrent Delta Count */}
            <div className="bg-[var(--paper)] border border-[var(--border)] p-4 rounded-lg space-y-1 shadow-2xs">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--ink-faint)]">Concurrent Spans</span>
              <div className="font-display text-xl text-[var(--ochre)]">1 Fork Resolved</div>
              <p className="font-newsreader text-xs text-[var(--ink-soft)] leading-snug">
                Merged at op_9M41 without data loss
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CAUSAL DAG VISUALIZER (LEFT) & OPERATION INSPECTOR (RIGHT) */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Causal DAG Visualizer (7 cols) */}
        <div className="xl:col-span-7 bg-[var(--paper-raised)] border border-[var(--border)] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--copper)] font-bold">
                DIRECTED ACYCLIC GRAPH
              </span>
              <h2 className="font-display text-2xl text-[var(--ink)]">Causal Branch Visualizer</h2>
            </div>
            <div className="flex items-center gap-2 text-[var(--ink-soft)] font-mono text-[10px]">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--copper)]" /> Aarav (Rep A)
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--verdigris)] ml-2" /> Meera (Rep B)
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--ochre)] ml-2" /> Fork
            </div>
          </div>

          {/* Graph Canvas Box */}
          <div className="w-full bg-[var(--paper-sunken)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto relative min-h-[300px] flex items-center justify-center">
            <svg className="w-full min-w-[620px] h-60" fill="none" viewBox="0 0 680 240">
              {/* Background Grid Coordinate Ticks */}
              <line className="text-[var(--border)]" stroke="currentColor" strokeDasharray="2 4" x1="40" x2="640" y1="120" y2="120" />

              {/* Shared Ancestor Trunk (v0 -> v1 -> v2) */}
              <line className="text-[var(--ink-faint)]/40" stroke="currentColor" strokeWidth="2.5" x1="70" x2="150" y1="120" y2="120" />
              <line className="text-[var(--ink-faint)]/40" stroke="currentColor" strokeWidth="2.5" x1="150" x2="230" y1="120" y2="120" />

              {/* Branch Divergence Forks from v2 */}
              {/* Up to Branch A (Aarav) */}
              <path className="text-[var(--copper)]/70" d="M 230 120 C 270 120, 270 60, 310 60" stroke="currentColor" strokeWidth="2.5" />
              <line className="text-[var(--copper)]" stroke="currentColor" strokeWidth="2.5" x1="310" x2="390" y1="60" y2="60" />

              {/* Down to Branch B (Meera) */}
              <path className="text-[var(--verdigris)]/70" d="M 230 120 C 270 120, 270 180, 310 180" stroke="currentColor" strokeWidth="2.5" />
              <line className="text-[var(--verdigris)]" stroke="currentColor" strokeWidth="2.5" x1="310" x2="390" y1="180" y2="180" />

              {/* Convergence Re-join Paths to v5 */}
              <path className="text-[var(--ochre)]" d="M 390 60 C 430 60, 430 120, 470 120" stroke="currentColor" strokeDasharray="4 2" strokeWidth="2.5" />
              <path className="text-[var(--ochre)]" d="M 390 180 C 430 180, 430 120, 470 120" stroke="currentColor" strokeDasharray="4 2" strokeWidth="2.5" />

              {/* Post-join Trunk to Tip (v5 -> v10 -> v14) */}
              <line className="text-[var(--verdigris)]" stroke="currentColor" strokeWidth="2.5" x1="470" x2="550" y1="120" y2="120" />
              <line className="text-[var(--copper)]" stroke="currentColor" strokeWidth="2.5" x1="550" x2="630" y1="120" y2="120" />

              {/* v0 Genesis */}
              <g className="cursor-pointer group" onClick={() => handleSelectOp('op_0000')}>
                <circle className={`stroke-[var(--ink)] ${selectedOpId === 'op_0000' ? 'fill-[var(--copper)]' : 'fill-[var(--paper-raised)]'}`} cx="70" cy="120" r="14" strokeWidth="1.5" />
                <text className="font-mono text-[10px] fill-[var(--ink)] font-bold" textAnchor="middle" x="70" y="124">v0</text>
                <text className="font-mono text-[9px] fill-[var(--ink-faint)]" textAnchor="middle" x="70" y="148">Genesis</text>
              </g>

              {/* v1 */}
              <g className="cursor-pointer group" onClick={() => handleSelectOp('op_1A09')}>
                <circle className={`stroke-[var(--ink-soft)] ${selectedOpId === 'op_1A09' ? 'fill-[var(--copper)] text-[var(--paper-raised)]' : 'fill-[var(--paper-raised)]'}`} cx="150" cy="120" r="14" strokeWidth="1.5" />
                <text className="font-mono text-[10px] fill-[var(--ink)]" textAnchor="middle" x="150" y="124">v1</text>
              </g>

              {/* v2 Common Base */}
              <g className="cursor-pointer group" onClick={() => handleSelectOp('op_2F81')}>
                <circle className="fill-[var(--paper-raised)] stroke-[var(--copper)]" cx="230" cy="120" r="16" strokeWidth="2" />
                <text className="font-mono text-[10px] fill-[var(--ink)] font-bold" textAnchor="middle" x="230" y="124">v2</text>
                <text className="font-mono text-[8px] fill-[var(--ink-faint)] uppercase" textAnchor="middle" x="230" y="152">Common Base</text>
              </g>

              {/* Branch A: v3 (3C88) */}
              <g className="cursor-pointer group" onClick={() => handleSelectOp('op_3C88')}>
                <circle className={`stroke-[var(--copper)] ${selectedOpId === 'op_3C88' ? 'fill-[var(--copper)]' : 'fill-[var(--paper-raised)]'}`} cx="310" cy="60" r="15" strokeWidth="2" />
                <text className={`font-mono text-[9px] font-bold ${selectedOpId === 'op_3C88' ? 'fill-[var(--paper-raised)]' : 'fill-[var(--copper)]'}`} textAnchor="middle" x="310" y="64">3C88</text>
                <text className="font-mono text-[8px] fill-[var(--ink-faint)]" textAnchor="middle" x="310" y="38">Aarav (v3)</text>
              </g>

              {/* Branch A: v4 (7Kq2x) - Selected Active */}
              <g className="cursor-pointer group" onClick={() => handleSelectOp('op_7Kq2x')}>
                <circle className="fill-[var(--copper)] stroke-[var(--paper-raised)]" cx="390" cy="60" r="18" strokeWidth="2" />
                {selectedOpId === 'op_7Kq2x' && (
                  <circle className="stroke-[var(--copper)] animate-pulse" cx="390" cy="60" fill="none" r="23" strokeWidth="1.5" />
                )}
                <text className="font-mono text-[9px] fill-[var(--paper-raised)] font-bold" textAnchor="middle" x="390" y="64">7Kq2x</text>
                <text className="font-mono text-[9px] fill-[var(--copper)] font-bold" textAnchor="middle" x="390" y="34">★ SELECTED</text>
              </g>

              {/* Branch B: v3 (2B14) */}
              <g className="cursor-pointer group" onClick={() => handleSelectOp('op_2B14')}>
                <circle className={`stroke-[var(--verdigris)] ${selectedOpId === 'op_2B14' ? 'fill-[var(--verdigris)]' : 'fill-[var(--paper-raised)]'}`} cx="310" cy="180" r="15" strokeWidth="2" />
                <text className={`font-mono text-[9px] font-bold ${selectedOpId === 'op_2B14' ? 'fill-[var(--paper-raised)]' : 'fill-[var(--verdigris)]'}`} textAnchor="middle" x="310" y="184">2B14</text>
                <text className="font-mono text-[8px] fill-[var(--ink-faint)]" textAnchor="middle" x="310" y="208">Meera (v3)</text>
              </g>

              {/* Branch B: v4 (4D92) */}
              <g className="cursor-pointer group" onClick={() => handleSelectOp('op_4D92')}>
                <circle className={`stroke-[var(--verdigris)] ${selectedOpId === 'op_4D92' ? 'fill-[var(--verdigris)]' : 'fill-[var(--paper-raised)]'}`} cx="390" cy="180" r="15" strokeWidth="2" />
                <text className={`font-mono text-[9px] font-bold ${selectedOpId === 'op_4D92' ? 'fill-[var(--paper-raised)]' : 'fill-[var(--verdigris)]'}`} textAnchor="middle" x="390" y="184">4D92</text>
                <text className="font-mono text-[8px] fill-[var(--ink-faint)]" textAnchor="middle" x="390" y="208">Meera (v4)</text>
              </g>

              {/* Join Semilattice Node: v5 (op_9M41) */}
              <g className="cursor-pointer group" onClick={() => handleSelectOp('op_9M41')}>
                <polygon className="fill-[var(--ochre)]/20 stroke-[var(--ochre)]" points="470,104 486,120 470,136 454,120" strokeWidth="2" />
                <text className="font-mono text-[8px] fill-[var(--ochre)] font-bold" textAnchor="middle" x="470" y="123">⋈ v5</text>
                <text className="font-mono text-[8px] fill-[var(--ochre)] uppercase font-bold" textAnchor="middle" x="470" y="152">Lattice Join</text>
              </g>

              {/* Continuation: v10 */}
              <g className="cursor-pointer group" onClick={() => handleSelectOp('op_8V11')}>
                <circle className={`stroke-[var(--verdigris)] ${selectedOpId === 'op_8V11' ? 'fill-[var(--verdigris)]' : 'fill-[var(--paper-raised)]'}`} cx="550" cy="120" r="14" strokeWidth="1.5" />
                <text className="font-mono text-[9px] fill-[var(--verdigris)]" textAnchor="middle" x="550" y="124">v10</text>
              </g>

              {/* Tip: v14 */}
              <g className="cursor-pointer group" onClick={() => handleSelectOp('op_EE82')}>
                <circle className="fill-[var(--verdigris)]/20 stroke-[var(--verdigris)]" cx="630" cy="120" r="16" strokeWidth="2" />
                <text className="font-mono text-[9px] fill-[var(--verdigris)] font-bold" textAnchor="middle" x="630" y="124">v14</text>
                <text className="font-mono text-[8px] fill-[var(--verdigris)] uppercase font-bold" textAnchor="middle" x="630" y="152">Tip</text>
              </g>
            </svg>
          </div>

          {/* Fork Annotation Legend */}
          <div className="p-3 rounded-lg bg-[var(--paper)] border border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-2 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[var(--ochre)] shrink-0" />
              <span className="text-[var(--ink)]">
                Concurrent Fork in epoch [v3, v4] resolved without manual collision handling.
              </span>
            </div>
            <span className="text-[var(--ink-soft)] font-mono text-[10px]">Algorithm: LWW-Register + OR-Set Lattice</span>
          </div>
        </div>

        {/* Right Column: Selected Operation Inspector Card & Clock Matrix (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <div className="bg-[var(--paper-raised)] border border-[var(--border)] rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--copper)] font-bold">
                  OP SPECIFICATION
                </span>
                <h3 className="font-display text-xl text-[var(--ink)]">Selected Op: {selectedOp.id}</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-[var(--copper)]/15 border border-[var(--copper)]/30 text-[var(--copper)] font-mono text-[10px] uppercase font-bold">
                {selectedOp.badge}
              </span>
            </div>

            {/* Spec Data Sheet */}
            <div className="space-y-2 bg-[var(--paper)] border border-[var(--border)] rounded-lg p-4 font-mono text-xs shadow-2xs">
              <div className="flex justify-between py-1 border-b border-[var(--line)]">
                <span className="text-[var(--ink-soft)]">Lamport Timestamp</span>
                <span className="font-bold text-[var(--ink)]">{selectedOp.lamport}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--line)]">
                <span className="text-[var(--ink-soft)]">Vector Clock (VC)</span>
                <span className="font-bold text-[var(--copper)]">{selectedOp.vc}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--line)]">
                <span className="text-[var(--ink-soft)]">Origin Replica</span>
                <span className="font-bold text-[var(--ink)]">{selectedOp.replicaLabel}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--line)]">
                <span className="text-[var(--ink-soft)]">Parent Dependencies</span>
                <span className="font-bold text-[var(--ink)]">{selectedOp.deps}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--line)]">
                <span className="text-[var(--ink-soft)]">Merkle Leaf Digest</span>
                <span className="font-bold text-[var(--ink)] text-[11px]">{selectedOp.hash}</span>
              </div>
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-[var(--ink-faint)] text-[10px] uppercase">Causal Payload Mutation</span>
                <div className="p-2 rounded bg-[var(--paper-sunken)] border border-[var(--border)] font-mono text-xs text-[var(--copper)] font-bold">
                  {selectedOp.payload}
                </div>
              </div>
            </div>

            {/* Vector Clock Matrix Comparison Widget */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="uppercase tracking-wider text-[var(--ink-soft)] font-bold text-[10px]">Vector Matrix Comparison</span>
                <span className="text-[var(--verdigris)] font-bold text-[10px]">Dominated Causally</span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div className="p-3 rounded bg-[var(--paper)] border border-[var(--border)]">
                  <div className="text-[var(--ink-faint)] text-[9px] uppercase">Node A State (Aarav)</div>
                  <div className="font-display text-lg text-[var(--copper)] mt-0.5">VC[A] = 8</div>
                  <div className="text-[9px] text-[var(--ink-soft)] mt-0.5">Local increments: +3</div>
                </div>
                <div className="p-3 rounded bg-[var(--paper)] border border-[var(--border)]">
                  <div className="text-[var(--ink-faint)] text-[9px] uppercase">Node B State (Meera)</div>
                  <div className="font-display text-lg text-[var(--verdigris)] mt-0.5">VC[B] = 6</div>
                  <div className="text-[9px] text-[var(--ink-soft)] mt-0.5">Awaits sync of [{selectedOp.id}]</div>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Context Card with Lattice Certificate */}
          <div className="bg-[var(--paper-raised)] border border-[var(--border)] rounded-xl p-4 shadow-xs flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-[var(--copper)]/10 border border-[var(--copper)]/30 flex items-center justify-center shrink-0">
              <Award className="w-8 h-8 text-[var(--copper)]" />
            </div>
            <div className="space-y-0.5">
              <div className="font-mono text-[9px] uppercase text-[var(--copper)] font-bold">Lattice Certificate</div>
              <div className="font-display text-lg text-[var(--ink)]">Idempotent Join Verified</div>
              <p className="font-newsreader text-xs text-[var(--ink-soft)]">
                Proof hash signed via Ed25519 causal lattice root. No split-brain divergence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LIVE RAW OP-LOG SCRUBBER TABLE */}
      <section className="w-full">
        <div className="bg-[var(--paper-raised)] border border-[var(--border)] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--copper)] font-bold">
                LEDGER LOG
              </span>
              <h2 className="font-display text-2xl text-[var(--ink)]">Immutable Operation Stream</h2>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-[var(--ink-faint)] uppercase text-[10px]">Filter by Replica:</span>
              <button
                onClick={() => setReplicaFilter('ALL')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  replicaFilter === 'ALL'
                    ? 'bg-[var(--copper)] text-[var(--paper-raised)] font-bold'
                    : 'bg-[var(--paper)] border border-[var(--border)] text-[var(--ink)]'
                }`}
              >
                All (10 ops)
              </button>
              <button
                onClick={() => setReplicaFilter('REP_A')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  replicaFilter === 'REP_A'
                    ? 'bg-[var(--copper)] text-[var(--paper-raised)] font-bold'
                    : 'bg-[var(--paper)] border border-[var(--border)] text-[var(--ink)]'
                }`}
              >
                Rep A
              </button>
              <button
                onClick={() => setReplicaFilter('REP_B')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  replicaFilter === 'REP_B'
                    ? 'bg-[var(--copper)] text-[var(--paper-raised)] font-bold'
                    : 'bg-[var(--paper)] border border-[var(--border)] text-[var(--ink)]'
                }`}
              >
                Rep B
              </button>
            </div>
          </div>

          {/* Raw Stream Ledger Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--paper)] border-b border-[var(--line)] text-[var(--ink-faint)] uppercase text-[10px]">
                  <th className="py-2.5 px-3">Epoch</th>
                  <th className="py-2.5 px-3">Op Hash</th>
                  <th className="py-2.5 px-3">Replica</th>
                  <th className="py-2.5 px-3">Lamport</th>
                  <th className="py-2.5 px-3">Vector Clocks</th>
                  <th className="py-2.5 px-3">CRDT Mutation Diff</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {Object.values(OP_CATALOG)
                  .reverse()
                  .filter((op) => {
                    if (replicaFilter === 'REP_A') return op.replica === 'rep_01';
                    if (replicaFilter === 'REP_B') return op.replica === 'rep_02';
                    return true;
                  })
                  .map((op) => {
                    const isSelected = selectedOpId === op.id;
                    return (
                      <tr
                        key={op.id}
                        onClick={() => handleSelectOp(op.id)}
                        className={`hover:bg-[var(--paper)] transition-colors cursor-pointer ${
                          isSelected ? 'bg-[var(--copper)]/10 font-bold' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-[var(--ink)]">{op.version}</td>
                        <td className="py-2.5 px-3 text-[var(--copper)] font-bold">{op.id}</td>
                        <td className="py-2.5 px-3 text-[var(--ink)]">{op.replicaLabel.split(' ')[0]} {op.replicaLabel.split(' ')[1]}</td>
                        <td className="py-2.5 px-3 text-[var(--ink-soft)]">{op.lamport}</td>
                        <td className="py-2.5 px-3 text-[var(--copper)]">{op.vc}</td>
                        <td className="py-2.5 px-3 text-[var(--ink)]">{op.payload}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                              op.version === 'v14'
                                ? 'bg-[var(--verdigris)]/20 text-[var(--verdigris)]'
                                : op.badge === 'Join Node'
                                ? 'bg-[var(--ochre)]/20 text-[var(--ochre)]'
                                : op.badge.includes('Branch')
                                ? 'bg-[var(--ochre)]/20 text-[var(--ochre)]'
                                : 'bg-[var(--paper)] border border-[var(--border)] text-[var(--ink-soft)]'
                            }`}
                          >
                            {op.badge}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
