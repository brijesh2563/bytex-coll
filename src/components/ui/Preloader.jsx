import { useState, useEffect, useCallback } from 'react';

/**
 * Observatory Instrument Preloader.
 * Rings draw, ticks fade clockwise, wordmark masked rise, vertical wipe with copper edge.
 * Runs in < 1.6s, once per session, skippable.
 * @param {Object} props
 * @param {() => void} [props.onComplete]
 */
export function Preloader({ onComplete }) {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !sessionStorage.getItem('nexussync_preloader_seen');
  });
  const [wiping, setWiping] = useState(false);

  useEffect(() => {
    if (!visible) {
      onComplete?.();
      return;
    }

    const wipeTimer = setTimeout(() => {
      setWiping(true);
    }, 1100);

    const endTimer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('nexussync_preloader_seen', 'true');
      onComplete?.();
    }, 1550);

    return () => {
      clearTimeout(wipeTimer);
      clearTimeout(endTimer);
    };
  }, [visible, onComplete]);

  const handleSkip = useCallback(() => {
    setWiping(true);
    setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('nexussync_preloader_seen', 'true');
      onComplete?.();
    }, 200);
  }, [onComplete]);

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, handleSkip]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-99999 flex flex-col items-center justify-center bg-[var(--paper)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] select-none ${
        wiping ? '-translate-y-full' : 'translate-y-0'
      }`}
      style={{
        borderBottom: wiping ? '3px solid var(--copper)' : 'none',
      }}
    >
      {/* Precision Instrument Calibrating Graphic */}
      <div className="relative flex flex-col items-center">
        <svg
          viewBox="0 0 100 100"
          className="w-24 h-24 mb-6"
          role="img"
          aria-label="Calibrating Instrument"
        >
          {/* Calibrating Rings with Stroke Dasharray */}
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="var(--dial-ring)"
            strokeWidth="1"
            strokeDasharray="276"
            strokeDashoffset="0"
            className="animate-spin"
            style={{ animationDuration: '4s' }}
          />
          <circle
            cx="50"
            cy="50"
            r="32"
            fill="none"
            stroke="var(--line)"
            strokeWidth="0.8"
          />
          <circle
            cx="50"
            cy="50"
            r="20"
            fill="none"
            stroke="var(--copper)"
            strokeWidth="1.5"
            strokeDasharray="125"
            strokeDashoffset="30"
          />
          {/* Center Needle Dot */}
          <circle cx="50" cy="50" r="3" fill="var(--copper)" />
        </svg>

        {/* Wordmark Masked Rise */}
        <div className="overflow-hidden">
          <div className="font-display text-3xl sm:text-4xl tracking-tight text-[var(--ink)] animate-in slide-in-from-bottom duration-700">
            Nexus<span className="italic text-[var(--copper)]">Sync</span>
          </div>
        </div>

        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-faint)]">
          Calibrating Instrument · Observatory 01
        </div>

        {/* Skip button for rapid development / testing */}
        <button
          onClick={handleSkip}
          className="mt-6 font-mono text-[11px] uppercase tracking-wider text-[var(--ink-soft)] hover:text-[var(--copper)] underline cursor-pointer"
        >
          Skip [Esc]
        </button>
      </div>
    </div>
  );
}
