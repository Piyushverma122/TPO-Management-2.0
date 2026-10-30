import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/app/Toast';
import { Input as ShadInput } from '@/components/ui/input';
import { Button as ShadButton } from '@/components/ui/button';

export const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Valid email address is required');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setLoading(false);
      const msg = 'Password reset link has been sent successfully.';
      setSuccessMessage(msg);
      success('Reset Link Sent', msg);
    } catch (err: any) {
      setLoading(false);
      const backendMsg =
        err.response?.data?.message ||
        err.message ||
        'Unable to send reset email.';
      setErrorMessage(backendMsg);
      toastError('Error', backendMsg);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 font-sans selection:bg-primary selection:text-black relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-sky-400/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md bg-muted/90 border border-border rounded-2xl p-6 sm:p-8  relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-card border border-primary/30 text-primary flex items-center justify-center mb-4">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Forgot Password?</h1>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Enter your institutional email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-400 text-xs font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="forgot-email" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Institutional Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <ShadInput
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@tpo.com"
                maxLength={255}
                disabled={loading}
                aria-label="Institutional Email Address"
                className="h-auto w-full bg-card dark:bg-card rounded-xl pl-10 pr-4 py-3 text-xs text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <ShadButton
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary text-primary-foreground font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending Reset Link...</span>
              </>
            ) : (
              <span>Send Reset Link</span>
            )}
          </ShadButton>
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
