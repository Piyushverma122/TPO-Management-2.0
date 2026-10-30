import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  CheckCircle2,
  Trophy,
  XCircle,
  Search,
  Filter,
  FileText,
  MoreVertical,
  Plus,
  X,
  Mail,
  Phone,
  GraduationCap,
  Award,
  Download,
  Edit,
  Trash2,
  ExternalLink,
  Briefcase,
  FileCheck,
  RefreshCw,
  Upload,
  Eye,
  EyeOff,
  Copy,
  Key,
  ShieldCheck,
  Lock,
  Check,
  MapPin,
  Link2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { Card } from '../components/app/Card';
import { Button } from '../components/app/Button';
import { Badge } from '../components/app/Badge';
import { Input, SearchInput } from '../components/app/Input';
import { Dropdown } from '../components/app/Dropdown';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/app/Table';
import { Pagination } from '../components/app/Pagination';
import { Modal } from '../components/app/Modal';
import { Avatar } from '../components/app/Avatar';
import { useToast } from '../components/app/Toast';
import { Student } from '../types';
import { PermissionGuard } from '../components/auth/PermissionGuard';
import { Module, Action } from '../config/rbac';
import { Input as ShadInput } from '@/components/ui/input';
import { Textarea as ShadTextarea } from '@/components/ui/textarea';
import { Button as ShadButton } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  uploadResume,
  getResumes,
  deleteResume,
} from '../api/student.api';

// Sparkline Mock Data
const totalSparkline = [{ v: 40 }, { v: 55 }, { v: 65 }, { v: 91 }];
const eligibleSparkline = [{ v: 30 }, { v: 70 }, { v: 90 }, { v: 81 }];
const placedSparkline = [{ v: 20 }, { v: 45 }, { v: 60 }, { v: 78 }];
const notEligibleSparkline = [{ v: 80 }, { v: 60 }, { v: 90 }, { v: 40 }];

type EnrollStep = 'basic' | 'account' | 'academic' | 'address' | 'social';
const ENROLL_STEPS: { id: EnrollStep; title: string; desc: string; icon: React.ElementType }[] = [
  { id: 'basic', title: 'Basic Info', desc: 'Name, contact and personal details', icon: Users },
  { id: 'account', title: 'Account Credentials', desc: 'Login password for the student', icon: Key },
  { id: 'academic', title: 'Academic Info', desc: 'Branch, batch, CGPA and status', icon: GraduationCap },
  { id: 'address', title: 'Address', desc: 'Current and permanent address', icon: MapPin },
  { id: 'social', title: 'Links & Bio', desc: 'Profiles, portfolio and summary', icon: Link2 },
];

export const Students: React.FC = () => {
  const { success, error: toastError, info } = useToast();

  // API State
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCgpa, setSelectedCgpa] = useState('All');

  // Modals & Drawers
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // Form Tab State & All Student Fields
  const [formTab, setFormTab] = useState<'basic' | 'account' | 'academic' | 'address' | 'social'>('basic');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Success Modal State after Student Enrollment
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [createdStudentInfo, setCreatedStudentInfo] = useState<{
    full_name: string;
    email: string;
    roll_number: string;
    tempPassword: string;
  } | null>(null);

  const [enrollForm, setEnrollForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    alternate_phone: '',
    gender: 'Male',
    date_of_birth: '',
    roll_number: '',
    enrollment_number: '',
    branch_id: '',
    current_semester: '1',
    passing_year: '2025',
    cgpa: '8.0',
    tenth_percentage: '',
    twelfth_percentage: '',
    diploma_percentage: '',
    active_backlogs: '0',
    history_backlogs: '0',
    placement_status: 'Unplaced',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    resume_headline: '',
    bio: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    leetcode_url: '',
    hackerrank_url: '',
  });

  // Password strength logic
  const passwordCriteria = useMemo(() => {
    const p = enrollForm.password;
    return {
      minLength: p.length >= 8,
      hasUpper: /[A-Z]/.test(p),
      hasLower: /[a-z]/.test(p),
      hasNumber: /[0-9]/.test(p),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(p),
    };
  }, [enrollForm.password]);

  const passwordScore = useMemo(() => {
    const { minLength, hasUpper, hasLower, hasNumber, hasSpecial } = passwordCriteria;
    let score = 0;
    if (minLength) score++;
    if (hasUpper) score++;
    if (hasLower) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;
    return score;
  }, [passwordCriteria]);

  // Resume Upload State
  const [resumesList, setResumesList] = useState<any[]>([]);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Fetch Students API Data
  const fetchStudentsData = async () => {
    setLoading(true);
    try {
      const res = await getStudents({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        department: selectedDept !== 'All' ? selectedDept : undefined,
        passing_year: selectedYear !== 'All' ? selectedYear : undefined,
        placement_status: selectedStatus !== 'All' ? selectedStatus : undefined,
      });

      const rawList = Array.isArray(res.data) ? res.data : (res.data?.students || (res as any).students || []);
      const total = (res as any).pagination?.totalEntries || res.data?.total || (res as any).total || rawList.length;

      const formattedList: Student[] = rawList.map((s: any) => ({
        id: s.id,
        rollNumber: s.roll_number || 'N/A',
        enrollmentNumber: s.enrollment_number || undefined,
        name: s.users?.full_name || s.name || 'Candidate',
        email: s.users?.email || s.email || '',
        phone: s.phone || s.users?.phone || undefined,
        alternatePhone: s.alternate_phone || undefined,
        gender: s.gender || undefined,
        dateOfBirth: s.date_of_birth || undefined,
        branch: s.branches?.name || s.users?.department || 'General',
        currentSemester: s.current_semester || 1,
        cgpa: s.cgpa ? parseFloat(s.cgpa) : 0,
        passingYear: s.passing_year || 2025,
        backlogs: s.active_backlogs || 0,
        historyBacklogs: s.history_backlogs || 0,
        tenthPercentage: s.tenth_percentage ? parseFloat(s.tenth_percentage) : undefined,
        twelfthPercentage: s.twelfth_percentage ? parseFloat(s.twelfth_percentage) : undefined,
        diplomaPercentage: s.diploma_percentage ? parseFloat(s.diploma_percentage) : undefined,
        placementStatus: (s.placement_status as any) || 'Unplaced',
        companyPlaced: s.company_placed || '(pending)',
        packageOffered: s.package_offered || '--',
        address: s.address || undefined,
        city: s.city || undefined,
        state: s.state || undefined,
        country: s.country || 'India',
        pincode: s.pincode || undefined,
        resumeHeadline: s.resume_headline || undefined,
        bio: s.bio || undefined,
        linkedinUrl: s.linkedin_url || undefined,
        githubUrl: s.github_url || undefined,
        portfolioUrl: s.portfolio_url || undefined,
        leetcodeUrl: s.leetcode_url || undefined,
        hackerrankUrl: s.hackerrank_url || undefined,
        avatar: s.users?.avatar_url || '',
        skills: s.skills || ['Problem Solving', 'Communication'],
      }));

      setStudents(formattedList);
      setTotalRecords(total);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load students directory.';
      toastError('Error Loading Students', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsData();
  }, [currentPage, searchQuery, selectedDept, selectedYear, selectedStatus]);

  // ESC key listener for drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  const handleOpenDrawer = async (student: Student) => {
    setSelectedStudent(student);
    setIsDrawerOpen(true);
    setActionMenuOpenId(null);
    try {
      const res = await getResumes(student.id);
      setResumesList(res.data?.resumes || []);
    } catch (e) {
      setResumesList([]);
    }
  };

  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedStudent) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('version_title', `${file.name} (Uploaded ${new Date().toLocaleDateString()})`);

    setUploadingResume(true);
    try {
      await uploadResume(selectedStudent.id, formData);
      success('Resume Uploaded', `${file.name} uploaded successfully.`);
      const res = await getResumes(selectedStudent.id);
      setResumesList(res.data?.resumes || []);
    } catch (err: any) {
      toastError('Upload Failed', err.response?.data?.message || 'Failed to upload PDF resume.');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDeleteResumeFile = async (resumeId: string) => {
    if (!selectedStudent) return;
    try {
      await deleteResume(selectedStudent.id, resumeId);
      success('Resume Deleted', 'Resume record removed.');
      setResumesList(resumesList.filter((r) => r.id !== resumeId));
    } catch (err: any) {
      toastError('Delete Failed', err.response?.data?.message || 'Failed to delete resume.');
    }
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollForm.full_name || !enrollForm.roll_number || !enrollForm.email) {
      toastError('Validation Error', 'Full Candidate Name, Roll Number, and Email Address are required.');
      return;
    }

    if (enrollForm.password) {
      if (enrollForm.password !== enrollForm.confirm_password) {
        toastError('Password Error', 'Passwords do not match.');
        setFormTab('account');
        return;
      }
      if (enrollForm.password.length < 8) {
        toastError('Password Error', 'Password must be at least 8 characters long.');
        setFormTab('account');
        return;
      }
    }

    try {
      const createdRes = await createStudent({
        full_name: enrollForm.full_name,
        email: enrollForm.email,
        password: enrollForm.password || undefined,
        phone: enrollForm.phone || undefined,
        alternate_phone: enrollForm.alternate_phone || undefined,
        gender: enrollForm.gender || undefined,
        date_of_birth: enrollForm.date_of_birth || undefined,
        roll_number: enrollForm.roll_number,
        enrollment_number: enrollForm.enrollment_number || undefined,
        branch_id: enrollForm.branch_id || undefined,
        cgpa: parseFloat(enrollForm.cgpa) || 8.0,
        passing_year: parseInt(enrollForm.passing_year) || 2025,
        current_semester: parseInt(enrollForm.current_semester) || 1,
        tenth_percentage: enrollForm.tenth_percentage ? parseFloat(enrollForm.tenth_percentage) : undefined,
        twelfth_percentage: enrollForm.twelfth_percentage ? parseFloat(enrollForm.twelfth_percentage) : undefined,
        diploma_percentage: enrollForm.diploma_percentage ? parseFloat(enrollForm.diploma_percentage) : undefined,
        active_backlogs: parseInt(enrollForm.active_backlogs) || 0,
        history_backlogs: parseInt(enrollForm.history_backlogs) || 0,
        placement_status: enrollForm.placement_status,
        address: enrollForm.address || undefined,
        city: enrollForm.city || undefined,
        state: enrollForm.state || undefined,
        country: enrollForm.country || 'India',
        pincode: enrollForm.pincode || undefined,
        resume_headline: enrollForm.resume_headline || undefined,
        bio: enrollForm.bio || undefined,
        linkedin_url: enrollForm.linkedin_url || undefined,
        github_url: enrollForm.github_url || undefined,
        portfolio_url: enrollForm.portfolio_url || undefined,
        leetcode_url: enrollForm.leetcode_url || undefined,
        hackerrank_url: enrollForm.hackerrank_url || undefined,
      });

      const tempPass = createdRes.data?._tempPassword || enrollForm.password || 'Student@Pass2026';

      setCreatedStudentInfo({
        full_name: enrollForm.full_name,
        email: enrollForm.email,
        roll_number: enrollForm.roll_number,
        tempPassword: tempPass,
      });

      setIsAddModalOpen(false);
      setIsSuccessModalOpen(true);

      // Reset form
      setEnrollForm({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: '',
        alternate_phone: '',
        gender: 'Male',
        date_of_birth: '',
        roll_number: '',
        enrollment_number: '',
        branch_id: '',
        current_semester: '1',
        passing_year: '2025',
        cgpa: '8.0',
        tenth_percentage: '',
        twelfth_percentage: '',
        diploma_percentage: '',
        active_backlogs: '0',
        history_backlogs: '0',
        placement_status: 'Unplaced',
        address: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        resume_headline: '',
        bio: '',
        linkedin_url: '',
        github_url: '',
        portfolio_url: '',
        leetcode_url: '',
        hackerrank_url: '',
      });
      success('Student Account Created', `${enrollForm.full_name} enrolled and login credentials generated.`);
      fetchStudentsData();
    } catch (err: any) {
      toastError('Enrollment Error', err.response?.data?.message || 'Failed to create student record.');
    }
  };

  const handleDeleteStudentAction = async (studentId: string) => {
    try {
      await deleteStudent(studentId);
      success('Student Deleted', 'Candidate record removed.');
      setActionMenuOpenId(null);
      setIsDrawerOpen(false);
      fetchStudentsData();
    } catch (err: any) {
      toastError('Delete Error', err.response?.data?.message || 'Failed to delete candidate.');
    }
  };

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
      className="space-y-6 pb-12 relative font-sans"
    >
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalRecords} registered candidates. Manage profiles, placement status, eligibility and resumes.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="tertiary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchStudentsData}
            disabled={loading}
            className="text-xs"
          >
            Refresh
          </Button>

          <PermissionGuard module={Module.STUDENTS} action={Action.CREATE}>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs shrink-0"
            >
              Add Student
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* STATS STRIP */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-border [&>div]:border-border max-lg:[&>div:nth-child(n+3)]:border-t lg:[&>div+div]:border-l max-lg:[&>div:nth-child(even)]:border-l">
          {[
            { label: 'Total enrolled', value: totalRecords, note: '+12% batch growth', icon: Users },
            { label: 'Eligible candidates', value: Math.round(totalRecords * 0.85), note: '85% meet 7.0+ CGPA', icon: CheckCircle2 },
            { label: 'Placed', value: Math.round(totalRecords * 0.72), note: '72% placement rate', icon: Trophy },
            { label: 'Opted out / unplaced', value: Math.round(totalRecords * 0.15), note: 'Higher studies / prep', icon: XCircle },
          ].map(({ label, value, note, icon: Icon }) => (
            <div key={label} className="p-6">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm">{label}</span>
                <Icon className="w-4 h-4" />
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{note}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* DIRECTORY CARD: toolbar + table + pagination */}
      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 border-b border-border">
          <div className="flex-1 min-w-0">
            <SearchInput
              placeholder="Search by name, roll number, department or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            <Dropdown
              className="w-full sm:w-44 shrink-0"
              options={[
                { label: 'All Departments', value: 'All' },
                { label: 'Computer Science', value: 'Computer Science' },
                { label: 'Information Tech', value: 'Information Tech' },
                { label: 'Electronics', value: 'Electronics' },
                { label: 'Mechanical', value: 'Mechanical' },
              ]}
              value={selectedDept}
              onChange={setSelectedDept}
            />

            <Dropdown
              className="w-full sm:w-36 shrink-0"
              options={[
                { label: 'All Batches', value: 'All' },
                { label: '2025 Batch', value: '2025' },
                { label: '2026 Batch', value: '2026' },
              ]}
              value={selectedYear}
              onChange={setSelectedYear}
            />

            <Dropdown
              className="w-full sm:w-44 shrink-0"
              options={[
                { label: 'All Statuses', value: 'All' },
                { label: 'Placed Only', value: 'Placed' },
                { label: 'Eligible (In Process)', value: 'Eligible' },
                { label: 'Opted Out', value: 'Opted Out' },
              ]}
              value={selectedStatus}
              onChange={setSelectedStatus}
            />

            {(selectedDept !== 'All' || selectedYear !== 'All' || selectedStatus !== 'All' || searchQuery !== '') && (
              <ShadButton
                variant="ghost"
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDept('All');
                  setSelectedYear('All');
                  setSelectedStatus('All');
                }}
                className="h-10 rounded-full px-4 text-xs text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </ShadButton>
            )}
          </div>
        </div>

        {/* Table */}
        <Table bare>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Roll number</TableHead>
              <TableHead>Branch & batch</TableHead>
              <TableHead>CGPA</TableHead>
              <TableHead>Backlogs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Loading student records...
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No matching student records found.
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow
                  key={student.id}
                  className="cursor-pointer"
                  onClick={() => handleOpenDrawer(student)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar src={student.avatar} name={student.name} size="md" />
                      <div className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">{student.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{student.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{student.rollNumber}</TableCell>
                  <TableCell>
                    <span className="block text-sm text-foreground">{student.branch}</span>
                    <span className="block text-xs text-muted-foreground">Batch of {student.passingYear}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex w-24 flex-col gap-1.5">
                      <span className="text-sm font-medium text-foreground">{student.cgpa.toFixed(1)}</span>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (student.cgpa / 10) * 100)}%` }} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.backlogs === 0 ? (
                      <Badge variant="neutral" size="sm">Clear</Badge>
                    ) : (
                      <Badge variant="alert" size="sm">{student.backlogs} active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        student.placementStatus === 'Placed'
                          ? 'success'
                          : student.placementStatus === 'In Process'
                          ? 'info'
                          : 'neutral'
                      }
                      size="sm"
                      dot
                    >
                      {student.placementStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          aria-label="Student actions"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-2xl">
                        <DropdownMenuItem onClick={() => handleOpenDrawer(student)}>
                          <FileText className="w-4 h-4" />
                          View profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteStudentAction(student.id)}
                          className="text-red-400 focus:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete student
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Server Pagination Controls */}
        <div className="px-4 py-2 border-t border-border">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalRecords / itemsPerPage) || 1}
            onPageChange={setCurrentPage}
            totalEntries={totalRecords}
            pageSize={itemsPerPage}
          />
        </div>
      </Card>

      {/* STUDENT PROFILE DETAILED DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsDrawerOpen(false)}
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-screen max-w-md bg-card border-l border-border p-6 overflow-y-auto space-y-6  relative text-foreground"
              >
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <span className="text-xs font-semibold text-primary tracking-wider uppercase">
                    Student Master Profile
                  </span>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Candidate Main Profile Banner Card */}
                <div className="bg-muted border border-border rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-4">
                    <Avatar src={selectedStudent.avatar} name={selectedStudent.name} size="lg" />
                    <div className="space-y-1 overflow-hidden">
                      <h3 className="text-lg font-semibold text-foreground leading-tight">{selectedStudent.name}</h3>
                      {selectedStudent.resumeHeadline && (
                        <p className="text-xs text-primary font-semibold truncate">{selectedStudent.resumeHeadline}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs font-mono font-semibold pt-1">
                        <span className="text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                          Roll: {selectedStudent.rollNumber}
                        </span>
                        {selectedStudent.enrollmentNumber && (
                          <span className="text-muted-foreground bg-accent px-2 py-0.5 rounded">
                            EN: {selectedStudent.enrollmentNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact & Personal details */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Email</span>
                      <span className="text-foreground font-medium truncate block">{selectedStudent.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Phone</span>
                      <span className="text-foreground font-medium">{selectedStudent.phone || 'N/A'}</span>
                    </div>
                    {selectedStudent.gender && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Gender</span>
                        <span className="text-foreground font-medium">{selectedStudent.gender}</span>
                      </div>
                    )}
                    {selectedStudent.dateOfBirth && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">DOB</span>
                        <span className="text-foreground font-medium">{selectedStudent.dateOfBirth}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Academic Highlights Grid */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
                    Academic Record
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-muted border border-border rounded-xl p-2.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">CGPA</span>
                      <span className="text-base font-semibold text-foreground">{selectedStudent.cgpa.toFixed(2)}</span>
                    </div>
                    <div className="bg-muted border border-border rounded-xl p-2.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Branch</span>
                      <span className="text-xs font-semibold text-foreground truncate block">{selectedStudent.branch}</span>
                    </div>
                    <div className="bg-muted border border-border rounded-xl p-2.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Placement</span>
                      <Badge variant={selectedStudent.placementStatus === 'Placed' ? 'success' : 'neutral'} size="sm">
                        {selectedStudent.placementStatus}
                      </Badge>
                    </div>

                    <div className="bg-muted border border-border rounded-xl p-2.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Semester</span>
                      <span className="text-xs font-semibold text-foreground">Sem {selectedStudent.currentSemester || 1}</span>
                    </div>
                    <div className="bg-muted border border-border rounded-xl p-2.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Passing Year</span>
                      <span className="text-xs font-semibold text-foreground">{selectedStudent.passingYear}</span>
                    </div>
                    <div className="bg-muted border border-border rounded-xl p-2.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Backlogs</span>
                      <span className={`text-xs font-semibold ${selectedStudent.backlogs > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {selectedStudent.backlogs} Active
                      </span>
                    </div>

                    {selectedStudent.tenthPercentage !== undefined && (
                      <div className="bg-muted border border-border rounded-xl p-2.5">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">10th %</span>
                        <span className="text-xs font-semibold text-foreground">{selectedStudent.tenthPercentage}%</span>
                      </div>
                    )}
                    {selectedStudent.twelfthPercentage !== undefined && (
                      <div className="bg-muted border border-border rounded-xl p-2.5">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">12th %</span>
                        <span className="text-xs font-semibold text-foreground">{selectedStudent.twelfthPercentage}%</span>
                      </div>
                    )}
                    {selectedStudent.diplomaPercentage !== undefined && (
                      <div className="bg-muted border border-border rounded-xl p-2.5">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Diploma %</span>
                        <span className="text-xs font-semibold text-foreground">{selectedStudent.diplomaPercentage}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Candidate Bio & Address section */}
                {(selectedStudent.bio || selectedStudent.address || selectedStudent.city) && (
                  <div className="bg-muted border border-border rounded-xl p-3 space-y-2 text-xs">
                    {selectedStudent.bio && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Summary / Bio</span>
                        <p className="text-foreground/90 text-xs leading-relaxed">{selectedStudent.bio}</p>
                      </div>
                    )}
                    {(selectedStudent.address || selectedStudent.city) && (
                      <div className="pt-2 border-t border-border">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Address</span>
                        <p className="text-foreground/90 text-xs">
                          {[selectedStudent.address, selectedStudent.city, selectedStudent.state, selectedStudent.country, selectedStudent.pincode].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Professional & Social Profiles */}
                {(selectedStudent.linkedinUrl || selectedStudent.githubUrl || selectedStudent.portfolioUrl || selectedStudent.leetcodeUrl || selectedStudent.hackerrankUrl) && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
                      Coding & Social Profiles
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {selectedStudent.linkedinUrl && (
                        <a href={selectedStudent.linkedinUrl} target="_blank" rel="noreferrer" className="bg-[#0A66C2]/20 border border-[#0A66C2]/40 text-[#0A66C2] px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 hover:bg-[#0A66C2]/30">
                          LinkedIn <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selectedStudent.githubUrl && (
                        <a href={selectedStudent.githubUrl} target="_blank" rel="noreferrer" className="bg-[#24292E]/60 border border-[#404448] text-foreground px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 hover:bg-[#24292E]">
                          GitHub <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selectedStudent.portfolioUrl && (
                        <a href={selectedStudent.portfolioUrl} target="_blank" rel="noreferrer" className="bg-primary/15 border border-primary/30 text-primary px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 hover:bg-primary/25">
                          Portfolio <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selectedStudent.leetcodeUrl && (
                        <a href={selectedStudent.leetcodeUrl} target="_blank" rel="noreferrer" className="bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 hover:bg-amber-500/25">
                          LeetCode <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selectedStudent.hackerrankUrl && (
                        <a href={selectedStudent.hackerrankUrl} target="_blank" rel="noreferrer" className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 hover:bg-emerald-500/25">
                          HackerRank <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Resume Upload & File List Section */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Resumes ({resumesList.length})
                    </span>
                    <label className="cursor-pointer bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      Upload PDF
                      <input type="file" accept=".pdf" className="hidden" onChange={handleResumeFileUpload} />
                    </label>
                  </div>

                  {uploadingResume && (
                    <div className="text-xs text-primary flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Uploading resume PDF to server storage...
                    </div>
                  )}

                  <div className="space-y-2">
                    {resumesList.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No active resumes uploaded for candidate.</p>
                    ) : (
                      resumesList.map((resItem) => (
                        <div key={resItem.id} className="bg-muted border border-border rounded-xl p-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <span className="truncate font-semibold text-foreground">{resItem.file_name || resItem.version_title}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={resItem.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleDeleteResumeFile(resItem.id)}
                              className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-md"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="pt-4 border-t border-border flex gap-2">
                  <Button variant="secondary" size="md" fullWidth onClick={() => setIsDrawerOpen(false)}>
                    Close
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    fullWidth
                    onClick={() => handleDeleteStudentAction(selectedStudent.id)}
                  >
                    Delete Student
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ENROLL NEW STUDENT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Enroll New Candidate"
        subtitle="Add a comprehensive student profile into the official TPO database."
        maxWidth="full"
      >
        <form onSubmit={handleAddStudentSubmit} className="flex flex-col md:flex-row gap-10 text-sm md:h-[62vh] md:min-h-[480px]">
          
          {/* Step Sidebar */}
          <nav className="md:w-72 shrink-0 space-y-1 md:overflow-y-auto" aria-label="Enrollment steps">
            {ENROLL_STEPS.map((step, idx) => {
              const current = ENROLL_STEPS.findIndex((x) => x.id === formTab);
              const isActive = idx === current;
              const isDone = idx < current;
              const Icon = step.icon;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setFormTab(step.id)}
                  className={`w-full flex items-start gap-3 rounded-2xl p-3 text-left transition-colors ${
                    isActive ? 'bg-secondary' : 'hover:bg-secondary/50'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary'
                        : isDone
                        ? 'bg-secondary text-foreground border-transparent'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.title}
                    </span>
                    <span className="block text-[11px] leading-snug text-muted-foreground">{step.desc}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="flex-1 min-w-0 flex flex-col min-h-0">
          {/* Step Heading + Progress */}
          <div className="space-y-3 mb-6 shrink-0">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {ENROLL_STEPS.find((x) => x.id === formTab)?.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {ENROLL_STEPS.find((x) => x.id === formTab)?.desc}
              </p>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${((ENROLL_STEPS.findIndex((x) => x.id === formTab) + 1) / ENROLL_STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-6">
          {/* TAB 1: BASIC INFO */}
          {formTab === 'basic' && (
            <div className="space-y-4">
              <Input
                label="Full Candidate Name *"
                placeholder="e.g. Rahul Sharma"
                value={enrollForm.full_name}
                onChange={(e) => setEnrollForm({ ...enrollForm, full_name: e.target.value })}
                required
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="rahul@university.edu"
                  value={enrollForm.email}
                  onChange={(e) => setEnrollForm({ ...enrollForm, email: e.target.value })}
                  required
                />
                <Input
                  label="Phone Number"
                  placeholder="+91 98765 43210"
                  value={enrollForm.phone}
                  onChange={(e) => setEnrollForm({ ...enrollForm, phone: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Alternate Phone"
                  placeholder="+91 98765 00000"
                  value={enrollForm.alternate_phone}
                  onChange={(e) => setEnrollForm({ ...enrollForm, alternate_phone: e.target.value })}
                />
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Gender
                  </label>
                  <Dropdown
                    options={[
                      { label: 'Male', value: 'Male' },
                      { label: 'Female', value: 'Female' },
                      { label: 'Other', value: 'Other' },
                    ]}
                    value={enrollForm.gender}
                    onChange={(v) => setEnrollForm({ ...enrollForm, gender: v })}
                  />
                </div>
                <Input
                  label="Date of Birth"
                  type="date"
                  value={enrollForm.date_of_birth}
                  onChange={(e) => setEnrollForm({ ...enrollForm, date_of_birth: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNT CREDENTIALS */}
          {formTab === 'account' && (
            <div className="space-y-5">
              <div className="bg-muted border border-border rounded-2xl p-4 flex items-start gap-3.5">
                <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-foreground font-semibold text-sm">Initial Account Security &amp; Credentials</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed mt-1">
                    Set an initial temporary password for the candidate account. An automated welcome email containing these login details will be dispatched to <strong className="text-foreground font-semibold">{enrollForm.email || 'the student email address'}</strong> upon registration.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Initial Password *
                  </label>
                  <div className="relative">
                    <ShadInput
                      type={showPassword ? 'text' : 'password'}
                      placeholder="e.g. Student@Pass2026"
                      className="h-auto w-full bg-muted/80 dark:bg-muted/80 rounded-xl px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground"
                      value={enrollForm.password}
                      onChange={(e) => setEnrollForm({ ...enrollForm, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <ShadInput
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      className="h-auto w-full bg-muted/80 dark:bg-muted/80 rounded-xl px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground"
                      value={enrollForm.confirm_password}
                      onChange={(e) => setEnrollForm({ ...enrollForm, confirm_password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {enrollForm.password && (
                <div className="bg-muted/60 border border-border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-semibold">Password Security Level:</span>
                    <span className={`font-semibold ${
                      passwordScore <= 2 ? 'text-rose-400' : passwordScore <= 4 ? 'text-amber-400' : 'text-primary'
                    }`}>
                      {passwordScore <= 2 ? 'Weak' : passwordScore <= 4 ? 'Moderate' : 'Strong'}
                    </span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-2 bg-[#1E293B] rounded-full overflow-hidden flex gap-1.5">
                    <div className={`h-full flex-1 transition-all rounded-full ${passwordScore >= 1 ? (passwordScore <= 2 ? 'bg-rose-500' : passwordScore <= 4 ? 'bg-amber-500' : 'bg-primary') : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 transition-all rounded-full ${passwordScore >= 2 ? (passwordScore <= 2 ? 'bg-rose-500' : passwordScore <= 4 ? 'bg-amber-500' : 'bg-primary') : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 transition-all rounded-full ${passwordScore >= 3 ? (passwordScore <= 4 ? 'bg-amber-500' : 'bg-primary') : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 transition-all rounded-full ${passwordScore >= 4 ? 'bg-primary' : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 transition-all rounded-full ${passwordScore >= 5 ? 'bg-primary' : 'bg-transparent'}`} />
                  </div>

                  {/* Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className={`flex items-center gap-2 ${passwordCriteria.minLength ? 'text-primary' : 'text-muted-foreground'}`}>
                      {passwordCriteria.minLength ? <Check className="w-4 h-4" /> : <span className="w-3.5 h-3.5 block border border-muted-foreground rounded-full" />}
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-2 ${passwordCriteria.hasUpper ? 'text-primary' : 'text-muted-foreground'}`}>
                      {passwordCriteria.hasUpper ? <Check className="w-4 h-4" /> : <span className="w-3.5 h-3.5 block border border-muted-foreground rounded-full" />}
                      Uppercase letter (A-Z)
                    </div>
                    <div className={`flex items-center gap-2 ${passwordCriteria.hasLower ? 'text-primary' : 'text-muted-foreground'}`}>
                      {passwordCriteria.hasLower ? <Check className="w-4 h-4" /> : <span className="w-3.5 h-3.5 block border border-muted-foreground rounded-full" />}
                      Lowercase letter (a-z)
                    </div>
                    <div className={`flex items-center gap-2 ${passwordCriteria.hasNumber ? 'text-primary' : 'text-muted-foreground'}`}>
                      {passwordCriteria.hasNumber ? <Check className="w-4 h-4" /> : <span className="w-3.5 h-3.5 block border border-muted-foreground rounded-full" />}
                      Number (0-9)
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACADEMIC INFO */}
          {formTab === 'academic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Roll Number *"
                  placeholder="e.g. RS2020CS"
                  value={enrollForm.roll_number}
                  onChange={(e) => setEnrollForm({ ...enrollForm, roll_number: e.target.value })}
                  required
                />
                <Input
                  label="Enrollment Number"
                  placeholder="e.g. EN20200045"
                  value={enrollForm.enrollment_number}
                  onChange={(e) => setEnrollForm({ ...enrollForm, enrollment_number: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="CGPA *"
                  type="number"
                  step="0.01"
                  placeholder="8.5"
                  value={enrollForm.cgpa}
                  onChange={(e) => setEnrollForm({ ...enrollForm, cgpa: e.target.value })}
                  required
                />
                <Input
                  label="Current Semester"
                  type="number"
                  placeholder="7"
                  value={enrollForm.current_semester}
                  onChange={(e) => setEnrollForm({ ...enrollForm, current_semester: e.target.value })}
                />
                <Input
                  label="Passing Year"
                  type="number"
                  placeholder="2025"
                  value={enrollForm.passing_year}
                  onChange={(e) => setEnrollForm({ ...enrollForm, passing_year: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="10th Percentage (%)"
                  type="number"
                  step="0.1"
                  placeholder="88.5"
                  value={enrollForm.tenth_percentage}
                  onChange={(e) => setEnrollForm({ ...enrollForm, tenth_percentage: e.target.value })}
                />
                <Input
                  label="12th Percentage (%)"
                  type="number"
                  step="0.1"
                  placeholder="85.0"
                  value={enrollForm.twelfth_percentage}
                  onChange={(e) => setEnrollForm({ ...enrollForm, twelfth_percentage: e.target.value })}
                />
                <Input
                  label="Diploma Percentage (%)"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 78.0"
                  value={enrollForm.diploma_percentage}
                  onChange={(e) => setEnrollForm({ ...enrollForm, diploma_percentage: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Active Backlogs"
                  type="number"
                  placeholder="0"
                  value={enrollForm.active_backlogs}
                  onChange={(e) => setEnrollForm({ ...enrollForm, active_backlogs: e.target.value })}
                />
                <Input
                  label="History Backlogs"
                  type="number"
                  placeholder="0"
                  value={enrollForm.history_backlogs}
                  onChange={(e) => setEnrollForm({ ...enrollForm, history_backlogs: e.target.value })}
                />
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Placement Status
                  </label>
                  <Dropdown
                    options={[
                      { label: 'Unplaced', value: 'Unplaced' },
                      { label: 'Placed', value: 'Placed' },
                      { label: 'In Process', value: 'In Process' },
                      { label: 'Opted Out', value: 'Opted Out' },
                    ]}
                    value={enrollForm.placement_status}
                    onChange={(v) => setEnrollForm({ ...enrollForm, placement_status: v })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ADDRESS */}
          {formTab === 'address' && (
            <div className="space-y-4">
              <Input
                label="Street Address"
                placeholder="House No, Street, Area"
                value={enrollForm.address}
                onChange={(e) => setEnrollForm({ ...enrollForm, address: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="City"
                  placeholder="e.g. Mumbai"
                  value={enrollForm.city}
                  onChange={(e) => setEnrollForm({ ...enrollForm, city: e.target.value })}
                />
                <Input
                  label="State"
                  placeholder="e.g. Maharashtra"
                  value={enrollForm.state}
                  onChange={(e) => setEnrollForm({ ...enrollForm, state: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Country"
                  placeholder="India"
                  value={enrollForm.country}
                  onChange={(e) => setEnrollForm({ ...enrollForm, country: e.target.value })}
                />
                <Input
                  label="Pincode"
                  placeholder="400001"
                  value={enrollForm.pincode}
                  onChange={(e) => setEnrollForm({ ...enrollForm, pincode: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* TAB 5: LINKS & BIO */}
          {formTab === 'social' && (
            <div className="space-y-4">
              <Input
                label="Resume Headline"
                placeholder="e.g. Aspiring Full Stack Developer & Cloud Engineer"
                value={enrollForm.resume_headline}
                onChange={(e) => setEnrollForm({ ...enrollForm, resume_headline: e.target.value })}
              />
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Candidate Bio / Summary
                </label>
                <ShadTextarea
                  className="w-full h-24 bg-muted/80 dark:bg-muted/80 rounded-xl p-3.5 text-sm text-foreground placeholder:text-muted-foreground resize-none"
                  placeholder="Brief overview of technical background, project experience, and career aspirations..."
                  value={enrollForm.bio}
                  onChange={(e) => setEnrollForm({ ...enrollForm, bio: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="LinkedIn URL"
                  placeholder="https://linkedin.com/in/username"
                  value={enrollForm.linkedin_url}
                  onChange={(e) => setEnrollForm({ ...enrollForm, linkedin_url: e.target.value })}
                />
                <Input
                  label="GitHub URL"
                  placeholder="https://github.com/username"
                  value={enrollForm.github_url}
                  onChange={(e) => setEnrollForm({ ...enrollForm, github_url: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Portfolio URL"
                  placeholder="https://myportfolio.com"
                  value={enrollForm.portfolio_url}
                  onChange={(e) => setEnrollForm({ ...enrollForm, portfolio_url: e.target.value })}
                />
                <Input
                  label="LeetCode URL"
                  placeholder="https://leetcode.com/username"
                  value={enrollForm.leetcode_url}
                  onChange={(e) => setEnrollForm({ ...enrollForm, leetcode_url: e.target.value })}
                />
                <Input
                  label="HackerRank URL"
                  placeholder="https://hackerrank.com/username"
                  value={enrollForm.hackerrank_url}
                  onChange={(e) => setEnrollForm({ ...enrollForm, hackerrank_url: e.target.value })}
                />
              </div>
            </div>
          )}

          </div>

          {/* Form Action Footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 mt-4 border-t border-border shrink-0">
            <Button type="button" variant="ghost" size="md" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              {formTab !== 'basic' && (
                <Button
                  type="button"
                  variant="tertiary"
                  size="md"
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                  onClick={() => setFormTab(ENROLL_STEPS[ENROLL_STEPS.findIndex((x) => x.id === formTab) - 1].id)}
                >
                  Back
                </Button>
              )}
              {formTab !== 'social' && (
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                  onClick={() => setFormTab(ENROLL_STEPS[ENROLL_STEPS.findIndex((x) => x.id === formTab) + 1].id)}
                >
                  Next
                </Button>
              )}
              <Button type="submit" variant="primary" size="md" className="px-6">
                Enroll Candidate
              </Button>
            </div>
          </div>
          </div>
        </form>
      </Modal>

      {/* STUDENT ENROLLMENT SUCCESS & CREDENTIALS MODAL */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Student Account Enrolled 🚀"
        subtitle="New candidate account and student profile have been created in the database."
        maxWidth="2xl"
      >
        <div className="space-y-5 text-sm">
          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 flex items-start gap-3.5">
            <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="text-primary font-semibold text-sm">Account Provisioned &amp; Welcome Email Dispatched</h4>
              <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                The student account was created with role <strong className="text-foreground font-semibold">STUDENT</strong>. An automated welcome email containing login credentials has been sent to candidate email.
              </p>
            </div>
          </div>

          {createdStudentInfo && (
            <div className="bg-muted border border-border rounded-2xl p-5 space-y-4">
              <h4 className="text-primary font-semibold text-xs uppercase tracking-wider">
                Candidate Account Summary
              </h4>

              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-muted-foreground text-xs font-medium block">Candidate Name</span>
                  <p className="font-semibold text-foreground mt-0.5 text-base">{createdStudentInfo.full_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs font-medium block">Roll Number</span>
                  <p className="font-semibold text-foreground mt-0.5 text-base">{createdStudentInfo.roll_number}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground text-xs font-medium block">Email Address</span>
                  <p className="font-semibold text-foreground mt-0.5 text-base">{createdStudentInfo.email}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <span className="text-muted-foreground text-xs font-semibold block mb-1.5">Temporary Initial Password</span>
                <div className="bg-background border border-primary/40 rounded-xl p-3 flex items-center justify-between">
                  <code className="text-primary font-mono text-base font-semibold tracking-wider">
                    {createdStudentInfo.tempPassword}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Email: ${createdStudentInfo.email}\nPassword: ${createdStudentInfo.tempPassword}\nRoll No: ${createdStudentInfo.roll_number}`
                      );
                      setCopiedPassword(true);
                      setTimeout(() => setCopiedPassword(false), 2500);
                    }}
                    className="bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary px-4 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-2 transition-colors"
                  >
                    {copiedPassword ? (
                      <>
                        <Check className="w-4 h-4" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy Credentials
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-amber-400 text-xs">
            <Lock className="w-5 h-5 shrink-0" />
            <span>Candidate will be prompted to change password upon initial portal login.</span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setIsSuccessModalOpen(false);
                setCreatedStudentInfo(null);
              }}
            >
              Done &amp; View Student List
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};
