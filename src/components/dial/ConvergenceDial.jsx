import { useMemo } from 'react';
import { useSyncStore } from '../../store/useSyncStore';
import { useScramble } from '../../motion/hooks';

/**
 * @param {Object} props
 * @param {number} [props.size=320] - Scalable size in pixels (120 - 520px)
 * @param {string} [props.className='']
 */
export function ConvergenceDial({ size = 320, className = '' }) {
  const {
    dialState,
    driftOps,
    replicaA,
    replicaB,
    stateHash,
    isHashMatching,
    failingInvariant,
  } = useSyncStore();

  const isScrambling = dialState === 'CONVERGING' || dialState === 'LOCKED';
  const displayedHash = useScramble(stateHash, isScrambling, 600);

  // Compute 60 ticks around r=92
  const ticks = useMemo(() => {
    const list = [];
    for (let i = 0; i < 60; i++) {
      const angleDeg = i * 6;
      const angleRad = ((angleDeg - 90) * Math.PI) / 180;
      const isMajor = i % 5 === 0;
      const rOuter = 92;
      const rInner = isMajor ? 85 : 88.5;

      const x1 = 100 + rInner * Math.cos(angleRad);
      const y1 = 100 + rInner * Math.sin(angleRad);
      const x2 = 100 + rOuter * Math.cos(angleRad);
      const y2 = 100 + rOuter * Math.sin(angleRad);

      // Check if tick falls into conflict sector (e.g. angle between 45 and 105 degrees)
      const inConflictSector = angleDeg >= 45 && angleDeg <= 105;

      list.push({
        id: i,
        x1,
        y1,
        x2,
        y2,
        isMajor,
        angleDeg,
        inConflictSector,
      });
    }
    return list;
  }, []);

  // Arc calculations
  // Circumferences:
  const c70 = 2 * Math.PI * 70; // ~439.82
  const c92 = 2 * Math.PI * 92; // ~578.05

  // Arc sweeps based on dialState:
  // Base sweep: 240 degrees
  const arcLengthA = (240 / 360) * c70;
  let arcLengthB = (240 / 360) * c92;
  let rotationA = -120;
  let rotationB = -120;

  if (dialState === 'DIVERGING') {
    // Arc B drifts ahead proportional to driftOps
    rotationB = -120 + driftOps * 18;
  } else if (dialState === 'CONFLICT') {
    rotationB = -120 + 40;
  } else if (dialState === 'CONVERGING') {
    rotationA = -120;
    rotationB = -120;
  } else if (dialState === 'LOCKED' || dialState === 'SYNCED') {
    rotationA = -120;
    rotationB = -120;
  }

  // Needle angle:
  let needleAngle = 0;
  if (dialState === 'DIVERGING') needleAngle = driftOps * 14;
  else if (dialState === 'CONFLICT') needleAngle = 35;
  else if (dialState === 'CONVERGING') needleAngle = 8;
  else if (dialState === 'LOCKED' || dialState === 'SYNCED') needleAngle = 0;

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${className}`}
      style={{ width: size }}
    >
      <div className="relative" style={{ width: size, height: size, overflow: 'hidden', borderRadius: '50%' }}>
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          role="img"
          aria-label={`Convergence Instrument Dial in state ${dialState}. Replica A version ${replicaA.version}, Replica B version ${replicaB.version}`}
        >
          {/* DEFINITIONS FOR ANIMATIONS & FILTERS */}
          <defs>
            <style>{`
              @keyframes hubBreathe {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.15); }
              }
              @keyframes conflictVibrate {
                0%, 100% { transform: translate(0, 0); }
                20% { transform: translate(-0.6px, 0.4px); }
                40% { transform: translate(0.6px, -0.4px); }
                60% { transform: translate(-0.4px, -0.6px); }
                80% { transform: translate(0.4px, 0.6px); }
              }
              @keyframes rippleExpand {
                0% { r: 48px; opacity: 0.5; }
                100% { r: 96px; opacity: 0; }
              }
              .dial-hub-breathe {
                animation: hubBreathe 3s ease-in-out infinite;
                transform-origin: 100px 100px;
              }
              .dial-vibrate {
                animation: conflictVibrate 90ms ease-in-out 6;
                transform-origin: 100px 100px;
              }
              .dial-ripple {
                animation: rippleExpand 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
              }
            `}</style>
          </defs>

          {/* 1. THREE CONCENTRIC RINGS */}
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke="var(--dial-ring)"
            strokeWidth="0.8"
            opacity="0.8"
          />
          <circle
            cx="100"
            cy="100"
            r="70"
            fill="none"
            stroke="var(--dial-ring)"
            strokeWidth="0.8"
            opacity="0.8"
          />
          <circle
            cx="100"
            cy="100"
            r="48"
            fill="none"
            stroke="var(--dial-ring)"
            strokeWidth="0.8"
            opacity="0.8"
          />

          {/* CONVERGING RIPPLE RING */}
          {dialState === 'CONVERGING' && (
            <circle
              cx="100"
              cy="100"
              r="48"
              fill="none"
              stroke="var(--verdigris)"
              strokeWidth="1.2"
              className="dial-ripple"
            />
          )}

          {/* 2. 60 ENGRAVED TICKS ON r=92 */}
          <g id="dial-ticks">
            {ticks.map((t) => {
              let tickColor = 'var(--tick)';
              if (dialState === 'CONFLICT' && t.inConflictSector) {
                tickColor = 'var(--ochre)';
              } else if (dialState === 'CONVERGING' || dialState === 'LOCKED') {
                tickColor = isHashMatching ? 'var(--verdigris)' : 'var(--rust)';
              }

              return (
                <line
                  key={t.id}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={tickColor}
                  strokeWidth={t.isMajor ? 1.2 : 0.75}
                  strokeLinecap="round"
                  className="transition-colors duration-300"
                />
              );
            })}
          </g>

          {/* 3. ARC A (REPLICA A) - INK 2.5px on r=70 */}
          <circle
            cx="100"
            cy="100"
            r="70"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${arcLengthA} ${c70}`}
            transform={`rotate(${rotationA} 100 100)`}
            className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          />

          {/* 4. ARC B (REPLICA B) - COPPER 2.5px on r=92 */}
          <g className={dialState === 'CONFLICT' ? 'dial-vibrate' : ''}>
            <circle
              cx="100"
              cy="100"
              r="92"
              fill="none"
              stroke="var(--copper)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${arcLengthB} ${c92}`}
              transform={`rotate(${rotationB} 100 100)`}
              className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            />

            {/* CONFLICT OVERLAY ARC SEGMENT */}
            {dialState === 'CONFLICT' && (
              <circle
                cx="100"
                cy="100"
                r="92"
                fill="none"
                stroke="var(--ochre)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeDasharray={`${(55 / 360) * c92} ${c92}`}
                transform={`rotate(${-45} 100 100)`}
              />
            )}
          </g>

          {/* 5. NEEDLE & HUB */}
          <g
            id="dial-needle"
            transform={`rotate(${needleAngle} 100 100)`}
            className="transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          >
            {/* Needle Line */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="34"
              stroke="var(--ink)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            {/* Needle Tip Indicator */}
            <polygon points="98.8,38 101.2,38 100,31" fill="var(--copper)" />
          </g>

          {/* Central Hub: Copper circle r=5 */}
          <circle
            cx="100"
            cy="100"
            r="5"
            fill="var(--copper)"
            stroke="var(--paper-raised)"
            strokeWidth="1"
            className={dialState === 'SYNCED' ? 'dial-hub-breathe' : ''}
          />
          <circle cx="100" cy="100" r="1.5" fill="var(--ink)" />

          {/* Cardinal Labels */}
          <text
            x="100"
            y="24"
            textAnchor="middle"
            fill="var(--ink-faint)"
            className="font-mono text-[7px] tracking-widest uppercase font-semibold"
          >
            0°
          </text>
        </svg>

        {/* LOCKED CONVERGED STAMP */}
        {dialState === 'LOCKED' && isHashMatching && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              animation: 'stampThud 220ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
          >
            <div className="border-2 border-[var(--verdigris)] text-[var(--verdigris)] px-2.5 py-0.5 rounded-[4px] font-mono text-[12px] font-bold tracking-[0.15em] uppercase -rotate-3 bg-[var(--paper-raised)]/90 shadow-xs">
              ✓ CONVERGED
            </div>
          </div>
        )}

        {/* DIVERGED STAMP */}
        {dialState === 'LOCKED' && !isHashMatching && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-[var(--rust)] text-[var(--rust)] px-2.5 py-0.5 rounded-[4px] font-mono text-[12px] font-bold tracking-[0.15em] uppercase rotate-2 bg-[var(--paper-raised)]/90 shadow-xs">
              ⚠ DIVERGED
            </div>
          </div>
        )}
      </div>

      {/* PRECISION MONO READOUT */}
      <div className="mt-4 flex flex-col items-center gap-1 text-center w-full">
        <div className="flex items-center justify-center gap-3 font-mono text-[11px] text-[var(--ink-soft)] uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink)]" />
            A: v{replicaA.version}
          </span>
          <span className="text-[var(--border)]">|</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--copper)]" />
            B: v{replicaB.version}
          </span>
          <span className="text-[var(--border)]">|</span>
          <span className="font-semibold text-[var(--ink)]">
            HASH {displayedHash.slice(0, 4)}…{displayedHash.slice(-2)}
          </span>
        </div>

        {/* DIVERGENCE / DRIFT / CONFLICT ALERT BANNER */}
        {dialState === 'DIVERGING' && (
          <div className="mt-1 font-mono text-[11px] text-[var(--ochre)] font-semibold tracking-wider animate-pulse">
            DRIFT +{driftOps} OPS (AHEAD)
          </div>
        )}

        {dialState === 'CONFLICT' && (
          <div className="mt-1 font-mono text-[11px] text-[var(--ochre)] font-semibold tracking-wider">
            ⚡ SEMANTIC CONFLICT DETECTED
          </div>
        )}

        {failingInvariant && dialState === 'CONFLICT' && (
          <div className="mt-0.5 text-xs text-[var(--rust)] font-sans italic max-w-[280px]">
            &ldquo;{failingInvariant}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
