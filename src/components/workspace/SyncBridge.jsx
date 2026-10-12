import { Radio, Zap } from 'lucide-react';

/**
 * Sync Bridge connecting Replica A and Replica B observation panes.
 * Ported from Stitch Screen 3e5e7475...
 *
 * @param {Object} props
 * @param {number} props.totalPendingOps - Count of uncommitted local operations
 * @param {boolean} props.isOffline - Whether either replica is offline
 */
export function SyncBridge({ totalPendingOps, isOffline }) {
  return (
    <div className="relative mb-6 bg-[var(--paper-raised)] border border-[var(--border)] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isOffline || totalPendingOps > 0 ? 'bg-[var(--ochre)]' : 'bg-[var(--verdigris)]'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-3 w-3 ${
              isOffline || totalPendingOps > 0 ? 'bg-[var(--ochre)]' : 'bg-[var(--verdigris)]'
            }`}
          />
        </span>
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-[var(--copper)]" />
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--ink)] font-semibold">
            Deterministic Replay Bus
          </span>
        </div>
      </div>

      {/* SVG Flowing Wire Visualizer */}
      <div className="flex-1 w-full flex items-center justify-center px-4">
        <div className="relative w-full max-w-md h-6 flex items-center">
          <svg className="w-full h-3" preserveAspectRatio="none" viewBox="0 0 300 20">
            <path
              d="M 0 10 L 300 10"
              fill="none"
              stroke={isOffline || totalPendingOps > 0 ? 'var(--ochre)' : 'var(--copper)'}
              strokeWidth="2"
              strokeDasharray={isOffline ? '6 4' : 'none'}
            />
          </svg>

          {/* Wire Bead Tag */}
          <div className="absolute left-1/2 -top-1 transform -translate-x-1/2 px-2.5 py-0.5 bg-[var(--ink)] text-[var(--paper-raised)] font-mono text-[9px] rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
            <Zap className="w-2.5 h-2.5 text-[var(--copper)]" />
            <span>
              {totalPendingOps > 0
                ? `${totalPendingOps} local op${totalPendingOps > 1 ? 's' : ''} queued`
                : 'local bus idle · awaiting push'}
            </span>
          </div>
        </div>
      </div>

      <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-faint)] flex items-center gap-2">
        <span>Partitions:</span>
        <span className="text-[var(--ink)] font-semibold">A &amp; B Local IndexedDB</span>
      </div>
    </div>
  );
}
