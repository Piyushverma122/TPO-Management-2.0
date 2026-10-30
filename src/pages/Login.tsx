import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Handshake,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/app/Toast';
import { Input } from '../components/app/Input';
import { Button } from '../components/app/Button';
import { Checkbox } from '../components/app/Checkbox';
import { Modal } from '../components/app/Modal';
import { BrandMark } from '../components/app/BrandMark';

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, forgotPassword } = useAuth();
  const { success, error: toastError } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      setIsLoading(false);
      success('Logged In Successfully', 'Welcome back to Smart Placement & TPO Platform.');
      navigate('/dashboard');
    } catch (err: any) {
      setIsLoading(false);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please check your credentials.';
      toastError('Login Failed', errMsg);
    }
  };

  const handleForgotSubmit = async () => {
    if (!forgotEmail) {
      toastError('Validation Error', 'Please enter a valid institutional email address.');
      return;
    }
    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail);
      setForgotLoading(false);
      setForgotModalOpen(false);
      success('Reset Link Sent', 'Check your email inbox for password reset instructions.');
    } catch (err: any) {
      setForgotLoading(false);
      const errMsg = err.response?.data?.message || 'Failed to send password reset link.';
      toastError('Error', errMsg);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground grid grid-cols-1 lg:grid-cols-2 font-sans">
      {/* LEFT: brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-border bg-card p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle,var(--muted-foreground)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
          aria-hidden
        />

        {/* Brand */}
        <div className="relative flex items-center gap-3">
          <BrandMark className="h-10 w-10" />
          <span className="text-base font-semibold tracking-tight">Smart Placement & TPO</span>
        </div>

        {/* Headline + features */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative space-y-10"
        >
          <div className="space-y-4">
            <h1 className="text-5xl font-semibold leading-[1.1] tracking-tight">
              One place for every
              <span className="block text-muted-foreground">campus placement.</span>
            </h1>
            <p className="max-w-md text-base text-muted-foreground">
              Drives, applications, interviews and offers, managed together by students, recruiters and the TPO cell.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              { icon: Building2, title: 'Recruiter network', text: 'Companies onboard, publish drives and shortlist in one flow.' },
              { icon: Handshake, title: 'Track every stage', text: 'From application to offer letter with live status updates.' },
              { icon: BarChart3, title: 'Placement analytics', text: 'Department, package and trend reports ready to export.' },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <dl className="grid grid-cols-3 divide-x divide-border rounded-3xl border border-border bg-background/40">
            {[
              ['94.8%', 'Placement rate'],
              ['500+', 'Recruiters'],
              ['₹24.5L', 'Top offer'],
            ].map(([value, label]) => (
              <div key={label} className="px-5 py-4">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-tight">{value}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        {/* Testimonial */}
        <figure className="relative rounded-3xl border border-border bg-background/40 p-6">
          <blockquote className="text-sm leading-relaxed text-muted-foreground">
            &ldquo;Applying, tracking interviews and accepting my offer all happened in one dashboard. No more
            spreadsheets.&rdquo;
          </blockquote>
          <figcaption className="mt-4 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold">SL</span>
            <span className="text-sm">
              <span className="block font-medium">Sophia Lin</span>
              <span className="block text-xs text-muted-foreground">Placed @ Deloitte</span>
            </span>
          </figcaption>
        </figure>
      </aside>

      {/* RIGHT: sign in */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="w-full max-w-sm space-y-8"
        >
          {/* Mobile brand */}
          <div className="flex items-center gap-3 lg:hidden">
            <BrandMark />
            <span className="text-base font-semibold">Smart Placement & TPO</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">Enter your institutional credentials to continue.</p>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@university.edu"
              leftIcon={<Mail className="w-4 h-4 text-muted-foreground" />}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address',
                },
              })}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4 text-muted-foreground" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="transition-colors hover:text-foreground focus:outline-none"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />

            <div className="flex items-center justify-between">
              <Checkbox label="Remember me" {...register('rememberMe')} />
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus:outline-none"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="text-sm"
            >
              Sign in
            </Button>
          </form>

          <div className="space-y-4 border-t border-border pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Need an account? <span className="text-foreground">Contact your Training & Placement Office.</span>
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
              <a href="#privacy" onClick={(e) => e.preventDefault()} className="transition-colors hover:text-foreground">
                Privacy
              </a>
              <span>&middot;</span>
              <a href="#terms" onClick={(e) => e.preventDefault()} className="transition-colors hover:text-foreground">
                Terms
              </a>
              <span>&middot;</span>
              <a href="#support" onClick={(e) => e.preventDefault()} className="transition-colors hover:text-foreground">
                Support
              </a>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset password"
        subtitle="Enter your institutional email to receive reset instructions."
        maxWidth="sm"
        footer={
          <>
            <Button type="button" variant="tertiary" size="md" onClick={() => setForgotModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" isLoading={forgotLoading} onClick={handleForgotSubmit}>
              Send link
            </Button>
          </>
        }
      >
        <Input
          label="Email Address"
          type="email"
          placeholder="you@university.edu"
          value={forgotEmail}
          onChange={(e) => setForgotEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
        />
      </Modal>
    </div>
  );
};
