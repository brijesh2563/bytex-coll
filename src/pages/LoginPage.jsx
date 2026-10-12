import { useState } from 'react';
import { useSyncStore } from '../store/useSyncStore';
import { authenticateOperator, DEMO_OPERATORS } from '../core/authAdapter';
import { AuthVisualSide } from '../components/ui/AuthVisualSide';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export function LoginPage() {
  const { login, setActivePage } = useSyncStore();

  const [email, setEmail] = useState('aarav@nexussync.org');
  const [password, setPassword] = useState('causal-clock-2026');
  const [showPassword, setShowPassword] = useState(false);

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [sessionOpened, setSessionOpened] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [shake, setShake] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordEntered = password.length > 0;

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!isEmailValid || !isPasswordEntered) {
      setErrorMessage('Please enter a valid email address and password.');
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    setErrorMessage(null);
    setIsAuthenticating(true);

    try {
      const res = await authenticateOperator(email, password);

      if (res.success) {
        setIsAuthenticating(false);
        setSessionOpened(true);

        // Commit user session to store
        login(res.operator);

        // Transition smoothly to home
        setTimeout(() => {
          setActivePage('home');
        }, 1200);
      } else {
        setIsAuthenticating(false);
        setErrorMessage('Unable to sign in with these credentials.');
        setShake(true);
        setTimeout(() => setShake(false), 400);
      }
    } catch {
      setIsAuthenticating(false);
      setErrorMessage('Sign in service unavailable. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  const handleQuickDemo = (profile) => {
    setEmail(profile.email);
    setPassword('causal-clock-2026');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] py-6 sm:py-10 w-full animate-mech-fade">
      <style>{`
        /* Phase E: Restrained 3D Auth Form Entrance */
        @keyframes authFormEntrance {
          0% {
            opacity: 0;
            transform: translateY(14px) translateZ(-8px) rotateX(2.5deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) translateZ(0) rotateX(0deg);
          }
        }

        .auth-form-3d {
          animation: authFormEntrance 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
          transform-style: preserve-3d;
        }

        .auth-stagger-1 { animation: authFormEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both; }
        .auth-stagger-2 { animation: authFormEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.7s both; }
        .auth-stagger-3 { animation: authFormEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both; }
        .auth-stagger-4 { animation: authFormEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.9s both; }

        @media (prefers-reduced-motion: reduce) {
          .auth-form-3d,
          .auth-stagger-1,
          .auth-stagger-2,
          .auth-stagger-3,
          .auth-stagger-4 {
            animation: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        {/* LEFT COLUMN: 40-45% Desktop Brand & 3D Instrument */}
        <div className="lg:col-span-5 flex flex-col">
          <AuthVisualSide />
        </div>

        {/* RIGHT COLUMN: 55-60% Login Form */}
        <div
          className={`lg:col-span-7 flex flex-col justify-center space-y-6 auth-form-3d ${
            shake ? 'animate-mech-shake' : ''
          }`}
        >
          {/* Header Title */}
          <div className="space-y-1.5 auth-stagger-1">
            <h1 className="font-display text-3xl sm:text-4xl text-[#15201F] tracking-tight">
              Welcome back
            </h1>
            <p className="font-newsreader text-base text-[#697775] leading-relaxed">
              Sign in to continue to your workspace.
            </p>
          </div>

          {/* Session Opened Success Plate */}
          {sessionOpened ? (
            <div className="bg-[#FFFFFF] border-2 border-[#176D70] rounded-2xl p-6 sm:p-8 shadow-sm space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#E4F1EF] text-[#176D70] flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="font-display text-2xl text-[#15201F]">
                  Signed In Successfully
                </h2>
                <p className="text-sm text-[#697775]">
                  Opening your workspace...
                </p>
              </div>
            </div>
          ) : (
            /* Main Login Card */
            <div className="bg-[#FFFFFF] border border-[#DCE5E1] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-[#B94A48]/10 border border-[#B94A48]/30 text-[#B94A48] text-xs font-mono flex items-center gap-2">
                  <span>⚠ {errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5 auth-stagger-2">
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-medium text-[#15201F]"
                  >
                    Email
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-[#697775] absolute left-3 pointer-events-none" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#F6F8F6] border border-[#DCE5E1] text-[#15201F] text-sm focus:outline-hidden focus:border-[#176D70] focus:ring-1 focus:ring-[#176D70] transition-colors"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5 auth-stagger-3">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-medium text-[#15201F]"
                  >
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#697775] absolute left-3 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-[#F6F8F6] border border-[#DCE5E1] text-[#15201F] text-sm focus:outline-hidden focus:border-[#176D70] focus:ring-1 focus:ring-[#176D70] transition-colors"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 p-1 text-[#697775] hover:text-[#176D70] transition cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2 auth-stagger-4">
                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full py-3 px-4 rounded-xl text-white bg-[#176D70] hover:bg-[#13585A] font-medium text-sm transition-all duration-200 shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:translate-y-[1px]"
                  >
                    {isAuthenticating ? (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <>
                        <span>SIGN IN</span>
                        <ArrowRight className="w-4 h-4 ml-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Demo Quick Accounts */}
              <div className="pt-4 border-t border-[#DCE5E1] space-y-2">
                <span className="text-[11px] font-medium text-[#697775] block">
                  Demo Accounts
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {DEMO_OPERATORS.map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => handleQuickDemo(op)}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                        email === op.email
                          ? 'border-[#176D70] bg-[#E4F1EF]/40 text-[#176D70]'
                          : 'border-[#DCE5E1] bg-[#F6F8F6] text-[#15201F] hover:border-[#176D70]'
                      }`}
                    >
                      <div className="font-semibold truncate">{op.name}</div>
                      <div className="text-[10px] text-[#697775] truncate">{op.role}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Switch to Signup */}
              <div className="pt-2 border-t border-[#DCE5E1] flex items-center justify-between text-xs text-[#697775]">
                <span>New to NexusSync?</span>
                <button
                  type="button"
                  onClick={() => setActivePage('signup')}
                  className="text-[#176D70] hover:text-[#13585A] font-semibold hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
