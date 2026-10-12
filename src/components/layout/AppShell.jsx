import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { WorkspaceTopBar } from './WorkspaceTopBar';
import { NewTaskModal } from '../workspace/NewTaskModal';

/**
 * AppShell
 * Authenticated Desktop Application Shell.
 * 
 * ┌──────────────────────────────────────────────────────────────┐
 * │ BRAND       │ TOP WORKSPACE STATUS BAR                       │
 * ├─────────────┼────────────────────────────────────────────────┤
 * │             │                                                │
 * │ LEFT        │ MAIN CONTENT AREA                              │
 * │ SIDEBAR     │                                                │
 * │             │                                                │
 * │             │                                                │
 * │             │                                                │
 * │ DEVICE      │                                                │
 * │ STATUS      │                                                │
 * └─────────────┴────────────────────────────────────────────────┘
 */
export function AppShell({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F6F8F6] text-[#15201F] flex flex-row relative antialiased selection:bg-[#176D70] selection:text-white">
      {/* 1. DESKTOP PERSISTENT LEFT SIDEBAR */}
      <div className="hidden md:flex h-screen sticky top-0 shrink-0 z-40">
        <Sidebar />
      </div>

      {/* 2. MOBILE / TABLET DRAWER OVERLAY */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-[#15201F]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-72 max-w-[80vw] h-full bg-white shadow-2xl flex">
            <Sidebar onCloseMobile={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE COLUMN */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* PERSISTENT TOP WORKSPACE BAR */}
        <WorkspaceTopBar
          onOpenNewTask={() => setNewTaskModalOpen(true)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col">
          {children}
        </main>
      </div>

      {/* 4. GLOBAL NEW TASK MODAL */}
      <NewTaskModal
        isOpen={newTaskModalOpen}
        onClose={() => setNewTaskModalOpen(false)}
      />
    </div>
  );
}
