import { TaskCard } from './TaskCard';
import { Switch } from '../ui/Switch';
import { Chip } from '../ui/Chip';
import { Plus, Database, Wifi, WifiOff } from 'lucide-react';

/**
 * Single replica partition pane ported from Stitch Screen 3e5e7475...
 *
 * @param {Object} props
 * @param {Object} props.replica - Replica state object
 * @param {'replicaA' | 'replicaB'} props.replicaKey
 * @param {boolean} props.isBrowserOnline
 * @param {(replicaKey: string) => void} props.onToggleOnline
 * @param {(replicaKey: string, taskId: string, newTitle: string) => void} props.onTitleChange
 * @param {(replicaKey: string) => void} props.onAppendTask
 */
export function ReplicaPane({
  replica,
  replicaKey,
  isBrowserOnline,
  onToggleOnline,
  onTitleChange,
  onAppendTask,
}) {
  const isA = replicaKey === 'replicaA';
  const pendingCount = replica.pendingOps?.length || 0;

  // Determine connectivity label and color
  let statusText = 'Online';
  let statusVariant = 'verdigris';
  let StatusIcon = Wifi;

  if (!isBrowserOnline) {
    statusText = 'Browser Offline';
    statusVariant = 'rust';
    StatusIcon = WifiOff;
  } else if (!replica.isSimulatedOnline) {
    statusText = 'Simulated Offline';
    statusVariant = 'ochre';
    StatusIcon = WifiOff;
  }

  return (
    <div
      className={`bg-[var(--paper-raised)] border border-[var(--border)] rounded-xl p-5 sm:p-6 transition-all duration-300 relative ${
        pendingCount > 0 ? 'ring-1 ring-[var(--ochre)]/40' : ''
      }`}
      id={`pane-${isA ? 'a' : 'b'}`}
    >
      {/* Pane Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--line)] mb-5 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isA ? 'bg-[var(--ink)]' : 'bg-[var(--copper)]'
              }`}
            />
            <h3 className="font-sans font-semibold text-lg text-[var(--ink)]">
              {replica.name}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--ink-faint)] mt-1">
            <Database className="w-3 h-3 text-[var(--ink-faint)]" />
            <span>LOCAL IDB STORE: {replica.partition}</span>
          </div>
        </div>

        {/* Online/Offline & Queued Status Controls */}
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <Chip variant="ochre" hasDot className="text-[10px]">
              Queued: {pendingCount}
            </Chip>
          )}

          <div className="flex items-center gap-2">
            <Switch
              checked={replica.isSimulatedOnline}
              onChange={() => onToggleOnline(replicaKey)}
              disabled={!isBrowserOnline}
            />
            <Chip variant={statusVariant} className="text-[10px] flex items-center gap-1">
              <StatusIcon className="w-3 h-3" />
              <span>{statusText}</span>
            </Chip>
          </div>
        </div>
      </div>

      {/* Board Card List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between font-mono text-xs text-[var(--ink-soft)] border-b border-[var(--line)]/40 pb-2">
          <span className="uppercase tracking-wider">
            Workspace Cards ({replica.tasks?.length || 0})
          </span>
          <button
            onClick={() => onAppendTask(replicaKey)}
            className="text-[var(--copper)] hover:text-[var(--copper-deep)] hover:underline font-mono text-xs flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Append Task</span>
          </button>
        </div>

        <div className="space-y-3" id={`cards-container-${isA ? 'a' : 'b'}`}>
          {replica.tasks?.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              replicaKey={replicaKey}
              onTitleChange={onTitleChange}
            />
          ))}

          {replica.tasks?.length === 0 && (
            <div className="p-8 text-center font-mono text-xs text-[var(--ink-faint)] border border-dashed border-[var(--border)] rounded-lg">
              No tasks stored in local partition. Click &quot;Append Task&quot; to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
