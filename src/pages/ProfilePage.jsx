import { useState } from 'react';
import { useSyncStore } from '../store/useSyncStore';
import { User, Mail, LogOut, ArrowLeft, ChevronDown, Cpu } from 'lucide-react';

/**
 * ProfilePage
 * 
 * Minimal, elegant Profile experience for authenticated operators.
 * Uses the fixed Pearl × Deep Teal theme palette:
 * - Background: #F6F8F6
 * - Surface: #FFFFFF
 * - Primary Text: #15201F
 * - Secondary Text: #697775
 * - Deep Teal: #176D70
 * - Border: #DCE5E1
 * 
 * Answers "Who am I signed in as?" (Operator Name and Email).
 * Technical replica details are kept progressively disclosed under Technical Details.
 */
export function ProfilePage() {
  const { user, logout, setActivePage, replicaA } = useSyncStore();
  const [techDetailsOpen, setTechDetailsOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'O';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayName = user?.name || 'Operator';
  const displayEmail = user?.email || null;
  const initials = getInitials(displayName);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-8 sm:py-12 w-full animate-in fade-in duration-300">
      <div className="max-w-lg w-full space-y-6">
        {/* Navigation back */}
        <button
          type="button"
          onClick={() => setActivePage('workspace')}
          className="inline-flex items-center gap-1.5 text-xs text-[#697775] hover:text-[#176D70] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Workspace</span>
        </button>

        {/* Profile Card */}
        <div className="bg-[#FFFFFF] border border-[#DCE5E1] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#DCE5E1] pb-4 flex items-center justify-between">
            <h1 className="font-display text-2xl sm:text-3xl text-[#15201F] tracking-tight font-bold">
              Operator Profile
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#E4F1EF] text-[#176D70] font-mono text-[10px] font-semibold">
              Authenticated Session
            </span>
          </div>

          {/* User Identity Presentation */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#176D70] text-white flex items-center justify-center font-mono text-lg font-bold shadow-xs shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-[#15201F] truncate">
                {displayName}
              </h2>
              {displayEmail && (
                <p className="text-xs text-[#697775] truncate mt-0.5 font-sans">
                  {displayEmail}
                </p>
              )}
            </div>
          </div>

          {/* User Fields (Strictly Real Data) */}
          <div className="space-y-3 pt-1">
            <div className="p-3.5 rounded-xl bg-[#F0F4F2] border border-[#DCE5E1] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-[#697775]">
                <User className="w-4 h-4 text-[#176D70]" />
                <span className="font-medium">Operator Name</span>
              </div>
              <span className="text-xs font-semibold text-[#15201F] text-right truncate">
                {displayName}
              </span>
            </div>

            {displayEmail && (
              <div className="p-3.5 rounded-xl bg-[#F0F4F2] border border-[#DCE5E1] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-[#697775]">
                  <Mail className="w-4 h-4 text-[#176D70]" />
                  <span className="font-medium">Email</span>
                </div>
                <span className="text-xs font-semibold text-[#15201F] text-right truncate">
                  {displayEmail}
                </span>
              </div>
            )}
          </div>

          {/* Collapsible Technical Details (Section 15 Progressive Disclosure) */}
          <div className="border border-[#DCE5E1] rounded-xl overflow-hidden bg-[#FFFFFF]">
            <button
              type="button"
              onClick={() => setTechDetailsOpen(!techDetailsOpen)}
              className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[#F0F4F2] transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-mono text-[#697775]">
                <Cpu className="w-3.5 h-3.5 text-[#176D70]" />
                <span>Technical Details</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[#697775] transition-transform ${techDetailsOpen ? 'rotate-180' : ''}`} />
            </button>

            {techDetailsOpen && (
              <div className="p-4 bg-[#F0F4F2] border-t border-[#DCE5E1] font-mono text-[11px] space-y-2 text-[#15201F] animate-in fade-in duration-150">
                <div className="flex justify-between">
                  <span className="text-[#697775]">Replica Node ID:</span>
                  <span className="font-semibold text-[#176D70]">{replicaA.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#697775]">Session Mode:</span>
                  <span>{user?.authMode || 'LOCAL / DEMO'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#697775]">Key Fingerprint:</span>
                  <span>{user?.ed25519Fingerprint || '7F8C·914B·22D1·D91A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#697775]">Storage Substrate:</span>
                  <span className="text-[#2F7D68] font-semibold">IndexedDB Partitioned</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions: Logout */}
          <div className="pt-2 border-t border-[#DCE5E1]">
            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 px-4 rounded-xl border border-[#DCE5E1] text-[#697775] hover:text-[#B94A48] hover:border-[#B94A48]/30 hover:bg-[#B94A48]/5 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
            <p className="text-[11px] text-[#697775] text-center mt-2 font-sans">
              Logging out clears your active session. Local workspace data and pending edits remain preserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
