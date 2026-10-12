import { useState } from 'react';
import { useSyncStore } from '../../store/useSyncStore';
import { DeviceStatusCard } from './DeviceStatusCard';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  GitFork,
  History,
  Sliders,
  ChevronDown,
  RotateCcw,
  X
} from 'lucide-react';

/**
 * Sidebar
 * Persistent authenticated Left Sidebar matching approved Stitch architecture.
 * 
 * Top Brand: NexusSync Workspace + Local Mode
 * Primary:
 * - Workspace
 * - My Tasks
 * - Pending Changes [actual count]
 * - Conflicts [actual count]
 * - History
 * Advanced Options (Collapsible):
 * - Network Simulation
 * - Reset Demo Data
 * Bottom Device Status Card
 */
export function Sidebar({ onCloseMobile }) {
  const {
    activePage,
    setActivePage,
    conflicts,
    replicaA,
    replicaB,
  } = useSyncStore();

  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [resetting, setResetting] = useState(false);

  // Derive real counts strictly from application state
  const pendingOpsCount = (replicaA.pendingOps?.length || 0) + (replicaB.pendingOps?.length || 0);
  const conflictsCount = conflicts?.length || 0;

  const navItems = [
    {
      id: 'workspace',
      label: 'Workspace',
      icon: LayoutDashboard,
      badge: null,
      badgeVariant: 'default',
    },
    {
      id: 'my-tasks',
      label: 'My Tasks',
      icon: CheckSquare,
      badge: null,
      badgeVariant: 'default',
    },
    {
      id: 'pending',
      label: 'Pending Changes',
      icon: Clock,
      badge: pendingOpsCount > 0 ? `${pendingOpsCount}` : null,
      badgeVariant: 'amber',
    },
    {
      id: 'conflicts',
      label: 'Conflicts',
      icon: GitFork,
      badge: conflictsCount > 0 ? `${conflictsCount}` : null,
      badgeVariant: 'danger',
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      badge: null,
      badgeVariant: 'default',
    },
  ];

  const handleNavigate = (pageId) => {
    setActivePage(pageId);
    if (onCloseMobile) onCloseMobile();
  };

  const handleResetDemoData = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      if (typeof indexedDB !== 'undefined') {
        const req = indexedDB.deleteDatabase('nexussync_db');
        req.onsuccess = () => {
          window.location.reload();
        };
        req.onerror = () => {
          setResetting(false);
        };
      }
    } catch (e) {
      console.warn('Failed to reset demo IndexedDB:', e);
      setResetting(false);
    }
  };

  // Determine if active page matches destination (or aliases)
  const isNavActive = (id) => {
    if (id === 'workspace') return activePage === 'workspace' || activePage === 'observatory' || activePage === 'home';
    if (id === 'my-tasks') return activePage === 'my-tasks' || activePage === 'tasks';
    if (id === 'pending') return activePage === 'pending' || activePage === 'pending-changes';
    if (id === 'conflicts') return activePage === 'conflicts' || activePage === 'resolver';
    if (id === 'history') return activePage === 'history' || activePage === 'version-history';
    if (id === 'simulation') return activePage === 'simulation' || activePage === 'lab' || activePage === 'convergence-lab';
    return activePage === id;
  };

  return (
    <aside className="w-64 bg-[#FFFFFF] border-r border-[#DCE5E1] flex flex-col shrink-0 h-full min-h-screen select-none">
      {/* 1. TOP BRAND AREA */}
      <div className="h-16 px-5 border-b border-[#DCE5E1] flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={() => handleNavigate('workspace')}
          className="flex items-center gap-2.5 text-left cursor-pointer group focus:outline-hidden"
        >
          <div className="w-8 h-8 rounded-lg bg-[#176D70] text-white flex items-center justify-center font-display font-bold text-sm shadow-2xs group-hover:bg-[#13585A] transition-colors">
            NS
          </div>
          <div className="flex flex-col">
            <span className="font-display text-sm font-bold text-[#15201F] tracking-tight leading-tight">
              NexusSync
            </span>
            <span className="font-sans text-[11px] text-[#697775] leading-none">
              Workspace
            </span>
          </div>
        </button>

        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full bg-[#E4F1EF] text-[#176D70] font-mono text-[10px] font-semibold tracking-wider">
            Local Mode
          </span>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1 rounded-lg text-[#697775] hover:text-[#15201F] hover:bg-[#F0F4F2]"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. NAVIGATION LINKS CONTAINER */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-6">
        {/* Primary Navigation */}
        <nav aria-label="Main Navigation" className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = isNavActive(item.id);
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer group ${
                  active
                    ? 'bg-[#E4F1EF] text-[#176D70] font-semibold shadow-2xs'
                    : 'text-[#697775] hover:text-[#15201F] hover:bg-[#F0F4F2] font-medium'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      active ? 'text-[#176D70]' : 'text-[#697775] group-hover:text-[#15201F]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold shrink-0 ${
                      item.badgeVariant === 'danger'
                        ? 'bg-[#FBEBEB] text-[#B94A48]'
                        : item.badgeVariant === 'amber'
                        ? 'bg-[#FAF5EC] text-[#C4872D]'
                        : 'bg-[#F0F4F2] text-[#697775]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 3. ADVANCED OPTIONS (Collapsible) */}
        <div className="flex flex-col gap-1 pt-3 border-t border-[#DCE5E1]">
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-[#697775] hover:text-[#15201F] transition cursor-pointer"
          >
            <span>Advanced Options</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                advancedOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {advancedOpen && (
            <div className="flex flex-col gap-1 mt-1 animate-in fade-in duration-150">
              <button
                type="button"
                onClick={() => handleNavigate('simulation')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer group ${
                  isNavActive('simulation')
                    ? 'bg-[#E4F1EF] text-[#176D70] font-semibold shadow-2xs'
                    : 'text-[#697775] hover:text-[#15201F] hover:bg-[#F0F4F2] font-medium'
                }`}
              >
                <Sliders
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isNavActive('simulation') ? 'text-[#176D70]' : 'text-[#697775] group-hover:text-[#15201F]'
                  }`}
                />
                <span className="truncate">Network Simulation</span>
              </button>

              <button
                type="button"
                onClick={handleResetDemoData}
                disabled={resetting}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#697775] hover:text-[#B94A48] hover:bg-[#FBEBEB] font-medium transition cursor-pointer group"
                title="Reset local IndexedDB state to initial seed"
              >
                <RotateCcw className="w-4 h-4 shrink-0 text-[#697775] group-hover:text-[#B94A48]" />
                <span className="truncate">{resetting ? 'Resetting...' : 'Reset Demo Data'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. BOTTOM DEVICE STATUS */}
      <div className="p-3 border-t border-[#DCE5E1] shrink-0 bg-[#FFFFFF]">
        <DeviceStatusCard />
      </div>
    </aside>
  );
}
