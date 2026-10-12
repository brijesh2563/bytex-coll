import { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { Preloader } from './components/ui/Preloader';
import { PageCurtain } from './components/navigation/PageCurtain';
import { AppShell } from './components/layout/AppShell';
import { WorkspacePage } from './pages/WorkspacePage';
import { MyTasksPage } from './pages/MyTasksPage';
import { PendingChangesPage } from './pages/PendingChangesPage';
import { ConflictResolverPage } from './pages/ConflictResolverPage';
import { ConflictRadarPage } from './pages/ConflictRadarPage';
import { ConflictImpactPage } from './pages/ConflictImpactPage';
import { VectorTimelinePage } from './pages/VectorTimelinePage';
import { VersionHistoryPage } from './pages/VersionHistoryPage';
import { ConvergenceLabPage } from './pages/ConvergenceLabPage';
import { EngineProofsPage } from './pages/EngineProofsPage';
import { StatusPage } from './pages/StatusPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthGatePage } from './pages/AuthGatePage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import { MotionLabPage } from './pages/MotionLabPage';
import { useSyncStore } from './store/useSyncStore';

export default function App() {
  const {
    activePage,
    setActivePage,
    initWorkspace,
    setBrowserOnlineStatus,
    user,
  } = useSyncStore();

  const [preloaderComplete, setPreloaderComplete] = useState(false);

  // NexusSync Fixed Pearl × Deep Teal theme identity
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'pearl');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Synchronize hash routing with store and enforce truthful auth gate
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace('#', '');
      const currentUser = useSyncStore.getState().user;
      const isAuth = !!currentUser?.isAuthenticated;
      const publicRoutes = ['login', 'signin', 'signup', 'register', 'auth', 'gate'];

      let targetPage = rawHash;
      if (!targetPage) {
        targetPage = isAuth ? 'workspace' : 'login';
      } else if (!isAuth && !publicRoutes.includes(targetPage)) {
        targetPage = 'login';
      }

      setActivePage(targetPage);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setActivePage]);

  // Initialize Lenis smooth scroll active only after the preloader completes
  useEffect(() => {
    if (!preloaderComplete) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let animationFrameId;
    function raf(time) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }
    animationFrameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, [preloaderComplete]);

  // Initialize IndexedDB workspace and real browser connectivity listeners
  useEffect(() => {
    initWorkspace();

    const handleOnline = () => setBrowserOnlineStatus(true);
    const handleOffline = () => setBrowserOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [initWorkspace, setBrowserOnlineStatus]);

  // Page switcher with strict unauthenticated gating
  const renderCurrentPage = () => {
    // Unauthenticated sessions: render only auth flow pages (Login first)
    if (!user || !user.isAuthenticated) {
      switch (activePage) {
        case 'signup':
        case 'register':
          return <SignupPage />;
        case 'auth':
        case 'gate':
          return <AuthGatePage />;
        case 'login':
        case 'signin':
        default:
          return <LoginPage />;
      }
    }

    // Authenticated sessions: allow all instrument pages
    switch (activePage) {
      case 'workspace':
        return <WorkspacePage />;
      case 'my-tasks':
      case 'tasks':
        return <MyTasksPage />;
      case 'pending':
      case 'pending-changes':
        return <PendingChangesPage />;
      case 'conflicts':
      case 'resolver':
        return <ConflictResolverPage />;
      case 'conflict-radar':
      case 'radar':
        return <ConflictRadarPage />;
      case 'conflict-impact':
      case 'impact':
        return <ConflictImpactPage />;
      case 'history':
      case 'version-history':
        return <VersionHistoryPage />;
      case 'timeline':
      case 'vector-timeline':
        return <VectorTimelinePage />;
      case 'simulation':
      case 'lab':
      case 'convergence-lab':
        return <ConvergenceLabPage />;
      case 'proofs':
      case 'engine-proofs':
        return <EngineProofsPage />;
      case 'status':
      case 'system-status':
        return <StatusPage />;
      case 'admin':
        return <AdminPage />;
      case 'settings':
        return <SettingsPage />;
      case 'motion-lab':
        return <MotionLabPage />;
      case 'profile':
        return <ProfilePage />;
      case 'home':
      case 'observatory':
      default:
        return <WorkspacePage />;
    }
  };

  // 1. UNAUTHENTICATED EXPERIENCE: Self-contained auth flow without desktop workspace shell
  if (!user || !user.isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F6F8F6] text-[#15201F] relative flex flex-col selection:bg-[#176D70] selection:text-white transition-colors duration-300">
        <PageCurtain />
        <Preloader onComplete={() => setPreloaderComplete(true)} />
        <main className="flex-1 w-full flex flex-col">
          {renderCurrentPage()}
        </main>
      </div>
    );
  }

  // 2. AUTHENTICATED EXPERIENCE: Persistent AppShell (Left Sidebar + Top Workspace Bar + Main Content Area)
  return (
    <div className="min-h-screen bg-[#F6F8F6] text-[#15201F] relative flex flex-col selection:bg-[#176D70] selection:text-white transition-colors duration-300">
      <PageCurtain />
      <Preloader onComplete={() => setPreloaderComplete(true)} />
      <AppShell>
        {renderCurrentPage()}
      </AppShell>
    </div>
  );
}
