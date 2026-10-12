import { useState, useRef, useEffect } from 'react';
import { useSyncStore } from '../../store/useSyncStore';
import { User, LogOut, ChevronDown } from 'lucide-react';

/**
 * UserMenu
 * Authenticated user control with real session identity.
 * Dropdown items: Profile, Logout ONLY.
 */
export function UserMenu() {
  const { user, logout, setActivePage } = useSyncStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const getInitials = (name) => {
    if (!name) return 'OP';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayName = user?.name || 'Station Operator';
  const initials = getInitials(displayName);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleProfileClick = () => {
    setIsOpen(false);
    setActivePage('profile');
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-[#DCE5E1] bg-[#FFFFFF] hover:bg-[#F0F4F2] transition text-[#15201F] cursor-pointer shadow-2xs group"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User navigation menu"
      >
        <span className="w-7 h-7 rounded-lg bg-[#176D70] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
          {initials}
        </span>
        <span className="font-sans text-xs font-medium text-[#15201F] max-w-[130px] truncate hidden sm:inline">
          {displayName}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#697775] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-[#FFFFFF] border border-[#DCE5E1] shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-[#DCE5E1]">
            <p className="font-sans text-xs font-semibold text-[#15201F] truncate">
              {displayName}
            </p>
            {user?.email && (
              <p className="font-sans text-[11px] text-[#697775] truncate">
                {user.email}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleProfileClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#15201F] hover:bg-[#F0F4F2] hover:text-[#176D70] transition-colors cursor-pointer text-left"
          >
            <User className="w-3.5 h-3.5 text-[#176D70]" />
            <span>Profile</span>
          </button>

          <button
            type="button"
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#B94A48] hover:bg-[#FBEBEB] transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-3.5 h-3.5 text-[#B94A48]" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
