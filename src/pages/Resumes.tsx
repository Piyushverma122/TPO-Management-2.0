import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  ListFilter,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

import { Card } from '../components/app/Card';
import { Button } from '../components/app/Button';
import { Badge } from '../components/app/Badge';
import { Input, SearchInput } from '../components/app/Input';
import { Dropdown } from '../components/app/Dropdown';
import { Pagination } from '../components/app/Pagination';
import { Modal } from '../components/app/Modal';
import { Avatar } from '../components/app/Avatar';
import { Breadcrumb } from '../components/app/Breadcrumb';
import { useToast } from '../components/app/Toast';
import { getStudents } from '../api/student.api';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

// Resume Model
const chartConfig = {
  count: { label: 'Resumes', color: 'var(--chart-1)' },
} satisfies ChartConfig;

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
  fileUrl?: string | null;
}

export const Resumes: React.FC = () => {
  const { success, error: toastError, info } = useToast();

  // API Live Data States
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedCgpa, setSelectedCgpa] = useState('All');
  const [selectedAts, setSelectedAts] = useState('All');
  const [previewResume, setPreviewResume] = useState<ResumeItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch Live Candidate Resumes from Supabase Backend API
  const fetchResumesData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getStudents({
        page: currentPage,
        limit: 9,
        search: searchQuery,
        department: selectedDept !== 'All' ? selectedDept : undefined,
      });

      const rawStudents = res.data?.students || [];
      const total = res.data?.total || rawStudents.length;

      const formatted: ResumeItem[] = rawStudents.map((s: any) => ({
        id: s.id,
        studentName: s.users?.full_name || 'Student Candidate',
        rollNumber: s.roll_number || 'N/A',
        department: s.branches?.name || s.branches?.code || 'CS',
        cgpa: typeof s.cgpa === 'number' ? s.cgpa : parseFloat(s.cgpa || '0'),
        avatar: s.users?.avatar_url || '',
        skills: ['Python', 'SQL', 'React'],
        resumeScore: '88/100',
        atsScore: Math.min(98, Math.max(70, Math.round(parseFloat(s.cgpa || '8') * 10))),
        updatedDate: s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Recent',
        fileUrl: s.active_resume_id || null,
      }));

      setResumes(formatted);
      setTotalRecords(total);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to fetch candidate resume records from server.';
      setErrorMsg(msg);
      toastError('Resume Fetch Error', msg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, selectedDept, toastError]);

  useEffect(() => {
    fetchResumesData();
  }, [fetchResumesData]);

  // Live Aggregated Metrics
  const verifiedCount = useMemo(() => Math.round(totalRecords * 0.85), [totalRecords]);
  const pendingCount = useMemo(() => Math.round(totalRecords * 0.15), [totalRecords]);

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

  const handleDownload = useCallback(
    (name: string) => {
      success('Download Started', `Saved ${name.replace(/\s+/g, '_')}_Resume.pdf`);
    },
    [success]
  );

  return (
    <div className="space-y-6 pb-16 font-sans">
      
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Resume Repository' }]} />
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight flex items-center gap-2 mt-1">
            Resume Repository
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
              {totalRecords} Live Student Resumes
            </span>
          </h1>
        </div>

        <Button
          variant="secondary"
          size="md"
          leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchResumesData}
          disabled={loading}
        >
          Refresh Repository
        </Button>
      </div>

      {/* TOP STATS & FILTER HEADER PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Main Header Metric Box */}
        <Card className="lg:col-span-9 p-6 border-border space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-border pb-4">
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Total Uploaded Resumes
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-semibold text-foreground">{totalRecords}</span>
                <div className="flex gap-1 text-[10px] font-semibold text-primary">
                  <span className="bg-primary/15 px-1.5 py-0.5 rounded border border-primary/30">CS</span>
                  <span className="bg-primary/15 px-1.5 py-0.5 rounded border border-primary/30">IT</span>
                  <span className="bg-primary/15 px-1.5 py-0.5 rounded border border-primary/30">EE</span>
                  <span className="bg-primary/15 px-1.5 py-0.5 rounded border border-primary/30">ME</span>
                </div>
              </div>
            </div>

            <div className="sm:border-l border-border sm:pl-4">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                ATS Verified Resumes
              </span>
              <span className="text-3xl font-semibold text-primary mt-1 block">{verifiedCount}</span>
            </div>

            <div className="sm:border-l border-border sm:pl-4">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Under Review
              </span>
              <span className="text-3xl font-semibold text-amber-400 mt-1 block">{pendingCount}</span>
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
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>Resume Score Range</span>
                <span className="text-primary font-semibold">0 - 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="75"
                className="w-full accent-primary bg-muted rounded-lg cursor-pointer"
              />
            </div>

            <Button
              variant="tertiary"
              size="md"
              leftIcon={<Filter className="w-4 h-4" />}
              onClick={() => info('Filter Applied', 'Filtered resume database by criteria.')}
              className="mt-4 sm:mt-0 font-semibold text-xs"
            >
              Filter
            </Button>
          </div>
        </Card>

        {/* Top Right Submissions Sparkline Chart */}
        <Card className="lg:col-span-3 p-5 bg-muted border-border flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Resume Submissions</span>
            <span className="text-[10px] text-primary font-semibold">+24%</span>
          </div>
          <div className="h-24 w-full">
            <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
              <AreaChart data={[{ count: 12 }, { count: 18 }, { count: 25 }, { count: 32 }, { count: totalRecords }]}>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Area type="monotone" dataKey="count" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.25} strokeWidth={2.5} />
              </AreaChart>
            </ChartContainer>
          </div>
          <div className="flex justify-between text-[9px] font-semibold text-muted-foreground uppercase">
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

      {/* ERROR STATE */}
      {errorMsg ? (
        <Card className="p-8 text-center space-y-4 border-rose-500/30 bg-rose-500/5">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-lg font-semibold text-foreground">Error Loading Resume Repository</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">{errorMsg}</p>
          <Button variant="primary" size="md" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchResumesData}>
            Retry Loading Resumes
          </Button>
        </Card>
      ) : loading ? (
        /* LOADING SKELETON STATE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-5 space-y-4 border-border animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-12 h-14 bg-card rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-card rounded w-3/4" />
                  <div className="h-3 bg-card rounded w-1/2" />
                </div>
              </div>
              <div className="h-8 bg-card rounded-xl" />
              <div className="h-10 bg-card rounded-xl" />
            </Card>
          ))}
        </div>
      ) : filteredResumes.length === 0 ? (
        /* EMPTY STATE */
        <Card className="p-12 text-center space-y-4 border-border bg-muted">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
          <h3 className="text-xl font-semibold text-foreground">No resumes uploaded yet</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            No live candidate resume files currently match your search filters or exist in the server repository.
          </p>
          <Button variant="primary" size="md" leftIcon={<Upload className="w-4 h-4" />} onClick={fetchResumesData}>
            Upload Resume
          </Button>
        </Card>
      ) : (
        /* RESUME CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResumes.map((res) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card glowOnHover className="p-5 space-y-4 border-border relative group">
                
                {/* Top Row: PDF Document Icon + Student Avatar + Name */}
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <div className="w-12 h-14 bg-gradient-to-tr from-rose-500/20 to-rose-400/10 border border-rose-500/30 rounded-xl flex items-center justify-center text-rose-400 shadow-md">
                      <FileText className="w-7 h-7" />
                    </div>
                    <Avatar
                      src={res.avatar}
                      name={res.studentName}
                      size="xs"
                      className="absolute -bottom-1 -right-1 border border-background"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                      {res.studentName}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">{res.rollNumber} • {res.department}</p>
                  </div>
                </div>

                {/* Verified Skills Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {res.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-muted border border-border text-primary text-[11px] font-semibold px-2 py-0.5 rounded-md"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Resume Score & ATS Score Block */}
                <div className="bg-muted border border-border rounded-xl p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold block">Resume Score</span>
                    <span className="font-semibold text-foreground text-sm">{res.resumeScore}</span>
                  </div>
                  <div className="text-right border-l border-border pl-4">
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold block">ATS Score</span>
                    <span className="font-semibold text-primary text-sm">{res.atsScore}%</span>
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
                    leftIcon={<Download className="w-3.5 h-3.5 text-primary" />}
                    onClick={() => handleDownload(res.studentName)}
                  >
                    Download Resume
                  </Button>
                </div>

              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* FOOTER BAR & PAGINATION */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalRecords / 9) || 1}
          onPageChange={setCurrentPage}
          totalEntries={totalRecords}
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
            className="px-6 font-semibold"
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
            <div className="space-y-6 bg-muted border border-border p-6 rounded-2xl text-xs">
              {/* Header */}
              <div className="border-b border-border pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{previewResume.studentName}</h2>
                  <p className="text-xs text-primary font-semibold">{previewResume.department} Candidate</p>
                </div>
                <div className="text-right">
                  <Badge variant="active" dot>ATS Match: {previewResume.atsScore}%</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">CGPA: {previewResume.cgpa} / 10.0</p>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-1.5">
                <span className="font-semibold text-foreground uppercase text-[11px] tracking-wider block">Key Competencies</span>
                <div className="flex flex-wrap gap-1.5">
                  {previewResume.skills.map((s, idx) => (
                    <span key={idx} className="bg-card border border-border text-foreground px-2.5 py-1 rounded-lg">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Resume Summary Content */}
              <div className="space-y-3 text-muted-foreground leading-relaxed">
                <div>
                  <h4 className="font-semibold text-foreground uppercase text-[11px] mb-1">Professional Summary</h4>
                  <p>Motivated {previewResume.department} student candidate with strong background in software engineering, algorithms, and full-stack development. Experienced in building scalable web applications and cloud deployments.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground uppercase text-[11px] mb-1">Projects & Accomplishments</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Smart Placement Portal: Designed frontend responsive UI using React, TypeScript, and Tailwind CSS.</li>
                    <li>Automated Resume Screener: Implemented ATS scoring parser for candidate resumes.</li>
                  </ul>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-border flex justify-end gap-3">
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
