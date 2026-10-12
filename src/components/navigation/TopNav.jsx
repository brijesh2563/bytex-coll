import { useState, useEffect, useRef } from 'react';
import { useSyncStore } from '../../store/useSyncStore';
import {
  Activity,
  Layers,
  GitFork,
  History,
  Radio,
  User,
  LogOut,
  LogIn,
  UserPlus,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

export function TopNav() {
  const {
    activePage,
    setActivePage,
    conflicts,
    replicaA,
    replicaB,
    user,
    logout,
  } = useSyncStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const pendingOpsCount = (replicaA.pendingOps?.length || 0) + (replicaB.pendingOps?.length || 0);

  const navItems = [
    { id: 'home', label: 'Home', icon: Activity },
    { id: 'workspace', label: 'Workspace', icon: Layers, badge: pendingOpsCount > 0 ? `${pendingOpsCount}` : null },
    { id: 'conflicts', label: 'Conflicts', icon: GitFork, badge: conflicts.length > 0 ? `${conflicts.length}` : null, badgeVariant: 'ochre' },
    { id: 'history', label: 'History', icon: History },
    { id: 'lab', label: 'Lab', icon: Radio },
  ];

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setMobileMenuOpen(false);
  };

  // Keyboard accessibility & click outside handling for profile dropdown
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Derived user display properties
  const getInitials = (name) => {
    if (!name) return 'O';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayName = user?.name || 'Operator';
  const firstName = displayName.split(' ')[0];
  const initials = getInitials(displayName);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#DCE5E1] bg-[#F6F8F6]/95 backdrop-blur-md">
      <style>{`
        /* Profile Dropdown Transition (Target 180-240ms) */
        @keyframes profileMenuEnter {
          0% {
            opacity: 0;
            transform: translateY(-4px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .profile-menu-dropdown {
          animation: profileMenuEnter 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top right;
        }

        @media (prefers-reduced-motion: reduce) {
          .profile-menu-dropdown {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* BRAND */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick(user?.isAuthenticated ? 'observatory' : 'login')}
            className="flex items-baseline gap-2 group text-left cursor-pointer focus:outline-hidden"
            title={user?.isAuthenticated ? 'NexusSync Observatory' : 'NexusSync Operator Login'}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#176D70] transition-transform group-hover:scale-125" />
            <span className="font-display text-2xl tracking-tight text-[#15201F] font-semibold">
              Nexus<span className="italic text-[#176D70]">Sync</span>
            </span>
          </button>
        </div>

        {/* PRIMARY DESKTOP NAVIGATION TABS */}
        {user?.isAuthenticated ? (
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === 'home'
                ? (activePage === 'home' || activePage === 'observatory')
                : activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#176D70] text-white font-bold shadow-xs'
                      : 'text-[#697775] hover:text-[#15201F] hover:bg-[#FFFFFF]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#176D70]'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                        item.badgeVariant === 'ochre'
                          ? 'bg-[#C4872D] text-white'
                          : 'bg-[#F0F4F2] text-[#15201F]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        ) : (
          <nav className="hidden lg:flex items-center gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => handleNavClick('login')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activePage === 'login' || activePage === 'signin'
                  ? 'bg-[#176D70] text-white font-bold shadow-xs'
                  : 'text-[#697775] hover:text-[#15201F] hover:bg-[#FFFFFF]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('signup')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activePage === 'signup' || activePage === 'register'
                  ? 'bg-[#176D70] text-white font-bold shadow-xs'
                  : 'text-[#697775] hover:text-[#15201F] hover:bg-[#FFFFFF]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </nav>
        )}

        {/* TOP-RIGHT CONTROLS */}
        <div className="flex items-center gap-3 shrink-0">
          {user?.isAuthenticated ? (
            /* COMPACT USER CONTROL: [Initial] Name ▾ */
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 py-1 px-2 rounded-full border border-[#DCE5E1] bg-[#FFFFFF] hover:border-[#176D70] transition-colors cursor-pointer text-xs text-[#15201F] focus:outline-hidden focus:ring-2 focus:ring-[#176D70]"
              >
                {/* Small avatar circle */}
                <div className="w-6 h-6 rounded-full bg-[#176D70] text-white flex items-center justify-center font-mono text-[11px] font-bold shrink-0">
                  {initials}
                </div>
                {/* User/operator name */}
                <span className="font-medium max-w-[120px] truncate">
                  {firstName}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#697775] transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* PROFILE DROPDOWN MENU (ONLY Profile & Logout) */}
              {userMenuOpen && (
                <div
                  role="menu"
                  aria-orientation="vertical"
                  className="profile-menu-dropdown absolute right-0 mt-2 w-64 bg-[#FFFFFF] border border-[#DCE5E1] rounded-xl shadow-lg py-1.5 z-50 text-[#15201F]"
                >
                  {/* User details header */}
                  <div className="px-4 py-3 border-b border-[#DCE5E1] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#176D70] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-[#15201F] truncate">
                        {displayName}
                      </div>
                      {user.email && (
                        <div className="text-xs text-[#697775] truncate mt-0.5">
                          {user.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: ONLY Profile & Logout */}
                  <div className="pt-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        handleNavClick('profile');
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#F0F4F2] flex items-center gap-2.5 text-xs text-[#15201F] font-medium transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[#176D70]" />
                      <span>Profile</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#F0F4F2] flex items-center gap-2.5 text-xs text-[#697775] hover:text-[#B94A48] font-medium transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-[#697775]" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Unauthenticated Compact CTA for Desktop / Tablet */
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleNavClick('login')}
                className="px-3 py-1.5 rounded-lg border border-[#DCE5E1] bg-[#FFFFFF] hover:border-[#176D70] text-xs font-medium text-[#15201F] cursor-pointer transition-colors"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-md hover:bg-[#FFFFFF] text-[#15201F] cursor-pointer border border-[#DCE5E1]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE EXPANDED MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-4 bg-[#FFFFFF] border-b border-[#DCE5E1] space-y-1 font-mono text-xs">
          {user?.isAuthenticated ? (
            <>
              {/* User Identity Header in Mobile Drawer */}
              <div className="px-3 py-2.5 mb-2 rounded-lg bg-[#F0F4F2] border border-[#DCE5E1] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#176D70] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-[#15201F] truncate">
                    {displayName}
                  </div>
                  {user.email && (
                    <div className="text-[10px] text-[#697775] truncate">
                      {user.email}
                    </div>
                  )}
                </div>
              </div>

              {/* Primary Mobile Navigation Links */}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === 'home'
                  ? (activePage === 'home' || activePage === 'observatory')
                  : activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                      isActive
                        ? 'bg-[#176D70] text-white font-bold'
                        : 'text-[#15201F] hover:bg-[#F6F8F6]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-[#C4872D] text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Integrated Mobile Profile & Logout */}
              <div className="pt-2 border-t border-[#DCE5E1] flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => handleNavClick('profile')}
                  className="w-full text-left px-3 py-2 rounded text-[#15201F] hover:bg-[#F0F4F2] flex items-center gap-2 font-medium"
                >
                  <User className="w-4 h-4 text-[#176D70]" />
                  <span>Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded text-[#697775] hover:text-[#B94A48] hover:bg-[#B94A48]/5 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handleNavClick('login')}
                className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${
                  activePage === 'login' || activePage === 'signin'
                    ? 'bg-[#176D70] text-white font-bold'
                    : 'text-[#697775] hover:bg-[#F6F8F6]'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('signup')}
                className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${
                  activePage === 'signup' || activePage === 'register'
                    ? 'bg-[#176D70] text-white font-bold'
                    : 'text-[#176D70] font-bold hover:bg-[#F6F8F6]'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
