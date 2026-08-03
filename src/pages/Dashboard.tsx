import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Building2,
  Trophy,
  Calendar,
  MoreVertical,
  TrendingUp,
  CheckCircle2,
  Clock,
  FileCheck,
  Plus,
  ArrowUpRight,
  Sparkles,
  Filter,
  BarChart3,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { Card, CardHeader, CardTitle, CardContent, MetricCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import {
  getAdminDashboard,
  getTPODashboard,
  getStudentDashboard,
  getRecruiterDashboard,
  getFacultyDashboard,
  AdminDashboardData,
  TPODashboardData,
  StudentDashboardData,
  RecruiterDashboardData,
  FacultyDashboardData,
} from '../api/dashboard.api';

import { StudentDashboard } from './StudentDashboard';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'student') {
    return <StudentDashboard />;
  }
  const { success, error: toastError } = useToast();
  const [driveFilter, setDriveFilter] = useState<'Recent' | 'All' | 'Interviews'>('Recent');
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Dashboard API Loading & Error states
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Dashboard Data States
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [tpoData, setTpoData] = useState<TPODashboardData | null>(null);
  const [studentData, setStudentData] = useState<StudentDashboardData | null>(null);
  const [recruiterData, setRecruiterData] = useState<RecruiterDashboardData | null>(null);
  const [facultyData, setFacultyData] = useState<FacultyDashboardData | null>(null);

  // Quick Add Form state
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newRoleType, setNewRoleType] = useState('Full Time');

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const role = user?.role || 'admin';

      if (role === 'admin' || role === 'tpo_admin') {
        const res = await getAdminDashboard();
        setAdminData(res.data.dashboard);
      } else if (role === 'tpo') {
        const res = await getTPODashboard();
        setTpoData(res.data.dashboard);
      } else if (role === 'student') {
        const res = await getStudentDashboard();
        setStudentData(res.data.dashboard);
      } else if (role === 'recruiter') {
        const res = await getRecruiterDashboard();
        setRecruiterData(res.data.dashboard);
      } else if (role === 'faculty') {
        const res = await getFacultyDashboard();
        setFacultyData(res.data.dashboard);
      } else {
        const res = await getAdminDashboard();
        setAdminData(res.data.dashboard);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to fetch dashboard metrics from backend.';
      setErrorMsg(msg);
      toastError('Dashboard Error', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel('public:dashboard_events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'placement_drives' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'placements' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drive_applications' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleCreateDrive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName) return;
    setQuickAddOpen(false);
    setNewCompanyName('');
    success('Drive Request Submitted', `${newCompanyName} recruitment drive request logged.`);
  };

  // Derive Display Metrics
  const totalStudents = adminData?.totalStudents ?? 5200;
  const companiesCount = adminData?.totalCompanies ?? 350;
  const placedCount = adminData?.totalPlacements ?? 4100;
  const upcomingCount = adminData?.upcomingDrives?.length ?? tpoData?.activeDrives ?? 25;
  const recentDrivesList = adminData?.upcomingDrives || [];
  const recentActivitiesList = adminData?.recentActivities || [];

  // Motion Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.04,
      },
    },
  };

  const cardItemVariants = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 280,
        damping: 22,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-10"
    >
      {/* Top Welcome Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            {(user?.role as string) === 'student'
              ? 'Student Placement Portal'
              : (user?.role as string) === 'recruiter'
              ? 'Recruiter Portal Dashboard'
              : (user?.role as string) === 'faculty'
              ? 'Faculty Academic Dashboard'
              : 'TPO Admin Dashboard'}
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 shadow-[0_0_10px_rgba(163,230,53,0.2)]">
              Live Session
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Real-time analytics, upcoming recruitment drives, and student placement metrics.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchDashboardData}
            disabled={loading}
            className="font-extrabold text-xs shrink-0"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setQuickAddOpen(true)}
            className="font-extrabold text-xs shrink-0"
          >
            Quick Add: Drive/Student
          </Button>
        </div>
      </div>

      {/* Error Message Banner if API fails */}
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between text-rose-300 text-sm font-semibold"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchDashboardData}>
            Retry
          </Button>
        </motion.div>
      )}

      {/* TOP 4 STATISTIC METRIC CARDS ROW */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {/* Stat 1: Total Students */}
        <motion.div
          variants={cardItemVariants}
          whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
          className="bg-[#162032] border border-[#202D42] rounded-2xl p-5 hover:border-[#A3E635]/40 transition-all duration-300 shadow-xl hover:shadow-[0_12px_25px_rgba(0,0,0,0.3)] group"
        >
          <div className="flex items-center justify-between text-[#94A3B8]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider group-hover:text-white transition-colors">
              <Users className="w-4 h-4 text-[#A3E635]" />
              <span>Total Students</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">
            {loading ? <div className="h-8 w-24 bg-[#202D42] animate-pulse rounded-md" /> : totalStudents.toLocaleString()}
          </div>

          <div className="h-14 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={(adminData as any)?.placementTrend || []}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A3E635" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#A3E635" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="placed" stroke="#A3E635" strokeWidth={2.5} fill="url(#grad1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-[#64748B] mt-1 uppercase tracking-wider">
            <span>Jan</span>
            <span>Jun</span>
            <span>Dec</span>
          </div>
        </motion.div>

        {/* Stat 2: Companies Visited */}
        <motion.div
          variants={cardItemVariants}
          whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
          className="bg-[#162032] border border-[#202D42] rounded-2xl p-5 hover:border-[#A3E635]/40 transition-all duration-300 shadow-xl hover:shadow-[0_12px_25px_rgba(0,0,0,0.3)] group"
        >
          <div className="flex items-center justify-between text-[#94A3B8]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider group-hover:text-white transition-colors">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>Companies Visited</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">
            {loading ? <div className="h-8 w-20 bg-[#202D42] animate-pulse rounded-md" /> : companiesCount.toLocaleString()}
          </div>

          <div className="h-14 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(adminData as any)?.placementTrend || []}>
                <Bar dataKey="placed" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-[#64748B] mt-1 uppercase tracking-wider">
            <span>Jan</span>
            <span>Jun</span>
            <span>Dec</span>
          </div>
        </motion.div>

        {/* Stat 3: HIGHLIGHTED NEON GREEN CARD - Placed Students */}
        <motion.div
          variants={cardItemVariants}
          whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
          className="bg-[#A3E635] text-[#0B0F17] rounded-2xl p-5 shadow-[0_0_30px_rgba(163,230,53,0.35)] relative overflow-hidden group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0B0F17]/80">
              <Trophy className="w-4 h-4 text-[#0B0F17]" />
              <span>Placed Students</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#0B0F17] mt-2 tracking-tight flex items-center justify-between">
            <span>{loading ? <div className="h-8 w-24 bg-[#0B0F17]/20 animate-pulse rounded-md" /> : placedCount.toLocaleString()}</span>
            <Trophy className="w-7 h-7 text-[#0B0F17]/30 group-hover:rotate-12 transition-transform duration-300" />
          </div>

          <div className="h-14 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={(adminData as any)?.placementTrend || []}>
                <Area type="monotone" dataKey="placed" stroke="#0B0F17" strokeWidth={3} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[10px] font-extrabold text-[#0B0F17]/80 mt-1 uppercase tracking-wider">
            <span>Jan</span>
            <span>Jun</span>
            <span>Dec</span>
          </div>
        </motion.div>

        {/* Stat 4: Upcoming Drives */}
        <motion.div
          variants={cardItemVariants}
          whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
          className="bg-[#162032] border border-[#202D42] rounded-2xl p-5 hover:border-[#A3E635]/40 transition-all duration-300 shadow-xl hover:shadow-[0_12px_25px_rgba(0,0,0,0.3)] group"
        >
          <div className="flex items-center justify-between text-[#94A3B8]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider group-hover:text-white transition-colors">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Upcoming Drives</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">
            {loading ? <div className="h-8 w-16 bg-[#202D42] animate-pulse rounded-md" /> : upcomingCount}
          </div>

          <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pt-1">
            <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center font-bold text-[11px] text-black shrink-0 shadow-sm">
              G
            </div>
            <div className="w-6 h-6 rounded-md bg-[#FF9900] flex items-center justify-center font-bold text-[11px] text-black shrink-0 shadow-sm">
              a
            </div>
            <div className="w-6 h-6 rounded-md bg-[#006699] flex items-center justify-center font-bold text-[11px] text-white shrink-0 shadow-sm">
              EY
            </div>
            <div className="w-6 h-6 rounded-md bg-[#1877F2] flex items-center justify-center font-bold text-[11px] text-white shrink-0 shadow-sm">
              ∞
            </div>
            <div className="w-6 h-6 rounded-md bg-rose-600 flex items-center justify-center font-bold text-[11px] text-white shrink-0 shadow-sm">
              P
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* MAIN TWO-COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT MAIN COLUMN (7 cols): Drive Analytics & Records + Monthly Graph */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-5 space-y-4 border-[#202D42] hover:border-[#A3E635]/30 transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-[#202D42] pb-4">
              <h2 className="text-base font-extrabold text-white">Drive Analytics & Records</h2>
              
              {/* Smooth Sliding Pill Tab Switcher */}
              <div className="flex items-center gap-1 bg-[#101726] border border-[#202D42] p-1 rounded-xl">
                {(['Recent', 'All', 'Interviews'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDriveFilter(filter)}
                    className={`relative px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 cursor-pointer ${
                      driveFilter === filter ? 'text-[#0B0F17]' : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    {driveFilter === filter && (
                      <motion.div
                        layoutId="activeDriveFilterTab"
                        className="absolute inset-0 bg-[#A3E635] rounded-lg shadow-[0_0_12px_rgba(163,230,53,0.4)]"
                        transition={{ type: 'spring' as const, stiffness: 380, damping: 28 }}
                      />
                    )}
                    <span className="relative z-10">{filter}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Drives Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Drive Code</TableHead>
                  <TableHead>Company & Role</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>CTC</TableHead>
                  <TableHead className="text-right">Options</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-[#94A3B8]">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#A3E635] border-t-transparent rounded-full animate-spin" />
                        <span>Loading live drive data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : recentDrivesList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-[#94A3B8]">
                      No active drive records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentDrivesList.map((drive: any, idx: number) => (
                    <TableRow key={drive.id || idx} className="hover:bg-[#162032]/60 transition-colors">
                      <TableCell className="font-bold text-[#A3E635]">{drive.drive_code || `D-${3101 + idx}`}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-md bg-[#A3E635]/20 text-[#A3E635] flex items-center justify-center font-bold text-xs shrink-0">
                            {drive.companies?.name ? drive.companies.name.charAt(0) : 'C'}
                          </div>
                          <div>
                            <span className="font-bold text-white block leading-tight">{drive.companies?.name || 'Partner Company'}</span>
                            <span className="text-[11px] text-[#94A3B8]">{drive.role_title || 'Software Engineer'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#94A3B8] text-xs">
                        {drive.registration_deadline ? new Date(drive.registration_deadline).toLocaleDateString() : 'Active'}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-white">
                        {drive.ctc ? `₹${drive.ctc} LPA` : '₹12 LPA'}
                      </TableCell>
                      <TableCell className="text-right">
                        <button className="text-[#94A3B8] hover:text-white p-1.5 rounded-lg hover:bg-[#202D42] transition-colors cursor-pointer">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Monthly Placement Graph Section */}
            <div className="pt-4 border-t border-[#202D42]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Monthly Placement Graph</h3>
                <span className="text-xs text-[#A3E635] font-semibold flex items-center gap-1 bg-[#A3E635]/10 border border-[#A3E635]/20 px-2.5 py-0.5 rounded-full">
                  <TrendingUp className="w-3.5 h-3.5" /> +18.4% YoY Growth
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(adminData as any)?.placementTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPlaced" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A3E635" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#A3E635" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#101726',
                        borderColor: '#202D42',
                        borderRadius: '12px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="placed"
                      stroke="#A3E635"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorPlaced)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN (5 cols): Insights & Top Recruiters + Recent Activity Timeline */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-5 space-y-5 border-[#202D42] hover:border-[#A3E635]/30 transition-colors duration-300">
            <h2 className="text-base font-extrabold text-white border-b border-[#202D42] pb-3">
              Insights & Top Recruiters
            </h2>

            {/* Analytics Overview Cards */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Analytics Overview
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Branch Wise Placement Donut Card */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="bg-[#101726] border border-[#202D42] rounded-2xl p-3.5 space-y-2 hover:border-[#A3E635]/30 transition-all"
                >
                  <span className="text-[11px] font-bold text-white block">Branch Wise Placement</span>
                  <div className="h-28 flex items-center justify-center relative">
                    {((adminData as any)?.branchDistribution || []).length === 0 ? (
                      <span className="text-[11px] text-[#94A3B8]">No placement data</span>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={(adminData as any)?.branchDistribution}
                            innerRadius={25}
                            outerRadius={40}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {((adminData as any)?.branchDistribution || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] font-semibold text-[#94A3B8]">
                    {((adminData as any)?.branchDistribution || []).map((b: any) => (
                      <div key={b.name} className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                        <span>{b.name}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Highest Package Card */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="bg-[#101726] border border-[#202D42] rounded-2xl p-3.5 space-y-2 flex flex-col justify-between hover:border-[#A3E635]/30 transition-all"
                >
                  <div>
                    <span className="text-[11px] font-bold text-[#94A3B8] block">Highest Package</span>
                    <span className="text-xl font-extrabold text-white">₹45.0 LPA</span>
                  </div>
                  <div className="h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={(adminData as any)?.placementTrend || []}>
                        <Area type="monotone" dataKey="placed" stroke="#A3E635" strokeWidth={2} fill="#A3E635" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-[#64748B] uppercase">
                    <span>Jan</span>
                    <span>Jun</span>
                    <span>Dec</span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Stat Summary Row */}
            <div className="grid grid-cols-2 gap-3 bg-[#101726] border border-[#202D42] rounded-xl p-3 text-center">
              <div>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Average Package</span>
                <span className="text-base font-extrabold text-white">₹10.5 LPA</span>
              </div>
              <div className="border-l border-[#202D42]">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Highest Package</span>
                <span className="text-base font-extrabold text-[#A3E635]">₹45 LPA</span>
              </div>
            </div>

            {/* Top Recruiters Grid */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">
                Top Recruiters
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: 'amazon', color: 'text-white' },
                  { name: 'IBM', color: 'text-white' },
                  { name: 'Deloitte.', color: 'text-white' },
                  { name: 'P&G', color: 'text-rose-400' },
                  { name: 'KPMG', color: 'text-sky-400' },
                  { name: 'EY', color: 'text-amber-400' },
                  { name: 'Google', color: 'text-[#A3E635]' },
                  { name: 'ORACLE', color: 'text-rose-500' },
                ].map((rec, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.06, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring' as const, stiffness: 350, damping: 20 }}
                    className={`bg-[#101726] border border-[#202D42] rounded-xl py-2 px-1 text-center font-bold text-xs ${rec.color} hover:border-[#A3E635]/40 hover:bg-[#162032] transition-colors cursor-pointer shadow-sm`}
                  >
                    {rec.name}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="space-y-3 pt-2 border-t border-[#202D42]">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">
                Recent Activity Timeline
              </span>
              <div className="space-y-3">
                {recentActivitiesList.length === 0 ? (
                  <>
                    <motion.div whileHover={{ x: 3 }} className="flex items-start gap-3 text-xs cursor-pointer">
                      <div className="w-6 h-6 rounded-full bg-[#A3E635]/20 text-[#A3E635] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-white leading-snug">Amazon declared results, 10 placed</p>
                        <span className="text-[10px] text-[#64748B]">2 hours ago</span>
                      </div>
                    </motion.div>
                    <motion.div whileHover={{ x: 3 }} className="flex items-start gap-3 text-xs cursor-pointer">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-white leading-snug">IBM drive rescheduled to 5th Nov</p>
                        <span className="text-[10px] text-[#64748B]">Yesterday</span>
                      </div>
                    </motion.div>
                  </>
                ) : (
                  recentActivitiesList.map((act: any, idx: number) => (
                    <motion.div key={act.id || idx} whileHover={{ x: 3 }} className="flex items-start gap-3 text-xs cursor-pointer">
                      <div className="w-6 h-6 rounded-full bg-[#A3E635]/20 text-[#A3E635] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-white leading-snug">{act.action || 'System Action Recorded'}</p>
                        <span className="text-[10px] text-[#64748B]">
                          {act.created_at ? new Date(act.created_at).toLocaleTimeString() : 'Recently'}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* QUICK ADD DRIVE MODAL */}
      <Modal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        title="Quick Add Placement Drive"
        subtitle="Create a new recruitment drive record."
      >
        <form onSubmit={handleCreateDrive} className="space-y-4">
          <Input
            label="Company Name"
            placeholder="e.g. Microsoft / Google"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            required
          />
          <Dropdown
            label="Job Role Type"
            options={[
              { label: 'Full Time', value: 'Full Time' },
              { label: 'Internship', value: 'Internship' },
              { label: 'Dual (Intern + FT)', value: 'Dual (Intern+FT)' },
            ]}
            value={newRoleType}
            onChange={setNewRoleType}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setQuickAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Create Drive
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};
