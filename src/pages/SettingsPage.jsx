import { useSyncStore } from '../store/useSyncStore';
import {
  Moon,
  Sun,
  Trash2
} from 'lucide-react';

export function SettingsPage() {
  const { theme, setTheme, replicaA, replicaB } = useSyncStore();

  const handleClearCache = async () => {
    if (confirm('Clear local IndexedDB storage and reload seed state?')) {
      window.indexedDB.deleteDatabase('nexussync_db');
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-300">
      {/* Editorial Header */}
      <div className="border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--copper)] font-bold">
            PREFERENCES &amp; REPLICATION ENGINE
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--copper)]" />
          <span className="font-newsreader text-xs italic text-[var(--ink-soft)]">
            "fine-tuning optical calibrations and causal mesh transport"
          </span>
        </div>
        <h1 className="font-display text-4xl text-[var(--ink)] tracking-tight">
          Instrument Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start font-mono text-xs">
        {/* Card 1: Appearance & Theme */}
        <div className="bg-[var(--paper-raised)] border border-[var(--border)] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <span className="font-bold text-[var(--ink)] uppercase">Material Astrolabe Theme</span>
            <span className="text-[10px] text-[var(--copper)] font-bold">{theme.toUpperCase()} MODE</span>
          </div>

          <div className="space-y-3">
            <p className="font-newsreader text-sm text-[var(--ink-soft)]">
              Choose between the tactile warm cream rag paper stock or the nocturnal astrolabe slate palette:
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setTheme('light')}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 cursor-pointer transition ${
                  theme === 'light'
                    ? 'border-[var(--copper)] bg-[var(--paper)] text-[var(--ink)] font-bold shadow-xs'
                    : 'border-[var(--border)] bg-[var(--paper)] text-[var(--ink-soft)]'
                }`}
              >
                <Sun className="w-5 h-5 text-[var(--copper)]" />
                <span>Observatory Light</span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 cursor-pointer transition ${
                  theme === 'dark'
                    ? 'border-[var(--copper)] bg-[var(--paper)] text-[var(--ink)] font-bold shadow-xs'
                    : 'border-[var(--border)] bg-[var(--paper)] text-[var(--ink-soft)]'
                }`}
              >
                <Moon className="w-5 h-5 text-[var(--ochre)]" />
                <span>Astrolabe Dark</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Local IndexedDB Maintenance */}
        <div className="bg-[var(--paper-raised)] border border-[var(--border)] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <span className="font-bold text-[var(--ink)] uppercase">Local Disk Storage</span>
            <span className="text-[10px] text-[var(--verdigris)] font-bold">INDEXEDDB v1</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded bg-[var(--paper)] border border-[var(--border)] space-y-1">
              <div className="flex justify-between">
                <span className="text-[var(--ink-soft)]">Replica A Local Store:</span>
                <strong className="text-[var(--ink)]">{replicaA.tasks.length} tasks</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-soft)]">Replica B Local Store:</span>
                <strong className="text-[var(--ink)]">{replicaB.tasks.length} tasks</strong>
              </div>
            </div>

            <button
              onClick={handleClearCache}
              className="w-full py-2.5 px-4 rounded bg-[var(--paper)] hover:bg-[var(--rust)] hover:text-[var(--paper-raised)] border border-[var(--border)] text-[var(--rust)] font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset IndexedDB Cache &amp; Reseed</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
