import { useState } from 'react';
import { useSyncStore } from '../store/useSyncStore';
import { registerOperator } from '../core/authAdapter';
import { AuthVisualSide } from '../components/ui/AuthVisualSide';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export function SignupPage() {
  const { signup, setActivePage } = useSyncStore();

  const [operatorName, setOperatorName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isInitializing, setIsInitializing] = useState(false);
  const [sessionOpened, setSessionOpened] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [shake, setShake] = useState(false);

  const isNameValid = operatorName.trim().length >= 2;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = password.length >= 6;
  const isConfirmValid = confirmPassword.length >= 6 && confirmPassword === password;

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmValid) {
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
      } else if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
      } else {
        setErrorMessage('Please fill in all fields with valid information.');
      }
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    setErrorMessage(null);
    setIsInitializing(true);

    try {
      const res = await registerOperator({
        name: operatorName,
        email,
        password,
      });

      if (res.success) {
        setIsInitializing(false);
        setSessionOpened(true);

        // Commit to store
        signup(res.operator);

        // Transition to home
        setTimeout(() => {
          setActivePage('home');
        }, 1200);
      } else {
        setIsInitializing(false);
        setErrorMessage('Could not create account. Please try again.');
        setShake(true);
        setTimeout(() => setShake(false), 400);
      }
    } catch {
      setIsInitializing(false);
      setErrorMessage('Account creation service unavailable. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] py-6 sm:py-10 w-full animate-mech-fade">
      <style>{`
        /* Smooth 600-850ms Transition for Form Content */
        @keyframes signupFormEntrance {
          0% {
            opacity: 0;
            transform: translateY(14px) translateZ(-8px) rotateX(2.5deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) translateZ(0) rotateX(0deg);
          }
        }

        .signup-form-3d {
          animation: signupFormEntrance 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
          transform-style: preserve-3d;
        }

        .signup-stagger-1 { animation: signupFormEntrance 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both; }
        .signup-stagger-2 { animation: signupFormEntrance 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.16s both; }
        .signup-stagger-3 { animation: signupFormEntrance 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.24s both; }
        .signup-stagger-4 { animation: signupFormEntrance 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.32s both; }
        .signup-stagger-5 { animation: signupFormEntrance 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.40s both; }

        @media (prefers-reduced-motion: reduce) {
          .signup-form-3d,
          .signup-stagger-1,
          .signup-stagger-2,
          .signup-stagger-3,
          .signup-stagger-4,
          .signup-stagger-5 {
            animation: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        {/* LEFT COLUMN: Stable 40-45% Desktop Brand & 3D Instrument */}
        <div className="lg:col-span-5 flex flex-col">
          <AuthVisualSide />
        </div>

        {/* RIGHT COLUMN: 55-60% Signup Form */}
        <div
          className={`lg:col-span-7 flex flex-col justify-center space-y-6 signup-form-3d ${
            shake ? 'animate-mech-shake' : ''
          }`}
        >
          {/* Header Title */}
          <div className="space-y-1.5 signup-stagger-1">
            <h1 className="font-display text-3xl sm:text-4xl text-[#15201F] tracking-tight">
              Create your account
            </h1>
            <p className="font-newsreader text-base text-[#697775] leading-relaxed">
              Start collaborating with real-time consistency.
            </p>
          </div>

          {/* Success Plate */}
          {sessionOpened ? (
            <div className="bg-[#FFFFFF] border-2 border-[#176D70] rounded-2xl p-6 sm:p-8 shadow-sm space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#E4F1EF] text-[#176D70] flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="font-display text-2xl text-[#15201F]">
                  Account Created
                </h2>
                <p className="text-sm text-[#697775]">
                  Opening your workspace...
                </p>
              </div>
            </div>
          ) : (
            /* Main Signup Card */
            <div className="bg-[#FFFFFF] border border-[#DCE5E1] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-[#B94A48]/10 border border-[#B94A48]/30 text-[#B94A48] text-xs font-mono flex items-center gap-2">
                  <span>⚠ {errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                {/* Operator Name Field */}
                <div className="space-y-1.5 signup-stagger-1">
                  <label
                    htmlFor="signup-name"
                    className="block text-xs font-medium text-[#15201F]"
                  >
                    Operator Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-[#697775] absolute left-3 pointer-events-none" />
                    <input
                      id="signup-name"
                      type="text"
                      required
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#F6F8F6] border border-[#DCE5E1] text-[#15201F] text-sm focus:outline-hidden focus:border-[#176D70] focus:ring-1 focus:ring-[#176D70] transition-colors"
                      placeholder="e.g. Man Chaudhary"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-1.5 signup-stagger-2">
                  <label
                    htmlFor="signup-email"
                    className="block text-xs font-medium text-[#15201F]"
                  >
                    Email
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-[#697775] absolute left-3 pointer-events-none" />
                    <input
                      id="signup-email"
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
                <div className="space-y-1.5 signup-stagger-3">
                  <label
                    htmlFor="signup-password"
                    className="block text-xs font-medium text-[#15201F]"
                  >
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#697775] absolute left-3 pointer-events-none" />
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-[#F6F8F6] border border-[#DCE5E1] text-[#15201F] text-sm focus:outline-hidden focus:border-[#176D70] focus:ring-1 focus:ring-[#176D70] transition-colors"
                      placeholder="Minimum 6 characters"
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

                {/* Confirm Password Field */}
                <div className="space-y-1.5 signup-stagger-4">
                  <label
                    htmlFor="signup-confirm-password"
                    className="block text-xs font-medium text-[#15201F]"
                  >
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#697775] absolute left-3 pointer-events-none" />
                    <input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-[#F6F8F6] border border-[#DCE5E1] text-[#15201F] text-sm focus:outline-hidden focus:border-[#176D70] focus:ring-1 focus:ring-[#176D70] transition-colors"
                      placeholder="Re-enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 p-1 text-[#697775] hover:text-[#176D70] transition cursor-pointer"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2 signup-stagger-5">
                  <button
                    type="submit"
                    disabled={isInitializing}
                    className="w-full py-3 px-4 rounded-xl text-white bg-[#176D70] hover:bg-[#13585A] font-medium text-sm transition-all duration-200 shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:translate-y-[1px]"
                  >
                    {isInitializing ? (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>Creating account...</span>
                      </div>
                    ) : (
                      <>
                        <span>CREATE ACCOUNT</span>
                        <ArrowRight className="w-4 h-4 ml-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Secondary Switch to Login */}
              <div className="pt-2 border-t border-[#DCE5E1] flex items-center justify-between text-xs text-[#697775]">
                <span>Already have an account?</span>
                <button
                  type="button"
                  onClick={() => setActivePage('login')}
                  className="text-[#176D70] hover:text-[#13585A] font-semibold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
