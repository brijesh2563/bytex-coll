import { useState } from 'react';
import { Clock, Check, MoreVertical, Trash2, ArrowRightCircle } from 'lucide-react';

/**
 * Stitch-aligned TaskCard component.
 * Prioritizes: Title, Description, Assignee, Due Date, Priority, Dependencies, Status, Sync state.
 *
 * @param {Object} props
 * @param {Object} props.task
 * @param {string} props.replicaKey - 'replicaA' | 'replicaB'
 * @param {(replicaKey: string, taskId: string, newTitle: string) => void} props.onTitleChange
 * @param {(replicaKey: string, taskId: string, newStatus: string) => void} [props.onStatusChange]
 * @param {(replicaKey: string, taskId: string) => void} [props.onDelete]
 */
export function TaskCard({ task, replicaKey, onTitleChange, onStatusChange, onDelete }) {
  const [prevTaskTitle, setPrevTaskTitle] = useState(task.title);
  const [title, setTitle] = useState(task.title);
  const [isEditing, setIsEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (task.title !== prevTaskTitle) {
    setPrevTaskTitle(task.title);
    if (!isEditing) {
      setTitle(task.title);
    }
  }

  const handleBlur = () => {
    setIsEditing(false);
    if (title.trim() && title.trim() !== task.title) {
      onTitleChange(replicaKey, task.id, title.trim());
    }
  };

  const isPending = task.syncStatus === 'PENDING_SYNC';
  const priority = (task.priority || 'MEDIUM').toUpperCase();

  let priorityClass = 'bg-[#F0F4F2] text-[#697775]';
  if (priority === 'HIGH' || priority === 'CRITICAL') {
    priorityClass = 'bg-[#FBEBEB] text-[#B94A48]';
  } else if (priority === 'MEDIUM') {
    priorityClass = 'bg-[#FAF5EC] text-[#C4872D]';
  } else if (priority === 'LOW') {
    priorityClass = 'bg-[#E4F1EF] text-[#2F7D68]';
  }

  const assigneeName = task.assignee || 'Elena Vance';
  const assigneeInitials = assigneeName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const statuses = [
    { id: 'BACKLOG', label: 'Backlog' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'IN_REVIEW', label: 'In Review' },
    { id: 'COMPLETED', label: 'Completed' },
  ];

  return (
    <div
      className={`flex flex-col bg-[#FFFFFF] border rounded-xl p-4 shadow-xs hover:shadow-md transition-all relative group ${
        isPending ? 'border-[#C4872D]/60' : 'border-[#DCE5E1]'
      }`}
      data-card-id={task.id}
    >
      {/* Top Metadata Row: ID & Priority */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#F0F4F2] text-[#697775] font-semibold">
            {task.id.startsWith('NX-') ? task.id : `NX-${task.id.replace('card-', '10')}`}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold uppercase ${priorityClass}`}>
            {task.priority || 'Medium'}
          </span>
        </div>

        {/* Card Options Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-6 h-6 rounded flex items-center justify-center text-[#697775] hover:text-[#15201F] hover:bg-[#F0F4F2] transition cursor-pointer"
            title="Card actions"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-7 w-44 bg-[#FFFFFF] border border-[#DCE5E1] rounded-xl shadow-lg py-1 z-30 font-sans text-xs">
              <div className="px-3 py-1 font-mono text-[10px] uppercase text-[#697775]">Move status</div>
              {statuses.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (onStatusChange) onStatusChange(replicaKey, task.id, s.id);
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-[#F0F4F2] flex items-center justify-between ${
                    (task.status || 'BACKLOG').toUpperCase() === s.id ? 'font-bold text-[#176D70]' : 'text-[#15201F]'
                  }`}
                >
                  <span>{s.label}</span>
                  {(task.status || 'BACKLOG').toUpperCase() === s.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
              {onDelete && (
                <div className="pt-1 mt-1 border-t border-[#DCE5E1]">
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(replicaKey, task.id);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#FBEBEB] text-[#B94A48] flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Task</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Editable Title */}
      <div className="mb-1.5">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsEditing(true)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          className={`w-full bg-transparent font-sans font-semibold text-[#15201F] text-sm focus:outline-none transition-colors border-b ${
            isEditing ? 'border-[#176D70] pb-0.5' : 'border-transparent hover:border-[#DCE5E1]'
          }`}
          placeholder="Task title..."
        />
      </div>

      {/* Description */}
      {task.description && (
        <p className="font-sans text-xs text-[#697775] line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Dependencies if present */}
      {task.dependencies?.length > 0 && (
        <div className="mb-2 flex items-center gap-1 font-mono text-[10px] text-[#697775]">
          <span className="text-[#697775]">Depends on:</span>
          <span className="px-1.5 py-0.2 rounded bg-[#F0F4F2] text-[#15201F] font-semibold">
            {task.dependencies.join(', ')}
          </span>
        </div>
      )}

      {/* Assignee & Due Date Row */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#DCE5E1]">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-[#176D70] text-white flex items-center justify-center font-mono text-[9px] font-bold">
            {assigneeInitials}
          </div>
          <span className="font-sans text-xs text-[#15201F] truncate max-w-[100px]">
            {assigneeName}
          </span>
        </div>

        <div className="flex items-center gap-1 font-mono text-[11px] text-[#697775]">
          <Clock className="w-3 h-3 text-[#697775]" />
          <span>{task.dueDate || 'Oct 28'}</span>
        </div>
      </div>

      {/* Sync State Indicator Footer (Saved locally · Synced OR Changes waiting to sync) */}
      <div className="mt-2.5 pt-2 -mx-4 -mb-4 px-4 py-2 rounded-b-xl bg-[#F0F4F2] flex items-center justify-between border-t border-[#DCE5E1]">
        {isPending ? (
          <div className="flex items-center gap-1.5 text-[#C4872D] font-mono text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C4872D] animate-pulse" />
            <span>Changes waiting to sync</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[#2F7D68] font-mono text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2F7D68]" />
            <span>Saved locally · Synced</span>
          </div>
        )}

        {isPending ? (
          <ArrowRightCircle className="w-3.5 h-3.5 text-[#C4872D]" />
        ) : (
          <Check className="w-3.5 h-3.5 text-[#2F7D68]" />
        )}
      </div>
    </div>
  );
}
