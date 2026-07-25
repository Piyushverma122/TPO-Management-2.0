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

  // New Student Form State
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentBranch, setNewStudentBranch] = useState('Computer Science');
  const [newStudentCgpa, setNewStudentCgpa] = useState('8.5');
  const [newStudentYear, setNewStudentYear] = useState('2025');

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

      const rawList = res.data?.students || [];
      const total = res.data?.total || 0;

      // Transform backend response into frontend Student type
      const formattedList: Student[] = rawList.map((s: any) => ({
        id: s.id,
        rollNumber: s.roll_number || 'N/A',
        name: s.users?.full_name || s.name || 'Candidate',
        email: s.users?.email || s.email || '',
        branch: s.branches?.name || s.users?.department || 'General',
        cgpa: s.cgpa ? parseFloat(s.cgpa) : 0,
        passingYear: s.passing_year || 2025,
        backlogs: s.active_backlogs || 0,
        placementStatus: (s.placement_status as any) || 'Unplaced',
        companyPlaced: s.company_placed || '(pending)',
        packageOffered: s.package_offered || '--',
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
    if (!newStudentName || !newStudentRoll || !newStudentEmail) {
      toastError('Validation Error', 'Name, Roll Number, and Email are required.');
      return;
    }

    try {
      await createStudent({
        roll_number: newStudentRoll,
        email: newStudentEmail,
        full_name: newStudentName,
        cgpa: parseFloat(newStudentCgpa) || 8.0,
        passing_year: parseInt(newStudentYear) || 2025,
      });

      setIsAddModalOpen(false);
      setNewStudentName('');
      setNewStudentRoll('');
      setNewStudentEmail('');
      success('Student Enrolled', `${newStudentName} added to TPO database.`);
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

  return (
    <div className="space-y-6 pb-12 relative font-sans">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Student Directory
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
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

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
            className="font-extrabold text-xs shrink-0"
          >
            Add New Student
          </Button>
        </div>
      </div>

      {/* TOP 4 STATISTIC METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">Total Enrolled</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">{totalRecords}</span>
            <span className="text-[11px] text-[#A3E635] font-semibold mt-1 block">+12% batch growth</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 flex items-center justify-center font-bold text-xl">
            <Users className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">Eligible Candidates</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">{Math.round(totalRecords * 0.85)}</span>
            <span className="text-[11px] text-[#38BDF8] font-semibold mt-1 block">85% meets 7.0+ CGPA</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">Successfully Placed</span>
            <span className="text-2xl font-extrabold text-[#A3E635] mt-1 block">{Math.round(totalRecords * 0.72)}</span>
            <span className="text-[11px] text-[#A3E635] font-semibold mt-1 block">72% placement rate</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#A3E635]/20 text-[#A3E635] border border-[#A3E635]/40 flex items-center justify-center font-bold text-xl">
            <Trophy className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">Opted Out / Unplaced</span>
            <span className="text-2xl font-extrabold text-rose-400 mt-1 block">{Math.round(totalRecords * 0.15)}</span>
            <span className="text-[11px] text-rose-400 font-semibold mt-1 block">Higher Studies / Prep</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-xl">
            <XCircle className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          <div className="w-full lg:flex-1">
            <SearchInput
              placeholder="Search by student name, roll number, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <Dropdown
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
              options={[
                { label: 'All Batches', value: 'All' },
                { label: '2025 Batch', value: '2025' },
                { label: '2026 Batch', value: '2026' },
              ]}
              value={selectedYear}
              onChange={setSelectedYear}
            />

            <Dropdown
              options={[
                { label: 'All Statuses', value: 'All' },
                { label: 'Placed Only', value: 'Placed' },
                { label: 'Eligible (In Process)', value: 'Eligible' },
                { label: 'Opted Out', value: 'Opted Out' },
              ]}
              value={selectedStatus}
              onChange={setSelectedStatus}
            />
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

                {/* Candidate Main Avatar Card */}
                <div className="flex items-center gap-4 bg-[#101726] border border-[#202D42] rounded-2xl p-4">
                  <Avatar src={selectedStudent.avatar} name={selectedStudent.name} size="lg" />
                  <div>
                    <h3 className="text-lg font-extrabold text-white">{selectedStudent.name}</h3>
                    <p className="text-xs text-[#A3E635] font-mono font-bold">{selectedStudent.rollNumber}</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">{selectedStudent.email}</p>
                  </div>
                </div>

                {/* Academic Highlights */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3">
                    <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">CGPA</span>
                    <span className="text-lg font-extrabold text-white">{selectedStudent.cgpa.toFixed(2)}</span>
                  </div>
                  <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3">
                    <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Placement</span>
                    <Badge variant={selectedStudent.placementStatus === 'Placed' ? 'success' : 'neutral'} size="sm">
                      {selectedStudent.placementStatus}
                    </Badge>
                  </div>
                </div>

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
        subtitle="Add a student record into the official TPO database."
      >
        <form onSubmit={handleAddStudentSubmit} className="space-y-4">
          <Input
            label="Full Candidate Name"
            placeholder="e.g. Rahul Sharma"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            required
          />
          <Input
            label="Roll Number"
            placeholder="e.g. RS2020CS"
            value={newStudentRoll}
            onChange={(e) => setNewStudentRoll(e.target.value)}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="student@university.edu"
            value={newStudentEmail}
            onChange={(e) => setNewStudentEmail(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Dropdown
              label="Branch"
              options={[
                { label: 'Computer Science', value: 'Computer Science' },
                { label: 'Information Tech', value: 'Information Tech' },
                { label: 'Electronics', value: 'Electronics' },
                { label: 'Mechanical', value: 'Mechanical' },
              ]}
              value={newStudentBranch}
              onChange={setNewStudentBranch}
            />
            <Input
              label="CGPA"
              type="number"
              step="0.1"
              value={newStudentCgpa}
              onChange={(e) => setNewStudentCgpa(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Enroll Candidate
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
