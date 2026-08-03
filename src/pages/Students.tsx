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
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer } from 'recharts';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { useToast } from '../components/ui/Toast';
import { Student } from '../types';
import { PermissionGuard } from '../components/auth/PermissionGuard';
import { Module, Action } from '../config/rbac';
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
        avatar: s.users?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Student Directory
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 shadow-[0_0_10px_rgba(163,230,53,0.2)]">
              {totalRecords} Total Registered
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Manage student academic profiles, placement status, eligibility criteria, and resumes.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchStudentsData}
            disabled={loading}
          >
            Refresh
          </Button>

          <PermissionGuard module={Module.STUDENTS} action={Action.CREATE}>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddModalOpen(true)}
              className="font-extrabold text-xs shrink-0"
            >
              Add New Student
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* TOP 4 STATISTIC METRIC CARDS ROW */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        <motion.div variants={cardItemVariants} whileHover={{ y: -4 }} transition={{ type: 'spring' as const, stiffness: 280, damping: 22 }}>
          <Card className="p-5 flex items-center justify-between border-[#202D42] hover:border-[#A3E635]/40 transition-all duration-300 shadow-xl group">
            <div>
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">Total Enrolled</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">{totalRecords}</span>
              <span className="text-[11px] text-[#A3E635] font-semibold mt-1 block">+12% batch growth</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={cardItemVariants} whileHover={{ y: -4 }} transition={{ type: 'spring' as const, stiffness: 280, damping: 22 }}>
          <Card className="p-5 flex items-center justify-between border-[#202D42] hover:border-sky-500/40 transition-all duration-300 shadow-xl group">
            <div>
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">Eligible Candidates</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">{Math.round(totalRecords * 0.85)}</span>
              <span className="text-[11px] text-[#38BDF8] font-semibold mt-1 block">85% meets 7.0+ CGPA</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={cardItemVariants} whileHover={{ y: -4 }} transition={{ type: 'spring' as const, stiffness: 280, damping: 22 }}>
          <Card className="p-5 flex items-center justify-between border-[#202D42] hover:border-[#A3E635]/40 transition-all duration-300 shadow-xl group">
            <div>
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">Successfully Placed</span>
              <span className="text-2xl font-extrabold text-[#A3E635] mt-1 block">{Math.round(totalRecords * 0.72)}</span>
              <span className="text-[11px] text-[#A3E635] font-semibold mt-1 block">72% placement rate</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#A3E635]/20 text-[#A3E635] border border-[#A3E635]/40 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6" />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={cardItemVariants} whileHover={{ y: -4 }} transition={{ type: 'spring' as const, stiffness: 280, damping: 22 }}>
          <Card className="p-5 flex items-center justify-between border-[#202D42] hover:border-rose-500/40 transition-all duration-300 shadow-xl group">
            <div>
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">Opted Out / Unplaced</span>
              <span className="text-2xl font-extrabold text-rose-400 mt-1 block">{Math.round(totalRecords * 0.15)}</span>
              <span className="text-[11px] text-rose-400 font-semibold mt-1 block">Higher Studies / Prep</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              <XCircle className="w-6 h-6" />
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <Card className="p-3 relative z-30 bg-[#101726] border-[#202D42] shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full min-w-0">
            <SearchInput
              placeholder="Search student by name, roll number, department, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto shrink-0">
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
              className="w-full sm:w-40 shrink-0"
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
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDept('All');
                  setSelectedYear('All');
                  setSelectedStatus('All');
                }}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* MAIN STUDENTS DIRECTORY TABLE */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Info</TableHead>
              <TableHead>Roll Number</TableHead>
              <TableHead>Branch & Batch</TableHead>
              <TableHead>CGPA</TableHead>
              <TableHead>Backlogs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-[#94A3B8]">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-[#A3E635] border-t-transparent rounded-full animate-spin" />
                    <span>Loading student records from server...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-[#94A3B8]">
                  No matching student records found.
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow
                  key={student.id}
                  className="hover:bg-[#1C293F]/50 transition-colors cursor-pointer"
                  onClick={() => handleOpenDrawer(student)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar src={student.avatar} name={student.name} size="md" />
                      <div>
                        <span className="font-bold text-white block leading-tight hover:text-[#A3E635] transition-colors">
                          {student.name}
                        </span>
                        <span className="text-xs text-[#94A3B8]">{student.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-semibold text-xs text-[#A3E635]">
                    {student.rollNumber}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold text-white block">{student.branch}</span>
                    <span className="text-[11px] text-[#64748B]">Batch of {student.passingYear}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-white text-sm">{student.cgpa.toFixed(1)}</span>
                  </TableCell>
                  <TableCell>
                    {student.backlogs === 0 ? (
                      <span className="text-xs font-semibold text-emerald-400">0 Clear</span>
                    ) : (
                      <span className="text-xs font-semibold text-rose-400">{student.backlogs} Active</span>
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
                    >
                      {student.placementStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() => setActionMenuOpenId(actionMenuOpenId === student.id ? null : student.id)}
                        className="text-[#94A3B8] hover:text-white p-1.5 rounded-lg hover:bg-[#202D42] transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {actionMenuOpenId === student.id && (
                        <div className="absolute right-0 mt-1 w-44 bg-[#162032] border border-[#202D42] rounded-xl shadow-2xl z-30 py-1 space-y-0.5 text-xs text-left">
                          <button
                            onClick={() => handleOpenDrawer(student)}
                            className="w-full px-3 py-2 text-white hover:bg-[#202D42] flex items-center gap-2 font-medium"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#A3E635]" />
                            View Profile
                          </button>
                          <button
                            onClick={() => handleDeleteStudentAction(student.id)}
                            className="w-full px-3 py-2 text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Student
                          </button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Server Pagination Controls */}
        <div className="p-4 border-t border-[#202D42] flex items-center justify-between">
          <span className="text-xs text-[#94A3B8]">
            Showing Page {currentPage} of {Math.ceil(totalRecords / itemsPerPage) || 1} ({totalRecords} records)
          </span>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalRecords / itemsPerPage) || 1}
            onPageChange={setCurrentPage}
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
              className="fixed inset-0 bg-[#0B0F17]/80 backdrop-blur-sm"
              onClick={() => setIsDrawerOpen(false)}
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-screen max-w-md bg-[#162032] border-l border-[#202D42] p-6 overflow-y-auto space-y-6 shadow-2xl relative text-white"
              >
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-[#202D42] pb-4">
                  <span className="text-xs font-extrabold text-[#A3E635] tracking-wider uppercase">
                    Student Master Profile
                  </span>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#202D42]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Candidate Main Profile Banner Card */}
                <div className="bg-[#101726] border border-[#202D42] rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-4">
                    <Avatar src={selectedStudent.avatar} name={selectedStudent.name} size="lg" />
                    <div className="space-y-1 overflow-hidden">
                      <h3 className="text-lg font-extrabold text-white leading-tight">{selectedStudent.name}</h3>
                      {selectedStudent.resumeHeadline && (
                        <p className="text-xs text-[#A3E635] font-semibold truncate">{selectedStudent.resumeHeadline}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs font-mono font-bold pt-1">
                        <span className="text-[#A3E635] bg-[#A3E635]/10 px-2 py-0.5 rounded border border-[#A3E635]/20">
                          Roll: {selectedStudent.rollNumber}
                        </span>
                        {selectedStudent.enrollmentNumber && (
                          <span className="text-[#94A3B8] bg-[#1C293F] px-2 py-0.5 rounded">
                            EN: {selectedStudent.enrollmentNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact & Personal details */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#202D42] text-xs">
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-bold block">Email</span>
                      <span className="text-white font-medium truncate block">{selectedStudent.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-bold block">Phone</span>
                      <span className="text-white font-medium">{selectedStudent.phone || 'N/A'}</span>
                    </div>
                    {selectedStudent.gender && (
                      <div>
                        <span className="text-[10px] text-[#64748B] uppercase font-bold block">Gender</span>
                        <span className="text-white font-medium">{selectedStudent.gender}</span>
                      </div>
                    )}
                    {selectedStudent.dateOfBirth && (
                      <div>
                        <span className="text-[10px] text-[#64748B] uppercase font-bold block">DOB</span>
                        <span className="text-white font-medium">{selectedStudent.dateOfBirth}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Academic Highlights Grid */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-[#A3E635] uppercase tracking-wider block">
                    Academic Record
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-[#101726] border border-[#202D42] rounded-xl p-2.5">
                      <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">CGPA</span>
                      <span className="text-base font-extrabold text-white">{selectedStudent.cgpa.toFixed(2)}</span>
                    </div>
                    <div className="bg-[#101726] border border-[#202D42] rounded-xl p-2.5">
                      <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Branch</span>
                      <span className="text-xs font-bold text-white truncate block">{selectedStudent.branch}</span>
                    </div>
                    <div className="bg-[#101726] border border-[#202D42] rounded-xl p-2.5">
                      <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Placement</span>
                      <Badge variant={selectedStudent.placementStatus === 'Placed' ? 'success' : 'neutral'} size="sm">
                        {selectedStudent.placementStatus}
                      </Badge>
                    </div>

                    <div className="bg-[#101726] border border-[#202D42] rounded-xl p-2.5">
                      <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Semester</span>
                      <span className="text-xs font-bold text-white">Sem {selectedStudent.currentSemester || 1}</span>
                    </div>
                    <div className="bg-[#101726] border border-[#202D42] rounded-xl p-2.5">
                      <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Passing Year</span>
                      <span className="text-xs font-bold text-white">{selectedStudent.passingYear}</span>
                    </div>
                    <div className="bg-[#101726] border border-[#202D42] rounded-xl p-2.5">
                      <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Backlogs</span>
                      <span className={`text-xs font-bold ${selectedStudent.backlogs > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {selectedStudent.backlogs} Active
                      </span>
                    </div>

                    {selectedStudent.tenthPercentage !== undefined && (
                      <div className="bg-[#101726] border border-[#202D42] rounded-xl p-2.5">
                        <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">10th %</span>
                        <span className="text-xs font-bold text-white">{selectedStudent.tenthPercentage}%</span>
                      </div>
                    )}
                    {selectedStudent.twelfthPercentage !== undefined && (
                      <div className="bg-[#101726] border border-[#202D42] rounded-xl p-2.5">
                        <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">12th %</span>
                        <span className="text-xs font-bold text-white">{selectedStudent.twelfthPercentage}%</span>
                      </div>
                    )}
                    {selectedStudent.diplomaPercentage !== undefined && (
                      <div className="bg-[#101726] border border-[#202D42] rounded-xl p-2.5">
                        <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Diploma %</span>
                        <span className="text-xs font-bold text-white">{selectedStudent.diplomaPercentage}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Candidate Bio & Address section */}
                {(selectedStudent.bio || selectedStudent.address || selectedStudent.city) && (
                  <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3 space-y-2 text-xs">
                    {selectedStudent.bio && (
                      <div>
                        <span className="text-[10px] text-[#64748B] uppercase font-bold block">Summary / Bio</span>
                        <p className="text-white/90 text-xs leading-relaxed">{selectedStudent.bio}</p>
                      </div>
                    )}
                    {(selectedStudent.address || selectedStudent.city) && (
                      <div className="pt-2 border-t border-[#202D42]">
                        <span className="text-[10px] text-[#64748B] uppercase font-bold block">Address</span>
                        <p className="text-white/90 text-xs">
                          {[selectedStudent.address, selectedStudent.city, selectedStudent.state, selectedStudent.country, selectedStudent.pincode].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Professional & Social Profiles */}
                {(selectedStudent.linkedinUrl || selectedStudent.githubUrl || selectedStudent.portfolioUrl || selectedStudent.leetcodeUrl || selectedStudent.hackerrankUrl) && (
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-[#A3E635] uppercase tracking-wider block">
                      Coding & Social Profiles
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {selectedStudent.linkedinUrl && (
                        <a href={selectedStudent.linkedinUrl} target="_blank" rel="noreferrer" className="bg-[#0A66C2]/20 border border-[#0A66C2]/40 text-[#0A66C2] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 hover:bg-[#0A66C2]/30">
                          LinkedIn <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selectedStudent.githubUrl && (
                        <a href={selectedStudent.githubUrl} target="_blank" rel="noreferrer" className="bg-[#24292E]/60 border border-[#404448] text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 hover:bg-[#24292E]">
                          GitHub <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selectedStudent.portfolioUrl && (
                        <a href={selectedStudent.portfolioUrl} target="_blank" rel="noreferrer" className="bg-[#A3E635]/15 border border-[#A3E635]/30 text-[#A3E635] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 hover:bg-[#A3E635]/25">
                          Portfolio <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selectedStudent.leetcodeUrl && (
                        <a href={selectedStudent.leetcodeUrl} target="_blank" rel="noreferrer" className="bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 hover:bg-amber-500/25">
                          LeetCode <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selectedStudent.hackerrankUrl && (
                        <a href={selectedStudent.hackerrankUrl} target="_blank" rel="noreferrer" className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 hover:bg-emerald-500/25">
                          HackerRank <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Resume Upload & File List Section */}
                <div className="space-y-3 pt-2 border-t border-[#202D42]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Resumes ({resumesList.length})
                    </span>
                    <label className="cursor-pointer bg-[#A3E635]/15 hover:bg-[#A3E635]/25 border border-[#A3E635]/30 text-[#A3E635] px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      Upload PDF
                      <input type="file" accept=".pdf" className="hidden" onChange={handleResumeFileUpload} />
                    </label>
                  </div>

                  {uploadingResume && (
                    <div className="text-xs text-[#A3E635] flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-[#A3E635] border-t-transparent rounded-full animate-spin" />
                      Uploading resume PDF to server storage...
                    </div>
                  )}

                  <div className="space-y-2">
                    {resumesList.length === 0 ? (
                      <p className="text-xs text-[#94A3B8] italic">No active resumes uploaded for candidate.</p>
                    ) : (
                      resumesList.map((resItem) => (
                        <div key={resItem.id} className="bg-[#101726] border border-[#202D42] rounded-xl p-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="w-4 h-4 text-[#A3E635] shrink-0" />
                            <span className="truncate font-semibold text-white">{resItem.file_name || resItem.version_title}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={resItem.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-[#94A3B8] hover:text-white hover:bg-[#202D42] rounded-md"
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
                <div className="pt-4 border-t border-[#202D42] flex gap-2">
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
        maxWidth="3xl"
      >
        <form onSubmit={handleAddStudentSubmit} className="space-y-6 text-sm">
          
          {/* Navigation Tabs Header */}
          <div className="flex border-b border-[#202D42] gap-2 pb-3 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFormTab('basic')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2 ${
                formTab === 'basic'
                  ? 'bg-[#A3E635] text-[#0B0F17] shadow-lg shadow-[#A3E635]/20'
                  : 'bg-[#101726] text-[#94A3B8] hover:text-white border border-[#202D42]'
              }`}
            >
              <Users className="w-4 h-4" />
              Basic Info
            </button>
            <button
              type="button"
              onClick={() => setFormTab('account')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2 ${
                formTab === 'account'
                  ? 'bg-[#A3E635] text-[#0B0F17] shadow-lg shadow-[#A3E635]/20'
                  : 'bg-[#101726] text-[#94A3B8] hover:text-white border border-[#202D42]'
              }`}
            >
              <Key className="w-4 h-4" />
              Account Credentials
            </button>
            <button
              type="button"
              onClick={() => setFormTab('academic')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2 ${
                formTab === 'academic'
                  ? 'bg-[#A3E635] text-[#0B0F17] shadow-lg shadow-[#A3E635]/20'
                  : 'bg-[#101726] text-[#94A3B8] hover:text-white border border-[#202D42]'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Academic Info
            </button>
            <button
              type="button"
              onClick={() => setFormTab('address')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2 ${
                formTab === 'address'
                  ? 'bg-[#A3E635] text-[#0B0F17] shadow-lg shadow-[#A3E635]/20'
                  : 'bg-[#101726] text-[#94A3B8] hover:text-white border border-[#202D42]'
              }`}
            >
              Address
            </button>
            <button
              type="button"
              onClick={() => setFormTab('social')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2 ${
                formTab === 'social'
                  ? 'bg-[#A3E635] text-[#0B0F17] shadow-lg shadow-[#A3E635]/20'
                  : 'bg-[#101726] text-[#94A3B8] hover:text-white border border-[#202D42]'
              }`}
            >
              Links &amp; Bio
            </button>
          </div>

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
                  <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-1.5">
                    Gender
                  </label>
                  <select
                    className="w-full bg-[#101726]/80 border border-[#202D42] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635] transition-all"
                    value={enrollForm.gender}
                    onChange={(e) => setEnrollForm({ ...enrollForm, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
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
              <div className="bg-[#101726] border border-[#202D42] rounded-2xl p-4 flex items-start gap-3.5">
                <ShieldCheck className="w-6 h-6 text-[#A3E635] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-bold text-sm">Initial Account Security &amp; Credentials</h4>
                  <p className="text-[#94A3B8] text-xs leading-relaxed mt-1">
                    Set an initial temporary password for the candidate account. An automated welcome email containing these login details will be dispatched to <strong className="text-white font-bold">{enrollForm.email || 'the student email address'}</strong> upon registration.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-1.5">
                    Initial Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="e.g. Student@Pass2026"
                      className="w-full bg-[#101726]/80 border border-[#202D42] rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635] transition-all"
                      value={enrollForm.password}
                      onChange={(e) => setEnrollForm({ ...enrollForm, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[#94A3B8] hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      className="w-full bg-[#101726]/80 border border-[#202D42] rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635] transition-all"
                      value={enrollForm.confirm_password}
                      onChange={(e) => setEnrollForm({ ...enrollForm, confirm_password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-[#94A3B8] hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {enrollForm.password && (
                <div className="bg-[#101726]/60 border border-[#202D42] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#94A3B8] font-semibold">Password Security Level:</span>
                    <span className={`font-bold ${
                      passwordScore <= 2 ? 'text-rose-400' : passwordScore <= 4 ? 'text-amber-400' : 'text-[#A3E635]'
                    }`}>
                      {passwordScore <= 2 ? 'Weak' : passwordScore <= 4 ? 'Moderate' : 'Strong'}
                    </span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-2 bg-[#1E293B] rounded-full overflow-hidden flex gap-1.5">
                    <div className={`h-full flex-1 transition-all rounded-full ${passwordScore >= 1 ? (passwordScore <= 2 ? 'bg-rose-500' : passwordScore <= 4 ? 'bg-amber-500' : 'bg-[#A3E635]') : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 transition-all rounded-full ${passwordScore >= 2 ? (passwordScore <= 2 ? 'bg-rose-500' : passwordScore <= 4 ? 'bg-amber-500' : 'bg-[#A3E635]') : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 transition-all rounded-full ${passwordScore >= 3 ? (passwordScore <= 4 ? 'bg-amber-500' : 'bg-[#A3E635]') : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 transition-all rounded-full ${passwordScore >= 4 ? 'bg-[#A3E635]' : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 transition-all rounded-full ${passwordScore >= 5 ? 'bg-[#A3E635]' : 'bg-transparent'}`} />
                  </div>

                  {/* Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className={`flex items-center gap-2 ${passwordCriteria.minLength ? 'text-[#A3E635]' : 'text-[#64748B]'}`}>
                      {passwordCriteria.minLength ? <Check className="w-4 h-4" /> : <span className="w-3.5 h-3.5 block border border-[#64748B] rounded-full" />}
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-2 ${passwordCriteria.hasUpper ? 'text-[#A3E635]' : 'text-[#64748B]'}`}>
                      {passwordCriteria.hasUpper ? <Check className="w-4 h-4" /> : <span className="w-3.5 h-3.5 block border border-[#64748B] rounded-full" />}
                      Uppercase letter (A-Z)
                    </div>
                    <div className={`flex items-center gap-2 ${passwordCriteria.hasLower ? 'text-[#A3E635]' : 'text-[#64748B]'}`}>
                      {passwordCriteria.hasLower ? <Check className="w-4 h-4" /> : <span className="w-3.5 h-3.5 block border border-[#64748B] rounded-full" />}
                      Lowercase letter (a-z)
                    </div>
                    <div className={`flex items-center gap-2 ${passwordCriteria.hasNumber ? 'text-[#A3E635]' : 'text-[#64748B]'}`}>
                      {passwordCriteria.hasNumber ? <Check className="w-4 h-4" /> : <span className="w-3.5 h-3.5 block border border-[#64748B] rounded-full" />}
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
                  <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-1.5">
                    Placement Status
                  </label>
                  <select
                    className="w-full bg-[#101726]/80 border border-[#202D42] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635] transition-all"
                    value={enrollForm.placement_status}
                    onChange={(e) => setEnrollForm({ ...enrollForm, placement_status: e.target.value })}
                  >
                    <option value="Unplaced">Unplaced</option>
                    <option value="Placed">Placed</option>
                    <option value="In Process">In Process</option>
                    <option value="Opted Out">Opted Out</option>
                  </select>
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
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-1.5">
                  Candidate Bio / Summary
                </label>
                <textarea
                  className="w-full h-24 bg-[#101726]/80 border border-[#202D42] rounded-xl p-3.5 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635] transition-all resize-none"
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

          {/* Form Action Footer */}
          <div className="flex justify-between items-center pt-4 border-t border-[#202D42]">
            <div className="text-xs font-semibold text-[#94A3B8]">
              Step {formTab === 'basic' ? '1' : formTab === 'account' ? '2' : formTab === 'academic' ? '3' : formTab === 'address' ? '4' : '5'} of 5
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="secondary" size="md" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" className="px-6">
                Enroll Candidate
              </Button>
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
          <div className="bg-[#A3E635]/10 border border-[#A3E635]/30 rounded-2xl p-4 flex items-start gap-3.5">
            <CheckCircle2 className="w-6 h-6 text-[#A3E635] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[#A3E635] font-bold text-sm">Account Provisioned &amp; Welcome Email Dispatched</h4>
              <p className="text-[#94A3B8] text-xs mt-1 leading-relaxed">
                The student account was created with role <strong className="text-white font-bold">STUDENT</strong>. An automated welcome email containing login credentials has been sent to candidate email.
              </p>
            </div>
          </div>

          {createdStudentInfo && (
            <div className="bg-[#101726] border border-[#202D42] rounded-2xl p-5 space-y-4">
              <h4 className="text-[#A3E635] font-extrabold text-xs uppercase tracking-wider">
                Candidate Account Summary
              </h4>

              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-[#94A3B8] text-xs font-medium block">Candidate Name</span>
                  <p className="font-bold text-white mt-0.5 text-base">{createdStudentInfo.full_name}</p>
                </div>
                <div>
                  <span className="text-[#94A3B8] text-xs font-medium block">Roll Number</span>
                  <p className="font-bold text-white mt-0.5 text-base">{createdStudentInfo.roll_number}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[#94A3B8] text-xs font-medium block">Email Address</span>
                  <p className="font-bold text-white mt-0.5 text-base">{createdStudentInfo.email}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#202D42]">
                <span className="text-[#94A3B8] text-xs font-bold block mb-1.5">Temporary Initial Password</span>
                <div className="bg-[#0B0F17] border border-[#A3E635]/40 rounded-xl p-3 flex items-center justify-between">
                  <code className="text-[#A3E635] font-mono text-base font-extrabold tracking-wider">
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
                    className="bg-[#A3E635]/15 hover:bg-[#A3E635]/25 border border-[#A3E635]/30 text-[#A3E635] px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors"
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

          <div className="flex justify-end gap-3 pt-3 border-t border-[#202D42]">
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
