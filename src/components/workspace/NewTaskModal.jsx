import { useState } from 'react';
import { useSyncStore } from '../../store/useSyncStore';
import { X, Plus } from 'lucide-react';

/**
 * NewTaskModal
 * Global modal for creating a task saved locally in IndexedDB and queued in pending_ops.
 */
export function NewTaskModal({ isOpen, onClose }) {
  const { createCustomTask, user } = useSyncStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'BACKLOG',
    dueDate: 'Nov 14',
    category: 'Core Roadmap',
    assignee: user?.name || 'Elena Vance',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    createCustomTask('replicaA', formData);

    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'BACKLOG',
      dueDate: 'Nov 14',
      category: 'Core Roadmap',
      assignee: user?.name || 'Elena Vance',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#15201F]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#DCE5E1] rounded-2xl max-w-lg w-full p-6 shadow-xl flex flex-col gap-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE5E1]">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#E4F1EF] text-[#176D70] flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-[#15201F]">
                Create New Task
              </h2>
              <p className="font-sans text-xs text-[#697775]">
                Saved locally on this device in IndexedDB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#697775] hover:text-[#15201F] hover:bg-[#F0F4F2] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs font-semibold text-[#15201F]">
              Task Title <span className="text-[#B94A48]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Implement Causal Merkle Tree verification"
              className="w-full px-3 py-2 rounded-xl border border-[#DCE5E1] bg-[#F6F8F6] text-xs font-sans text-[#15201F] focus:outline-none focus:border-[#176D70] focus:bg-white transition"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs font-semibold text-[#15201F]">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide context, acceptance criteria, or technical details..."
              className="w-full px-3 py-2 rounded-xl border border-[#DCE5E1] bg-[#F6F8F6] text-xs font-sans text-[#15201F] focus:outline-none focus:border-[#176D70] focus:bg-white transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-semibold text-[#15201F]">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE5E1] bg-[#F6F8F6] text-xs font-sans text-[#15201F] focus:outline-none focus:border-[#176D70] cursor-pointer"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High Priority</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-semibold text-[#15201F]">
                Initial Column
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE5E1] bg-[#F6F8F6] text-xs font-sans text-[#15201F] focus:outline-none focus:border-[#176D70] cursor-pointer"
              >
                <option value="BACKLOG">To Do / Backlog</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Done</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-semibold text-[#15201F]">
                Assignee
              </label>
              <input
                type="text"
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE5E1] bg-[#F6F8F6] text-xs font-sans text-[#15201F] focus:outline-none focus:border-[#176D70]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-semibold text-[#15201F]">
                Due Date
              </label>
              <input
                type="text"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE5E1] bg-[#F6F8F6] text-xs font-sans text-[#15201F] focus:outline-none focus:border-[#176D70]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DCE5E1]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-sans font-medium text-[#697775] hover:text-[#15201F] hover:bg-[#F0F4F2] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#176D70] text-white hover:bg-[#13585A] text-xs font-sans font-semibold transition shadow-xs cursor-pointer"
            >
              Save to Local Device
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
