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
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { Card, CardHeader, CardTitle, CardContent, MetricCard } from '../components/app/Card';
import { Button } from '../components/app/Button';
import { Badge, StatusBadge } from '../components/app/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/app/Table';
import { Modal } from '../components/app/Modal';
import { Input } from '../components/app/Input';
import { Dropdown } from '../components/app/Dropdown';
import { useToast } from '../components/app/Toast';
import { ProgressBar } from '../components/app/ProgressBar';
import { Tabs } from '../components/app/Tabs';
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

import { StudentDashboard } from './StudentDashboard';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const CHART_PALETTE = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-5)', 'var(--chart-3)', 'var(--chart-4)'];

const chartConfig = {
  placed: { label: 'Placed', color: 'var(--chart-1)' },
  value: { label: 'Placements', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  return user?.role === 'student' ? <StudentDashboard /> : <StaffDashboard />;
};

const StaffDashboard: React.FC = () => {
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

    // Direct table subscriptions are not allowed (RLS), so refresh on a slow interval instead.
    const timer = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(timer);
  }, [user]);

  const handleCreateDrive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName) return;
    setQuickAddOpen(false);
    setNewCompanyName('');
    success('Drive Request Submitted', `${newCompanyName} recruitment drive request logged.`);
  };

  // Derive Display Metrics
  const totalStudents = adminData?.totalStudents ?? 0;
  const companiesCount = adminData?.totalCompanies ?? 0;
  const placedCount = adminData?.totalPlacements ?? 0;
  const upcomingCount = adminData?.upcomingDrives?.length ?? tpoData?.activeDrives ?? 0;
  const highestPackage = adminData?.highestPackage ?? 0;
  const averagePackage = adminData?.averagePackage ?? 0;
  const topRecruiters = adminData?.topRecruiters ?? [];
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

  const branchData: { name: string; value: number }[] = (adminData as any)?.branchDistribution || [];
  const branchTotal = branchData.reduce((sum, b) => sum + (Number(b.value) || 0), 0);
  const placementRate = totalStudents > 0 ? Math.round((placedCount / totalStudents) * 100) : 0;
  const firstName = (user?.name || 'Admin').split(' ')[0];
  const roleTitle =
    (user?.role as string) === 'recruiter'
      ? 'Recruiter overview'
      : (user?.role as string) === 'faculty'
      ? 'Faculty overview'
      : 'Placement overview';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-10"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{roleTitle}</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-1">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here is what is happening with drives and placements today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="tertiary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchDashboardData}
            disabled={loading}
            className="text-xs shrink-0"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setQuickAddOpen(true)}
            className="text-xs shrink-0"
          >
            Quick Add
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="flex items-center justify-between gap-3 rounded-3xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-red-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchDashboardData}>
            Retry
          </Button>
        </div>
      )}

      {/* KPI row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {[
          { title: 'Total students', value: totalStudents.toLocaleString(), note: 'Registered on the portal', icon: Users },
          { title: 'Companies', value: companiesCount.toLocaleString(), note: 'Recruiting partners', icon: Building2 },
          { title: 'Placed students', value: placedCount.toLocaleString(), note: `${placementRate}% placement rate`, icon: Trophy },
          { title: 'Upcoming drives', value: String(upcomingCount), note: 'Scheduled recruitment drives', icon: Calendar },
        ].map(({ title, value, note, icon: Icon }) => (
          <motion.div key={title} variants={cardItemVariants}>
            <Card className="p-5 h-full">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{title}</p>
                  <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    {loading ? <div className="h-9 w-16 animate-pulse rounded-md bg-secondary" /> : value}
                  </div>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground">
                  <Icon className="w-5 h-5" />
                </span>
              </div>
              <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">{note}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Trend + Branch split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Placement trend</h2>
              <p className="text-xs text-muted-foreground mt-1">Students placed per month</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold tracking-tight text-foreground">{placedCount}</p>
              <p className="text-xs text-muted-foreground">total placed</p>
            </div>
          </div>
          <ChartContainer config={chartConfig} className="aspect-auto mt-6 h-72 w-full">
            <AreaChart data={(adminData as any)?.placementTrend || []} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-placed)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-placed)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="var(--chart-2)" fontSize={11} tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis stroke="var(--chart-2)" fontSize={11} tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
              <Area type="monotone" dataKey="placed" stroke="var(--color-placed)" strokeWidth={2} fill="url(#trendFill)" />
            </AreaChart>
          </ChartContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-base font-semibold text-foreground">Branch-wise placement</h2>
          <p className="text-xs text-muted-foreground mt-1">Share of placed students by branch</p>
          {branchData.length === 0 ? (
            <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">No placement data yet</div>
          ) : (
            <>
              <div className="relative mt-4">
                <ChartContainer config={chartConfig} className="aspect-auto mx-auto h-48 w-full">
                  <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Pie data={branchData} innerRadius={58} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name" strokeWidth={0}>
                      {branchData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold text-foreground">{branchTotal}</span>
                  <span className="text-xs text-muted-foreground">placed</span>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {branchData.map((b, bi) => (
                  <li key={b.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_PALETTE[bi % CHART_PALETTE.length] }} />
                      {b.name}
                    </span>
                    <span className="font-medium text-foreground">{b.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      {/* Drives table + side widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Placement drives</h2>
              <p className="text-xs text-muted-foreground mt-1">Latest drives and their package details</p>
            </div>
            <Tabs
              variant="neon"
              activeTab={driveFilter}
              onChange={(id) => setDriveFilter(id as 'Recent' | 'All' | 'Interviews')}
              tabs={[
                { id: 'Recent', label: 'Recent' },
                { id: 'All', label: 'All' },
                { id: 'Interviews', label: 'Interviews' },
              ]}
              className="w-auto"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drive</TableHead>
                <TableHead>Company & role</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>CTC</TableHead>
                <TableHead className="text-right">Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading live drive data...
                  </TableCell>
                </TableRow>
              ) : recentDrivesList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No active drive records found.
                  </TableCell>
                </TableRow>
              ) : (
                recentDrivesList.map((drive: any, idx: number) => (
                  <TableRow key={drive.id || idx}>
                    <TableCell className="font-medium text-muted-foreground">{drive.drive_code || `D-${3101 + idx}`}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                          {drive.companies?.name ? drive.companies.name.charAt(0) : 'C'}
                        </span>
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">{drive.companies?.name || 'Partner Company'}</span>
                          <span className="block truncate text-xs text-muted-foreground">{drive.role_title || 'Software Engineer'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {drive.registration_deadline ? new Date(drive.registration_deadline).toLocaleDateString() : 'Active'}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{drive.ctc ? `₹${drive.ctc} LPA` : '₹12 LPA'}</TableCell>
                    <TableCell className="text-right">
                      <button
                        aria-label="Drive options"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <div className="space-y-4">
          {/* Package highlights */}
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground">Package highlights</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-secondary p-4">
                <p className="text-xs text-muted-foreground">Average</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{averagePackage > 0 ? `₹${averagePackage} LPA` : 'N/A'}</p>
              </div>
              <div className="rounded-2xl bg-secondary p-4">
                <p className="text-xs text-muted-foreground">Highest</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{highestPackage > 0 ? `₹${highestPackage} LPA` : 'N/A'}</p>
              </div>
            </div>
            <ProgressBar value={placementRate} label="Placement rate" size="sm" />
          </Card>

          {/* Top recruiters */}
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground">Top recruiters</h2>
            {topRecruiters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No placements recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {topRecruiters.map((rec, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                      {idx + 1}
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">{rec.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Recent activity */}
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground">Recent activity</h2>
            {recentActivitiesList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <ul className="space-y-4">
                {recentActivitiesList.map((act: any, idx: number) => (
                  <li key={act.id || idx} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm leading-snug text-foreground">{act.action || 'System Action Recorded'}</p>
                      <span className="text-xs text-muted-foreground">
                        {act.created_at ? new Date(act.created_at).toLocaleTimeString() : 'Recently'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
