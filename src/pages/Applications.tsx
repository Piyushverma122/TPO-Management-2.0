import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  FileCheck,
  Upload,
  Send,
  UserCheck,
  Award,
  Globe,
  Briefcase,
  AlertCircle,
  Trash2,
  ExternalLink,
  ChevronRight,
  Ban,
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import {
  getApplications,
  updateApplication,
  withdrawApplication,
  uploadOffer,
} from '../api/application.api';
import { createNotification } from '../api/notification.api';
import supabase from '../config/supabase';

export interface DetailedApplication {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  rollNumber: string;
  branch: string;
  cgpa: number;
  semester: number;
  companyId: string;
  companyName: string;
  companyLogo: string;
  driveId: string;
  roleTitle: string;
  ctc: string;
  location: string;
  appliedDate: string;
  status: string;
  resumeUrl?: string;
  resumeName?: string;
  offerLetterUrl?: string;
  remarks?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  skills?: string[];
}

export const Applications: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const driveIdParam = searchParams.get('drive_id') || '';

  const { success, error: toastError, info, warning } = useToast();

  // API State
  const [applications, setApplications] = useState<DetailedApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Latest');

  // Modals State
  const [viewingApp, setViewingApp] = useState<DetailedApplication | null>(null);
  const [withdrawAppId, setWithdrawAppId] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  // Fetch Applications from Backend API (Scoped to logged in student if student role)
  const fetchApplicationsData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getApplications({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        drive_id: driveIdParam || undefined,
      });

      const rawList = res.data?.applications || [];
      const total = res.data?.total || rawList.length;

      const formattedList: DetailedApplication[] = rawList.map((a: any) => {
        const driveObj = a.placement_drives || a.drives;
        const compObj = driveObj?.companies;
        const studentObj = a.students;
        const userObj = studentObj?.users;
        const appDate = a.created_at || a.applied_at || a.applied_date;

        return {
          id: a.id,
          studentId: studentObj?.id || '',
          studentName: userObj?.full_name || studentObj?.name || 'Candidate',
          studentAvatar: userObj?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
          rollNumber: studentObj?.roll_number || 'N/A',
          branch: studentObj?.branches?.name || 'Computer Science',
          cgpa: studentObj?.cgpa ? parseFloat(studentObj.cgpa) : 8.0,
          semester: studentObj?.current_semester || 7,
          companyId: compObj?.id || '',
          companyName: compObj?.name || 'Corporate Partner',
          companyLogo: compObj?.logo_url || 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=120',
          driveId: driveObj?.id || '',
          roleTitle: driveObj?.role_title || 'Software Engineer',
          ctc: driveObj?.ctc ? `₹${driveObj.ctc} LPA` : '₹12 LPA',
          location: driveObj?.location || 'On Campus',
          appliedDate: appDate ? new Date(appDate).toLocaleDateString() : new Date().toLocaleDateString(),
          status: a.status || 'Applied',
          resumeUrl: a.resumes?.file_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          resumeName: a.resumes?.file_name || 'Student_CV.pdf',
          offerLetterUrl: a.offer_letter_url || '',
          remarks: a.remarks || 'Application submitted successfully.',
          githubUrl: studentObj?.github_url || '',
          linkedinUrl: studentObj?.linkedin_url || '',
          portfolioUrl: studentObj?.portfolio_url || '',
          skills: studentObj?.skills || ['React', 'TypeScript', 'Node.js'],
        };
      });

      setApplications(formattedList);
      setTotalRecords(total);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load drive applications.';
      setErrorMsg(msg);
      toastError('Error Loading Applications', msg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, selectedStatus, driveIdParam, toastError]);

  useEffect(() => {
    fetchApplicationsData();
  }, [fetchApplicationsData]);

  // Processed Filtered & Sorted Applications
  const processedApplications = useMemo(() => {
    let list = applications.filter((app) => {
      const matchesSearch =
        app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'All' || app.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });

    list.sort((a, b) => {
      if (selectedSort === 'Highest Package') {
        const ctcA = parseFloat(a.ctc.replace(/[^0-9.]/g, '')) || 0;
        const ctcB = parseFloat(b.ctc.replace(/[^0-9.]/g, '')) || 0;
        return ctcB - ctcA;
      }
      return b.id.localeCompare(a.id);
    });

    return list;
  }, [applications, searchQuery, selectedStatus, selectedSort]);

  // Handle Application Withdrawal
  const handleWithdrawConfirm = async () => {
    if (!withdrawAppId) return;
    setWithdrawing(true);
    try {
      await withdrawApplication(withdrawAppId);
      success('Application Withdrawn', 'Your application has been withdrawn cleanly.');
      setWithdrawAppId(null);
      await fetchApplicationsData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to withdraw application.';
      toastError('Withdrawal Error', msg);
    } finally {
      setWithdrawing(false);
    }
  };

  // Status Badge Colors Mapping Helper
  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-extrabold">Applied</span>;
      case 'under review':
        return <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-extrabold">Under Review</span>;
      case 'shortlisted':
        return <span className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full text-xs font-extrabold">Shortlisted</span>;
      case 'interview scheduled':
      case 'round 1':
      case 'round 2':
      case 'technical':
      case 'hr':
        return <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-extrabold">{status}</span>;
      case 'selected':
      case 'placed':
        return <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-extrabold">Selected / Placed</span>;
      case 'offer':
      case 'offer released':
        return <span className="bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 px-3 py-1 rounded-full text-xs font-extrabold">Offer Released</span>;
      case 'rejected':
        return <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-extrabold">Rejected</span>;
      default:
        return <span className="bg-[#162032] text-[#94A3B8] border border-[#202D42] px-3 py-1 rounded-full text-xs font-extrabold">{status}</span>;
    }
  };

  // Timeline Active Stage Helper
  const getTimelineStepIndex = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'applied') return 1;
    if (s === 'under review') return 2;
    if (s === 'shortlisted') return 3;
    if (s.includes('interview') || s.includes('round') || s === 'technical' || s === 'hr') return 4;
    if (s === 'offer' || s === 'offer released') return 5;
    if (s === 'selected' || s === 'placed') return 6;
    if (s === 'rejected') return -1;
    return 1;
  };

  const isWithdrawAllowed = (status: string) => {
    const s = status.toLowerCase();
    return s === 'applied' || s === 'under review';
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'My Applications' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3 mt-1">
            My Drive Applications
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              {totalRecords} Submissions
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Track your recruitment drive applications, interview progress timelines, and offer letters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchApplicationsData}
            disabled={loading}
          >
            Refresh List
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Briefcase className="w-4 h-4" />}
            onClick={() => navigate('/drives')}
            className="font-extrabold px-5 shadow-[0_0_15px_rgba(163,230,53,0.3)]"
          >
            Browse Drives
          </Button>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          <div className="lg:col-span-2">
            <SearchInput
              placeholder="Search by company, role title, or application ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Dropdown
            label="Filter by Status:"
            options={[
              { label: 'All Statuses', value: 'All' },
              { label: 'Applied', value: 'Applied' },
              { label: 'Under Review', value: 'Under Review' },
              { label: 'Shortlisted', value: 'Shortlisted' },
              { label: 'Interview Scheduled', value: 'Interview Scheduled' },
              { label: 'Offer Released', value: 'Offer Released' },
              { label: 'Selected', value: 'Selected' },
              { label: 'Rejected', value: 'Rejected' },
            ]}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />

          <Dropdown
            label="Sort Applications:"
            options={[
              { label: 'Latest Submissions', value: 'Latest' },
              { label: 'Highest Package (CTC)', value: 'Highest Package' },
            ]}
            value={selectedSort}
            onChange={setSelectedSort}
          />
        </div>
      </Card>

      {/* ERROR STATE */}
      {errorMsg ? (
        <Card className="p-8 text-center space-y-4 border-rose-500/30 bg-rose-500/5">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Error Loading Applications</h3>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto">{errorMsg}</p>
          <Button variant="primary" size="md" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchApplicationsData}>
            Retry Loading Applications
          </Button>
        </Card>
      ) : loading ? (
        /* LOADING SKELETON STATE */
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5 border-[#202D42] animate-pulse space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#162032] rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-4 bg-[#162032] rounded w-48" />
                    <div className="h-3 bg-[#162032] rounded w-32" />
                  </div>
                </div>
                <div className="h-8 bg-[#162032] rounded-xl w-24" />
              </div>
            </Card>
          ))}
        </div>
      ) : processedApplications.length === 0 ? (
        /* EMPTY STATE */
        <Card className="p-12 text-center space-y-4 border-[#202D42] bg-[#101726]">
          <Briefcase className="w-12 h-12 text-[#94A3B8] mx-auto opacity-40" />
          <h3 className="text-xl font-extrabold text-white">You haven't applied to any placement drives yet.</h3>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
            Browse available campus recruitment drives matching your eligibility criteria and submit your application.
          </p>
          <Button variant="primary" size="md" leftIcon={<Send className="w-4 h-4" />} onClick={() => navigate('/drives')}>
            Browse Drives
          </Button>
        </Card>
      ) : (
        /* LIVE APPLICATIONS LIST WITH JOURNEY TIMELINES */
        <div className="space-y-4">
          {processedApplications.map((app) => {
            const currentStepIndex = getTimelineStepIndex(app.status);
            const withdrawable = isWithdrawAllowed(app.status);

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="p-5 border-[#202D42] space-y-5 hover:border-[#A3E635]/40 transition-colors">
                  
                  {/* Top Bar: Company Details + Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#202D42] pb-4">
                    <div className="flex items-center gap-4">
                      <Avatar src={app.companyLogo} name={app.companyName} size="md" className="border border-[#202D42]" />
                      <div>
                        <h3 className="text-base font-extrabold text-white leading-tight flex items-center gap-2">
                          {app.companyName}
                          <span className="text-xs text-[#94A3B8] font-mono font-normal">ID: {app.id.slice(0, 8)}</span>
                        </h3>
                        <p className="text-xs text-[#A3E635] font-semibold">{app.roleTitle} • {app.ctc}</p>
                        <p className="text-[11px] text-[#94A3B8] flex items-center gap-2 mt-0.5">
                          <Calendar className="w-3 h-3 text-[#64748B]" /> Applied: {app.appliedDate}
                          <span className="text-[#64748B]">•</span>
                          <Building2 className="w-3 h-3 text-[#64748B]" /> {app.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-center">
                      {renderStatusBadge(app.status)}
                    </div>
                  </div>

                  {/* APPLICATION TIMELINE JOURNEY STEPS */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">Application Journey Timeline</span>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[11px]">
                      
                      {/* Step 1: Applied */}
                      <div className={`p-2 rounded-xl border ${currentStepIndex >= 1 ? 'bg-[#A3E635]/15 border-[#A3E635]/40 text-white' : 'bg-[#101726] border-[#202D42] text-[#64748B]'}`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 mx-auto mb-1 ${currentStepIndex >= 1 ? 'text-[#A3E635]' : 'text-[#64748B]'}`} />
                        <span className="font-bold block">1. Applied</span>
                      </div>

                      {/* Step 2: Under Review */}
                      <div className={`p-2 rounded-xl border ${currentStepIndex >= 2 ? 'bg-[#A3E635]/15 border-[#A3E635]/40 text-white' : 'bg-[#101726] border-[#202D42] text-[#64748B]'}`}>
                        <Clock className={`w-3.5 h-3.5 mx-auto mb-1 ${currentStepIndex >= 2 ? 'text-[#A3E635]' : 'text-[#64748B]'}`} />
                        <span className="font-bold block">2. Review</span>
                      </div>

                      {/* Step 3: Shortlisted */}
                      <div className={`p-2 rounded-xl border ${currentStepIndex >= 3 ? 'bg-[#A3E635]/15 border-[#A3E635]/40 text-white' : 'bg-[#101726] border-[#202D42] text-[#64748B]'}`}>
                        <UserCheck className={`w-3.5 h-3.5 mx-auto mb-1 ${currentStepIndex >= 3 ? 'text-[#A3E635]' : 'text-[#64748B]'}`} />
                        <span className="font-bold block">3. Shortlist</span>
                      </div>

                      {/* Step 4: Interview */}
                      <div className={`p-2 rounded-xl border ${currentStepIndex >= 4 ? 'bg-[#A3E635]/15 border-[#A3E635]/40 text-white' : 'bg-[#101726] border-[#202D42] text-[#64748B]'}`}>
                        <Calendar className={`w-3.5 h-3.5 mx-auto mb-1 ${currentStepIndex >= 4 ? 'text-[#A3E635]' : 'text-[#64748B]'}`} />
                        <span className="font-bold block">4. Interview</span>
                      </div>

                      {/* Step 5: Offer Released */}
                      <div className={`p-2 rounded-xl border ${currentStepIndex >= 5 ? 'bg-[#A3E635]/15 border-[#A3E635]/40 text-white' : 'bg-[#101726] border-[#202D42] text-[#64748B]'}`}>
                        <Award className={`w-3.5 h-3.5 mx-auto mb-1 ${currentStepIndex >= 5 ? 'text-[#A3E635]' : 'text-[#64748B]'}`} />
                        <span className="font-bold block">5. Offer</span>
                      </div>

                      {/* Step 6: Selected */}
                      <div className={`p-2 rounded-xl border ${currentStepIndex >= 6 ? 'bg-emerald-500/20 border-emerald-500/40 text-white' : app.status === 'Rejected' ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-[#101726] border-[#202D42] text-[#64748B]'}`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 mx-auto mb-1 ${currentStepIndex >= 6 ? 'text-emerald-400' : app.status === 'Rejected' ? 'text-rose-400' : 'text-[#64748B]'}`} />
                        <span className="font-bold block">{app.status === 'Rejected' ? 'Rejected' : '6. Placed'}</span>
                      </div>

                    </div>
                  </div>

                  {/* ACTION BUTTONS ROW */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#202D42] text-xs">
                    <Button variant="secondary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5 text-sky-400" />} onClick={() => setViewingApp(app)}>
                      View Application Specifications
                    </Button>

                    {withdrawable ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-400" />}
                        onClick={() => setWithdrawAppId(app.id)}
                        className="hover:border-rose-500/40 hover:text-rose-400"
                      >
                        Withdraw Application
                      </Button>
                    ) : (
                      <span className="text-[11px] text-[#64748B] font-bold italic">
                        Withdrawal locked for {app.status} stage
                      </span>
                    )}
                  </div>

                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* FOOTER BAR & PAGINATION */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalRecords / itemsPerPage) || 1}
          onPageChange={setCurrentPage}
          totalEntries={totalRecords}
        />
      </div>

      {/* VIEW APPLICATION DETAILS MODAL */}
      <AnimatePresence>
        {viewingApp && (
          <Modal
            isOpen={!!viewingApp}
            onClose={() => setViewingApp(null)}
            title={`Application Details — ${viewingApp.companyName}`}
            subtitle={`Role: ${viewingApp.roleTitle} • ID: ${viewingApp.id}`}
            maxWidth="xl"
          >
            <div className="space-y-5 bg-[#101726] border border-[#202D42] p-6 rounded-2xl text-xs">
              
              {/* Header */}
              <div className="border-b border-[#202D42] pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={viewingApp.companyLogo} name={viewingApp.companyName} size="md" />
                  <div>
                    <h2 className="text-xl font-extrabold text-white">{viewingApp.companyName}</h2>
                    <p className="text-xs text-[#A3E635] font-semibold">{viewingApp.roleTitle}</p>
                  </div>
                </div>
                <div>{renderStatusBadge(viewingApp.status)}</div>
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#162032] p-3 rounded-xl border border-[#202D42]">
                <div>
                  <span className="text-[10px] text-[#94A3B8] block">Applied Date</span>
                  <span className="font-bold text-white text-xs">{viewingApp.appliedDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#94A3B8] block">Package CTC</span>
                  <span className="font-bold text-[#A3E635] text-xs">{viewingApp.ctc}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#94A3B8] block">Location</span>
                  <span className="font-bold text-white text-xs">{viewingApp.location}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#94A3B8] block">Branch</span>
                  <span className="font-bold text-white text-xs">{viewingApp.branch}</span>
                </div>
              </div>

              {/* Status Remarks */}
              <div className="space-y-1">
                <span className="font-extrabold text-white uppercase text-[11px]">Recruiter / System Remarks</span>
                <p className="text-[#94A3B8] leading-relaxed p-3 bg-[#162032] rounded-xl border border-[#202D42]">
                  {viewingApp.remarks}
                </p>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#202D42] flex justify-end gap-3">
                <Button variant="secondary" size="md" onClick={() => setViewingApp(null)}>
                  Close
                </Button>
              </div>

            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* CONFIRM WITHDRAWAL MODAL */}
      <AnimatePresence>
        {withdrawAppId && (
          <Modal
            isOpen={!!withdrawAppId}
            onClose={() => setWithdrawAppId(null)}
            title="Confirm Application Withdrawal"
            subtitle="Are you sure you wish to withdraw your application?"
            maxWidth="md"
          >
            <div className="space-y-4 text-xs">
              <p className="text-[#94A3B8] leading-relaxed">
                Withdrawing will remove your candidate profile from this recruitment drive's active pool. You will not be able to re-apply once the registration deadline passes.
              </p>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#202D42]">
                <Button variant="secondary" size="md" onClick={() => setWithdrawAppId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  isLoading={withdrawing}
                  onClick={handleWithdrawConfirm}
                  className="bg-rose-500 hover:bg-rose-600 border-none text-white font-extrabold"
                >
                  Confirm Withdrawal
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

    </div>
  );
};
