import { useState, useEffect, useRef } from 'react';

/**
 * AuthConvergenceInstrument
 * 
 * Lightweight custom 3D Convergence Instrument for NexusSync.
 * Communicates:
 *   Copy A (Ring A) \
 *                    DIFFERENT STATES -> SYNCHRONIZATION -> ALIGNMENT -> CONSISTENCY (Lock)
 *   Copy B (Ring B) /
 * 
 * Built strictly with:
 * - Pure SVG & CSS perspective
 * - transform-style: preserve-3d
 * - translateZ, rotateX, rotateY, opacity
 * - SVG stroke animations
 * - Coordinated 2.4s–2.8s entrance sequence
 * - Calm resting state with ultra-subtle idle breathing (1-2px depth)
 * - Micro-pointer response (~1deg max) on desktop fine-pointer devices
 * - Respects prefers-reduced-motion (disables 3D motion)
 * - Zero WebGL / Three.js / external animation libraries
 */
export function AuthConvergenceInstrument({ className = '' }) {
  const containerRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const [isPointerFine, setIsPointerFine] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(pointer: fine)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointerQuery = window.matchMedia('(pointer: fine)');

    const handleMotionChange = (e) => setPrefersReducedMotion(e.matches);
    const handlePointerChange = (e) => setIsPointerFine(e.matches);

    motionQuery.addEventListener('change', handleMotionChange);
    pointerQuery.addEventListener('change', handlePointerChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      pointerQuery.removeEventListener('change', handlePointerChange);
    };
  }, []);

  const handlePointerMove = (e) => {
    if (prefersReducedMotion || !isPointerFine || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

    // Restrained max ~1° rotation and 2px depth
    setTilt({
      x: -y * 1.2,
      y: x * 1.2,
    });
  };

  const handlePointerLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative w-full aspect-square max-w-[280px] sm:max-w-[320px] lg:max-w-[340px] mx-auto select-none flex items-center justify-center ${className}`}
      style={{
        perspective: '1000px',
      }}
      aria-hidden="true"
    >
      <style>{`
        /* Coordinated 3D Convergence Opening Sequence (2.4s - 2.8s) */
        @keyframes ringAEntrance {
          0% {
            opacity: 0;
            transform: rotateX(24deg) rotateY(-22deg) translateZ(-32px) scale(0.92);
          }
          15% {
            opacity: 0.2;
          }
          35% {
            opacity: 0.95;
            transform: rotateX(18deg) rotateY(-16deg) translateZ(-26px) scale(0.96);
          }
          65% {
            transform: rotateX(4deg) rotateY(-3deg) translateZ(-6px) scale(0.99);
          }
          85% {
            transform: rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1);
          }
          100% {
            opacity: 1;
            transform: rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1);
          }
        }

        @keyframes ringBEntrance {
          0% {
            opacity: 0;
            transform: rotateX(-20deg) rotateY(24deg) translateZ(28px) scale(1.06);
          }
          15% {
            opacity: 0.2;
          }
          35% {
            opacity: 0.95;
            transform: rotateX(-15deg) rotateY(18deg) translateZ(20px) scale(1.03);
          }
          65% {
            transform: rotateX(-3deg) rotateY(4deg) translateZ(5px) scale(1.01);
          }
          85% {
            transform: rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1);
          }
          100% {
            opacity: 1;
            transform: rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1);
          }
        }

        @keyframes coreEntrance {
          0% {
            opacity: 0;
            transform: scale(0.7) translateZ(-15px);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.85) translateZ(-5px);
          }
          75% {
            opacity: 1;
            transform: scale(1.08) translateZ(8px);
          }
          88% {
            transform: scale(0.98) translateZ(0px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateZ(0px);
          }
        }

        @keyframes signalPulse {
          0%, 65% {
            opacity: 0;
            transform: scale(0.6);
          }
          75% {
            opacity: 0.85;
            transform: scale(0.95);
          }
          88% {
            opacity: 0.4;
            transform: scale(1.15);
          }
          100% {
            opacity: 0;
            transform: scale(1.3);
          }
        }

        @keyframes idleDepthBreathing {
          0%, 100% {
            transform: translateZ(0px);
          }
          50% {
            transform: translateZ(2px);
          }
        }

        .convergence-ring-a {
          animation: ringAEntrance 2.6s cubic-bezier(0.2, 0.8, 0.25, 1) forwards;
        }

        .convergence-ring-b {
          animation: ringBEntrance 2.6s cubic-bezier(0.2, 0.8, 0.25, 1) forwards;
        }

        .convergence-core {
          animation: coreEntrance 2.6s cubic-bezier(0.2, 0.8, 0.25, 1) forwards;
        }

        .convergence-signal {
          animation: signalPulse 2.6s cubic-bezier(0.2, 0.8, 0.25, 1) forwards;
        }

        .convergence-idle-wrap {
          animation: idleDepthBreathing 7s ease-in-out infinite 2.8s;
        }

        @media (prefers-reduced-motion: reduce) {
          .convergence-ring-a,
          .convergence-ring-b,
          .convergence-core,
          .convergence-signal,
          .convergence-idle-wrap {
            animation: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      {/* 3D Preserved Layer Hierarchy */}
      <div
        className="w-full h-full relative flex items-center justify-center convergence-idle-wrap transition-transform duration-300 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: prefersReducedMotion
            ? 'none'
            : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        {/* Ambient Depth Bed Plate */}
        <div
          className="absolute inset-2 sm:inset-4 rounded-full border border-[#DCE5E1] bg-radial from-[#E4F1EF]/40 via-transparent to-transparent pointer-events-none"
          style={{ transform: 'translateZ(-20px)' }}
        />

        {/* ============================================================ */}
        {/* RING A: Workspace State A (Starts back, calibrates forward) */}
        {/* ============================================================ */}
        <svg
          viewBox="0 0 280 280"
          className="absolute inset-0 w-full h-full convergence-ring-a pointer-events-none"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Outer primary track */}
          <circle
            cx="140"
            cy="140"
            r="112"
            fill="none"
            stroke="#176D70"
            strokeWidth="1.25"
            strokeDasharray="4 8"
            opacity="0.45"
          />

          {/* Precision calibration tick ring */}
          <circle
            cx="140"
            cy="140"
            r="98"
            fill="none"
            stroke="#176D70"
            strokeWidth="1.75"
            strokeDasharray="28 6 12 6"
            opacity="0.8"
          />

          {/* State A Causal Node Anchors */}
          <g>
            <circle cx="140" cy="42" r="3.5" fill="#176D70" />
            <circle cx="140" cy="42" r="7" fill="none" stroke="#176D70" strokeWidth="1" opacity="0.4" />
            <circle cx="238" cy="140" r="3" fill="#176D70" opacity="0.75" />
            <circle cx="140" cy="238" r="3" fill="#176D70" opacity="0.75" />
            <circle cx="42" cy="140" r="3" fill="#176D70" opacity="0.75" />
          </g>

          {/* Coordinate Guide Arcs */}
          <path
            d="M 58 140 A 82 82 0 0 1 140 58"
            fill="none"
            stroke="#176D70"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.9"
          />
          <path
            d="M 222 140 A 82 82 0 0 1 140 222"
            fill="none"
            stroke="#176D70"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.9"
          />
        </svg>

        {/* ============================================================ */}
        {/* RING B: Workspace State B (Starts forward, calibrates backward) */}
        {/* ============================================================ */}
        <svg
          viewBox="0 0 280 280"
          className="absolute inset-0 w-full h-full convergence-ring-b pointer-events-none"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* State B Harmonic Secondary Track */}
          <circle
            cx="140"
            cy="140"
            r="82"
            fill="none"
            stroke="#697775"
            strokeWidth="1"
            strokeDasharray="2 4"
            opacity="0.55"
          />

          {/* Complementary Quadrant Arc Guides */}
          <path
            d="M 140 76 A 64 64 0 0 1 204 140"
            fill="none"
            stroke="#176D70"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M 140 204 A 64 64 0 0 1 76 140"
            fill="none"
            stroke="#176D70"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* State B Vector Nodes */}
          <g>
            <circle cx="204" cy="140" r="3" fill="#176D70" />
            <circle cx="76" cy="140" r="3" fill="#176D70" />
            <circle cx="140" cy="76" r="2.5" fill="#697775" opacity="0.6" />
            <circle cx="140" cy="204" r="2.5" fill="#697775" opacity="0.6" />
          </g>

          {/* Subtly offset angle ticks */}
          <line x1="140" y1="68" x2="140" y2="76" stroke="#176D70" strokeWidth="1.5" />
          <line x1="140" y1="204" x2="140" y2="212" stroke="#176D70" strokeWidth="1.5" />
          <line x1="68" y1="140" x2="76" y2="140" stroke="#176D70" strokeWidth="1.5" />
          <line x1="204" y1="140" x2="212" y2="140" stroke="#176D70" strokeWidth="1.5" />
        </svg>

        {/* ============================================================ */}
        {/* SIGNAL WAVE: Restrained Deep Teal Pulse on Lock Agreement */}
        {/* ============================================================ */}
        <div
          className="absolute w-44 h-44 rounded-full border border-[#176D70] convergence-signal pointer-events-none"
          style={{ transformStyle: 'preserve-3d' }}
        />

        {/* ============================================================ */}
        {/* CENTER CORE: Agreement & Convergence Hub */}
        {/* ============================================================ */}
        <div
          className="relative w-28 h-28 rounded-full bg-[#FFFFFF] border-2 border-[#176D70] shadow-sm flex items-center justify-center convergence-core pointer-events-none"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Fine concentric calibration rim */}
          <div className="absolute inset-1.5 rounded-full border border-[#DCE5E1] bg-[#F0F4F2]/50 flex items-center justify-center">
            {/* Center Alignment Crosshairs */}
            <div className="absolute w-full h-[1px] bg-[#DCE5E1]" />
            <div className="absolute h-full w-[1px] bg-[#DCE5E1]" />

            {/* Core Central Jewel */}
            <div className="relative w-8 h-8 rounded-full bg-[#176D70] flex items-center justify-center shadow-xs">
              {/* Inner Pearl Core */}
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFFFFF]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
