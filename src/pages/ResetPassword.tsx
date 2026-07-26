import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowLeft, ShieldAlert, KeyRound } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { resetPasswordApi } from '../api/auth.api';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [checkingSession, setCheckingSession] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);

  // Check URL hash/query parameters for Password Recovery Token
  useEffect(() => {
    const checkRecoveryToken = () => {
      try {
        const hash = window.location.hash;
        const search = window.location.search;
        const rawParams = hash ? hash.substring(1) : search ? search.substring(1) : '';
        const params = new URLSearchParams(rawParams);

        const type = params.get('type');
        const token = params.get('access_token') || params.get('token') || params.get('refresh_token');

        if (type === 'recovery' || token) {
          if (token) {
            setRecoveryToken(token);
          }
          setIsValidToken(true);
        } else {
          // If no token in URL, check if local storage has a pending recovery session
          const savedToken = localStorage.getItem('tpo_token');
          if (savedToken) {
            setRecoveryToken(savedToken);
            setIsValidToken(true);
          } else {
            setIsValidToken(false);
          }
        }
      } catch (err) {
        setIsValidToken(false);
      } finally {
        setCheckingSession(false);
      }
    };

    checkRecoveryToken();
  }, []);

  // Calculate Password Strength in Realtime (Score 0 to 4)
  const calculateStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-[#202D42]', textColor: 'text-gray-500' };

    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-400' };
    if (score === 3) return { score: 2, label: 'Medium', color: 'bg-amber-500', textColor: 'text-amber-400' };
    if (score === 4) return { score: 3, label: 'Strong', color: 'bg-sky-500', textColor: 'text-sky-400' };
    return { score: 4, label: 'Very Strong', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
  };

  const strength = calculateStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!newPassword) {
      setErrorMessage('Password is required');
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      setErrorMessage('Password must be between 8 and 128 characters');
      return;
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setErrorMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return;
    }

    if (!confirmPassword) {
      setErrorMessage('Please confirm your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await resetPasswordApi({
        token: recoveryToken || '',
        password: newPassword,
      });

      // Clear recovery tokens from storage
      localStorage.removeItem('tpo_token');
      localStorage.removeItem('tpo_refresh_token');
      localStorage.removeItem('tpo_user');

      setSubmitting(false);
      const msg = 'Password has been reset successfully.';
      setSuccessMessage(msg);
      success('Password Reset Complete', msg);

      // Start 3 second redirect countdown to /login
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            navigate('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setSubmitting(false);
      const backendMsg =
        err.response?.data?.message ||
        err.message ||
        'Unable to update password. Reset link may have expired.';
      setErrorMessage(backendMsg);
      toastError('Reset Failed', backendMsg);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex items-center justify-center p-4 sm:p-6 font-sans selection:bg-[#A3E635] selection:text-black relative overflow-hidden">
      {/* Background Decorative Radial Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#A3E635]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#38BDF8]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#101726]/90 border border-[#202D42] backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10">
        {checkingSession ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="w-10 h-10 text-[#A3E635] animate-spin mb-4" />
            <p className="text-xs text-[#94A3B8] font-semibold">Verifying password recovery link...</p>
          </div>
        ) : !isValidToken ? (
          <div className="text-center py-4 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Invalid or Expired Link</h2>
              <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
                Reset link is invalid or has expired. Password recovery tokens are valid for a single request.
              </p>
            </div>
            <div className="pt-4 border-t border-[#202D42]">
              <Link
                to="/forgot-password"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#162032] hover:bg-[#202D42] border border-[#202D42] text-[#A3E635] font-bold py-3 rounded-xl text-xs transition-colors"
              >
                <span>Request New Reset Link</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#162032] border border-[#A3E635]/30 text-[#A3E635] flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(163,230,53,0.15)]">
                <KeyRound className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Reset Password</h1>
              <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
                Enter your new secure password below to update your account credentials.
              </p>
            </div>

            {/* Success Banner */}
            {successMessage && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col gap-2 text-emerald-400 text-xs font-medium">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{successMessage}</span>
                </div>
                {countdown !== null && (
                  <p className="text-[11px] text-emerald-300/80 pl-7">
                    Redirecting to login in <span className="font-extrabold">{countdown}</span> seconds...
                  </p>
                )}
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-400 text-xs font-medium">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label htmlFor="new-password-input" className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    id="new-password-input"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    maxLength={128}
                    disabled={submitting || !!successMessage}
                    aria-label="New Password"
                    className="w-full bg-[#162032] border border-[#202D42] focus:border-[#A3E635] rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-[#64748B] focus:outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Realtime Indicator */}
                {newPassword && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#64748B]">Password Strength:</span>
                      <span className={`font-bold ${strength.textColor}`}>{strength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#162032] rounded-full overflow-hidden flex gap-1 p-0.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            step <= strength.score ? strength.color : 'bg-[#202D42]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm-password-input" className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    id="confirm-password-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    maxLength={128}
                    disabled={submitting || !!successMessage}
                    aria-label="Confirm Password"
                    className="w-full bg-[#162032] border border-[#202D42] focus:border-[#A3E635] rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-[#64748B] focus:outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !!successMessage}
                className="w-full bg-[#A3E635] hover:bg-[#b4f046] text-[#0B0F17] font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:shadow-[0_0_25px_rgba(163,230,53,0.5)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Reset Password</span>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#202D42] text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#94A3B8] hover:text-[#A3E635] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Login</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
