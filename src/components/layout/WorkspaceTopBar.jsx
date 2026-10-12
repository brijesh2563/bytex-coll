import { useSyncStore } from '../../store/useSyncStore';
import { UserMenu } from './UserMenu';
import {
  Folder,
  Plus,
  RefreshCw,
  Menu
} from 'lucide-react';

/**
 * WorkspaceTopBar
 * Persistent top status and action bar to the right of the Left Sidebar.
 * 
 * Left: [folder icon] NexusSync Workspace -> Saved on this device (or Offline / Syncing)
 * Center/Right: [N] waiting to sync (actual pending count)
 * Right: + New Task button + UserMenu (Profile & Logout only)
 */
export function WorkspaceTopBar({ onOpenNewTask, onOpenMobileNav }) {
  const {
    replicaA,
    replicaB,
    isBrowserOnline,
  } = useSyncStore();

  const activeReplica = replicaA;
  const isOffline = !isBrowserOnline || !activeReplica.effectiveOnline;
  const pendingCount = (replicaA.pendingOps?.length || 0) + (replicaB.pendingOps?.length || 0);

  let localStateText = 'Saved on this device';
  let localStateColor = 'text-[#2F7D68]';
  let localStateDot = 'bg-[#2F7D68]';

  if (isOffline) {
    localStateText = 'Offline (local storage active)';
    localStateColor = 'text-[#C4872D]';
    localStateDot = 'bg-[#C4872D]';
  } else if (pendingCount > 0) {
    localStateText = 'Local edits saved';
    localStateColor = 'text-[#176D70]';
    localStateDot = 'bg-[#176D70]';
  }

  return (
    <header className="h-16 w-full border-b border-[#DCE5E1] bg-[#FFFFFF]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
      {/* LEFT: Mobile Menu Button + Workspace Folder Context */}
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="md:hidden p-2 rounded-xl text-[#697775] hover:text-[#15201F] hover:bg-[#F0F4F2] transition cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#F0F4F2] text-[#176D70] flex items-center justify-center shrink-0">
            <Folder className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-baseline gap-2 truncate">
            <span className="font-display text-sm font-semibold text-[#15201F] truncate">
              NexusSync Workspace
            </span>
            <span className="text-[#DCE5E1] hidden sm:inline select-none">·</span>
            <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px]">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${localStateDot}`} />
              <span className={localStateColor}>{localStateText}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER / RIGHT: PENDING OPERATIONS PILL (Only if pending operations exist) */}
      <div className="flex items-center gap-3">
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF5EC] border border-[#C4872D]/30 text-[#C4872D] font-mono text-xs font-semibold animate-pulse">
            <RefreshCw className="w-3 h-3" />
            <span>{pendingCount} waiting to sync</span>
          </div>
        )}

        {/* + NEW TASK BUTTON */}
        {onOpenNewTask && (
          <button
            type="button"
            onClick={onOpenNewTask}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#176D70] text-white hover:bg-[#13585A] font-sans text-xs font-semibold transition shadow-2xs cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Task</span>
            <span className="sm:hidden">New</span>
          </button>
        )}

        {/* AUTHENTICATED USER CONTROL */}
        <UserMenu />
      </div>
    </header>
  );
}
