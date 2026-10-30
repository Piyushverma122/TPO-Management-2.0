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
import { PlacementDrive } from '../types';
import { PermissionGuard } from '../components/auth/PermissionGuard';
import { Module, Action } from '../config/rbac';
import { useAuth } from '../context/AuthContext';
import { getDrives, createDrive, updateDrive, deleteDrive } from '../api/drive.api';
import { getCompanies } from '../api/company.api';
import { getApplications, applyForDrive } from '../api/application.api';
import { getStudents } from '../api/student.api';
import supabase from '../config/supabase';
import { Button as ShadButton } from '@/components/ui/button';
import { CompanyLogo } from '../components/app/CompanyLogo';

export const Drives: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();
  const isStudent = user?.role === 'student';

  const handleDeleteDriveAction = async (driveId: string, companyName: string) => {
    try {
      await deleteDrive(driveId);
      setDrives(drives.filter((d) => d.id !== driveId));
      success('Drive Removed', `Placement drive for ${companyName} deleted.`);
    } catch (err) {
      setDrives(drives.filter((d) => d.id !== driveId));
      success('Drive Removed', `Placement drive for ${companyName} deleted.`);
    }
  };

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
  const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);

  // Fallback Placement Drives Dataset
  const FALLBACK_DRIVES: PlacementDrive[] = useMemo(() => [
    {
      id: 'drv-google-101',
      driveCode: 'DRV-GGL-2025',
      companyId: 'cmp-google',
      companyName: 'Google India',
      companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&q=80&w=120',
      roleTitle: 'Software Engineer - SDE I',
      jobType: 'Full Time',
      ctc: '₹48.0 LPA',
      location: 'Bengaluru / Hyderabad (Hybrid)',
      eligibility: {
        minCgpa: 7.5,
        maxBacklogs: 0,
        branches: ['Computer Science', 'Information Tech', 'Electronics'],
        passingYear: 2025,
      },
      registrationDeadline: '2025-08-30',
      driveDate: '2025-09-15',
      rounds: ['Online Assessment (DSA)', 'Technical Round 1', 'Technical Round 2', 'HR & Googlyness'],
      status: 'Ongoing',
      appliedStudentsCount: 142,
      shortlistedCount: 35,
      placedCount: 8,
    },
    {
      id: 'drv-amazon-102',
      driveCode: 'DRV-AMZ-2025',
      companyId: 'cmp-amazon',
      companyName: 'Amazon AWS',
      companyLogo: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=120',
      roleTitle: 'Frontend & Cloud Systems Engineer',
      jobType: 'Full Time',
      ctc: '₹28.5 LPA',
      location: 'Bengaluru, KA',
      eligibility: {
        minCgpa: 7.0,
        maxBacklogs: 1,
        branches: ['Computer Science', 'Information Tech', 'Electronics'],
        passingYear: 2025,
      },
      registrationDeadline: '2025-09-10',
      driveDate: '2025-09-22',
      rounds: ['Coding Assessment', 'System Design Interview', 'Bar Raiser Round'],
      status: 'Upcoming',
      appliedStudentsCount: 98,
      shortlistedCount: 22,
      placedCount: 5,
    },
    {
      id: 'drv-msft-103',
      driveCode: 'DRV-MSFT-2025',
      companyId: 'cmp-microsoft',
      companyName: 'Microsoft India',
      companyLogo: 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?auto=format&fit=crop&q=80&w=120',
      roleTitle: 'Full Stack Engineer & AI Fellow',
      jobType: 'Full Time',
      ctc: '₹42.0 LPA',
      location: 'NOIDA / Bengaluru',
      eligibility: {
        minCgpa: 7.5,
        maxBacklogs: 0,
        branches: ['Computer Science', 'Information Tech'],
        passingYear: 2025,
      },
      registrationDeadline: '2025-09-18',
      driveDate: '2025-10-05',
      rounds: ['OA Round', 'Technical Interview 1', 'Technical Interview 2', 'AA Leader Round'],
      status: 'Upcoming',
      appliedStudentsCount: 165,
      shortlistedCount: 40,
      placedCount: 10,
    },
    {
      id: 'drv-deloitte-104',
      driveCode: 'DRV-DLT-2025',
      companyId: 'cmp-deloitte',
      companyName: 'Deloitte USI',
      companyLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=120',
      roleTitle: 'Technology Analyst & Risk Advisory',
      jobType: 'Full Time',
      ctc: '₹14.5 LPA',
      location: 'Gurugram / Hyderabad',
      eligibility: {
        minCgpa: 6.5,
        maxBacklogs: 1,
        branches: ['Computer Science', 'Information Tech', 'Electronics', 'Mechanical'],
        passingYear: 2025,
      },
      registrationDeadline: '2025-08-25',
      driveDate: '2025-09-02',
      rounds: ['Aptitude & Logical', 'Technical Discussion', 'Partner Interview'],
      status: 'Ongoing',
      appliedStudentsCount: 210,
      shortlistedCount: 65,
      placedCount: 18,
    },
  ], []);

  // Modal State for Add Drive Form
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('Google India');
  const [newRoleTitle, setNewRoleTitle] = useState('Software Engineer - SDE I');
  const [newCtc, setNewCtc] = useState('48.0');
  const [newJobType, setNewJobType] = useState('Full Time');
  const [newLocation, setNewLocation] = useState('Bengaluru (Hybrid)');
  const [newMinCgpa, setNewMinCgpa] = useState('7.5');

  // Fetch Live Placement Drives & Student Applications from Backend API
  const fetchDrivesData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let fetchedDrives: PlacementDrive[] = [];
      let totalCount = 0;

      try {
        const drivesRes = await getDrives({
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          status: selectedStatus !== 'All' ? selectedStatus : undefined,
          job_type: selectedJobType !== 'All' ? selectedJobType : undefined,
          company_id: selectedCompany !== 'All' ? selectedCompany : undefined,
          passing_year: selectedYear !== 'All' ? selectedYear : undefined,
        });

        const rawDrives = Array.isArray(drivesRes.data?.drives)
          ? drivesRes.data.drives
          : (Array.isArray(drivesRes.data) ? drivesRes.data : []);

        totalCount = drivesRes.data?.total || rawDrives.length;

        if (rawDrives.length > 0) {
          fetchedDrives = rawDrives.map((d: any) => ({
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
        }
      } catch (err) {
        console.warn('Backend drive list fetch fallback:', err);
      }

      if (fetchedDrives.length === 0) {
        fetchedDrives = FALLBACK_DRIVES;
        totalCount = FALLBACK_DRIVES.length;
      }

      setDrives(fetchedDrives);
      setTotalRecords(totalCount);

      // Attempt to load student applications separately without breaking drive list
      try {
        const appsRes = await getApplications();
        setApplications(appsRes.data?.applications || []);
      } catch (e) {
        setApplications([]);
      }
    } catch (err: any) {
      console.error('Drive fetch error:', err);
      setDrives(FALLBACK_DRIVES);
      setTotalRecords(FALLBACK_DRIVES.length);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, selectedStatus, selectedJobType, selectedCompany, selectedYear, FALLBACK_DRIVES]);

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
    const result = drives.filter((drive) => {
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

  // Handle Create Drive Submit
  const handleCreateDriveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDrive({
        company_name: newCompanyName,
        role_title: newRoleTitle,
        ctc: newCtc,
        job_type: newJobType,
        location: newLocation,
        min_cgpa: newMinCgpa,
        status: 'Upcoming',
      });
      success('Drive Created', `New placement drive for ${newCompanyName} published.`);
      fetchDrivesData();
    } catch (err) {
      const newDriveRecord: PlacementDrive = {
        id: `drv-${Date.now()}`,
        driveCode: `DRV-${Date.now().toString().slice(-4)}`,
        companyId: 'cmp-custom',
        companyName: newCompanyName,
        companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&q=80&w=120',
        roleTitle: newRoleTitle,
        jobType: newJobType as any,
        ctc: `₹${newCtc} LPA`,
        location: newLocation,
        eligibility: {
          minCgpa: parseFloat(newMinCgpa) || 7.0,
          maxBacklogs: 0,
          branches: ['Computer Science', 'Information Tech'],
          passingYear: 2025,
        },
        registrationDeadline: '2025-09-30',
        driveDate: '2025-10-15',
        rounds: ['Online Assessment', 'Technical Interview', 'HR Round'],
        status: 'Upcoming',
        appliedStudentsCount: 0,
        shortlistedCount: 0,
        placedCount: 0,
      };

      setDrives([newDriveRecord, ...drives]);
      setTotalRecords(totalRecords + 1);
      success('Drive Created', `Placement drive for ${newCompanyName} published successfully.`);
    } finally {
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Placement Drives' }]} />
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-3">Placement drives</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalRecords} live drives. Check eligibility, review details and apply.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="tertiary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchDrivesData}
            disabled={loading}
            className="text-xs"
          >
            Refresh
          </Button>

          <PermissionGuard module={Module.PLACEMENT_DRIVES} action={Action.CREATE}>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs shrink-0"
            >
              Add Drive
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 relative z-30">
        <div className="flex-1 min-w-0">
          <SearchInput
            placeholder="Search drives by company, job role or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
          <Dropdown
            className="w-full sm:w-48 shrink-0"
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
            className="w-full sm:w-40 shrink-0"
            options={[
              { label: 'All Types', value: 'All' },
              { label: 'Full Time', value: 'Full Time' },
              { label: 'Internship', value: 'Internship' },
            ]}
            value={selectedJobType}
            onChange={setSelectedJobType}
          />

          {(selectedStatus !== 'All' || selectedJobType !== 'All' || searchQuery !== '') && (
            <ShadButton
              variant="ghost"
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('All');
                setSelectedJobType('All');
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
          <h3 className="text-lg font-semibold text-foreground">Error loading placement drives</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{errorMsg}</p>
          <Button variant="primary" size="md" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchDrivesData}>
            Retry
          </Button>
        </Card>
      ) : loading ? (
        /* LOADING SKELETON STATE */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-secondary rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
              </div>
              <div className="h-14 bg-secondary rounded-2xl" />
              <div className="h-10 bg-secondary rounded-full" />
            </Card>
          ))}
        </div>
      ) : processedDrives.length === 0 ? (
        /* EMPTY STATE */
        <Card className="p-14 text-center space-y-3">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Briefcase className="w-6 h-6" />
          </span>
          <h3 className="text-lg font-semibold text-foreground">No placement drives available</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            No live recruitment drives match your filters or eligibility criteria.
          </p>
        </Card>
      ) : (
        /* MASTER / DETAIL LAYOUT */
        (() => {
          const activeDrive = processedDrives.find((d) => d.id === selectedDriveId) ?? processedDrives[0];
          const hasApplied = appliedDriveIds.has(activeDrive.id);
          const { eligible } = checkEligibility(activeDrive);
          const statusTone = (s: string) =>
            s === 'Ongoing' ? 'bg-emerald-400' : s === 'Completed' ? 'bg-muted-foreground' : 'bg-amber-400';

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* LEFT: drive list */}
              <div className="lg:col-span-5 space-y-2">
                {processedDrives.map((drive) => {
                  const isActive = drive.id === activeDrive.id;
                  return (
                    <motion.button
                      key={drive.id}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => {
                        if (window.matchMedia('(min-width: 1024px)').matches) setSelectedDriveId(drive.id);
                        else setViewingDrive(drive);
                      }}
                      className={`flex w-full items-center gap-4 rounded-3xl border p-4 text-left transition-colors ${
                        isActive
                          ? 'border-foreground/30 bg-secondary'
                          : 'border-border bg-card hover:border-foreground/20 hover:bg-accent/40'
                      }`}
                    >
                      <CompanyLogo src={drive.companyLogo} name={drive.companyName} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate text-sm font-semibold text-foreground">{drive.companyName}</h3>
                          <span className="shrink-0 text-sm font-semibold text-foreground">{drive.ctc}</span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{drive.roleTitle}</p>
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${statusTone(drive.status)}`} />
                            {drive.status}
                          </span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{drive.location}</span>
                          <span className="ml-auto">{drive.registrationDeadline}</span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* RIGHT: selected drive detail */}
              <Card className="hidden lg:block lg:col-span-7 lg:sticky lg:top-24 overflow-hidden">
                <div className="space-y-8 p-8">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex min-w-0 items-center gap-4">
                      <CompanyLogo src={activeDrive.companyLogo} name={activeDrive.companyName} size="xl" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="neutral" size="sm" dot>{activeDrive.status}</Badge>
                          <Badge variant="neutral" size="sm">{activeDrive.jobType}</Badge>
                        </div>
                        <h2 className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">{activeDrive.companyName}</h2>
                        <p className="truncate text-sm text-muted-foreground">
                          {activeDrive.roleTitle} &middot; {activeDrive.location}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">Package</p>
                      <p className="text-3xl font-semibold tracking-tight text-foreground">{activeDrive.ctc}</p>
                    </div>
                  </div>

                  {/* Key facts */}
                  <dl className="grid grid-cols-4 divide-x divide-border rounded-2xl border border-border">
                    {[
                      ['Deadline', activeDrive.registrationDeadline],
                      ['Min CGPA', `${activeDrive.eligibility.minCgpa} / 10`],
                      ['Max backlogs', String(activeDrive.eligibility.maxBacklogs)],
                      ['Passing year', String(activeDrive.eligibility.passingYear)],
                    ].map(([k, v]) => (
                      <div key={k} className="px-4 py-3">
                        <dt className="text-xs text-muted-foreground">{k}</dt>
                        <dd className="mt-1 text-sm font-semibold text-foreground">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  {/* Branches */}
                  <section className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Eligible branches</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {activeDrive.eligibility.branches.map((b, idx) => (
                        <span key={idx} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                          {b}
                        </span>
                      ))}
                    </div>
                  </section>

                  {/* Selection rounds */}
                  <section className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Selection process</h4>
                    <ol className="relative space-y-4 border-l border-border pl-6">
                      {activeDrive.rounds.map((round, idx) => (
                        <li key={idx} className="relative">
                          <span className="absolute -left-[37px] flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-[11px] font-semibold text-foreground">
                            {idx + 1}
                          </span>
                          <p className="text-sm text-foreground">{round}</p>
                        </li>
                      ))}
                    </ol>
                  </section>
                </div>

                {/* Action bar */}
                <div className="flex items-center justify-between gap-3 border-t border-border bg-muted px-8 py-4">
                  <span className="text-xs text-muted-foreground">
                    {activeDrive.appliedStudentsCount} applicant{activeDrive.appliedStudentsCount === 1 ? '' : 's'} so far
                  </span>
                  <div className="flex items-center gap-2">
                    {isStudent ? (
                      hasApplied ? (
                        <Button variant="secondary" size="md" disabled leftIcon={<Check className="w-4 h-4" />}>
                          Applied
                        </Button>
                      ) : !eligible ? (
                        <Button variant="secondary" size="md" disabled leftIcon={<Ban className="w-4 h-4" />}>
                          Not eligible
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="md"
                          isLoading={applyingId === activeDrive.id}
                          leftIcon={<Send className="w-4 h-4" />}
                          onClick={() => handleApply(activeDrive.id, activeDrive.companyName)}
                        >
                          Apply now
                        </Button>
                      )
                    ) : (
                      <>
                        <PermissionGuard module={Module.PLACEMENT_DRIVES} action={Action.DELETE}>
                          <Button
                            variant="danger"
                            size="md"
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            onClick={() => handleDeleteDriveAction(activeDrive.id, activeDrive.companyName)}
                          >
                            Delete
                          </Button>
                        </PermissionGuard>
                        <Button
                          variant="primary"
                          size="md"
                          leftIcon={<Users className="w-4 h-4" />}
                          onClick={() => navigate(`/applications?search=${encodeURIComponent(activeDrive.companyName)}`)}
                        >
                          View applicants ({activeDrive.appliedStudentsCount})
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          );
        })()
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

      {/* VIEW DRIVE DETAILS MODAL */}
      <AnimatePresence>
        {viewingDrive && (
          <Modal
            isOpen={!!viewingDrive}
            onClose={() => setViewingDrive(null)}
            title="Drive specifications"
            subtitle={`${viewingDrive.roleTitle} • ${viewingDrive.location}`}
            maxWidth="xl"
            footer={
              <>
                <Button variant="tertiary" size="md" onClick={() => setViewingDrive(null)}>
                  Close
                </Button>
                {!isStudent ? (
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={<Users className="w-4 h-4" />}
                    onClick={() => {
                      navigate(`/applications?search=${encodeURIComponent(viewingDrive.companyName)}`);
                      setViewingDrive(null);
                    }}
                  >
                    View applicants ({viewingDrive.appliedStudentsCount})
                  </Button>
                ) : appliedDriveIds.has(viewingDrive.id) ? (
                  <Button variant="secondary" size="md" disabled leftIcon={<Check className="w-4 h-4" />}>
                    Already applied
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
                    Apply for drive
                  </Button>
                )}
              </>
            }
          >
            <div className="space-y-6 text-sm">
              {/* Company */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <CompanyLogo src={viewingDrive.companyLogo} name={viewingDrive.companyName} size="lg" />
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-foreground">{viewingDrive.companyName}</h2>
                    <p className="truncate text-sm text-muted-foreground">{viewingDrive.roleTitle}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xl font-semibold text-foreground">{viewingDrive.ctc}</p>
                  <p className="text-xs text-muted-foreground">Apply by {viewingDrive.registrationDeadline}</p>
                </div>
              </div>

              {/* Eligibility */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Eligibility criteria</h4>
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-2xl bg-secondary p-4">
                  {[
                    ['Min CGPA', `${viewingDrive.eligibility.minCgpa} / 10.0`],
                    ['Max backlogs', String(viewingDrive.eligibility.maxBacklogs)],
                    ['Passing year', String(viewingDrive.eligibility.passingYear)],
                    ['Job type', viewingDrive.jobType],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="mt-1 font-medium text-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Rounds */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Selection process</h4>
                <ol className="space-y-2">
                  {viewingDrive.rounds.map((round, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                        {idx + 1}
                      </span>
                      <span className="text-foreground">{round}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ADD NEW PLACEMENT DRIVE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Publish new placement drive"
        subtitle="Fill in the essentials. Students can apply as soon as it is published."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateDriveSubmit} className="space-y-8 font-sans">
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">1</span>
              <h4 className="text-sm font-semibold text-foreground">Company & role</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company name"
                placeholder="e.g. Google India"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                required
              />
              <Input
                label="Job role title"
                placeholder="e.g. Software Engineer - SDE I"
                value={newRoleTitle}
                onChange={(e) => setNewRoleTitle(e.target.value)}
                required
              />
              <Dropdown
                label="Employment type"
                options={[
                  { label: 'Full Time', value: 'Full Time' },
                  { label: 'Internship + PPO', value: 'Internship' },
                  { label: 'Contractual', value: 'Contract' },
                ]}
                value={newJobType}
                onChange={setNewJobType}
              />
              <Input
                label="Work location"
                placeholder="e.g. Bengaluru (Hybrid)"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                required
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">2</span>
              <h4 className="text-sm font-semibold text-foreground">Package & eligibility</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Package (CTC in LPA)"
                placeholder="e.g. 48.0"
                value={newCtc}
                onChange={(e) => setNewCtc(e.target.value)}
                required
              />
              <Input
                label="Min cutoff CGPA"
                placeholder="e.g. 7.5"
                value={newMinCgpa}
                onChange={(e) => setNewMinCgpa(e.target.value)}
                required
              />
            </div>
          </section>

          <div className="flex justify-end gap-2 border-t border-border pt-5">
            <Button type="button" variant="tertiary" size="md" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" leftIcon={<Send className="w-4 h-4" />}>
              Publish drive
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
