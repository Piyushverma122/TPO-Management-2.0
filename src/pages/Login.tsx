import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Building2,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Handshake,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { UserRole } from '../types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, forgotPassword } = useAuth();
  const { success, error: toastError, info } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole>('tpo_admin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: 'james.tpo@university.edu',
      password: 'password123',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const userRole = await login(data.email, data.password);
      setIsLoading(false);
      success('Logged In Successfully', `Welcome back to Smart Placement & TPO System.`);

      // Role-based redirection
      if (userRole === 'admin' || userRole === 'tpo' || userRole === 'tpo_admin') {
        navigate('/dashboard');
      } else if (userRole === 'student') {
        navigate('/dashboard');
      } else if (userRole === 'recruiter') {
        navigate('/dashboard');
      } else if (userRole === 'faculty') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setIsLoading(false);
      const errMsg = err.response?.data?.message || err.message || 'Authentication failed. Please check your credentials.';
      toastError('Login Failed', errMsg);
    }
  };

  const handleForgotSubmit = async () => {
    if (!forgotEmail) {
      toastError('Validation Error', 'Please enter a valid email address.');
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

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'tpo_admin') {
      setValue('email', 'james.tpo@university.edu');
    } else if (role === 'student') {
      setValue('email', 'alex.rivera@student.edu');
    } else {
      setValue('email', 'recruitment@google.com');
    }
    info('Role Selected', `Preset email loaded for ${role.replace('_', ' ').toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans selection:bg-[#A3E635] selection:text-black">
      {/* Background Decorative Ambient Radial Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#A3E635]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-[#38BDF8]/10 rounded-full blur-[180px] pointer-events-none" />

      {/* Main Split Grid Container */}
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">

        {/* LEFT COLUMN: Hero Design Illustration & Animated Pathway */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="lg:col-span-6 space-y-8 text-center lg:text-left relative flex flex-col justify-center"
        >
          {/* Header Title strictly matching Login.jpg */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 shadow-[0_0_15px_rgba(163,230,53,0.2)]">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Smart Placement & TPO Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Empowering <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#A3E635]">
                Careers & Futures
              </span>
            </h1>
          </div>

          {/* Interactive Graphic Box with Winding Neon Path & Floating Badges */}
          <div className="relative w-full max-w-lg mx-auto lg:mx-0 h-[400px] sm:h-[440px] rounded-3xl bg-[#101726]/70 border border-[#202D42] backdrop-blur-2xl p-6 flex items-center justify-center overflow-hidden shadow-2xl">
            
            {/* Curved Neon Lime Pathway Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 440" fill="none">
              <path
                d="M 60 70 Q 220 30 250 220 T 440 370"
                stroke="url(#gradient-path-main)"
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
                className="filter drop-shadow-[0_0_15px_rgba(163,230,53,0.85)]"
              />
              <path
                d="M 90 370 Q 220 340 280 190 T 430 70"
                stroke="url(#gradient-path-sub)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="8 8"
                fill="none"
                className="opacity-70"
              />
              <defs>
                <linearGradient id="gradient-path-main" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#BEF264" />
                  <stop offset="50%" stopColor="#A3E635" />
                  <stop offset="100%" stopColor="#84CC16" />
                </linearGradient>
                <linearGradient id="gradient-path-sub" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#A3E635" />
                </linearGradient>
              </defs>
            </svg>

            {/* Top Left Recruiter Avatar Card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-6 left-6 bg-[#162032]/95 border border-[#202D42] rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 backdrop-blur-md z-10"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-md">
                <Building2 className="w-6 h-6 text-slate-950" />
              </div>
              <div className="text-left">
                <p className="text-xs text-[#94A3B8] font-medium">Recruitment Partner</p>
                <p className="text-sm font-bold text-white">Google & Deloitte</p>
              </div>
            </motion.div>

            {/* Top Right Student Avatar Card */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute top-8 right-6 bg-[#162032]/95 border border-[#A3E635]/40 rounded-2xl p-3 shadow-2xl flex items-center gap-3 backdrop-blur-md z-10"
            >
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
                  alt="Student"
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#A3E635]"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#A3E635] rounded-full border-2 border-[#162032]" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Sophia Lin</p>
                <p className="text-[11px] text-[#A3E635] font-semibold">Placed @ Deloitte</p>
              </div>
            </motion.div>

            {/* Center Handshake Icon Bubble */}
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-full bg-[#101726]/95 border-2 border-[#A3E635] flex items-center justify-center shadow-[0_0_35px_rgba(163,230,53,0.5)] z-20 backdrop-blur-md"
            >
              <Handshake className="w-10 h-10 text-[#A3E635]" />
            </motion.div>

            {/* Bottom Left Student Offer Badge */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              className="absolute bottom-8 left-8 bg-[#162032]/95 border border-[#202D42] rounded-2xl p-3 shadow-2xl flex items-center gap-3 backdrop-blur-md z-10"
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120"
                alt="Student"
                className="w-10 h-10 rounded-full object-cover border-2 border-sky-400"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-white">David Miller</p>
                <p className="text-[11px] text-sky-400 font-semibold">Offer: 24.5 LPA</p>
              </div>
            </motion.div>

            {/* Bottom Right Placement Success Chip */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              className="absolute bottom-10 right-8 bg-[#162032]/95 border border-[#202D42] rounded-2xl p-3 shadow-2xl flex items-center gap-2.5 backdrop-blur-md z-10"
            >
              <div className="w-9 h-9 rounded-xl bg-[#A3E635]/20 flex items-center justify-center text-[#A3E635]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-[11px] text-[#94A3B8]">Placement Rate</p>
                <p className="text-sm font-extrabold text-[#A3E635]">94.8% Success</p>
              </div>
            </motion.div>

            {/* Company Partner Badges Bar */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#0B0F17]/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#202D42] flex items-center gap-3 text-xs font-semibold text-[#94A3B8]">
              <span className="hover:text-white transition-colors">Google</span>
              <span className="w-1 h-1 rounded-full bg-[#A3E635]" />
              <span className="hover:text-white transition-colors">Amazon</span>
              <span className="w-1 h-1 rounded-full bg-[#A3E635]" />
              <span className="hover:text-white transition-colors">Microsoft</span>
              <span className="w-1 h-1 rounded-full bg-[#A3E635]" />
              <span className="hover:text-white transition-colors">P&G</span>
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Glassmorphic Auth Card matching Login.jpg */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className="lg:col-span-6 flex justify-center"
        >
          <div className="w-full max-w-md bg-[#162032]/75 backdrop-blur-2xl border border-[#202D42] rounded-3xl p-7 sm:p-9 shadow-2xl relative overflow-hidden group">
            
            {/* Top Glowing Ambient Border Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#A3E635] to-transparent opacity-80" />

            {/* Brand Logo & Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center justify-center gap-2.5 mb-1">
                <div className="w-9 h-9 rounded-xl bg-[#A3E635] text-[#0B0F17] flex items-center justify-center font-extrabold text-xl shadow-[0_0_18px_rgba(163,230,53,0.5)]">
                  S
                </div>
                <span className="text-lg font-bold text-white tracking-wide">
                  Smart Placement <span className="text-[#A3E635]">& TPO</span>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs sm:text-sm text-[#94A3B8]">
                Log in to your account
              </p>
            </div>

            {/* Demo Role Selector Switcher */}
            <div className="mb-6 p-1 bg-[#101726] border border-[#202D42] rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleRoleChange('tpo_admin')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === 'tpo_admin'
                    ? 'bg-[#A3E635] text-[#0B0F17] shadow-[0_0_10px_rgba(163,230,53,0.3)]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                TPO Admin
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === 'student'
                    ? 'bg-[#A3E635] text-[#0B0F17] shadow-[0_0_10px_rgba(163,230,53,0.3)]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Student
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('recruiter')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === 'recruiter'
                    ? 'bg-[#A3E635] text-[#0B0F17] shadow-[0_0_10px_rgba(163,230,53,0.3)]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Recruiter
              </button>
            </div>

            {/* Auth Form with Reusable Form Components */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Email Address Field */}
              <Input
                label="Email Address"
                type="email"
                placeholder="Email Address"
                leftIcon={<Mail className="w-4 h-4 text-[#64748B]" />}
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email address is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address',
                  },
                })}
              />

              {/* Password Field with Show/Hide Toggle */}
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                leftIcon={<Lock className="w-4 h-4 text-[#64748B]" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-[#A3E635] transition-colors focus:outline-none"
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

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between pt-1">
                <Checkbox
                  label="Remember Me"
                  {...register('rememberMe')}
                />
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs font-semibold text-[#A3E635] hover:underline hover:text-[#BEF264] transition-colors focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Log In Button (Loading Button state) */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                className="mt-2 text-base font-extrabold tracking-wide"
              >
                Log In
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#202D42]" />
              </div>
              <span className="relative px-3 bg-[#162032] text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                or continue with
              </span>
            </div>

            {/* Social Google Login Button */}
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => {
                  login('google.user@university.edu', selectedRole);
                  setIsLoading(false);
                  success('Google Auth Success', 'Signed in with Google account.');
                  navigate('/dashboard');
                }, 800);
              }}
              className="w-full bg-[#101726] border border-[#202D42] hover:border-[#A3E635]/40 hover:bg-[#1C293F] text-white py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-3 transition-all duration-200 shadow-md active:scale-[0.98]"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Card Footer */}
            <div className="mt-6 text-center space-y-3">
              <p className="text-xs text-[#94A3B8]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => info('Sign Up Notice', 'Registration is managed by TPO Admin.')}
                  className="font-extrabold text-[#A3E635] hover:underline"
                >
                  Sign Up
                </button>
              </p>
              <div className="flex items-center justify-center gap-3 text-[11px] text-[#64748B]">
                <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-[#94A3B8] transition-colors">
                  Privacy Policy
                </a>
                <span>•</span>
                <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-[#94A3B8] transition-colors">
                  Terms of Service
                </a>
                <span>•</span>
                <a href="#support" onClick={(e) => e.preventDefault()} className="hover:text-[#94A3B8] transition-colors">
                  Contact Support
                </a>
              </div>
            </div>

            {/* Sparkle Star Accent Icon */}
            <div className="absolute -bottom-2 -right-2 text-[#A3E635]/25 pointer-events-none">
              <Sparkles className="w-12 h-12" />
            </div>
          </div>
        </motion.div>

      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#0B0F17]/80 backdrop-blur-md" onClick={() => setForgotModalOpen(false)} />
          <div className="w-full max-w-sm bg-[#162032] border border-[#202D42] rounded-3xl p-6 shadow-2xl relative z-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-white">Reset Password</h3>
              <p className="text-xs text-[#94A3B8]">
                Enter your institutional email to receive password reset instructions.
              </p>
            </div>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@university.edu"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />
            <div className="flex gap-2">
              <Button variant="secondary" size="md" fullWidth onClick={() => setForgotModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                fullWidth
                isLoading={forgotLoading}
                onClick={handleForgotSubmit}
              >
                Send Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
