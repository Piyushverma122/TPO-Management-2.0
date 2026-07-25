import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck,
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Award,
  GraduationCap,
  Briefcase,
  Share2,
  ListFilter
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';

// Submissions Graph Sparkline Data
const submissionSparklineData = [
  { day: 'Oct 12', count: 4 },
  { day: 'Oct 20', count: 14 },
  { day: 'Oct 28', count: 6 },
  { day: 'Nov 04', count: 10 },
];

// Resume Card Model
export interface ResumeItem {
  id: string;
  studentName: string;
  rollNumber: string;
  department: string;
  cgpa: number;
  avatar: string;
  skills: string[];
  resumeScore: string;
  atsScore: number;
  updatedDate: string;
}

// Initial Resume Repository Items matching Design Resume Repository..jpg
const initialResumes: ResumeItem[] = [
  {
    id: 'res-1',
    studentName: 'Rahul Sharma',
    rollNumber: 'RS2020CS',
    department: 'Computer Science',
    cgpa: 8.9,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    skills: ['Python', 'Java', 'Data Structures'],
    resumeScore: '9.2/10',
    atsScore: 92,
    updatedDate: '2 hours ago',
  },
  {
    id: 'res-2',
    studentName: 'Jamel Mahiral',
    rollNumber: 'JM2021CS',
    department: 'Computer Science',
    cgpa: 8.4,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    skills: ['Data Analysis', 'SQL', 'Tableau'],
    resumeScore: '8.4/10',
    atsScore: 89,
    updatedDate: '5 hours ago',
  },
  {
    id: 'res-3',
    studentName: 'Kaelen Vance',
    rollNumber: 'KV2020CS',
    department: 'Computer Science',
    cgpa: 9.1,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    skills: ['Full Stack', 'React', 'Node.js'],
    resumeScore: '9.4/10',
    atsScore: 94,
    updatedDate: 'Yesterday',
  },
  {
    id: 'res-4',
    studentName: 'Seraphina Moon',
    rollNumber: 'SM2021EE',
    department: 'Electronics',
    cgpa: 7.8,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120',
    skills: ['Hardware', 'Embedded C', 'ARM'],
    resumeScore: '8.0/10',
    atsScore: 85,
    updatedDate: 'Oct 22, 2025',
  },
  {
    id: 'res-5',
    studentName: 'Liam Hayes',
    rollNumber: 'LH2020ME',
    department: 'Mechanical',
    cgpa: 7.2,
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=120',
    skills: ['SolidWorks', 'Operations', 'AutoCAD'],
    resumeScore: '7.5/10',
    atsScore: 79,
    updatedDate: 'Oct 20, 2025',
  },
  {
    id: 'res-6',
    studentName: 'Chen Wei',
    rollNumber: 'CW2021IT',
    department: 'Information Tech',
    cgpa: 8.6,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
    skills: ['Data Analysis', 'SQL', 'Python'],
    resumeScore: '8.8/10',
    atsScore: 91,
    updatedDate: 'Oct 19, 2025',
  },
  {
    id: 'res-7',
    studentName: 'Aanya Patel',
    rollNumber: 'AP2020CS',
    department: 'Computer Science',
    cgpa: 9.3,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    skills: ['Python', 'Java', 'Machine Learning'],
    resumeScore: '9.6/10',
    atsScore: 96,
    updatedDate: 'Oct 18, 2025',
  },
  {
    id: 'res-8',
    studentName: 'Ben Carter',
    rollNumber: 'BC2021CS',
    department: 'Computer Science',
    cgpa: 8.1,
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=120',
    skills: ['Full Stack', 'React', 'MongoDB'],
    resumeScore: '8.2/10',
    atsScore: 87,
    updatedDate: 'Oct 15, 2025',
  },
  {
    id: 'res-9',
    studentName: 'Maria Garcia',
    rollNumber: 'MG2020IT',
    department: 'Information Tech',
    cgpa: 8.7,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    skills: ['AWS', 'Docker', 'Kubernetes'],
    resumeScore: '9.0/10',
    atsScore: 93,
    updatedDate: 'Oct 12, 2025',
  },
];

export const Resumes: React.FC = () => {
  const { success, info } = useToast();
  const [resumes, setResumes] = useState<ResumeItem[]>(initialResumes);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedCgpa, setSelectedCgpa] = useState('All');
  const [selectedAts, setSelectedAts] = useState('All');
  const [previewResume, setPreviewResume] = useState<ResumeItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered Calculation
  const filteredResumes = useMemo(() => {
    return resumes.filter((r) => {
      const matchesSearch =
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDept = selectedDept === 'All' || r.department === selectedDept;
      const matchesCgpa =
        selectedCgpa === 'All' ||
        (selectedCgpa === '8.5+' && r.cgpa >= 8.5) ||
        (selectedCgpa === '7.5-8.5' && r.cgpa >= 7.5 && r.cgpa < 8.5);

      const matchesAts =
        selectedAts === 'All' ||
        (selectedAts === '90+' && r.atsScore >= 90) ||
        (selectedAts === '80+' && r.atsScore >= 80);

      return matchesSearch && matchesDept && matchesCgpa && matchesAts;
    });
  }, [resumes, searchQuery, selectedDept, selectedCgpa, selectedAts]);

  const handleDownload = (name: string) => {
    success('Download Started', `Saved ${name.replace(/\s+/g, '_')}_Resume.pdf`);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Resume Repository' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-1">
            Resume Repository
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              2,500+ Verified CVs
            </span>
          </h1>
        </div>
      </div>

      {/* TOP STATS & FILTER HEADER PANEL strictly matching Design Resume Repository..jpg */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Main Header Metric Box */}
        <Card className="lg:col-span-9 p-6 bg-gradient-to-r from-[#162032] via-[#101726] to-[#162032] border-[#202D42] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-[#202D42] pb-4">
            <div>
              <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                Filter by Department/Branch
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-white">2500+</span>
                <div className="flex gap-1 text-[10px] font-bold text-[#A3E635]">
                  <span className="bg-[#A3E635]/15 px-1.5 py-0.5 rounded border border-[#A3E635]/30">CS</span>
                  <span className="bg-[#A3E635]/15 px-1.5 py-0.5 rounded border border-[#A3E635]/30">IT</span>
                  <span className="bg-[#A3E635]/15 px-1.5 py-0.5 rounded border border-[#A3E635]/30">EE</span>
                  <span className="bg-[#A3E635]/15 px-1.5 py-0.5 rounded border border-[#A3E635]/30">ME</span>
                </div>
              </div>
            </div>

            <div className="sm:border-l border-[#202D42] sm:pl-4">
              <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                ATS Optimized
              </span>
              <span className="text-3xl font-extrabold text-[#A3E635] mt-1 block">1800+</span>
            </div>

            <div className="sm:border-l border-[#202D42] sm:pl-4">
              <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                Under Review
              </span>
              <span className="text-3xl font-extrabold text-amber-400 mt-1 block">112</span>
            </div>
          </div>

          {/* Inline Filter Controls Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <Dropdown
              label="Filter by Skills"
              options={[
                { label: 'All Skills', value: 'All' },
                { label: 'Python / ML', value: 'Python' },
                { label: 'Java / Spring', value: 'Java' },
                { label: 'Full Stack / React', value: 'React' },
                { label: 'Data Analysis / SQL', value: 'SQL' },
              ]}
              value="All"
              onChange={() => {}}
            />

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-[#94A3B8]">
                <span>Resume Score Range</span>
                <span className="text-[#A3E635] font-extrabold">0 - 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="75"
                className="w-full accent-[#A3E635] bg-[#101726] rounded-lg cursor-pointer"
              />
            </div>

            <Button
              variant="tertiary"
              size="md"
              leftIcon={<Filter className="w-4 h-4" />}
              onClick={() => info('Filter Applied', 'Filtered resume database by criteria.')}
              className="mt-4 sm:mt-0 font-bold text-xs"
            >
              Filter
            </Button>
          </div>
        </Card>

        {/* Top Right Submissions Sparkline Chart */}
        <Card className="lg:col-span-3 p-5 bg-[#101726] border-[#202D42] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-white">Resume Submissions</span>
            <span className="text-[10px] text-[#A3E635] font-bold">+24%</span>
          </div>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={submissionSparklineData}>
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

      {/* SEARCH BAR & FILTER DROPDOWNS BAR */}
      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          <div className="lg:col-span-2">
            <SearchInput
              placeholder="Search Resumes by student name, roll number, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Dropdown
            label="Department Filter:"
            options={[
              { label: 'All Departments', value: 'All' },
              { label: 'Computer Science', value: 'Computer Science' },
              { label: 'Electronics', value: 'Electronics' },
              { label: 'Mechanical', value: 'Mechanical' },
              { label: 'Information Tech', value: 'Information Tech' },
            ]}
            value={selectedDept}
            onChange={setSelectedDept}
          />

          <Dropdown
            label="CGPA Cut-off:"
            options={[
              { label: 'All CGPA', value: 'All' },
              { label: '>= 8.5 CGPA', value: '8.5+' },
              { label: '7.5 - 8.5 CGPA', value: '7.5-8.5' },
            ]}
            value={selectedCgpa}
            onChange={setSelectedCgpa}
          />
        </div>
      </Card>

      {/* RESUME CARDS GRID strictly matching Design Resume Repository..jpg */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResumes.map((res) => (
          <motion.div
            key={res.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card glowOnHover className="p-5 space-y-4 border-[#202D42] relative group">
              
              {/* Top Row: PDF Document Icon + Student Avatar + Name */}
              <div className="flex items-start gap-3">
                
                {/* PDF Graphic Icon Box with Avatar Overlay */}
                <div className="relative shrink-0">
                  <div className="w-12 h-14 bg-gradient-to-tr from-rose-500/20 to-rose-400/10 border border-rose-500/30 rounded-xl flex items-center justify-center text-rose-400 shadow-md">
                    <FileText className="w-7 h-7" />
                  </div>
                  <Avatar
                    src={res.avatar}
                    name={res.studentName}
                    size="xs"
                    className="absolute -bottom-1 -right-1 border border-[#0B0F17]"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-extrabold text-white truncate leading-tight group-hover:text-[#A3E635] transition-colors">
                    {res.studentName}
                  </h3>
                  <p className="text-xs text-[#94A3B8] font-mono">{res.rollNumber} • {res.department}</p>
                </div>
              </div>

              {/* Verified Skills Tags */}
              <div className="flex flex-wrap gap-1.5">
                {res.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-[#101726] border border-[#202D42] text-[#A3E635] text-[11px] font-bold px-2 py-0.5 rounded-md"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Resume Score & ATS Score Block matching design */}
              <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#94A3B8] text-[10px] uppercase font-bold block">Resume Score</span>
                  <span className="font-extrabold text-white text-sm">{res.resumeScore}</span>
                </div>
                <div className="text-right border-l border-[#202D42] pl-4">
                  <span className="text-[#94A3B8] text-[10px] uppercase font-bold block">ATS Score</span>
                  <span className="font-extrabold text-[#A3E635] text-sm">{res.atsScore}%</span>
                </div>
              </div>

              {/* Action Buttons Bar: View Resume & Download Resume */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  leftIcon={<Eye className="w-3.5 h-3.5 text-sky-400" />}
                  onClick={() => setPreviewResume(res)}
                >
                  View Resume
                </Button>
                <Button
                  variant="tertiary"
                  size="sm"
                  fullWidth
                  leftIcon={<Download className="w-3.5 h-3.5 text-[#A3E635]" />}
                  onClick={() => handleDownload(res.studentName)}
                >
                  Download Resume
                </Button>
              </div>

            </Card>
          </motion.div>
        ))}
      </div>

      {/* FOOTER BAR & PAGINATION strictly matching design */}
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
            onClick={() => info('Export Batch', 'Exporting selected candidate resumes...')}
          >
            Export Selected Resumes
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => success('Decisions Finalized', 'All candidate shortlists published to placement office.')}
            className="px-6 font-extrabold"
          >
            Finalize All Decisions
          </Button>
        </div>
      </div>

      {/* PDF RESUME PREVIEW MODAL */}
      <AnimatePresence>
        {previewResume && (
          <Modal
            isOpen={!!previewResume}
            onClose={() => setPreviewResume(null)}
            title={`Resume Preview: ${previewResume.studentName}`}
            subtitle={`${previewResume.rollNumber} • ${previewResume.department}`}
            maxWidth="xl"
          >
            <div className="space-y-6 bg-[#101726] border border-[#202D42] p-6 rounded-2xl text-xs">
              {/* Header */}
              <div className="border-b border-[#202D42] pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-white">{previewResume.studentName}</h2>
                  <p className="text-xs text-[#A3E635] font-semibold">{previewResume.department} Candidate</p>
                </div>
                <div className="text-right">
                  <Badge variant="active" dot>ATS Match: {previewResume.atsScore}%</Badge>
                  <p className="text-[10px] text-[#64748B] mt-1">CGPA: {previewResume.cgpa} / 10.0</p>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-1.5">
                <span className="font-extrabold text-white uppercase text-[11px] tracking-wider block">Key Competencies</span>
                <div className="flex flex-wrap gap-1.5">
                  {previewResume.skills.map((s, idx) => (
                    <span key={idx} className="bg-[#162032] border border-[#202D42] text-white px-2.5 py-1 rounded-lg">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mock Resume Summary Content */}
              <div className="space-y-3 text-[#94A3B8] leading-relaxed">
                <div>
                  <h4 className="font-bold text-white uppercase text-[11px] mb-1">Professional Summary</h4>
                  <p>Motivated {previewResume.department} student with strong background in software engineering, algorithms, and full-stack development. Experienced in building scalable web applications and cloud deployments.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-[11px] mb-1">Projects & Accomplishments</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Smart Placement Portal: Designed frontend responsive UI using React, TypeScript, and Tailwind CSS.</li>
                    <li>Automated Resume Screener: Implemented ATS scoring parser for candidate resumes.</li>
                  </ul>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#202D42] flex justify-end gap-3">
                <Button variant="secondary" size="md" onClick={() => setPreviewResume(null)}>
                  Close Preview
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => {
                    handleDownload(previewResume.studentName);
                    setPreviewResume(null);
                  }}
                >
                  Download PDF Resume
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

    </div>
  );
};
