import React, { useState, useMemo } from 'react';
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
  FileCheck
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

// Sparkline Mock Data
const totalSparkline = [{ v: 40 }, { v: 55 }, { v: 65 }, { v: 91 }];
const eligibleSparkline = [{ v: 30 }, { v: 70 }, { v: 90 }, { v: 81 }];
const placedSparkline = [{ v: 20 }, { v: 45 }, { v: 60 }, { v: 78 }];
const notEligibleSparkline = [{ v: 80 }, { v: 60 }, { v: 90 }, { v: 40 }];

// Initial Mock Students List
const initialStudents: Student[] = [
  {
    id: 'std-1',
    rollNumber: 'RS2020CS',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@student.edu',
    branch: 'Computer Science',
    cgpa: 8.9,
    passingYear: 2025,
    backlogs: 0,
    placementStatus: 'Placed',
    companyPlaced: 'Amazon',
    packageOffered: '₹18 LPA',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    skills: ['React', 'Node.js', 'Python', 'AWS', 'Data Structures'],
  },
  {
    id: 'std-2',
    rollNumber: 'PP2021EC',
    name: 'Priya Patel',
    email: 'priya.patel@student.edu',
    branch: 'Electronics',
    cgpa: 7.5,
    passingYear: 2025,
    backlogs: 0,
    placementStatus: 'In Process',
    companyPlaced: 'Tata Consultancy Services',
    packageOffered: '₹6.5 LPA',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    skills: ['Embedded Systems', 'VLSI', 'C++', 'MATLAB'],
  },
  {
    id: 'std-3',
    rollNumber: 'VS2020ME',
    name: 'Vikram Singh',
    email: 'vikram.singh@student.edu',
    branch: 'Mechanical',
    cgpa: 6.2,
    passingYear: 2025,
    backlogs: 0,
    placementStatus: 'Unplaced',
    companyPlaced: '(pending)',
    packageOffered: '--',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    skills: ['AutoCAD', 'SolidWorks', 'Thermodynamics'],
  },
  {
    id: 'std-4',
    rollNumber: 'AG2019CS',
    name: 'Anjali Gupta',
    email: 'anjali.gupta@student.edu',
    branch: 'Computer Science',
    cgpa: 9.1,
    passingYear: 2025,
    backlogs: 1,
    placementStatus: 'Opted Out',
    companyPlaced: '(pending)',
    packageOffered: '--',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    skills: ['Java', 'Spring Boot', 'SQL', 'System Design'],
  },
  {
    id: 'std-5',
    rollNumber: 'RV2020IT',
    name: 'Rohan Verma',
    email: 'rohan.verma@student.edu',
    branch: 'Information Tech',
    cgpa: 8.4,
    passingYear: 2025,
    backlogs: 0,
    placementStatus: 'Placed',
    companyPlaced: 'Deloitte',
    packageOffered: '₹12.5 LPA',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    skills: ['Cybersecurity', 'Docker', 'Go', 'Linux'],
  },
  {
    id: 'std-[#6]',
    rollNumber: 'SR2021CE',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@student.edu',
    branch: 'Civil',
    cgpa: 7.8,
    passingYear: 2025,
    backlogs: 0,
    placementStatus: 'In Process',
    companyPlaced: 'L&T Construction',
    packageOffered: '₹7.0 LPA',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    skills: ['STAAD Pro', 'REVIT', 'Project Management'],
  },
];

export const Students: React.FC = () => {
  const { success, info } = useToast();
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // New Student Form State
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentBranch, setNewStudentBranch] = useState('Computer Science');
  const [newStudentCgpa, setNewStudentCgpa] = useState('8.5');

  // Filtered Students Calculation
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDept = selectedDept === 'All' || student.branch === selectedDept;
      const matchesYear = selectedYear === 'All' || String(student.passingYear) === selectedYear;
      const matchesStatus =
        selectedStatus === 'All' ||
        (selectedStatus === 'Placed' && student.placementStatus === 'Placed') ||
        (selectedStatus === 'Eligible' && (student.placementStatus === 'In Process' || student.placementStatus === 'Unplaced')) ||
        (selectedStatus === 'Not Eligible' && student.placementStatus === 'Opted Out');

      return matchesSearch && matchesDept && matchesYear && matchesStatus;
    });
  }, [students, searchQuery, selectedDept, selectedYear, selectedStatus]);

  const handleOpenDrawer = (student: Student) => {
    setSelectedStudent(student);
    setIsDrawerOpen(true);
    setActionMenuOpenId(null);
  };

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentRoll) return;

    const newStd: Student = {
      id: `std-${Date.now()}`,
      rollNumber: newStudentRoll,
      name: newStudentName,
      email: `${newStudentName.toLowerCase().replace(/\s+/g, '.')}@student.edu`,
      branch: newStudentBranch,
      cgpa: parseFloat(newStudentCgpa) || 8.0,
      passingYear: 2025,
      backlogs: 0,
      placementStatus: 'Unplaced',
      companyPlaced: '(pending)',
      packageOffered: '--',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      skills: ['Problem Solving', 'Data Structures', 'Communication'],
    };

    setStudents([newStd, ...students]);
    setIsAddModalOpen(false);
    setNewStudentName('');
    setNewStudentRoll('');
    success('Student Enrolled', `${newStudentName} added to TPO record database.`);
  };

  return (
    <div className="space-y-6 pb-12 relative">
      
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Student Management</h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Directory of enrolled candidates, eligibility checks, and career placement status.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
          className="font-extrabold text-xs"
        >
          + Add Student
        </Button>
      </div>

      {/* TOP METRICS CARDS ROW strictly matching Student managemnt page.jpg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Students */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <Users className="w-4 h-4 text-[#94A3B8]" />
              <span>Total Students</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">6,800</div>
          <div className="h-10 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={totalSparkline}>
                <Area type="monotone" dataKey="v" stroke="#A3E635" fill="#A3E635" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center text-xs font-semibold text-[#94A3B8] pt-1 border-t border-[#202D42]">
            <span>Avg. Attendance</span>
            <span className="text-white font-extrabold">91%</span>
          </div>
        </Card>

        {/* Card 2: Eligible Students */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-[#94A3B8]" />
              <span>Eligible Students</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">5,500</div>
          <div className="h-10 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eligibleSparkline}>
                <Bar dataKey="v" fill="#A3E635" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center text-xs font-semibold text-[#94A3B8] pt-1 border-t border-[#202D42]">
            <span>Eligibility Rate</span>
            <span className="text-white font-extrabold">81%</span>
          </div>
        </Card>

        {/* Card 3: HIGHLIGHTED NEON GREEN Placed Students */}
        <Card variant="accent" className="p-5 space-y-2 relative overflow-hidden shadow-[0_0_30px_rgba(163,230,53,0.35)]">
          <div className="flex items-center justify-between text-[#0B0F17]/80">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-[#0B0F17]" />
              <span>Placed Students</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#0B0F17]">4,300</div>
          <div className="h-10 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={placedSparkline}>
                <Area type="monotone" dataKey="v" stroke="#0B0F17" fill="none" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center text-xs font-extrabold text-[#0B0F17]/90 pt-1 border-t border-[#0B0F17]/20">
            <span>Placement Rate</span>
            <span>78%</span>
          </div>
        </Card>

        {/* Card 4: Not Eligible (Red Accent) */}
        <Card className="p-5 space-y-2 border-rose-500/30">
          <div className="flex items-center justify-between text-rose-400">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>Not Eligible</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">1,300</div>
          <div className="h-10 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={notEligibleSparkline}>
                <Bar dataKey="v" fill="#F43F5E" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center text-[11px] font-semibold text-[#94A3B8] pt-1 border-t border-[#202D42]">
            <span>Common Reason:</span>
            <span className="text-rose-400 font-extrabold">GPA &lt; 6.0</span>
          </div>
        </Card>

      </div>

      {/* MAIN SEARCH, FILTER & TABLE CONTAINER strictly matching design */}
      <Card className="p-6 space-y-5">
        
        {/* Search Bar */}
        <SearchInput
          placeholder="Search Students by name, roll, or skill..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-sm py-3"
        />

        {/* Filter Dropdowns Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          
          <Dropdown
            label="Department:"
            options={[
              { label: 'All Departments', value: 'All' },
              { label: 'Computer Science', value: 'Computer Science' },
              { label: 'Electronics', value: 'Electronics' },
              { label: 'Mechanical', value: 'Mechanical' },
              { label: 'Civil', value: 'Civil' },
              { label: 'Information Tech', value: 'Information Tech' },
            ]}
            value={selectedDept}
            onChange={setSelectedDept}
          />

          <Dropdown
            label="Year:"
            options={[
              { label: 'All Passing Years', value: 'All' },
              { label: '2024', value: '2024' },
              { label: '2025', value: '2025' },
              { label: '2026', value: '2026' },
            ]}
            value={selectedYear}
            onChange={setSelectedYear}
          />

          <Dropdown
            label="Placement Status:"
            options={[
              { label: 'All Statuses', value: 'All' },
              { label: 'Placed', value: 'Placed' },
              { label: 'Eligible', value: 'Eligible' },
              { label: 'Not Eligible', value: 'Not Eligible' },
            ]}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />

          <Dropdown
            label="CGPA Range:"
            options={[
              { label: 'All CGPA', value: 'All' },
              { label: '> 8.5 CGPA', value: '8.5+' },
              { label: '7.5 - 8.5 CGPA', value: '7.5-8.5' },
              { label: '6.0 - 7.5 CGPA', value: '6.0-7.5' },
            ]}
            value="All"
            onChange={() => {}}
          />

          <div className="pt-5">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Filter className="w-4 h-4 text-[#A3E635]" />}
              fullWidth
              onClick={() => {
                setSearchQuery('');
                setSelectedDept('All');
                setSelectedYear('All');
                setSelectedStatus('All');
                info('Filters Reset', 'Cleared all active filters.');
              }}
            >
              Reset Filter
            </Button>
          </div>
        </div>

        {/* Student Data Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Roll Number</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>CGPA</TableHead>
              <TableHead>Resume</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Package</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10 text-[#94A3B8]">
                  No students found matching current filter query.
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow
                  key={student.id}
                  className="cursor-pointer hover:bg-[#1C293F]"
                  onClick={() => handleOpenDrawer(student)}
                >
                  <TableCell>
                    <Avatar src={student.avatar} name={student.name} size="sm" />
                  </TableCell>
                  <TableCell className="font-bold text-white hover:text-[#A3E635] transition-colors">
                    {student.name}
                  </TableCell>
                  <TableCell className="text-[#94A3B8] font-mono text-xs">{student.rollNumber}</TableCell>
                  <TableCell className="text-[#94A3B8]">{student.branch}</TableCell>
                  <TableCell className="font-bold text-white">{student.cgpa}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        info('Resume PDF', `Opening resume for ${student.name}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#101726] border border-[#202D42] text-xs font-semibold text-sky-400 hover:text-white hover:border-sky-400 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View
                    </button>
                  </TableCell>
                  <TableCell>
                    {student.placementStatus === 'Placed' ? (
                      <Badge variant="active" dot>
                        Placed
                      </Badge>
                    ) : student.placementStatus === 'In Process' || student.placementStatus === 'Unplaced' ? (
                      <Badge variant="info" dot>
                        Eligible
                      </Badge>
                    ) : (
                      <Badge variant="alert" dot>
                        Not Eligible
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-bold text-white">
                    {student.companyPlaced || '(pending)'}
                  </TableCell>
                  <TableCell className="font-extrabold text-[#A3E635]">
                    {student.packageOffered || '--'}
                  </TableCell>
                  <TableCell className="text-right relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuOpenId(actionMenuOpenId === student.id ? null : student.id);
                      }}
                      className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#202D42] transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Action Dropdown Menu */}
                    {actionMenuOpenId === student.id && (
                      <div
                        className="absolute right-4 top-10 bg-[#101726] border border-[#202D42] rounded-xl shadow-2xl z-40 p-1.5 w-44 text-left backdrop-blur-xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleOpenDrawer(student)}
                          className="w-full px-3 py-2 text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-[#162032] rounded-lg flex items-center gap-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#A3E635]" />
                          View Profile
                        </button>
                        <button
                          onClick={() => {
                            setActionMenuOpenId(null);
                            info('Edit Student', `Editing record for ${student.name}`);
                          }}
                          className="w-full px-3 py-2 text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-[#162032] rounded-lg flex items-center gap-2"
                        >
                          <Edit className="w-3.5 h-3.5 text-sky-400" />
                          Edit Details
                        </button>
                        <button
                          onClick={() => {
                            setActionMenuOpenId(null);
                            info('Download Resume', `Downloading ${student.name}_Resume.pdf`);
                          }}
                          className="w-full px-3 py-2 text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-[#162032] rounded-lg flex items-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          Download Resume
                        </button>
                        <button
                          onClick={() => {
                            setStudents(students.filter((s) => s.id !== student.id));
                            setActionMenuOpenId(null);
                            success('Student Removed', `Removed ${student.name} from roster.`);
                          }}
                          className="w-full px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 rounded-lg flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Student
                        </button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer matching design */}
        <Pagination
          currentPage={currentPage}
          totalPages={68}
          onPageChange={setCurrentPage}
          totalEntries={6800}
        />
      </Card>

      {/* STUDENT PROFILE SLIDE-OVER DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Dark Glass Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-[#0B0F17]/80 backdrop-blur-md"
            />

            {/* Slide-over Drawer Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full max-w-md bg-[#162032] border-l border-[#202D42] h-full shadow-2xl relative z-10 p-6 overflow-y-auto space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-[#202D42] pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#A3E635]">
                    Student Profile Card
                  </span>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#202D42] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Profile Hero Section */}
                <div className="text-center space-y-3 bg-[#101726] border border-[#202D42] rounded-2xl p-5 relative overflow-hidden">
                  <Avatar
                    src={selectedStudent.avatar}
                    name={selectedStudent.name}
                    size="xl"
                    border
                    borderColor="border-[#A3E635]"
                    className="mx-auto"
                  />
                  <div>
                    <h3 className="text-xl font-extrabold text-white">{selectedStudent.name}</h3>
                    <p className="text-xs text-[#A3E635] font-mono mt-0.5">{selectedStudent.rollNumber}</p>
                  </div>
                  <div className="flex justify-center gap-2">
                    {selectedStudent.placementStatus === 'Placed' ? (
                      <Badge variant="active" dot>
                        Placed @ {selectedStudent.companyPlaced}
                      </Badge>
                    ) : (
                      <Badge variant="info" dot>
                        Eligible Candidate
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Academic Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Cumulative CGPA</span>
                    <span className="text-lg font-extrabold text-white">{selectedStudent.cgpa} / 10.0</span>
                  </div>
                  <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Active Backlogs</span>
                    <span className={`text-lg font-extrabold ${selectedStudent.backlogs === 0 ? 'text-[#A3E635]' : 'text-rose-400'}`}>
                      {selectedStudent.backlogs}
                    </span>
                  </div>
                </div>

                {/* Detailed Information Rows */}
                <div className="space-y-3 bg-[#101726] border border-[#202D42] rounded-2xl p-4 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#202D42]">
                    <span className="text-[#94A3B8] flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#A3E635]" /> Department
                    </span>
                    <span className="font-bold text-white">{selectedStudent.branch}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#202D42]">
                    <span className="text-[#94A3B8] flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#A3E635]" /> Email Address
                    </span>
                    <span className="font-bold text-white truncate max-w-[180px]">{selectedStudent.email}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#202D42]">
                    <span className="text-[#94A3B8] flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#A3E635]" /> Offered Package
                    </span>
                    <span className="font-extrabold text-[#A3E635]">{selectedStudent.packageOffered}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[#94A3B8] flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#A3E635]" /> Graduation Year
                    </span>
                    <span className="font-bold text-white">{selectedStudent.passingYear}</span>
                  </div>
                </div>

                {/* Technical Skills Badges */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Verified Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStudent.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="bg-[#101726] border border-[#202D42] text-white text-xs font-medium px-2.5 py-1 rounded-lg"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-4 border-t border-[#202D42] space-y-2">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => success('Resume Downloaded', `Saved ${selectedStudent.name}_Resume.pdf`)}
                >
                  Download Full Resume PDF
                </Button>
                <Button variant="secondary" size="md" fullWidth onClick={() => setIsDrawerOpen(false)}>
                  Close Drawer
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ENROLL NEW STUDENT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Enroll New Student"
        subtitle="Add candidate into placement tracking system."
      >
        <form onSubmit={handleAddStudentSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Ananya Roy"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            required
          />
          <Input
            label="Roll Number"
            placeholder="e.g. AR2022CS"
            value={newStudentRoll}
            onChange={(e) => setNewStudentRoll(e.target.value)}
            required
          />
          <Dropdown
            label="Department"
            options={[
              { label: 'Computer Science', value: 'Computer Science' },
              { label: 'Electronics', value: 'Electronics' },
              { label: 'Mechanical', value: 'Mechanical' },
              { label: 'Civil', value: 'Civil' },
              { label: 'Information Tech', value: 'Information Tech' },
            ]}
            value={newStudentBranch}
            onChange={setNewStudentBranch}
          />
          <Input
            label="CGPA Score"
            type="number"
            step="0.1"
            placeholder="8.5"
            value={newStudentCgpa}
            onChange={(e) => setNewStudentCgpa(e.target.value)}
            required
          />
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
