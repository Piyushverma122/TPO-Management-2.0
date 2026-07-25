import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  Check,
  Star,
  X,
  Eye,
  Download,
  Building2,
  GraduationCap,
  Calendar,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';

// Sparkline Mock Data
const applicationSparklineData = [
  { day: 'Oct 12', count: 5 },
  { day: 'Oct 20', count: 15 },
  { day: 'Oct 28', count: 8 },
  { day: 'Nov 04', count: 12 },
];

export type ApplicationStatusType = 'Applied: Pending Review' | 'Shortlisted' | 'Approved' | 'Rejected';

export interface ApplicationItem {
  id: string;
  studentName: string;
  studentAvatar: string;
  branch: string;
  roleTitle: string;
  companyName: string;
  companyLogo: string;
  appliedDate: string;
  status: ApplicationStatusType;
}

// Initial Applications List matching Design Applications page..jpg
const initialApplications: ApplicationItem[] = [
  {
    id: 'app-1',
    studentName: 'Ervara Mahiral',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    branch: 'CS Branch',
    roleTitle: 'SDE Intern',
    companyName: 'Amazon',
    companyLogo: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=120',
    appliedDate: 'Oct 15, 2024',
    status: 'Shortlisted',
  },
  {
    id: 'app-2',
    studentName: 'Jamel Mahiral',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    branch: 'CS Branch',
    roleTitle: 'Data Analyst',
    companyName: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&q=80&w=120',
    appliedDate: 'Oct 16, 2024',
    status: 'Applied: Pending Review',
  },
  {
    id: 'app-3',
    studentName: 'Kaelen Vance',
    studentAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    branch: 'IT Branch',
    roleTitle: 'Product Manager',
    companyName: 'Microsoft',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=120',
    appliedDate: 'Oct 17, 2024',
    status: 'Approved',
  },
  {
    id: 'app-4',
    studentName: 'Seraphina Moon',
    studentAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120',
    branch: 'EE Branch',
    roleTitle: 'Hardware Engineer',
    companyName: 'Apple',
    companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=120',
    appliedDate: 'Oct 18, 2024',
    status: 'Rejected',
  },
  {
    id: 'app-5',
    studentName: 'Liam Hayes',
    studentAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=120',
    branch: 'ME Branch',
    roleTitle: 'Operations Intern',
    companyName: 'Deloitte',
    companyLogo: 'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&q=80&w=120',
    appliedDate: 'Oct 19, 2024',
    status: 'Applied: Pending Review',
  },
  {
    id: 'app-6',
    studentName: 'Aanya Patel',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    branch: 'CS Branch',
    roleTitle: 'Frontend Engineer',
    companyName: 'Amazon',
    companyLogo: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=120',
    appliedDate: 'Oct 20, 2024',
    status: 'Shortlisted',
  },
];

export const Applications: React.FC = () => {
  const { success, info, warning } = useToast();
  const [applications, setApplications] = useState<ApplicationItem[]>(initialApplications);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [previewApp, setPreviewApp] = useState<ApplicationItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Status Counts
  const activeReviewsCount = useMemo(() => applications.filter((a) => a.status === 'Applied: Pending Review').length, [applications]);
  const approvedCount = useMemo(() => applications.filter((a) => a.status === 'Approved').length, [applications]);

  // Filtered List
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.roleTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCompany = selectedCompany === 'All' || app.companyName === selectedCompany;
      const matchesBranch = selectedBranch === 'All' || app.branch.includes(selectedBranch);
      const matchesStatus = selectedStatus === 'All' || app.status === selectedStatus;

      return matchesSearch && matchesCompany && matchesBranch && matchesStatus;
    });
  }, [applications, searchQuery, selectedCompany, selectedBranch, selectedStatus]);

  const updateStatus = (id: string, newStatus: ApplicationStatusType) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
    if (newStatus === 'Shortlisted') success('Candidate Shortlisted', 'Candidate moved to shortlist pool.');
    if (newStatus === 'Approved') success('Candidate Approved', 'Approved candidate for HR rounds.');
    if (newStatus === 'Rejected') warning('Application Rejected', 'Candidate status updated to rejected.');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCompany('All');
    setSelectedBranch('All');
    setSelectedStatus('All');
    info('Filters Cleared', 'Reset all search and dropdown filters.');
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Placement Drives' }, { label: 'Applications' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-1">
            Applications Management Console
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              Live Review Queue
            </span>
          </h1>
        </div>
      </div>

      {/* TOP STAT SUMMARY PANEL strictly matching Design Applications page..jpg */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Main 3 Metrics Panel */}
        <Card className="lg:col-span-9 p-6 bg-gradient-to-r from-[#162032] via-[#101726] to-[#162032] border-[#202D42]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                Total Applications Received
              </span>
              <span className="text-3xl font-extrabold text-white mt-1 block">1300</span>
              <span className="text-[10px] text-[#A3E635] font-semibold mt-1 block">Total Applications Received</span>
            </div>

            <div className="sm:border-l border-[#202D42] sm:pl-6">
              <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                Active Reviews
              </span>
              <span className="text-3xl font-extrabold text-[#A3E635] mt-1 block">38</span>
              <span className="text-[10px] text-[#A3E635] font-semibold mt-1 block">Approved for HR Rounds</span>
            </div>

            <div className="sm:border-l border-[#202D42] sm:pl-6">
              <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                Approved for HR Rounds
              </span>
              <span className="text-3xl font-extrabold text-amber-400 mt-1 block">16</span>
              <span className="text-[10px] text-amber-400 font-semibold mt-1 block">Pending Decisions</span>
            </div>
          </div>
        </Card>

        {/* Top Right Applications Sparkline Chart */}
        <Card className="lg:col-span-3 p-5 bg-[#101726] border-[#202D42] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-white">Applications</span>
            <span className="text-[10px] text-[#A3E635] font-bold">+18%</span>
          </div>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={applicationSparklineData}>
                <Area type="monotone" dataKey="count" stroke="#A3E635" fill="#A3E635" fillOpacity={0.25} strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[9px] font-bold text-[#64748B] uppercase">
            <span>Oct 12</span>
            <span>Oct</span>
            <span>Nov</span>
          </div>
        </Card>

      </div>

      {/* THREE FILTER CARDS ROW strictly matching Design Applications page..jpg */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Filter 1: Filter by Company */}
        <Card className="p-4 space-y-2">
          <span className="text-xs font-extrabold text-white uppercase tracking-wider block">
            Filter by Company
          </span>
          <Dropdown
            options={[
              { label: 'All Companies', value: 'All' },
              { label: 'Amazon', value: 'Amazon' },
              { label: 'Google', value: 'Google' },
              { label: 'Microsoft', value: 'Microsoft' },
              { label: 'Apple', value: 'Apple' },
              { label: 'Deloitte', value: 'Deloitte' },
            ]}
            value={selectedCompany}
            onChange={setSelectedCompany}
          />
        </Card>

        {/* Filter 2: Filter by Branch */}
        <Card className="p-4 space-y-2">
          <span className="text-xs font-extrabold text-white uppercase tracking-wider block">
            Filter by Branch
          </span>
          <div className="flex items-center gap-1.5 pt-1">
            {['CS', 'IT', 'EE', 'ME'].map((b) => {
              const isSelected = selectedBranch === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBranch(isSelected ? 'All' : b)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[#A3E635] text-[#0B0F17] shadow-[0_0_10px_rgba(163,230,53,0.3)]'
                      : 'bg-[#101726] border border-[#202D42] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {b}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Filter 3: Filter by Application Status */}
        <Card className="p-4 space-y-2">
          <span className="text-xs font-extrabold text-white uppercase tracking-wider block">
            Filter by Application Status
          </span>
          <Dropdown
            options={[
              { label: 'All Statuses', value: 'All' },
              { label: 'Applied: Pending Review', value: 'Applied: Pending Review' },
              { label: 'Shortlisted', value: 'Shortlisted' },
              { label: 'Approved', value: 'Approved' },
              { label: 'Rejected', value: 'Rejected' },
            ]}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />
        </Card>

      </div>

      {/* APPLICATION REVIEW TABLE CARD strictly matching Design Applications page..jpg */}
      <Card className="p-6 space-y-5">
        
        {/* Table Header Row with Clear Filter button */}
        <div className="flex items-center justify-between border-b border-[#202D42] pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-extrabold text-white">Application Review</h2>
            <SearchInput
              placeholder="Search candidate name or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 py-1.5 text-xs"
            />
          </div>

          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs font-bold text-[#A3E635] hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Clear Filter
          </button>
        </div>

        {/* Applications Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Resume</TableHead>
              <TableHead>Applied Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApps.map((app) => (
              <TableRow key={app.id}>
                
                {/* Student Column (Avatar + Name + Role subtitle) */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar src={app.studentAvatar} name={app.studentName} size="md" />
                    <div>
                      <h4 className="font-extrabold text-white hover:text-[#A3E635] transition-colors">{app.studentName}</h4>
                      <p className="text-xs text-[#94A3B8]">
                        {app.branch}, {app.roleTitle}, <strong className="text-white">{app.companyName}</strong>
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* View Resume Button */}
                <TableCell>
                  <button
                    type="button"
                    onClick={() => setPreviewApp(app)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#101726] border border-[#202D42] text-xs font-bold text-[#A3E635] hover:border-[#A3E635]/40 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View Resume
                  </button>
                </TableCell>

                {/* Applied Date */}
                <TableCell className="text-[#94A3B8] font-medium">{app.appliedDate}</TableCell>

                {/* Status Badge strictly matching image */}
                <TableCell>
                  {app.status === 'Shortlisted' ? (
                    <Badge variant="active" icon={<Check className="w-3 h-3" />}>
                      Shortlisted
                    </Badge>
                  ) : app.status === 'Approved' ? (
                    <Badge variant="success" icon={<CheckCircle2 className="w-3 h-3" />}>
                      Approved
                    </Badge>
                  ) : app.status === 'Rejected' ? (
                    <Badge variant="alert" icon={<XCircle className="w-3 h-3" />}>
                      Rejected
                    </Badge>
                  ) : (
                    <Badge variant="warning" icon={<Clock className="w-3 h-3" />}>
                      Applied: Pending Review
                    </Badge>
                  )}
                </TableCell>

                {/* Actions Button Group strictly matching Shortlist (Green), Approve (Star), Reject (Red) */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    
                    {/* Shortlist Button */}
                    <button
                      type="button"
                      onClick={() => updateStatus(app.id, 'Shortlisted')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                        app.status === 'Shortlisted'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                          : 'bg-[#101726] border border-[#202D42] text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30'
                      }`}
                      title="Shortlist Candidate"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Shortlist</span>
                    </button>

                    {/* Approve Button */}
                    <button
                      type="button"
                      onClick={() => updateStatus(app.id, 'Approved')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                        app.status === 'Approved'
                          ? 'bg-[#A3E635] text-[#0B0F17] shadow-[0_0_10px_rgba(163,230,53,0.4)]'
                          : 'bg-[#101726] border border-[#202D42] text-[#A3E635] hover:bg-[#A3E635]/10 hover:border-[#A3E635]/30'
                      }`}
                      title="Approve for HR Rounds"
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>Approve</span>
                    </button>

                    {/* Reject Button */}
                    <button
                      type="button"
                      onClick={() => updateStatus(app.id, 'Rejected')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                        app.status === 'Rejected'
                          ? 'bg-rose-500/25 text-rose-400 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                          : 'bg-[#101726] border border-[#202D42] text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30'
                      }`}
                      title="Reject Application"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                  </div>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Footer Bar & Pagination matching design */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={43}
            onPageChange={setCurrentPage}
            totalEntries={2130}
          />

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => info('Export Data', 'Exporting Application_Records.xlsx...')}
            >
              Export Application Data
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => success('Decisions Finalized', 'All review decisions published to candidates.')}
              className="px-6 font-extrabold"
            >
              Finalize All Decisions
            </Button>
          </div>
        </div>

      </Card>

      {/* PREVIEW CANDIDATE APPLICATION & RESUME MODAL */}
      <AnimatePresence>
        {previewApp && (
          <Modal
            isOpen={!!previewApp}
            onClose={() => setPreviewApp(null)}
            title={`Application Details: ${previewApp.studentName}`}
            subtitle={`${previewApp.branch} • Applied for ${previewApp.roleTitle} @ ${previewApp.companyName}`}
            maxWidth="lg"
          >
            <div className="space-y-6 bg-[#101726] border border-[#202D42] p-6 rounded-2xl text-xs">
              <div className="flex items-center gap-4 border-b border-[#202D42] pb-4">
                <Avatar src={previewApp.studentAvatar} name={previewApp.studentName} size="lg" />
                <div>
                  <h3 className="text-lg font-extrabold text-white">{previewApp.studentName}</h3>
                  <p className="text-xs text-[#A3E635] font-semibold">{previewApp.branch}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#162032] border border-[#202D42] p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Target Company</span>
                  <span className="text-sm font-extrabold text-white">{previewApp.companyName}</span>
                </div>
                <div className="bg-[#162032] border border-[#202D42] p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Target Role</span>
                  <span className="text-sm font-extrabold text-[#A3E635]">{previewApp.roleTitle}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#202D42]">
                <Button variant="secondary" size="sm" onClick={() => setPreviewApp(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    updateStatus(previewApp.id, 'Shortlisted');
                    setPreviewApp(null);
                  }}
                >
                  Shortlist Candidate
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

    </div>
  );
};
