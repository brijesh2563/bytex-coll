import { useSyncStore } from '../../store/useSyncStore';

export function PageCurtain() {
  const { activePage } = useSyncStore();

  return (
    <div
      key={activePage}
      className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      {/* Copper Calibration Sweep Curtain (550-750ms, calibrated at 650ms) */}
      <div className="absolute inset-0 bg-[var(--copper)]/90 backdrop-blur-xs curtain-active flex flex-col items-center justify-center">
        {/* Leading Precision Copper Calibration Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--copper-deep)] shadow-sm" />

        {/* Optical Alignment Instrument Ring Pulse */}
        <div className="flex flex-col items-center gap-2.5 text-[var(--paper-raised)] font-mono text-xs uppercase tracking-widest opacity-95">
          <div className="relative w-14 h-14 flex items-center justify-center">
            {/* Outer Vernier Calibration Ticks */}
            <svg className="w-14 h-14 animate-spin" viewBox="0 0 100 100" style={{ animationDuration: '4s' }}>
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 6"
                opacity="0.6"
              />
              <circle
                cx="50"
                cy="50"
                r="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray="18 10"
              />
            </svg>
            {/* Center Registration Core */}
            <div className="absolute w-2.5 h-2.5 rounded-full bg-[var(--paper-raised)] shadow-xs" />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] tracking-wider font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--paper-raised)] animate-ping" />
            <span>COPPER CALIBRATION CURTAIN · SYNCHRONIZING</span>
          </div>
        </div>

        {/* Trailing Precision Copper Calibration Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--copper-deep)] shadow-sm" />
      </div>
    </div>
  );
}
