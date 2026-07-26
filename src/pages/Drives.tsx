import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Search,
  Filter,
  FileText,
  Video,
  Download,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  X,
  Sparkles,
  Edit,
  BarChart3,
  Award,
  ListFilter,
  RefreshCw,
  Copy,
  Trash2,
  Eye,
  CheckSquare,
  AlertCircle,
  TrendingUp,
  Building2,
  DollarSign,
  Send,
  Ban,
  Check,
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
import { PlacementDrive } from '../types';
import { PermissionGuard } from '../components/auth/PermissionGuard';
import { Module, Action } from '../config/rbac';
import { useAuth } from '../context/AuthContext';
import { getDrives, createDrive, updateDrive, deleteDrive } from '../api/drive.api';
import { getCompanies } from '../api/company.api';
import { getApplications, applyForDrive } from '../api/application.api';
import { getStudents } from '../api/student.api';
import supabase from '../config/supabase';

export const Drives: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  // API Live Data State
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [currentStudent, setCurrentStudent] = useState<any>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 9;

  // Selected Drive for Modal Details / Forms
  const [viewingDrive, setViewingDrive] = useState<PlacementDrive | null>(null);
  const [deletingDriveId, setDeletingDriveId] = useState<string | null>(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedJobType, setSelectedJobType] = useState('All');
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Newest');

  // Company Options for Filter
  const [companyOptions, setCompanyOptions] = useState<{ label: string; value: string }[]>([]);

  // Fetch Live Placement Drives & Student Applications from Backend API
  const fetchDrivesData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [drivesRes, appsRes, studentsRes] = await Promise.all([
        getDrives({
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          status: selectedStatus !== 'All' ? selectedStatus : undefined,
          job_type: selectedJobType !== 'All' ? selectedJobType : undefined,
          company_id: selectedCompany !== 'All' ? selectedCompany : undefined,
          passing_year: selectedYear !== 'All' ? selectedYear : undefined,
        }),
        getApplications(),
        getStudents({ limit: 100 }),
      ]);

      const rawDrives = drivesRes.data?.drives || [];
      const total = drivesRes.data?.total || rawDrives.length;
      setApplications(appsRes.data?.applications || []);

      // Find logged in student profile
      const studentList = studentsRes.data?.students || [];
      const student = studentList.find((s: any) => s.user_id === user?.id || s.users?.email === user?.email);
      setCurrentStudent(student || null);

      const formattedList: PlacementDrive[] = rawDrives.map((d: any) => ({
        id: d.id,
        driveCode: d.drive_code || 'DRV-101',
        companyId: d.company_id,
        companyName: d.companies?.name || d.company_name || 'Corporate Partner',
        companyLogo: d.companies?.logo_url || 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=120',
        roleTitle: d.role_title || 'Software Engineer',
        jobType: (d.job_type as any) || 'Full Time',
        ctc: d.ctc ? `₹${d.ctc} LPA` : '₹12 LPA',
        location: d.location || 'College Campus',
        eligibility: {
          minCgpa: d.min_cgpa ? parseFloat(d.min_cgpa) : 6.0,
          maxBacklogs: d.max_backlogs ?? 0,
          branches: d.allowed_branches || ['Computer Science', 'Information Tech', 'Electronics'],
          passingYear: d.passing_year ? parseInt(d.passing_year, 10) : 2025,
        },
        registrationDeadline: d.registration_deadline ? new Date(d.registration_deadline).toLocaleDateString() : 'Active',
        driveDate: d.drive_date ? new Date(d.drive_date).toLocaleDateString() : 'Upcoming',
        rounds: d.selection_rounds || ['Online Assessment', 'Technical Interview', 'HR Round'],
        status: (d.status as any) || 'Upcoming',
        appliedStudentsCount: d.applied_count || d.applied_students_count || 0,
        shortlistedCount: d.shortlisted_count || 0,
        placedCount: d.selected_count || d.placed_count || 0,
      }));

      setDrives(formattedList);
      setTotalRecords(total);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load placement drives from server.';
      setErrorMsg(msg);
      toastError('Error Loading Drives', msg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, selectedStatus, selectedJobType, selectedCompany, selectedYear, user, toastError]);

  useEffect(() => {
    fetchDrivesData();
  }, [fetchDrivesData]);

  // Applied Drive IDs set for quick check
  const appliedDriveIds = useMemo(() => {
    return new Set(applications.map((app: any) => app.drive_id));
  }, [applications]);

  // Student Eligibility Checker Function
  const checkEligibility = useCallback(
    (drive: PlacementDrive) => {
      if (!currentStudent) return { eligible: true, reason: 'Eligible' };

      const studentCgpa = parseFloat(currentStudent.cgpa || '8.0');
      const studentBacklogs = parseInt(currentStudent.active_backlogs || '0', 10);
      const studentBranch = currentStudent.branches?.name || currentStudent.branches?.code || 'Computer Science';
      const studentYear = parseInt(currentStudent.passing_year || '2025', 10);

      if (studentCgpa < drive.eligibility.minCgpa) {
        return { eligible: false, reason: `Min CGPA ${drive.eligibility.minCgpa} Required` };
      }
      if (studentBacklogs > drive.eligibility.maxBacklogs) {
        return { eligible: false, reason: `Max ${drive.eligibility.maxBacklogs} Backlogs Allowed` };
      }
      if (
        drive.eligibility.branches.length > 0 &&
        !drive.eligibility.branches.some(
          (b) => b.toLowerCase().includes(studentBranch.toLowerCase()) || studentBranch.toLowerCase().includes(b.toLowerCase())
        )
      ) {
        return { eligible: false, reason: 'Branch Not Eligible' };
      }

      return { eligible: true, reason: 'Eligible' };
    },
    [currentStudent]
  );

  // Filtered & Sorted Drives
  const processedDrives = useMemo(() => {
    let result = drives.filter((drive) => {
      const matchesSearch =
        drive.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drive.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drive.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'All' || drive.status === selectedStatus;
      const matchesJobType = selectedJobType === 'All' || drive.jobType === selectedJobType;

      return matchesSearch && matchesStatus && matchesJobType;
    });

    // Sort
    result.sort((a, b) => {
      if (selectedSort === 'Package') {
        const ctcA = parseFloat(a.ctc.replace(/[^0-9.]/g, '')) || 0;
        const ctcB = parseFloat(b.ctc.replace(/[^0-9.]/g, '')) || 0;
        return ctcB - ctcA;
      }
      return b.id.localeCompare(a.id);
    });

    return result;
  }, [drives, searchQuery, selectedStatus, selectedJobType, selectedSort]);

  // Handle Apply to Drive
  const handleApply = async (driveId: string, companyName: string) => {
    setApplyingId(driveId);
    try {
      await applyForDrive({ drive_id: driveId });
      success('Application Submitted', `Your application for ${companyName} has been submitted.`);
      await fetchDrivesData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit application for recruitment drive.';
      toastError('Application Failed', msg);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Placement Drives' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3 mt-1">
            Available Placement Drives
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              {totalRecords} Active Drives
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Explore live recruitment opportunities, check eligibility criteria, and submit drive applications.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchDrivesData}
          disabled={loading}
        >
          Refresh Drives
        </Button>
      </div>

      {/* SEARCH & MULTI-FILTERS BAR */}
      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          <div className="lg:col-span-2">
            <SearchInput
              placeholder="Search by company name, job role, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Dropdown
            label="Drive Status:"
            options={[
              { label: 'All Statuses', value: 'All' },
              { label: 'Upcoming', value: 'Upcoming' },
              { label: 'Ongoing / Active', value: 'Ongoing' },
              { label: 'Completed', value: 'Completed' },
            ]}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />

          <Dropdown
            label="Employment Type:"
            options={[
              { label: 'All Types', value: 'All' },
              { label: 'Full Time', value: 'Full Time' },
              { label: 'Internship', value: 'Internship' },
            ]}
            value={selectedJobType}
            onChange={setSelectedJobType}
          />
        </div>
      </Card>

      {/* ERROR STATE */}
      {errorMsg ? (
        <Card className="p-8 text-center space-y-4 border-rose-500/30 bg-rose-500/5">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Error Loading Placement Drives</h3>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto">{errorMsg}</p>
          <Button variant="primary" size="md" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchDrivesData}>
            Retry Loading Drives
          </Button>
        </Card>
      ) : loading ? (
        /* LOADING SKELETON STATE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-5 space-y-4 border-[#202D42] animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#162032] rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#162032] rounded w-3/4" />
                  <div className="h-3 bg-[#162032] rounded w-1/2" />
                </div>
              </div>
              <div className="h-10 bg-[#162032] rounded-xl" />
              <div className="h-10 bg-[#162032] rounded-xl" />
            </Card>
          ))}
        </div>
      ) : processedDrives.length === 0 ? (
        /* EMPTY STATE */
        <Card className="p-12 text-center space-y-4 border-[#202D42] bg-[#101726]">
          <Briefcase className="w-12 h-12 text-[#94A3B8] mx-auto opacity-40" />
          <h3 className="text-xl font-extrabold text-white">No placement drives available.</h3>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
            No live recruitment drives currently match your selected filters or eligibility criteria.
          </p>
        </Card>
      ) : (
        /* PLACEMENT DRIVE CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedDrives.map((drive) => {
            const hasApplied = appliedDriveIds.has(drive.id);
            const { eligible, reason } = checkEligibility(drive);

            return (
              <motion.div
                key={drive.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card glowOnHover className="p-5 space-y-4 border-[#202D42] flex flex-col justify-between h-full group">
                  
                  <div className="space-y-4">
                    {/* Top Row: Company Logo + Name + Job Role */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#101726] border border-[#202D42] p-1.5 flex items-center justify-center shrink-0">
                        <Avatar src={drive.companyLogo} name={drive.companyName} size="md" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-extrabold text-white truncate leading-tight group-hover:text-[#A3E635] transition-colors">
                          {drive.companyName}
                        </h3>
                        <p className="text-xs text-[#A3E635] font-semibold">{drive.roleTitle}</p>
                        <p className="text-[11px] text-[#94A3B8] flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#64748B]" /> {drive.location}
                        </p>
                      </div>
                    </div>

                    {/* Highlights Metric Pill Box */}
                    <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Package (CTC)</span>
                        <span className="font-extrabold text-[#A3E635] text-sm">{drive.ctc}</span>
                      </div>
                      <div className="border-l border-[#202D42] pl-3">
                        <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Deadline</span>
                        <span className="font-bold text-white text-xs">{drive.registrationDeadline}</span>
                      </div>
                    </div>

                    {/* Eligibility & Branch Tags */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                        <span>Min. CGPA: <strong className="text-white">{drive.eligibility.minCgpa}</strong></span>
                        <span>Max Backlogs: <strong className="text-white">{drive.eligibility.maxBacklogs}</strong></span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {drive.eligibility.branches.map((b, idx) => (
                          <span
                            key={idx}
                            className="bg-[#162032] border border-[#202D42] text-xs font-semibold px-2 py-0.5 rounded-md text-[#94A3B8]"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS ROW */}
                  <div className="pt-2 flex items-center gap-2 border-t border-[#202D42] mt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      leftIcon={<Eye className="w-3.5 h-3.5 text-sky-400" />}
                      onClick={() => setViewingDrive(drive)}
                    >
                      View Details
                    </Button>

                    {hasApplied ? (
                      <Button variant="secondary" size="sm" fullWidth disabled leftIcon={<Check className="w-3.5 h-3.5 text-[#A3E635]" />}>
                        Applied
                      </Button>
                    ) : !eligible ? (
                      <Button variant="secondary" size="sm" fullWidth disabled leftIcon={<Ban className="w-3.5 h-3.5 text-rose-400" />}>
                        Not Eligible
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        isLoading={applyingId === drive.id}
                        leftIcon={<Send className="w-3.5 h-3.5" />}
                        onClick={() => handleApply(drive.id, drive.companyName)}
                        className="font-extrabold shadow-[0_0_12px_rgba(163,230,53,0.3)]"
                      >
                        Apply
                      </Button>
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

      {/* VIEW DRIVE DETAILS MODAL */}
      <AnimatePresence>
        {viewingDrive && (
          <Modal
            isOpen={!!viewingDrive}
            onClose={() => setViewingDrive(null)}
            title={`${viewingDrive.companyName} — Drive Specifications`}
            subtitle={`${viewingDrive.roleTitle} • ${viewingDrive.location}`}
            maxWidth="xl"
          >
            <div className="space-y-6 bg-[#101726] border border-[#202D42] p-6 rounded-2xl text-xs">
              
              {/* Header */}
              <div className="border-b border-[#202D42] pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={viewingDrive.companyLogo} name={viewingDrive.companyName} size="md" />
                  <div>
                    <h2 className="text-xl font-extrabold text-white">{viewingDrive.companyName}</h2>
                    <p className="text-xs text-[#A3E635] font-semibold">{viewingDrive.roleTitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="active">Package: {viewingDrive.ctc}</Badge>
                  <p className="text-[10px] text-[#64748B] mt-1">Deadline: {viewingDrive.registrationDeadline}</p>
                </div>
              </div>

              {/* Eligibility Criteria Breakdown */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-white uppercase text-[11px]">Eligibility Criteria</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#162032] p-3 rounded-xl border border-[#202D42]">
                  <div>
                    <span className="text-[10px] text-[#94A3B8] block">Min CGPA</span>
                    <span className="font-bold text-white text-xs">{viewingDrive.eligibility.minCgpa} / 10.0</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] block">Max Backlogs</span>
                    <span className="font-bold text-white text-xs">{viewingDrive.eligibility.maxBacklogs}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] block">Passing Year</span>
                    <span className="font-bold text-white text-xs">{viewingDrive.eligibility.passingYear}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] block">Job Type</span>
                    <span className="font-bold text-white text-xs">{viewingDrive.jobType}</span>
                  </div>
                </div>
              </div>

              {/* Selection Process Rounds */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-white uppercase text-[11px]">Selection Process Rounds</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingDrive.rounds.map((round, idx) => (
                    <Badge key={idx} variant="info">
                      Round {idx + 1}: {round}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions Bar */}
              <div className="pt-4 border-t border-[#202D42] flex justify-end gap-3">
                <Button variant="secondary" size="md" onClick={() => setViewingDrive(null)}>
                  Close
                </Button>
                {appliedDriveIds.has(viewingDrive.id) ? (
                  <Button variant="secondary" size="md" disabled leftIcon={<Check className="w-4 h-4 text-[#A3E635]" />}>
                    Already Applied
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={<Send className="w-4 h-4" />}
                    onClick={() => {
                      handleApply(viewingDrive.id, viewingDrive.companyName);
                      setViewingDrive(null);
                    }}
                  >
                    Apply for Drive
                  </Button>
                )}
              </div>

            </div>
          </Modal>
        )}
      </AnimatePresence>

    </div>
  );
};
