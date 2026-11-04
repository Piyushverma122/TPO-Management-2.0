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

import { Card } from '../components/app/Card';
import { Button } from '../components/app/Button';
import { Badge, StatusBadge } from '../components/app/Badge';
import { Input, SearchInput } from '../components/app/Input';
import { Dropdown } from '../components/app/Dropdown';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/app/Table';
import { Pagination } from '../components/app/Pagination';
import { Modal } from '../components/app/Modal';
import { Avatar } from '../components/app/Avatar';
import { Breadcrumb } from '../components/app/Breadcrumb';
import { useToast } from '../components/app/Toast';
import { useAuth } from '../context/AuthContext';
import {
  getApplications,
  updateApplication,
  withdrawApplication,
} from '../api/application.api';
import { createNotification } from '../api/notification.api';
import supabase from '../config/supabase';
import { Button as ShadButton } from '@/components/ui/button';
import { CompanyLogo } from '../components/app/CompanyLogo';

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
  const searchParam = searchParams.get('search') || '';

  const { success, error: toastError, info, warning } = useToast();

  // API State
  const [applications, setApplications] = useState<DetailedApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Latest');

  // Modals State
  const [viewingApp, setViewingApp] = useState<DetailedApplication | null>(null);
  const [withdrawAppId, setWithdrawAppId] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParam]);

  // Fetch Applications from Backend API
  const fetchApplicationsData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let fetchedList: DetailedApplication[] = [];
      let totalCount = 0;

      const res = await getApplications({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || searchParam || undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        drive_id: driveIdParam || undefined,
      });

      const rawList = res.data?.applications || [];
      totalCount = res.data?.total || rawList.length;

      if (rawList.length > 0) {
        fetchedList = rawList.map((a: any) => {
          const driveObj = a.placement_drives || a.drives;
          const compObj = driveObj?.companies;
          const studentObj = a.students;
          const userObj = studentObj?.users;
          const appDate = a.created_at || a.applied_at || a.applied_date;

          return {
            id: a.id,
            studentId: studentObj?.id || '',
            studentName: userObj?.full_name || studentObj?.name || 'Candidate',
            studentAvatar: userObj?.avatar_url || '',
            rollNumber: studentObj?.roll_number || '',
            branch: studentObj?.branches?.name || '',
            cgpa: studentObj?.cgpa ? parseFloat(studentObj.cgpa) : 0,
            semester: studentObj?.current_semester || 0,
            companyId: compObj?.id || '',
            companyName: compObj?.name || driveObj?.company_name || 'Corporate Partner',
            companyLogo: compObj?.logo_url || '',
            driveId: driveObj?.id || a.drive_id || '',
            roleTitle: driveObj?.role_title || '',
            ctc: Number(driveObj?.ctc) > 0 ? `₹${driveObj.ctc} LPA` : '',
            location: driveObj?.location || '',
            appliedDate: appDate ? new Date(appDate).toLocaleDateString() : new Date().toLocaleDateString(),
            status: a.status || 'Applied',
            resumeUrl: a.resumes?.file_url || '',
            resumeName: a.resumes?.file_name || '',
            offerLetterUrl: a.offer_letter_url || '',
            remarks: a.remarks || '',
            skills: studentObj?.skills || [],
          };
        });
      }

      setApplications(fetchedList);
      setTotalRecords(totalCount);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load applications.';
      setErrorMsg(message);
      setApplications([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, searchParam, selectedStatus, driveIdParam]);

  useEffect(() => {
    fetchApplicationsData();
  }, [fetchApplicationsData]);

  // Processed Filtered & Sorted Applications
  const processedApplications = useMemo(() => {
    const list = applications.filter((app) => {
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
        return <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-semibold">Applied</span>;
      case 'under review':
        return <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold">Under Review</span>;
      case 'shortlisted':
        return <span className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full text-xs font-semibold">Shortlisted</span>;
      case 'interview scheduled':
      case 'round 1':
      case 'round 2':
      case 'technical':
      case 'hr':
        return <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-semibold">{status}</span>;
      case 'selected':
      case 'placed':
        return <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold">Selected / Placed</span>;
      case 'offer':
      case 'offer released':
        return <span className="bg-primary/15 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-semibold">Offer Released</span>;
      case 'rejected':
        return <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-semibold">Rejected</span>;
      default:
        return <span className="bg-card text-muted-foreground border border-border px-3 py-1 rounded-full text-xs font-semibold">{status}</span>;
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'My Applications' }]} />
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-3">My applications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalRecords} submissions. Track progress, interviews and offers for every drive.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="tertiary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchApplicationsData}
            disabled={loading}
            className="text-xs"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Briefcase className="w-4 h-4" />}
            onClick={() => navigate('/drives')}
            className="text-xs"
          >
            Browse drives
          </Button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 relative z-30">
        <div className="flex-1 min-w-0">
          <SearchInput
            placeholder="Search by company, role or application ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
          <Dropdown
            className="w-full sm:w-52 shrink-0"
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
            className="w-full sm:w-56 shrink-0"
            options={[
              { label: 'Latest Submissions', value: 'Latest' },
              { label: 'Highest Package (CTC)', value: 'Highest Package' },
            ]}
            value={selectedSort}
            onChange={setSelectedSort}
          />

          {(selectedStatus !== 'All' || selectedSort !== 'Latest' || searchQuery !== '') && (
            <ShadButton
              variant="ghost"
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('All');
                setSelectedSort('Latest');
              }}
              className="h-10 rounded-full px-4 text-xs text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </ShadButton>
          )}
        </div>
      </div>

      {/* ERROR STATE */}
      {errorMsg ? (
        <Card className="p-10 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h3 className="text-lg font-semibold text-foreground">Error loading applications</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{errorMsg}</p>
          <Button variant="primary" size="md" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchApplicationsData}>
            Retry
          </Button>
        </Card>
      ) : loading ? (
        /* LOADING SKELETON STATE */
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-secondary rounded-2xl" />
                <div className="space-y-2">
                  <div className="h-4 bg-secondary rounded w-48" />
                  <div className="h-3 bg-secondary rounded w-32" />
                </div>
              </div>
              <div className="h-12 bg-secondary rounded-2xl" />
            </Card>
          ))}
        </div>
      ) : processedApplications.length === 0 ? (
        /* EMPTY STATE */
        <Card className="p-14 text-center space-y-3">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Briefcase className="w-6 h-6" />
          </span>
          <h3 className="text-lg font-semibold text-foreground">You have not applied to any drives yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Browse campus recruitment drives that match your eligibility and submit your application.
          </p>
          <Button variant="primary" size="md" leftIcon={<Send className="w-4 h-4" />} onClick={() => navigate('/drives')}>
            Browse drives
          </Button>
        </Card>
      ) : (
        /* LIVE APPLICATIONS LIST WITH JOURNEY STEPPER */
        <div className="space-y-4">
          {processedApplications.map((app) => {
            const currentStepIndex = getTimelineStepIndex(app.status);
            const withdrawable = isWithdrawAllowed(app.status);
            const rejected = app.status === 'Rejected';
            const steps = [
              { label: 'Applied', icon: CheckCircle2 },
              { label: 'Review', icon: Clock },
              { label: 'Shortlist', icon: UserCheck },
              { label: 'Interview', icon: Calendar },
              { label: 'Offer', icon: Award },
              { label: rejected ? 'Rejected' : 'Placed', icon: rejected ? XCircle : CheckCircle2 },
            ];

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="p-6 space-y-6">
                  {/* Company + status */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <CompanyLogo src={app.companyLogo} name={app.companyName} size="lg" />
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-foreground">{app.companyName}</h3>
                        <p className="truncate text-sm text-muted-foreground">
                          {app.roleTitle} &middot; {app.ctc}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Applied {app.appliedDate}</span>
                          <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> {app.location}</span>
                          <span className="font-mono">#{app.id.slice(0, 8)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">{renderStatusBadge(app.status)}</div>
                  </div>

                  {/* Journey stepper */}
                  <ol className="grid grid-cols-6 gap-0">
                    {steps.map((step, i) => {
                      const n = i + 1;
                      const isLast = n === steps.length;
                      const done = currentStepIndex > n || (isLast && currentStepIndex >= n);
                      const current = currentStepIndex === n && !isLast;
                      const failed = isLast && rejected;
                      const Icon = step.icon;
                      return (
                        <li key={step.label} className="relative flex flex-col items-center text-center">
                          {!isLast && (
                            <span
                              className={`absolute left-1/2 top-4 h-px w-full ${currentStepIndex > n ? 'bg-primary' : 'bg-border'}`}
                              aria-hidden
                            />
                          )}
                          <span
                            className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs ${
                              failed
                                ? 'border-destructive bg-destructive/15 text-red-400'
                                : done
                                ? 'border-primary bg-primary text-primary-foreground'
                                : current
                                ? 'border-primary bg-card text-foreground ring-4 ring-primary/20'
                                : 'border-border bg-card text-muted-foreground'
                            }`}
                          >
                            {done && !failed ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                          </span>
                          <span
                            className={`mt-2 text-[11px] font-medium ${
                              current || done || failed ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {step.label}
                          </span>
                        </li>
                      );
                    })}
                  </ol>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <Button variant="tertiary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />} onClick={() => setViewingApp(app)}>
                      View details
                    </Button>

                    {withdrawable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        onClick={() => setWithdrawAppId(app.id)}
                        className="hover:text-red-400"
                      >
                        Withdraw
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Withdrawal locked at {app.status} stage</span>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      <Card className="px-4 py-2">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalRecords / itemsPerPage) || 1}
          onPageChange={setCurrentPage}
          totalEntries={totalRecords}
        />
      </Card>

      {/* VIEW APPLICATION DETAILS MODAL */}
      <AnimatePresence>
        {viewingApp && (
          <Modal
            isOpen={!!viewingApp}
            onClose={() => setViewingApp(null)}
            title="Application details"
            subtitle={`ID: ${viewingApp.id}`}
            maxWidth="xl"
            footer={
              <Button variant="primary" size="md" onClick={() => setViewingApp(null)}>
                Close
              </Button>
            }
          >
            <div className="space-y-6 text-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <CompanyLogo src={viewingApp.companyLogo} name={viewingApp.companyName} size="lg" />
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-foreground">{viewingApp.companyName}</h2>
                    <p className="truncate text-sm text-muted-foreground">{viewingApp.roleTitle}</p>
                  </div>
                </div>
                <div className="shrink-0">{renderStatusBadge(viewingApp.status)}</div>
              </div>

              <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-secondary p-4">
                {[
                  ['Applied date', viewingApp.appliedDate],
                  ['Package (CTC)', viewingApp.ctc],
                  ['Location', viewingApp.location],
                  ['Branch', viewingApp.branch],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="mt-1 font-medium text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Recruiter / system remarks</h4>
                <p className="rounded-2xl border border-border p-4 text-muted-foreground leading-relaxed">
                  {viewingApp.remarks}
                </p>
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
              <p className="text-muted-foreground leading-relaxed">
                Withdrawing will remove your candidate profile from this recruitment drive's active pool. You will not be able to re-apply once the registration deadline passes.
              </p>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="secondary" size="md" onClick={() => setWithdrawAppId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  isLoading={withdrawing}
                  onClick={handleWithdrawConfirm}
                  className="bg-rose-500 hover:bg-rose-600 border-none text-white font-semibold"
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
