import React, { useState } from 'react';
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
  BarChart3
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
  Cell
} from 'recharts';

import { Card, CardHeader, CardTitle, CardContent, MetricCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { useToast } from '../components/ui/Toast';

// Mock Data for Monthly Placements
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

const upcomingSparkline = [
  { month: 'Sep', val: 12 },
  { month: 'Oct', val: 18 },
  { month: 'Nov', val: 22 },
  { month: 'Dec', val: 25 },
];

// Branch Wise Placement Donut Data
const branchData = [
  { name: 'CS/IT', value: 45, color: '#A3E635' },
  { name: 'ME', value: 20, color: '#10B981' },
  { name: 'Civil', value: 15, color: '#F59E0B' },
  { name: 'EE', value: 20, color: '#38BDF8' },
];

// Table Drive Records Data
interface DriveRecord {
  id: string;
  driveCode: string;
  companyName: string;
  logo: string;
  type: string;
  status: 'Conducted' | 'Ongoing' | 'Upcoming' | 'Draft';
  date: string;
}

const initialDrives: DriveRecord[] = [
  {
    id: '1',
    driveCode: 'D-3101',
    companyName: 'Deloitte',
    logo: 'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&q=80&w=80',
    type: 'Full Time',
    status: 'Conducted',
    date: '18 Oct 2025',
  },
  {
    id: '2',
    driveCode: 'D-3102',
    companyName: 'Ernst & Young',
    logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&q=80&w=80',
    type: 'Full Time',
    status: 'Ongoing',
    date: '22 Oct 2025',
  },
  {
    id: '3',
    driveCode: 'D-3103',
    companyName: 'KPMG',
    logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=80',
    type: 'Internship',
    status: 'Upcoming',
    date: '28 Oct 2025',
  },
  {
    id: '4',
    driveCode: 'D-3104',
    companyName: 'IBM',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=80',
    type: 'Dual (Intern+FT)',
    status: 'Conducted',
    date: '25 Oct 2025',
  },
];

export const Dashboard: React.FC = () => {
  const { success } = useToast();
  const [driveFilter, setDriveFilter] = useState<'Recent' | 'All' | 'Interviews'>('Recent');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [drives, setDrives] = useState<DriveRecord[]>(initialDrives);

  // Quick Add Form state
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newRoleType, setNewRoleType] = useState('Full Time');

  const handleCreateDrive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName) return;
    const newDrive: DriveRecord = {
      id: String(Date.now()),
      driveCode: `D-${Math.floor(3100 + Math.random() * 100)}`,
      companyName: newCompanyName,
      logo: 'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&q=80&w=80',
      type: newRoleType,
      status: 'Upcoming',
      date: 'Next Month',
    };
    setDrives([newDrive, ...drives]);
    setQuickAddOpen(false);
    setNewCompanyName('');
    success('Drive Added Successfully', `${newCompanyName} drive created.`);
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* Top Welcome Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            TPO Admin Dashboard
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              Live Session
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Real-time analytics, upcoming recruitment drives, and student placement metrics.
          </p>
        </div>

        {/* Quick Add Button */}
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

      {/* TOP 4 STATISTIC METRIC CARDS ROW strictly matching Dashboard.jpg */}
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
          <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">5,200</div>
          
          {/* Sparkline Curve */}
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
          <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">350</div>

          {/* Bar Chart Sparkline */}
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
            <span>4,100</span>
            <Trophy className="w-7 h-7 text-[#0B0F17]/30" />
          </div>

          {/* Sparkline Line Curve */}
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
          <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">25</div>

          {/* Partner Company Logo Pills Row */}
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

      {/* MAIN TWO-COLUMN SECTION strictly matching Dashboard.jpg */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT MAIN COLUMN (8 cols): Drive Analytics & Records + Monthly Graph */}
        <div className="lg:col-span-7 space-y-6">

          {/* Card: Drive Analytics & Records */}
          <Card className="p-5 space-y-4">
            {/* Header & Filter Tabs */}
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
                  <TableHead>Drive ID</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Options</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drives.map((drive) => (
                  <TableRow key={drive.id}>
                    <TableCell className="font-bold text-[#A3E635]">{drive.driveCode}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <img src={drive.logo} alt={drive.companyName} className="w-6 h-6 rounded-md object-cover border border-[#202D42]" />
                        <span className="font-bold text-white">{drive.companyName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#94A3B8]">{drive.type}</TableCell>
                    <TableCell>
                      <StatusBadge status={drive.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-right">
                      <button className="text-[#94A3B8] hover:text-white p-1 rounded-lg hover:bg-[#202D42] transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
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

          {/* Insights & Top Recruiters Panel */}
          <Card className="p-5 space-y-5">
            <h2 className="text-base font-extrabold text-white border-b border-[#202D42] pb-3">
              Insights & Top Recruiters
            </h2>

            {/* Side-by-side Analytics Overview Cards */}
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
                  {/* Donut Legend */}
                  <div className="grid grid-cols-2 gap-1 text-[10px] font-semibold text-[#94A3B8]">
                    {branchData.map((b) => (
                      <div key={b.name} className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                        <span>{b.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Highest Package Curve Card */}
                <div className="bg-[#101726] border border-[#202D42] rounded-2xl p-3.5 space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#94A3B8] block">Highest Package</span>
                    <span className="text-xl font-extrabold text-white">₹1.05 LPA</span>
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

            {/* Top Recruiters Logos Grid */}
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

            {/* Recent Activity Timeline strictly matching Dashboard.jpg */}
            <div className="space-y-3 pt-2 border-t border-[#202D42]">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">
                Recent Activity Timeline
              </span>
              <div className="space-y-3">
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

                <div className="flex items-start gap-3 text-xs">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FileCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-white leading-snug">Updated 15 resumes in repository</p>
                    <span className="text-[10px] text-[#64748B]">2 days ago</span>
                  </div>
                </div>
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
