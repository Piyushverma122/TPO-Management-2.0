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

// Default Monthly Placements Data
const monthlyData = [
  { month: 'Jan', placed: 120 },
  { month: 'Feb', placed: 180 },
  { month: 'Mar', placed: 150 },
  { month: 'Apr', placed: 240 },
  { month: 'May', placed: 290 },
  { month: 'Jun', placed: 220 },
  { month: 'Jul', placed: 310 },
  { month: 'Aug', placed: 420 },
  { month: 'Sep', placed: 380 },
  { month: 'Oct', placed: 490 },
  { month: 'Nov', placed: 410 },
  { month: 'Dec', placed: 520 },
];

// Sparkline Mini Data
const totalStudentsSparkline = [
  { month: 'Sep', val: 3200 },
  { month: 'Oct', val: 3800 },
  { month: 'Nov', val: 4500 },
  { month: 'Dec', val: 5200 },
];

const companiesSparkline = [
  { month: 'Sep', val: 120 },
  { month: 'Oct', val: 210 },
  { month: 'Nov', val: 290 },
  { month: 'Dec', val: 350 },
];

const placedSparkline = [
  { month: 'Sep', val: 2100 },
  { month: 'Oct', val: 2900 },
  { month: 'Nov', val: 3400 },
  { month: 'Dec', val: 4100 },
];

// Branch Wise Placement Donut Data
const branchData = [
  { name: 'CS/IT', value: 45, color: '#A3E635' },
  { name: 'ME', value: 20, color: '#10B981' },
  { name: 'Civil', value: 15, color: '#F59E0B' },
  { name: 'EE', value: 20, color: '#38BDF8' },
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
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

  return (
    <div className="space-y-6 pb-10">
      {/* Top Welcome Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            {user?.role === 'student'
              ? 'Student Placement Portal'
              : user?.role === 'recruiter'
              ? 'Recruiter Portal Dashboard'
              : user?.role === 'faculty'
              ? 'Faculty Academic Dashboard'
              : 'TPO Admin Dashboard'}
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
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
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between text-rose-300 text-sm font-semibold">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchDashboardData}>
            Retry
          </Button>
        </div>
      )}

      {/* TOP 4 STATISTIC METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1: Total Students */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-[#162032] border border-[#202D42] rounded-2xl p-5 hover:border-[#A3E635]/30 transition-all duration-300 shadow-xl"
        >
          <div className="flex items-center justify-between text-[#94A3B8]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <Users className="w-4 h-4 text-[#94A3B8]" />
              <span>Total Students</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">
            {loading ? <div className="h-8 w-24 bg-[#202D42] animate-pulse rounded-md" /> : totalStudents.toLocaleString()}
          </div>

          <div className="h-14 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={totalStudentsSparkline}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A3E635" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#A3E635" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="val" stroke="#A3E635" strokeWidth={2.5} fill="url(#grad1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-[#64748B] mt-1 uppercase tracking-wider">
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
            <span>Dec</span>
          </div>
        </motion.div>

        {/* Stat 2: Companies Visited */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-[#162032] border border-[#202D42] rounded-2xl p-5 hover:border-[#A3E635]/30 transition-all duration-300 shadow-xl"
        >
          <div className="flex items-center justify-between text-[#94A3B8]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-[#94A3B8]" />
              <span>Companies Visited</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">
            {loading ? <div className="h-8 w-20 bg-[#202D42] animate-pulse rounded-md" /> : companiesCount.toLocaleString()}
          </div>

          <div className="h-14 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companiesSparkline}>
                <Bar dataKey="val" fill="#A3E635" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-[#64748B] mt-1 uppercase tracking-wider">
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
            <span>Dec</span>
          </div>
        </motion.div>

        {/* Stat 3: HIGHLIGHTED NEON GREEN CARD - Placed Students */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-[#A3E635] text-[#0B0F17] rounded-2xl p-5 shadow-[0_0_30px_rgba(163,230,53,0.35)] relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0B0F17]/80">
              <Trophy className="w-4 h-4 text-[#0B0F17]" />
              <span>Placed Students</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#0B0F17] mt-2 tracking-tight flex items-center justify-between">
            <span>{loading ? <div className="h-8 w-24 bg-[#0B0F17]/20 animate-pulse rounded-md" /> : placedCount.toLocaleString()}</span>
            <Trophy className="w-7 h-7 text-[#0B0F17]/30" />
          </div>

          <div className="h-14 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={placedSparkline}>
                <Area type="monotone" dataKey="val" stroke="#0B0F17" strokeWidth={3} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[10px] font-extrabold text-[#0B0F17]/80 mt-1 uppercase tracking-wider">
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
            <span>Dec</span>
          </div>
        </motion.div>

        {/* Stat 4: Upcoming Drives */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-[#162032] border border-[#202D42] rounded-2xl p-5 hover:border-[#A3E635]/30 transition-all duration-300 shadow-xl"
        >
          <div className="flex items-center justify-between text-[#94A3B8]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-[#94A3B8]" />
              <span>Upcoming Drives</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">
            {loading ? <div className="h-8 w-16 bg-[#202D42] animate-pulse rounded-md" /> : upcomingCount}
          </div>

          <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pt-1">
            <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center font-bold text-[11px] text-black shrink-0">
              G
            </div>
            <div className="w-6 h-6 rounded-md bg-[#FF9900] flex items-center justify-center font-bold text-[11px] text-black shrink-0">
              a
            </div>
            <div className="w-6 h-6 rounded-md bg-[#006699] flex items-center justify-center font-bold text-[11px] text-white shrink-0">
              EY
            </div>
            <div className="w-6 h-6 rounded-md bg-[#1877F2] flex items-center justify-center font-bold text-[11px] text-white shrink-0">
              ∞
            </div>
            <div className="w-6 h-6 rounded-md bg-rose-600 flex items-center justify-center font-bold text-[11px] text-white shrink-0">
              P
            </div>
          </div>
        </motion.div>
      </div>

      {/* MAIN TWO-COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT MAIN COLUMN (7 cols): Drive Analytics & Records + Monthly Graph */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#202D42] pb-4">
              <h2 className="text-base font-extrabold text-white">Drive Analytics & Records</h2>
              <div className="flex items-center gap-1 bg-[#101726] border border-[#202D42] p-1 rounded-xl">
                <button
                  onClick={() => setDriveFilter('Recent')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    driveFilter === 'Recent' ? 'bg-[#A3E635] text-[#0B0F17]' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Recent
                </button>
                <button
                  onClick={() => setDriveFilter('All')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    driveFilter === 'All' ? 'bg-[#A3E635] text-[#0B0F17]' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDriveFilter('Interviews')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    driveFilter === 'Interviews' ? 'bg-[#A3E635] text-[#0B0F17]' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Interviews
                </button>
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
                    <TableRow key={drive.id || idx}>
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
                        <button className="text-[#94A3B8] hover:text-white p-1 rounded-lg hover:bg-[#202D42] transition-colors">
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
                <span className="text-xs text-[#A3E635] font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +18.4% YoY Growth
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          <Card className="p-5 space-y-5">
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
                <div className="bg-[#101726] border border-[#202D42] rounded-2xl p-3.5 space-y-2">
                  <span className="text-[11px] font-bold text-white block">Branch Wise Placement</span>
                  <div className="h-28 flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={branchData}
                          innerRadius={25}
                          outerRadius={40}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {branchData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] font-semibold text-[#94A3B8]">
                    {branchData.map((b) => (
                      <div key={b.name} className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                        <span>{b.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Highest Package Card */}
                <div className="bg-[#101726] border border-[#202D42] rounded-2xl p-3.5 space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#94A3B8] block">Highest Package</span>
                    <span className="text-xl font-extrabold text-white">₹45.0 LPA</span>
                  </div>
                  <div className="h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={placedSparkline}>
                        <Area type="monotone" dataKey="val" stroke="#A3E635" strokeWidth={2} fill="#A3E635" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-[#64748B] uppercase">
                    <span>Sep</span>
                    <span>Oct</span>
                    <span>Nov</span>
                    <span>Dec</span>
                  </div>
                </div>
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
                <div className="bg-[#101726] border border-[#202D42] rounded-xl py-2 px-1 text-center font-bold text-xs text-white hover:border-[#A3E635]/40 transition-colors">
                  amazon
                </div>
                <div className="bg-[#101726] border border-[#202D42] rounded-xl py-2 px-1 text-center font-bold text-xs text-white hover:border-[#A3E635]/40 transition-colors">
                  IBM
                </div>
                <div className="bg-[#101726] border border-[#202D42] rounded-xl py-2 px-1 text-center font-bold text-xs text-white hover:border-[#A3E635]/40 transition-colors">
                  Deloitte.
                </div>
                <div className="bg-[#101726] border border-[#202D42] rounded-xl py-2 px-1 text-center font-bold text-xs text-rose-400 hover:border-[#A3E635]/40 transition-colors">
                  P&G
                </div>
                <div className="bg-[#101726] border border-[#202D42] rounded-xl py-2 px-1 text-center font-bold text-xs text-sky-400 hover:border-[#A3E635]/40 transition-colors">
                  KPMG
                </div>
                <div className="bg-[#101726] border border-[#202D42] rounded-xl py-2 px-1 text-center font-bold text-xs text-amber-400 hover:border-[#A3E635]/40 transition-colors">
                  EY
                </div>
                <div className="bg-[#101726] border border-[#202D42] rounded-xl py-2 px-1 text-center font-bold text-xs text-[#A3E635] hover:border-[#A3E635]/40 transition-colors">
                  P&G
                </div>
                <div className="bg-[#101726] border border-[#202D42] rounded-xl py-2 px-1 text-center font-bold text-xs text-rose-500 hover:border-[#A3E635]/40 transition-colors">
                  ORACLE
                </div>
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
                    <div className="flex items-start gap-3 text-xs">
                      <div className="w-6 h-6 rounded-full bg-[#A3E635]/20 text-[#A3E635] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-white leading-snug">Amazon declared results, 10 placed</p>
                        <span className="text-[10px] text-[#64748B]">2 hours ago</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-xs">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-white leading-snug">IBM drive rescheduled to 5th Nov</p>
                        <span className="text-[10px] text-[#64748B]">Yesterday</span>
                      </div>
                    </div>
                  </>
                ) : (
                  recentActivitiesList.map((act: any, idx: number) => (
                    <div key={act.id || idx} className="flex items-start gap-3 text-xs">
                      <div className="w-6 h-6 rounded-full bg-[#A3E635]/20 text-[#A3E635] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-white leading-snug">{act.action || 'System Action Recorded'}</p>
                        <span className="text-[10px] text-[#64748B]">
                          {act.created_at ? new Date(act.created_at).toLocaleTimeString() : 'Recently'}
                        </span>
                      </div>
                    </div>
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
    </div>
  );
};
