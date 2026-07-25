import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Filter,
  CheckCircle2,
  XCircle,
  Sparkles,
  Building2,
  GraduationCap,
  Users,
  Send,
  Download,
  FileText,
  Search,
  RefreshCw,
  Check
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Dropdown, MultiSelect } from '../components/ui/Dropdown';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { Avatar } from '../components/ui/Avatar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';

// Student Model for Eligibility Result
export interface EligibleStudentItem {
  id: string;
  photo: string;
  name: string;
  rollNo: string;
  branch: string;
  cgpa: number;
  backlogs: number;
  passingYear: number;
  skills: string[];
  invited: boolean;
}

const initialEligibleStudents: EligibleStudentItem[] = [
  {
    id: 'elg-1',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    name: 'Ervara Mahiral',
    rollNo: '10300530',
    branch: 'CS',
    cgpa: 9.0,
    backlogs: 1,
    passingYear: 2025,
    skills: ['Python', 'C++', 'SQL', 'Machine Learning'],
    invited: false,
  },
  {
    id: 'elg-2',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    name: 'Jamel Mahiral',
    rollNo: '10300551',
    branch: 'IT',
    cgpa: 8.0,
    backlogs: 0,
    passingYear: 2025,
    skills: ['Python', 'C++', 'SQL', 'Machine Learning'],
    invited: false,
  },
  {
    id: 'elg-3',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120',
    name: 'Seraphina Moon',
    rollNo: '10300562',
    branch: 'EE',
    cgpa: 7.0,
    backlogs: 1,
    passingYear: 2025,
    skills: ['EE Hardware', 'Matlab', 'Embedded C'],
    invited: false,
  },
  {
    id: 'elg-4',
    photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=120',
    name: 'Liam Hayes',
    rollNo: '10200334',
    branch: 'EE',
    cgpa: 7.1,
    backlogs: 0,
    passingYear: 2025,
    skills: ['Data Analysis', 'SQL', 'Tableau'],
    invited: false,
  },
  {
    id: 'elg-5',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    name: 'Aanya Patel',
    rollNo: '10300335',
    branch: 'CS',
    cgpa: 7.0,
    backlogs: 0,
    passingYear: 2025,
    skills: ['Data Analysis', 'SQL', 'Python'],
    invited: false,
  },
  {
    id: 'elg-6',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    name: 'Maria Garcia',
    rollNo: '10200337',
    branch: 'EE',
    cgpa: 6.5,
    backlogs: 0,
    passingYear: 2025,
    skills: ['Python', 'C++', 'SQL', 'Machine Learning'],
    invited: false,
  },
];

export const Eligibility: React.FC = () => {
  const { success, info } = useToast();
  const [selectedCompany, setSelectedCompany] = useState('Amazon');
  const [selectedBranches, setSelectedBranches] = useState<string[]>(['CS', 'IT']);
  const [minCgpa, setMinCgpa] = useState('7.0');
  const [maxBacklogs, setMaxBacklogs] = useState('1');
  const [passingYear, setPassingYear] = useState('2025');
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['Python', 'C++', 'SQL']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [students, setStudents] = useState<EligibleStudentItem[]>(initialEligibleStudents);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered Evaluation based on Criteria
  const filteredEligible = useMemo(() => {
    const cgpaThreshold = parseFloat(minCgpa) || 7.0;
    const backlogThreshold = parseInt(maxBacklogs, 10) || 1;

    return students.filter((student) => {
      const satisfiesCgpa = student.cgpa >= cgpaThreshold;
      const satisfiesBacklogs = student.backlogs <= backlogThreshold;
      const satisfiesBranch = selectedBranches.length === 0 || selectedBranches.includes(student.branch);

      return satisfiesCgpa && satisfiesBacklogs && satisfiesBranch;
    });
  }, [students, minCgpa, maxBacklogs, selectedBranches]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      success(
        'Eligibility Evaluated',
        `Generated ${filteredEligible.length} candidates matching criteria for ${selectedCompany}.`
      );
    }, 600);
  };

  const handleInviteStudent = (id: string, name: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, invited: true } : s))
    );
    success('Invitation Sent', `Sent drive invitation email to ${name}.`);
  };

  const handleBatchInvite = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, invited: true })));
    success(
      'Batch Invitations Dispatched',
      `Sent recruitment drive invitations to all ${filteredEligible.length} eligible candidates.`
    );
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Eligibility' }, { label: 'Checker' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-1">
            Eligibility Checker
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              Rule Evaluator
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Filter student pool against company CGPA cut-offs, backlogs, branch permissions, and skill tags.
          </p>
        </div>
      </div>

      {/* TOP CRITERIA FORM PANEL strictly matching Design Eligibility Checker..jpg */}
      <Card className="p-6 space-y-5 border-[#A3E635]/40 shadow-[0_0_25px_rgba(163,230,53,0.15)] relative overflow-hidden">
        
        {/* Row 1: Select Company & Select Branch */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6">
            <Dropdown
              label="Select Company"
              options={[
                { label: 'Google (SDE-I Drive)', value: 'Google' },
                { label: 'Amazon (SDE-I Drive)', value: 'Amazon' },
                { label: 'Microsoft (Product Manager)', value: 'Microsoft' },
                { label: 'Deloitte (Consulting)', value: 'Deloitte' },
              ]}
              value={selectedCompany}
              onChange={setSelectedCompany}
            />
          </div>

          <div className="lg:col-span-6">
            <MultiSelect
              label="Select Branch / Department"
              options={[
                { label: 'Computer Science (CS)', value: 'CS' },
                { label: 'Information Tech (IT)', value: 'IT' },
                { label: 'Electrical Eng (EE)', value: 'EE' },
                { label: 'Mechanical Eng (ME)', value: 'ME' },
                { label: 'Civil Eng (CE)', value: 'Civil' },
              ]}
              value={selectedBranches}
              onChange={setSelectedBranches}
            />
          </div>
        </div>

        {/* Row 2: Min. CGPA Required, Max. Backlogs Allowed, Passing Year */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Dropdown
            label="Min. CGPA Required"
            options={[
              { label: '6.0 CGPA', value: '6.0' },
              { label: '6.5 CGPA', value: '6.5' },
              { label: '7.0 CGPA', value: '7.0' },
              { label: '7.5 CGPA', value: '7.5' },
              { label: '8.0 CGPA', value: '8.0' },
              { label: '8.5 CGPA', value: '8.5' },
            ]}
            value={minCgpa}
            onChange={setMinCgpa}
          />

          <Dropdown
            label="Max. Backlogs Allowed"
            options={[
              { label: '0 (No Backlogs)', value: '0' },
              { label: '1 Backlog Allowed', value: '1' },
              { label: '2 Backlogs Allowed', value: '2' },
              { label: '3 Backlogs Allowed', value: '3' },
            ]}
            value={maxBacklogs}
            onChange={setMaxBacklogs}
          />

          <Dropdown
            label="Graduation Passing Year"
            options={[
              { label: '2024 Batch', value: '2024' },
              { label: '2025 Batch', value: '2025' },
              { label: '2026 Batch', value: '2026' },
            ]}
            value={passingYear}
            onChange={setPassingYear}
          />
        </div>

        {/* Row 3: Required Skills & Generate Action Button */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end pt-1">
          <div className="lg:col-span-8">
            <MultiSelect
              label="Required Skills Tags"
              options={[
                { label: 'Python', value: 'Python' },
                { label: 'C++', value: 'C++' },
                { label: 'SQL', value: 'SQL' },
                { label: 'Machine Learning', value: 'Machine Learning' },
                { label: 'React / Node', value: 'React' },
              ]}
              value={requiredSkills}
              onChange={setRequiredSkills}
            />
          </div>

          <div className="lg:col-span-4">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isGenerating}
              onClick={handleGenerate}
              className="font-extrabold text-sm shadow-[0_0_20px_rgba(163,230,53,0.4)]"
            >
              Generate Eligible Students
            </Button>
          </div>
        </div>

      </Card>

      {/* RESULT TABLE PANEL strictly matching Design Eligibility Checker..jpg */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#202D42] pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-extrabold text-white">Result Table</h2>
            <Badge variant="active" dot>
              {filteredEligible.length} Qualified Students Found
            </Badge>
          </div>
        </div>

        {/* Qualified Candidates Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Photo</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Roll No.</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>CGPA</TableHead>
              <TableHead>Backlogs</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEligible.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <Avatar src={student.photo} name={student.name} size="sm" />
                </TableCell>
                <TableCell className="font-extrabold text-white hover:text-[#A3E635] transition-colors">
                  {student.name}
                </TableCell>
                <TableCell className="font-mono text-xs text-[#94A3B8]">{student.rollNo}</TableCell>
                <TableCell className="font-bold text-white">{student.branch}</TableCell>
                <TableCell className="font-bold text-[#A3E635]">{student.cgpa.toFixed(2)}</TableCell>
                <TableCell className={`font-bold ${student.backlogs === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {student.backlogs}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {student.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="bg-[#101726] border border-[#202D42] text-[#A3E635] text-[10px] font-bold px-2 py-0.5 rounded-md"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {student.id === 'elg-1' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<FileText className="w-3.5 h-3.5 text-sky-400" />}
                      onClick={() => info('Resume View', `Viewing resume for ${student.name}`)}
                    >
                      View Resume
                    </Button>
                  ) : student.invited ? (
                    <Badge variant="success" icon={<Check className="w-3 h-3" />}>
                      Invited
                    </Badge>
                  ) : (
                    <Button
                      variant="tertiary"
                      size="sm"
                      leftIcon={<Send className="w-3.5 h-3.5 text-[#A3E635]" />}
                      onClick={() => handleInviteStudent(student.id, student.name)}
                    >
                      Invite to Drive
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Footer Bar & Batch Action Buttons strictly matching design */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#202D42]">
          <Pagination
            currentPage={currentPage}
            totalPages={42}
            onPageChange={setCurrentPage}
            totalEntries={250}
          />

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => success('List Exported', 'Saved Eligible_Students_Report.xlsx')}
            >
              Export Eligible Student List
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Send className="w-4 h-4" />}
              onClick={handleBatchInvite}
              className="px-6 font-extrabold shadow-[0_0_15px_rgba(163,230,53,0.3)]"
            >
              Batch Invite to Drive
            </Button>
          </div>
        </div>

      </Card>

    </div>
  );
};
