import React, { useState, useMemo } from 'react';
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
  ListFilter
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { Avatar, AvatarGroup } from '../components/ui/Avatar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';
import { PlacementDrive } from '../types';

// Mock Progression Bar Data
const roundProgressionData = [
  { name: 'Total', count: 400 },
  { name: 'Applied', count: 180 },
  { name: 'Round 1', count: 80 },
  { name: 'Round 2', count: 35 },
  { name: 'Offers', count: 18 },
];

const offerDistributionData = [
  { name: 'Accepted', value: 14, color: '#A3E635' },
  { name: 'Pending', value: 4, color: '#F59E0B' },
  { name: 'Rejected', value: 72, color: '#F43F5E' },
];

// Initial Placement Drives List
const initialDrives: PlacementDrive[] = [
  {
    id: 'drv-1',
    driveCode: 'AMZ-SDE1',
    companyId: 'cmp-1',
    companyName: 'Amazon',
    companyLogo: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=120',
    roleTitle: 'Software Development Engineer - 1',
    jobType: 'Full Time',
    ctc: '₹28 - ₹45 LPA',
    location: 'College Auditorium / Online',
    eligibility: {
      minCgpa: 7.5,
      maxBacklogs: 0,
      branches: ['CS', 'IT', 'ECE'],
      passingYear: 2025,
    },
    registrationDeadline: 'Oct 18, 2025',
    driveDate: 'Oct 20-22, 2025',
    rounds: ['Application', 'Written Test', 'Technical 1', 'HR Round', 'Result'],
    status: 'Ongoing',
    appliedStudentsCount: 180,
    shortlistedCount: 35,
    placedCount: 18,
  },
  {
    id: 'drv-2',
    driveCode: 'GOOG-SWE',
    companyId: 'cmp-2',
    companyName: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&q=80&w=120',
    roleTitle: 'Summer Internship Drive 2025',
    jobType: 'Internship',
    ctc: '₹1.2 Lakh/month',
    location: 'Virtual / Google Meet',
    eligibility: {
      minCgpa: 8.0,
      maxBacklogs: 0,
      branches: ['CS', 'IT'],
      passingYear: 2026,
    },
    registrationDeadline: 'Oct 25, 2025',
    driveDate: 'Nov 01-03, 2025',
    rounds: ['Online Assessment', 'Tech Interview 1', 'Tech Interview 2', 'HR Fitment'],
    status: 'Upcoming',
    appliedStudentsCount: 240,
    shortlistedCount: 50,
    placedCount: 0,
  },
  {
    id: 'drv-3',
    driveCode: 'DEL-CONS',
    companyId: 'cmp-3',
    companyName: 'Deloitte',
    companyLogo: 'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&q=80&w=120',
    roleTitle: 'Consulting Analyst Drive',
    jobType: 'Full Time',
    ctc: '₹12.5 LPA',
    location: 'Seminar Hall B',
    eligibility: {
      minCgpa: 7.0,
      maxBacklogs: 1,
      branches: ['All Branches'],
      passingYear: 2025,
    },
    registrationDeadline: 'Oct 10, 2025',
    driveDate: 'Oct 15-16, 2025',
    rounds: ['Aptitude Test', 'Group Discussion', 'PI Round'],
    status: 'Conducted',
    appliedStudentsCount: 310,
    shortlistedCount: 45,
    placedCount: 22,
  },
];

export const Drives: React.FC = () => {
  const navigate = useNavigate();
  const { success, info } = useToast();
  const [drives, setDrives] = useState<PlacementDrive[]>(initialDrives);
  const [viewMode, setViewMode] = useState<'cards' | 'details'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedJobType, setSelectedJobType] = useState('All');
  const [selectedDrive, setSelectedDrive] = useState<PlacementDrive>(initialDrives[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Drive Form State
  const [newCompany, setNewCompany] = useState('Amazon');
  const [newRole, setNewRole] = useState('Software Engineer');
  const [newCtc, setNewCtc] = useState('₹25 LPA');

  const filteredDrives = useMemo(() => {
    return drives.filter((d) => {
      const matchesSearch =
        d.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.driveCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === 'All' ||
        (selectedStatus === 'Ongoing' && (d.status === 'Ongoing' || d.status === 'Upcoming')) ||
        (selectedStatus === 'Conducted' && d.status === 'Conducted');

      const matchesType = selectedJobType === 'All' || d.jobType === selectedJobType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [drives, searchQuery, selectedStatus, selectedJobType]);

  const handleOpenDetailsView = (drive: PlacementDrive) => {
    setSelectedDrive(drive);
    setViewMode('details');
  };

  const handleCreateDrive = (e: React.FormEvent) => {
    e.preventDefault();
    const newDriveItem: PlacementDrive = {
      id: `drv-${Date.now()}`,
      driveCode: `${newCompany.slice(0, 3).toUpperCase()}-SDE`,
      companyId: 'cmp-1',
      companyName: newCompany,
      companyLogo: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=120',
      roleTitle: newRole,
      jobType: 'Full Time',
      ctc: newCtc,
      location: 'College Campus',
      eligibility: { minCgpa: 7.5, maxBacklogs: 0, branches: ['CS', 'IT'], passingYear: 2025 },
      registrationDeadline: 'Next Week',
      driveDate: 'Nov 10, 2025',
      rounds: ['Online Test', 'Interview', 'Result'],
      status: 'Upcoming',
      appliedStudentsCount: 0,
      shortlistedCount: 0,
      placedCount: 0,
    };

    setDrives([newDriveItem, ...drives]);
    setIsAddModalOpen(false);
    success('Placement Drive Published', `${newCompany} drive is now live for registration.`);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Placement Drives' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-1">
            Placement Drives Overview
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              Active Season 2025
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setViewMode(viewMode === 'cards' ? 'details' : 'cards')}
          >
            {viewMode === 'cards' ? 'Switch to Detailed View' : 'Back to Drives Grid'}
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
            className="font-extrabold text-xs"
          >
            Publish New Drive
          </Button>
        </div>
      </div>

      {/* VIEW MODE 1: CARDS GRID OVERVIEW strictly matching Design Placement Drive page 2..jpg */}
      {viewMode === 'cards' ? (
        <div className="space-y-6">
          
          {/* SEARCH & FILTERS CONTROLS */}
          <Card className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
              <div className="lg:col-span-2">
                <SearchInput
                  placeholder="Search drives by company, role, or drive code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Dropdown
                label="Drive Status:"
                options={[
                  { label: 'All Statuses', value: 'All' },
                  { label: 'Ongoing / Scheduled', value: 'Ongoing' },
                  { label: 'Conducted / Completed', value: 'Conducted' },
                ]}
                value={selectedStatus}
                onChange={setSelectedStatus}
              />

              <Dropdown
                label="Job Type:"
                options={[
                  { label: 'All Job Types', value: 'All' },
                  { label: 'Full Time', value: 'Full Time' },
                  { label: 'Internship', value: 'Internship' },
                ]}
                value={selectedJobType}
                onChange={setSelectedJobType}
              />
            </div>
          </Card>

          {/* DRIVES CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrives.map((drive) => (
              <motion.div
                key={drive.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card glowOnHover className="p-6 space-y-4 border-[#202D42]">
                  
                  {/* Card Header (Logo + Drive Name + Status Badge) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={drive.companyLogo} alt={drive.companyName} className="w-10 h-10 rounded-xl object-cover border border-[#202D42]" />
                      <div>
                        <h3 className="text-base font-extrabold text-white leading-snug">{drive.companyName} - {drive.jobType}</h3>
                        <p className="text-xs text-[#A3E635] font-mono">{drive.driveCode}</p>
                      </div>
                    </div>
                    <StatusBadge status={drive.status} size="sm" />
                  </div>

                  {/* Dates, Venue, & Eligibility Details */}
                  <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3 text-xs space-y-1">
                    <p className="text-white font-semibold flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#A3E635]" />
                      Date: <span className="text-[#94A3B8]">{drive.driveDate}</span>
                    </p>
                    <p className="text-white font-semibold flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#A3E635]" />
                      Venue: <span className="text-[#94A3B8]">{drive.location}</span>
                    </p>
                    <p className="text-white font-semibold flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-[#A3E635]" />
                      Eligible: <span className="text-[#94A3B8]">CGPA &gt; {drive.eligibility.minCgpa} ({drive.eligibility.branches.join(', ')})</span>
                    </p>
                  </div>

                  {/* Recruitment Workflow Stepper Node Timeline */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-wider block">
                      Drive Selection Rounds Workflow
                    </span>
                    <div className="flex items-center justify-between bg-[#101726] border border-[#202D42] p-2.5 rounded-xl text-[11px] font-semibold text-[#94A3B8]">
                      <span>Application</span>
                      <ChevronRight className="w-3 h-3 text-[#A3E635]" />
                      <span>Test</span>
                      <ChevronRight className="w-3 h-3 text-[#A3E635]" />
                      <span className="text-[#A3E635] font-bold">Tech 1</span>
                      <ChevronRight className="w-3 h-3 text-[#64748B]" />
                      <span>HR</span>
                    </div>
                  </div>

                  {/* Candidates Avatar Stack & Counters Grid strictly matching design */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#202D42]">
                    <div className="grid grid-cols-3 gap-3 w-full text-center">
                      <div className="bg-[#101726] border border-[#202D42] rounded-xl p-2">
                        <span className="text-[10px] text-[#94A3B8] uppercase block">Eligible</span>
                        <span className="text-sm font-extrabold text-white">400</span>
                      </div>
                      <div className="bg-[#101726] border border-[#202D42] rounded-xl p-2">
                        <span className="text-[10px] text-[#94A3B8] uppercase block">Applied</span>
                        <span className="text-sm font-extrabold text-white">{drive.appliedStudentsCount}</span>
                      </div>
                      <div className="bg-[#101726] border border-[#202D42] rounded-xl p-2">
                        <span className="text-[10px] text-[#94A3B8] uppercase block">Selected</span>
                        <span className="text-sm font-extrabold text-[#A3E635]">{drive.placedCount || 18}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={() => handleOpenDetailsView(drive)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={() => info('Manage Students', `Viewing student roster for ${drive.companyName}`)}
                    >
                      Manage Students
                    </Button>
                  </div>

                </Card>
              </motion.div>
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={69} onPageChange={setCurrentPage} totalEntries={69} />

        </div>
      ) : (
        /* VIEW MODE 2: FULL DRIVE DETAILS VIEW strictly matching Design Placement Drive Details..jpg */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Header Card matching Design Placement Drive Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Drive Hero Info Banner */}
            <Card className="lg:col-span-8 p-6 bg-gradient-to-r from-[#162032] via-[#101726] to-[#162032] border-[#202D42] flex flex-col justify-between">
              <div className="flex items-center gap-4">
                <img src={selectedDrive.companyLogo} alt={selectedDrive.companyName} className="w-16 h-16 rounded-2xl object-cover border-2 border-[#A3E635] bg-white p-1" />
                <div>
                  <span className="text-xs font-bold text-[#A3E635] uppercase tracking-wider font-mono">
                    {selectedDrive.driveCode}
                  </span>
                  <h2 className="text-2xl font-extrabold text-white">{selectedDrive.companyName} SDE-1 Drive (2025)</h2>
                  <p className="text-xs text-[#94A3B8]">{selectedDrive.roleTitle} • {selectedDrive.ctc}</p>
                </div>
              </div>
            </Card>

            {/* Quick Metadata Box */}
            <Card className="lg:col-span-4 p-5 space-y-2 text-xs bg-[#101726]">
              <div className="flex justify-between py-1 border-b border-[#202D42]">
                <span className="text-[#94A3B8]">Role:</span>
                <span className="font-bold text-white">{selectedDrive.roleTitle}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#202D42]">
                <span className="text-[#94A3B8]">Drive Dates:</span>
                <span className="font-bold text-white">{selectedDrive.driveDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#202D42]">
                <span className="text-[#94A3B8]">Venue:</span>
                <span className="font-bold text-white">{selectedDrive.location}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#94A3B8]">Open Positions:</span>
                <span className="font-extrabold text-[#A3E635]">25 Seats</span>
              </div>
            </Card>

          </div>

          {/* TIMELINE STEPPER CARD & ELIGIBILITY CARD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Horizontal Recruitment Timeline Stepper */}
            <Card className="lg:col-span-8 p-6 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                Recruitment Workflow Timeline
              </h3>
              
              <div className="flex items-center justify-between relative px-2 py-4">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-8 right-8 h-1 bg-[#202D42] -translate-y-1/2 z-0" />
                <div className="absolute top-1/2 left-8 w-3/5 h-1 bg-[#A3E635] -translate-y-1/2 z-0" />

                {/* Node 1 */}
                <div className="relative z-10 text-center space-y-1">
                  <div className="w-10 h-10 rounded-full bg-[#A3E635] text-[#0B0F17] flex items-center justify-center font-bold mx-auto shadow-[0_0_12px_rgba(163,230,53,0.5)]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white block">Application</span>
                </div>

                {/* Node 2 */}
                <div className="relative z-10 text-center space-y-1">
                  <div className="w-10 h-10 rounded-full bg-[#A3E635] text-[#0B0F17] flex items-center justify-center font-bold mx-auto shadow-[0_0_12px_rgba(163,230,53,0.5)]">
                    <Edit className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white block">Written Test</span>
                </div>

                {/* Node 3 */}
                <div className="relative z-10 text-center space-y-1">
                  <div className="w-10 h-10 rounded-full bg-[#A3E635] text-[#0B0F17] flex items-center justify-center font-bold mx-auto shadow-[0_0_12px_rgba(163,230,53,0.5)]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#A3E635] block">Technical 1</span>
                </div>

                {/* Node 4 */}
                <div className="relative z-10 text-center space-y-1">
                  <div className="w-10 h-10 rounded-full bg-[#101726] border-2 border-[#202D42] text-[#64748B] flex items-center justify-center font-bold mx-auto">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-[#64748B] block">HR Round</span>
                </div>

                {/* Node 5 */}
                <div className="relative z-10 text-center space-y-1">
                  <div className="w-10 h-10 rounded-full bg-[#101726] border-2 border-[#202D42] text-[#64748B] flex items-center justify-center font-bold mx-auto">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-[#64748B] block">Result</span>
                </div>

              </div>
            </Card>

            {/* Eligibility Card */}
            <Card className="lg:col-span-4 p-6 space-y-3 bg-[#101726]">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#A3E635]">
                Eligibility Criteria
              </h3>
              <ul className="text-xs space-y-2 text-[#94A3B8]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635]" />
                  Minimum 7.5 CGPA cut-off
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635]" />
                  Branches: CS, IT, ECE
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635]" />
                  No active backlogs allowed
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635]" />
                  Batch of 2025
                </li>
              </ul>
            </Card>

          </div>

          {/* STUDENTS AND ROUNDS PROGRESSION TABLE strictly matching design */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-white">Students and Rounds Progression</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Round-1 Status</TableHead>
                  <TableHead>Round-2 Status</TableHead>
                  <TableHead>HR Round Status</TableHead>
                  <TableHead>Final Offer Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-bold text-white">Rahul Sharma</TableCell>
                  <TableCell className="font-mono text-[#94A3B8]">RS2020CS</TableCell>
                  <TableCell><Badge variant="warning">Selected: Pending</Badge></TableCell>
                  <TableCell><Badge variant="active">Selected</Badge></TableCell>
                  <TableCell><span className="text-xs text-[#64748B]">Not Scheduled</span></TableCell>
                  <TableCell><Badge variant="active">Selected (Amazon)</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-bold text-white">Ervara Mahiral</TableCell>
                  <TableCell className="font-mono text-[#94A3B8]">201300303</TableCell>
                  <TableCell><Badge variant="warning">Selected: Pending</Badge></TableCell>
                  <TableCell><Badge variant="active">Selected</Badge></TableCell>
                  <TableCell><Badge variant="active">Offers</Badge></TableCell>
                  <TableCell><Badge variant="alert">Rejected</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-bold text-white">Jamel Mahiral</TableCell>
                  <TableCell className="font-mono text-[#94A3B8]">201300948</TableCell>
                  <TableCell><Badge variant="active">Selected</Badge></TableCell>
                  <TableCell><Badge variant="active">Selected</Badge></TableCell>
                  <TableCell><span className="text-xs text-[#64748B]">Not Scheduled</span></TableCell>
                  <TableCell><Badge variant="neutral">Pending</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          {/* INTERVIEW SCHEDULE & ROUND ANALYTICS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Interview Schedule Card */}
            <Card className="lg:col-span-8 p-6 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                Scheduled Interviews Card
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Round</TableHead>
                    <TableHead>Interviewer</TableHead>
                    <TableHead className="text-right">Join Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-xs text-white">Oct 23, 2025 (09:00 GST)</TableCell>
                    <TableCell className="font-bold text-white">Priya Patel</TableCell>
                    <TableCell className="text-xs text-[#A3E635]">HR Round 1</TableCell>
                    <TableCell className="text-xs text-[#94A3B8]">Sarah Jenkins</TableCell>
                    <TableCell className="text-right">
                      <a
                        href="#join"
                        onClick={(e) => {
                          e.preventDefault();
                          info('Joining Interview', 'Launching Google Meet video call...');
                        }}
                        className="text-xs font-bold text-sky-400 hover:underline flex items-center justify-end gap-1"
                      >
                        <Video className="w-3.5 h-3.5" /> Join Link
                      </a>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>

            {/* Progression Analytics Charts */}
            <Card className="lg:col-span-4 p-6 space-y-4 bg-[#101726]">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#A3E635]">
                Round Wise Progression Analytics
              </h3>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roundProgressionData}>
                    <Bar dataKey="count" fill="#A3E635" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between gap-2 pt-2 border-t border-[#202D42]">
                <Button variant="secondary" size="sm" fullWidth onClick={() => info('Export Data', 'Exported Drive_Summary.xlsx')}>
                  Export Data
                </Button>
                <Button variant="primary" size="sm" fullWidth onClick={() => success('Drive Published', 'Final results published to portal.')}>
                  Publish Final Result
                </Button>
              </div>
            </Card>

          </div>

        </motion.div>
      )}

      {/* CREATE NEW DRIVE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Publish New Placement Drive"
        subtitle="Schedule a recruitment drive for campus candidates."
      >
        <form onSubmit={handleCreateDrive} className="space-y-4">
          <Input
            label="Company Name"
            placeholder="e.g. Amazon / Google"
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            required
          />
          <Input
            label="Role Title"
            placeholder="Software Engineer I"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            required
          />
          <Input
            label="Offered CTC"
            placeholder="₹25 LPA"
            value={newCtc}
            onChange={(e) => setNewCtc(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Publish Drive
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
