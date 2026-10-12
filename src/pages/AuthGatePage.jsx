import { useSyncStore } from '../store/useSyncStore';
import { ScrambleText } from '../components/ui/ScrambleText';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  LogIn,
  Sparkles
} from 'lucide-react';

export function AuthGatePage() {
  const { setActivePage, login } = useSyncStore();

  const handleGuestEntry = () => {
    login({
      id: 'op_guest',
      name: 'Guest Observer',
      email: 'guest@nexussync.org',
      role: 'PEER OPERATOR',
      replicaId: 'r_guest-obs',
      region: 'guest-sandbox (Ephemeral)',
      isAdmin: false,
      accessLevel: 'OBSERVER',
      authMode: 'LOCAL / DEMO',
      sessionType: 'GUEST OPERATOR',
      ed25519Fingerprint: '00A1·F82D·1149·0B2C',
    });
    setActivePage('observatory');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] py-6 sm:py-10 w-full animate-mech-fade">
      <div className="max-w-4xl w-full space-y-8">
        {/* 1. OBSERVATORY SUBSTRATE MASTHEAD (Sequence 0-800ms) */}
        <div className="text-center space-y-3 relative">
          {/* Astrolabe Optical Reticle */}
          <div className="inline-flex items-center justify-center relative w-16 h-16 rounded-full bg-[var(--paper-raised)] border border-[var(--border)] shadow-xs mb-1 animate-mech-rise delay-mech-2">
            <svg className="w-14 h-14 animate-spin text-[var(--copper)]" viewBox="0 0 100 100" style={{ animationDuration: '12s' }}>
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 6"
                opacity="0.4"
              />
              <circle
                cx="50"
                cy="50"
                r="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="18 12"
              />
            </svg>
            <Compass className="w-6 h-6 text-[var(--copper)] absolute animate-mech-needle delay-mech-4" />
          </div>

          <div className="flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[var(--copper)] font-bold animate-mech-rise-sm delay-mech-3">
            <span>OPERATOR ACCESS GATE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--copper)]" />
            <ScrambleText text="TIER-0 ENCLAVE PROTOCOL" />
          </div>

          <h1 className="font-display text-4xl sm:text-5xl text-[var(--ink)] tracking-tight animate-mech-rise delay-mech-5">
            Nexus<span className="italic text-[var(--copper)]">Sync</span> Access Instrument
          </h1>

          <p className="font-newsreader text-base text-[var(--ink-soft)] max-w-xl mx-auto leading-relaxed animate-mech-rise delay-mech-6">
            Engrave identity coordinates into the local causal semilattice. Select an entry aperture to calibrate your replica journal.
          </p>

          {/* Copper Calibration Line Drawing Across Header */}
          <div className="w-32 h-0.5 bg-[var(--copper)] mx-auto animate-mech-line delay-mech-4" />
        </div>

        {/* 2. DUAL APERTURE ACCESS SLATES (Sequence 1300-2450ms) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {/* APERTURE 01: NEW OPERATOR (SIGN UP) */}
          <div className="bg-[var(--paper-raised)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-[var(--copper)] transition-all duration-300 shadow-xs animate-mech-rise delay-mech-7">
            {/* Engineering Registration Crosses */}
            <div className="absolute top-3 left-3 text-[var(--border)] font-mono text-xs select-none">+</div>
            <div className="absolute top-3 right-3 text-[var(--border)] font-mono text-xs select-none">+</div>
            <div className="absolute bottom-3 left-3 text-[var(--border)] font-mono text-xs select-none">+</div>
            <div className="absolute bottom-3 right-3 text-[var(--border)] font-mono text-xs select-none">+</div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--copper)] font-bold">
                  APERTURE I // NOVICE REGISTRATION
                </span>
                <span className="px-2 py-0.5 rounded bg-[var(--copper)]/10 text-[var(--copper)] font-mono text-[9px] font-bold uppercase">
                  FRESH VECTOR
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--paper)] border border-[var(--border)] flex items-center justify-center text-[var(--copper)] group-hover:scale-105 transition-transform">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-mono text-xs text-[var(--ink-faint)] uppercase tracking-wider">
                    NEW OPERATOR
                  </div>
                  <h2 className="font-display text-2xl text-[var(--ink)]">
                    Create Your Account
                  </h2>
                </div>
              </div>

              <p className="font-newsreader text-sm text-[var(--ink-soft)] leading-relaxed">
                Derive a fresh local deterministic Ed25519 identity vector, initialize your unique replica partition in IndexedDB, and join the asynchronous quorum.
              </p>

              {/* Truthful Telemetry Strip */}
              <div className="p-3 rounded-lg bg-[var(--paper)] border border-[var(--line)] font-mono text-[10px] space-y-1">
                <div className="flex justify-between text-[var(--ink-faint)]">
                  <span>SESSION TYPE:</span>
                  <span className="font-bold text-[var(--ink)]">LOCAL OPERATOR</span>
                </div>
                <div className="flex justify-between text-[var(--ink-faint)]">
                  <span>ACCESS MODE:</span>
                  <span className="text-[var(--verdigris)] font-bold">LOCAL / DEMO ENCLAVE</span>
                </div>
                <div className="flex justify-between text-[var(--ink-faint)]">
                  <span>STORAGE:</span>
                  <span className="text-[var(--ink)] font-mono">INDEXEDDB PARTITION</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => setActivePage('signup')}
                className="w-full py-3 px-4 rounded-xl bg-[var(--copper)] hover:bg-[var(--copper-deep)] text-[var(--paper-raised)] font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm flex items-center justify-center gap-2 group-hover:translate-y-[-1px] cursor-pointer"
              >
                <span>CREATE ACCOUNT</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* APERTURE 02: RETURNING OPERATOR (SIGN IN) */}
          <div className="bg-[var(--paper-raised)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-[var(--verdigris)] transition-all duration-300 shadow-xs animate-mech-rise delay-mech-8">
            {/* Engineering Registration Crosses */}
            <div className="absolute top-3 left-3 text-[var(--border)] font-mono text-xs select-none">+</div>
            <div className="absolute top-3 right-3 text-[var(--border)] font-mono text-xs select-none">+</div>
            <div className="absolute bottom-3 left-3 text-[var(--border)] font-mono text-xs select-none">+</div>
            <div className="absolute bottom-3 right-3 text-[var(--border)] font-mono text-xs select-none">+</div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--verdigris)] font-bold">
                  APERTURE II // RETURNING QUORUM
                </span>
                <span className="px-2 py-0.5 rounded bg-[var(--verdigris)]/10 text-[var(--verdigris)] font-mono text-[9px] font-bold uppercase">
                  EXISTING KEY
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--paper)] border border-[var(--border)] flex items-center justify-center text-[var(--verdigris)] group-hover:scale-105 transition-transform">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-mono text-xs text-[var(--ink-faint)] uppercase tracking-wider">
                    RETURNING OPERATOR
                  </div>
                  <h2 className="font-display text-2xl text-[var(--ink)]">
                    Already Registered?
                  </h2>
                </div>
              </div>

              <p className="font-newsreader text-sm text-[var(--ink-soft)] leading-relaxed">
                Re-authenticate your existing operator session or select pre-configured station profiles (Aarav, Meera, Dr. Vogel) to access the cluster.
              </p>

              {/* Truthful Telemetry Strip */}
              <div className="p-3 rounded-lg bg-[var(--paper)] border border-[var(--line)] font-mono text-[10px] space-y-1">
                <div className="flex justify-between text-[var(--ink-faint)]">
                  <span>STATION PROFILES:</span>
                  <span className="font-bold text-[var(--ink)]">CHIEF &amp; PEER OPERATORS</span>
                </div>
                <div className="flex justify-between text-[var(--ink-faint)]">
                  <span>CIPHER RING:</span>
                  <span className="text-[var(--copper)] font-bold">ED25519 DERIVATION</span>
                </div>
                <div className="flex justify-between text-[var(--ink-faint)]">
                  <span>STATE RECOVERY:</span>
                  <span className="text-[var(--verdigris)] font-mono">AUTOMATIC SYNC</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => setActivePage('login')}
                className="w-full py-3 px-4 rounded-xl bg-[var(--paper)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--ink)] font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-xs flex items-center justify-center gap-2 group-hover:translate-y-[-1px] cursor-pointer"
              >
                <span>SIGN IN</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-[var(--verdigris)]" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. AUXILIARY GUEST EVALUATION & ADAPTER DISCLAIMER */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[var(--ink-faint)] border-t border-[var(--line)] animate-mech-rise delay-mech-9">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--verdigris)]" />
            <span className="text-[11px]">
              DEMO AUTH ADAPTER · PASSWORDS NOT STORED IN PERSISTENCE
            </span>
          </div>

          <button
            type="button"
            onClick={handleGuestEntry}
            className="flex items-center gap-1.5 text-[var(--copper)] hover:text-[var(--copper-deep)] hover:underline cursor-pointer text-[11px] font-bold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Continue as Guest Observer (Read-Only)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
