import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Download,
  FileText,
  Award,
  DollarSign,
  Users,
  Building2,
  CheckCircle2,
  PieChart as PieIcon,
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Avatar } from '../components/ui/Avatar';
import { RadialProgress } from '../components/ui/ProgressBar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';

// Mock Data for Top Company Wise Placements
const companyPlacementData = [
  { name: 'Amazon', count: 35 },
  { name: 'Google', count: 30 },
  { name: 'Deloitte', count: 25 },
  { name: 'Accenture', count: 20 },
  { name: 'IBM', count: 15 },
];

// Department Wise Placement Donut Data
const deptPlacementData = [
  { name: 'CS', value: 40, color: '#A3E635' },
  { name: 'EE', value: 25, color: '#10B981' },
  { name: 'ME', value: 20, color: '#38BDF8' },
  { name: 'Civil', value: 15, color: '#F59E0B' },
];

// Monthly Progress Trend Data
const monthlyTrendData = [
  { month: 'Jan', val: 120 },
  { month: 'Feb', val: 180 },
  { month: 'Mar', val: 140 },
  { month: 'Apr', val: 260 },
  { month: 'May', val: 320 },
  { month: 'Jun', val: 280 },
  { month: 'Jul', val: 390 },
  { month: 'Aug', val: 450 },
  { month: 'Sep', val: 410 },
  { month: 'Oct', val: 520 },
  { month: 'Nov', val: 480 },
  { month: 'Dec', val: 600 },
];

// Top Quiz Achievers Data
const topPerformers = [
  { name: 'Rahul Sharma', quiz1: 95, quiz2: 90, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120' },
  { name: 'Priya Patel', quiz1: 98, quiz2: 92, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120' },
  { name: 'Vikram Singh', quiz1: 92, quiz2: 88, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120' },
  { name: 'Anjali Gupta', quiz1: 96, quiz2: 94, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120' },
];

export const Reports: React.FC = () => {
  const { success } = useToast();

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Reports' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-1">
            Placement Reports Dashboard
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              Annual Analytics 2025
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Comprehensive placement performance, department distributions, salary packages, and training completion metrics.
          </p>
        </div>
      </div>

      {/* TOP 3 METRIC CARDS ROW strictly matching Design Reports Dashboard.jpg */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Placement Rate */}
        <Card glowOnHover className="p-6 space-y-2 border-[#202D42]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#94A3B8] uppercase tracking-wider">
              Placement Rate 🎓
            </span>
          </div>
          <div className="text-4xl font-extrabold text-[#A3E635]">94%</div>
          <p className="text-xs text-[#94A3B8] font-medium">Overall Placement Rate (CTC)</p>
          
          <div className="h-12 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData.slice(0, 6)}>
                <Area type="monotone" dataKey="val" stroke="#A3E635" fill="#A3E635" fillOpacity={0.2} strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Card 2: Highest Package */}
        <Card glowOnHover className="p-6 space-y-2 border-[#A3E635]/50 bg-gradient-to-br from-[#162032] via-[#101726] to-[#162032] shadow-[0_0_25px_rgba(163,230,53,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#A3E635] uppercase tracking-wider">
              Highest Package 🤝
            </span>
          </div>
          <div className="text-4xl font-extrabold text-white">₹1.05 Cr PA</div>
          <div className="flex items-center gap-2 pt-1">
            <Avatar src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" name="Ervara" size="sm" border />
            <div>
              <p className="text-xs font-extrabold text-white leading-tight">Rahul Sharma</p>
              <p className="text-[10px] text-[#A3E635]">Amazon (SDE-1)</p>
            </div>
          </div>
        </Card>

        {/* Card 3: Average Package */}
        <Card glowOnHover className="p-6 space-y-2 border-[#202D42]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#94A3B8] uppercase tracking-wider">
              Average Package 💰
            </span>
          </div>
          <div className="text-4xl font-extrabold text-[#38BDF8]">₹12.5 LPA</div>
          <p className="text-xs text-[#94A3B8] font-medium">Average Package (CTC)</p>

          <div className="h-12 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData.slice(6, 12)}>
                <Area type="monotone" dataKey="val" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.2} strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      {/* MAIN CHARTS SECTION strictly matching design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (8 cols): Bar Chart + Donut Chart + Monthly Trend */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Top Row: Company Bar Chart + Department Donut Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Top Company Wise Placements Horizontal Bar Chart */}
            <Card className="p-5 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                Top Company Wise Placements (No. of Students)
              </h3>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={companyPlacementData} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" stroke="#64748B" fontSize={10} hide />
                    <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Bar dataKey="count" fill="#A3E635" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Placement Distribution by Department (%) Donut Chart */}
            <Card className="p-5 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                Placement Distribution by Department (%)
              </h3>
              <div className="h-32 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deptPlacementData} innerRadius={28} outerRadius={48} paddingAngle={4} dataKey="value">
                      {deptPlacementData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-4 gap-1 text-center text-[11px] font-extrabold text-[#94A3B8]">
                {deptPlacementData.map((d) => (
                  <div key={d.name} className="flex flex-col items-center">
                    <span className="w-2.5 h-2.5 rounded-full mb-1" style={{ backgroundColor: d.color }} />
                    <span className="text-white">{d.name}</span>
                    <span className="text-[#A3E635] text-[10px]">{d.value}%</span>
                  </div>
                ))}
              </div>
            </Card>

          </div>

          {/* Monthly Placement Progress Trend Area Graph */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white">Monthly Placement progress Trend</h3>
              <span className="text-xs font-bold text-[#A3E635] flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> Season 2025 On Track
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="reportsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A3E635" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#A3E635" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#101726', borderColor: '#202D42', borderRadius: '12px', color: '#FFF' }}
                  />
                  <Area type="monotone" dataKey="val" stroke="#A3E635" strokeWidth={3} fill="url(#reportsGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>

        {/* RIGHT COLUMN (4 cols): Training Gauges + Quiz Performers + Leaderboard */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Training Attendance & Participation Gauges */}
          <Card className="p-5 space-y-4 bg-[#101726] border-[#202D42]">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Training Attendance & Participation
            </h3>
            
            <div className="grid grid-cols-4 gap-2 text-center">
              <RadialProgress value={92} size={64} strokeWidth={6} label="92%" />
              <RadialProgress value={90} size={64} strokeWidth={6} label="90%" />
              <RadialProgress value={78} size={64} strokeWidth={6} label="78%" />
              <RadialProgress value={92} size={64} strokeWidth={6} label="92%" />
            </div>
            <div className="text-center text-xs font-extrabold text-[#A3E635] pt-1">
              Average Attendance 92%
            </div>
          </Card>

          {/* Top Quiz Performers Card */}
          <Card className="p-5 space-y-3 bg-[#101726] border-[#202D42]">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Top Quiz Performers & Results
            </h3>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              {topPerformers.map((tp, idx) => (
                <div key={idx} className="bg-[#162032] border border-[#202D42] rounded-xl p-2.5 flex items-center gap-2">
                  <Avatar src={tp.avatar} name={tp.name} size="xs" />
                  <div className="truncate">
                    <p className="font-bold text-white truncate text-[11px]">{tp.name}</p>
                    <p className="text-[9px] text-[#A3E635]">Quiz 1: {tp.quiz1} | Q2: {tp.quiz2}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Completion Cards & Top Achievers Leaderboard */}
          <Card className="p-5 space-y-3 bg-[#101726] border-[#202D42]">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Completion Cards & Top Achievers
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#162032] border border-[#202D42]">
                <div className="flex items-center gap-2">
                  <Avatar src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" name="Rahul" size="xs" />
                  <span className="font-bold text-white text-xs">Rahul Sharma</span>
                </div>
                <Badge variant="active">43 Badges</Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-[#162032] border border-[#202D42]">
                <div className="flex items-center gap-2">
                  <Avatar src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120" name="Priya" size="xs" />
                  <span className="font-bold text-white text-xs">Priya Patel</span>
                </div>
                <Badge variant="success">26 Certificates</Badge>
              </div>
            </div>
          </Card>

        </div>

      </div>

      {/* FOOTER ACTIONS strictly matching Design Reports Dashboard.jpg */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#202D42]">
        <Button
          variant="secondary"
          size="md"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={() => success('Export Analytics', 'Exported Analytics_Summary.csv')}
        >
          Export Analytics Report
        </Button>

        <Button
          variant="primary"
          size="md"
          leftIcon={<FileText className="w-4 h-4 text-[#0B0F17]" />}
          onClick={() => success('PDF Exported', 'Exported Placement_Report_2025.pdf')}
          className="font-extrabold"
        >
          Export PDF Report
        </Button>

        <Button
          variant="primary"
          size="md"
          leftIcon={<FileText className="w-4 h-4 text-[#0B0F17]" />}
          onClick={() => success('Excel Exported', 'Exported Placement_Data_Sheet.xlsx')}
          className="font-extrabold shadow-[0_0_15px_rgba(163,230,53,0.3)]"
        >
          Export Excel Report
        </Button>
      </div>

    </div>
  );
};
