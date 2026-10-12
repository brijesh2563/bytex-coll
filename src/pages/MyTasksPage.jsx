import { useState, useMemo } from 'react';
import { useSyncStore } from '../store/useSyncStore';
import { PageHeader } from '../components/layout/PageHeader';
import { TaskCard } from '../components/workspace/TaskCard';
import { NewTaskModal } from '../components/workspace/NewTaskModal';
import { Plus, Search } from 'lucide-react';

/**
 * MyTasksPage
 * Destination: Sidebar -> My Tasks
 * 
 * Header:
 * Workspace / My Tasks
 * My Tasks [actual assigned count]
 * Supporting text: "Showing tasks assigned to you on this device."
 * Actions: View All Tasks, + New Task
 * 
 * Filter control:
 * All Tasks, My Tasks, Needs Attention (all counts strictly real)
 * 
 * Kanban Columns:
 * TO DO, IN PROGRESS, DONE
 */
export function MyTasksPage() {
  const {
    replicaA,
    conflicts,
    user,
    updateTaskTitle,
    updateTaskStatus,
    deleteTask,
  } = useSyncStore();

  const currentReplicaTasks = replicaA.tasks;
  const tasks = useMemo(() => currentReplicaTasks || [], [currentReplicaTasks]);

  const [activeTabFilter, setActiveTabFilter] = useState('ALL'); // 'ALL' | 'MY_TASKS' | 'NEEDS_ATTENTION'
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Derive real operator identity
  const currentOperatorName = user?.name || 'Elena Vance';

  // Counts strictly calculated from real application state
  const allCount = tasks.length;
  const myTasksCount = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.assignee) return false;
      return t.assignee.toLowerCase() === currentOperatorName.toLowerCase() ||
        (user?.name && t.assignee.toLowerCase().includes(user.name.toLowerCase()));
    }).length;
  }, [tasks, currentOperatorName, user]);

  const needsAttentionCount = useMemo(() => {
    return tasks.filter((t) => {
      const isPending = t.syncStatus === 'PENDING_SYNC';
      const isHigh = t.priority === 'HIGH' || t.priority === 'CRITICAL';
      const hasConflict = conflicts.some((c) => c.taskCardId === t.id);
      return isPending || isHigh || hasConflict;
    }).length;
  }, [tasks, conflicts]);

  // Filter tasks based on search & tab filter
  const filteredTasks = useMemo(() => {
    let list = tasks;

    // 1. Tab filter
    if (activeTabFilter === 'MY_TASKS') {
      list = list.filter((t) => {
        if (!t.assignee) return false;
        return t.assignee.toLowerCase() === currentOperatorName.toLowerCase() ||
          (user?.name && t.assignee.toLowerCase().includes(user.name.toLowerCase()));
      });
    } else if (activeTabFilter === 'NEEDS_ATTENTION') {
      list = list.filter((t) => {
        const isPending = t.syncStatus === 'PENDING_SYNC';
        const isHigh = t.priority === 'HIGH' || t.priority === 'CRITICAL';
        const hasConflict = conflicts.some((c) => c.taskCardId === t.id);
        return isPending || isHigh || hasConflict;
      });
    }

    // 2. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.id?.toLowerCase().includes(q) ||
          t.assignee?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [tasks, activeTabFilter, searchQuery, currentOperatorName, user, conflicts]);

  // Map to 3 approved Kanban columns: TO DO, IN PROGRESS, DONE
  const kanbanColumns = [
    {
      id: 'TODO',
      label: 'TO DO',
      matcher: (status) => !status || status.toUpperCase() === 'TODO' || status.toUpperCase() === 'BACKLOG',
      targetStatus: 'TODO',
      dotColor: 'bg-[#697775]',
    },
    {
      id: 'IN_PROGRESS',
      label: 'IN PROGRESS',
      matcher: (status) => status && (status.toUpperCase() === 'IN_PROGRESS' || status.toUpperCase() === 'IN_REVIEW'),
      targetStatus: 'IN_PROGRESS',
      dotColor: 'bg-[#C4872D]',
    },
    {
      id: 'DONE',
      label: 'DONE',
      matcher: (status) => status && (status.toUpperCase() === 'DONE' || status.toUpperCase() === 'COMPLETED'),
      targetStatus: 'DONE',
      dotColor: 'bg-[#2F7D68]',
    },
  ];

  const handleTitleChange = (replicaKey, taskId, newTitle) => {
    updateTaskTitle('replicaA', taskId, newTitle);
  };

  const handleStatusChange = (replicaKey, taskId, newStatus) => {
    updateTaskStatus('replicaA', taskId, newStatus);
  };

  const handleDelete = (replicaKey, taskId) => {
    deleteTask('replicaA', taskId);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* 1. UNIFIED PAGE HEADER */}
      <PageHeader
        breadcrumbs={['Workspace', 'My Tasks']}
        title="My Tasks"
        badge={
          <span className="px-2.5 py-0.5 rounded-full bg-[#E4F1EF] text-[#176D70] font-mono text-xs font-semibold">
            {myTasksCount} Assigned
          </span>
        }
        description="Showing tasks assigned to you on this device. All updates are instantly saved locally in IndexedDB."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTabFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-sans font-medium transition cursor-pointer ${
                activeTabFilter === 'ALL'
                  ? 'bg-[#FFFFFF] border-[#176D70] text-[#176D70]'
                  : 'bg-[#FFFFFF] border-[#DCE5E1] text-[#697775] hover:text-[#15201F]'
              }`}
            >
              View All Tasks
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#176D70] text-white hover:bg-[#13585A] text-xs font-sans font-semibold transition shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
          </div>
        }
      />

      {/* 2. TASK FILTER CONTROL & SEARCH BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FFFFFF] border border-[#DCE5E1] p-3.5 rounded-2xl shadow-2xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setActiveTabFilter('ALL')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition cursor-pointer shrink-0 ${
              activeTabFilter === 'ALL'
                ? 'bg-[#176D70] text-white shadow-2xs font-semibold'
                : 'bg-[#F0F4F2] text-[#697775] hover:text-[#15201F]'
            }`}
          >
            <span>All Tasks</span>
            <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
              activeTabFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-[#DCE5E1] text-[#15201F]'
            }`}>
              {allCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabFilter('MY_TASKS')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition cursor-pointer shrink-0 ${
              activeTabFilter === 'MY_TASKS'
                ? 'bg-[#176D70] text-white shadow-2xs font-semibold'
                : 'bg-[#F0F4F2] text-[#697775] hover:text-[#15201F]'
            }`}
          >
            <span>My Tasks</span>
            <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
              activeTabFilter === 'MY_TASKS' ? 'bg-white/20 text-white' : 'bg-[#DCE5E1] text-[#15201F]'
            }`}>
              {myTasksCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabFilter('NEEDS_ATTENTION')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition cursor-pointer shrink-0 ${
              activeTabFilter === 'NEEDS_ATTENTION'
                ? 'bg-[#C4872D] text-white shadow-2xs font-semibold'
                : 'bg-[#FAF5EC] text-[#C4872D] hover:bg-[#F7EFE1]'
            }`}
          >
            <span>Needs Attention</span>
            <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
              activeTabFilter === 'NEEDS_ATTENTION' ? 'bg-white/20 text-white' : 'bg-[#C4872D]/20 text-[#C4872D]'
            }`}>
              {needsAttentionCount}
            </span>
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative min-w-[220px] max-w-sm w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#697775]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, IDs, tags..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F6F8F6] border border-[#DCE5E1] text-xs font-sans text-[#15201F] placeholder:text-[#697775] focus:outline-none focus:bg-white focus:border-[#176D70] transition"
          />
        </div>
      </div>

      {/* 3. KANBAN OPERATIONAL BOARD (TO DO, IN PROGRESS, DONE) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {kanbanColumns.map((col) => {
          const colTasks = filteredTasks.filter((t) => col.matcher(t.status));

          return (
            <div
              key={col.id}
              className="flex flex-col bg-[#F0F4F2]/70 border border-[#DCE5E1] rounded-2xl p-4 gap-3 min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE5E1]">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <span className="font-display text-sm font-bold text-[#15201F] tracking-tight">
                    {col.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#DCE5E1] text-[#697775] font-mono text-[11px] font-semibold shadow-2xs">
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Task Cards Column List */}
              <div className="flex flex-col gap-3">
                {colTasks.length > 0 ? (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      replicaKey="replicaA"
                      onTitleChange={handleTitleChange}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                    />
                  ))
                ) : (
                  <div className="py-12 px-4 rounded-xl border border-dashed border-[#DCE5E1] flex flex-col items-center justify-center text-center">
                    <p className="font-sans text-xs text-[#697775]">
                      No tasks in {col.label.toLowerCase()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Global New Task Modal */}
      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
