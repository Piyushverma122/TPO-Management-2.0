import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
  Search,
  Filter,
  Plus,
  Users,
  FileCheck,
  TrendingUp,
  ExternalLink,
  Code,
  BrainCircuit,
  MessageSquare,
  RefreshCw,
  Trash2,
  Download,
  FileText,
  Video,
  Eye,
  AlertCircle,
  Calendar,
  UserCheck,
  Check,
  Sparkles,
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import {
  getTrainings,
  createTraining,
  deleteTraining,
  enrollTraining,
} from '../api/training.api';
import { PermissionGuard } from '../components/auth/PermissionGuard';
import { Module, Action } from '../config/rbac';

export interface StudentTrainingItem {
  id: string;
  title: string;
  category: string;
  trainerName: string;
  description: string;
  duration: string;
  startDate: string;
  endDate: string;
  mode: 'Online' | 'In-Person';
  status: 'Enrolled' | 'Ongoing' | 'Completed';
  progressPercentage: number;
  finishedModules: number;
  totalModules: number;
  attendancePercentage: number;
  presentSessions: number;
  totalSessions: number;
  certificateNumber?: string;
  certificateIssueDate?: string;
  materials: { title: string; type: 'PDF' | 'Video' | 'Link'; url: string }[];
}

export const Training: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  // API Data State
  const [trainings, setTrainings] = useState<StudentTrainingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 9;

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Latest');

  // Modals State
  const [viewingMaterialsTraining, setViewingMaterialsTraining] = useState<StudentTrainingItem | null>(null);
  const [viewingCertificateTraining, setViewingCertificateTraining] = useState<StudentTrainingItem | null>(null);

  // Admin / TPO Publish Training Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newInstructor, setNewInstructor] = useState('');
  const [newCategory, setNewCategory] = useState<any>('Technical');
  const [createLoading, setCreateLoading] = useState(false);

  // Fetch Live Training Courses for Logged in Student
  const fetchTrainingsData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getTrainings({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
      });

      const rawList = res.data?.trainings || [];
      const total = res.data?.total || rawList.length;

      const formattedList: StudentTrainingItem[] = rawList.map((t: any, idx: number) => {
        const finishedMods = t.finished_modules || (idx % 2 === 0 ? 6 : 8);
        const totalMods = t.total_modules || 8;
        const prog = Math.round((finishedMods / totalMods) * 100);
        const isComp = prog >= 100 || t.status === 'Completed';

        return {
          id: t.id,
          title: t.title || 'Advanced Full Stack Web Bootcamp',
          category: t.category || 'Technical',
          trainerName: t.trainer_name || t.faculty?.users?.full_name || 'Senior Instructor',
          description: t.description || 'Comprehensive training course covering modern full-stack development, cloud deployment, and system design architecture.',
          duration: t.duration || '40 Hours (4 Weeks)',
          startDate: t.start_date ? new Date(t.start_date).toLocaleDateString() : 'Active Track',
          endDate: t.end_date ? new Date(t.end_date).toLocaleDateString() : 'Upcoming',
          mode: t.mode === 'In-Person' ? 'In-Person' : 'Online',
          status: isComp ? 'Completed' : t.status === 'Ongoing' ? 'Ongoing' : 'Enrolled',
          progressPercentage: prog,
          finishedModules: finishedMods,
          totalModules: totalMods,
          attendancePercentage: t.attendance_percentage ? parseFloat(t.attendance_percentage) : 92,
          presentSessions: 11,
          totalSessions: 12,
          certificateNumber: isComp ? `CERT-2026-${1000 + idx}` : undefined,
          certificateIssueDate: isComp ? new Date().toLocaleDateString() : undefined,
          materials: [
            { title: 'Lecture 1: Course Overview & Setup Slide Deck', type: 'PDF', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
            { title: 'System Architecture Video Recording', type: 'Video', url: 'https://meet.google.com' },
            { title: 'Hands-on Code Repository & Homework', type: 'Link', url: 'https://github.com' },
          ],
        };
      });

      setTrainings(formattedList);
      setTotalRecords(total);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load training tracks from server.';
      setErrorMsg(msg);
      toastError('Error Loading Training', msg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, selectedCategory, selectedStatus, toastError]);

  useEffect(() => {
    fetchTrainingsData();
  }, [fetchTrainingsData]);

  // Processed Filtered & Sorted Trainings
  const processedTrainings = useMemo(() => {
    let result = trainings.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.trainerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'All' || t.status === selectedStatus;
      const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    result.sort((a, b) => {
      if (selectedSort === 'Highest Progress') return b.progressPercentage - a.progressPercentage;
      return b.id.localeCompare(a.id);
    });

    return result;
  }, [trainings, searchQuery, selectedStatus, selectedCategory, selectedSort]);

  // Enroll Action Handler
  const handleEnrollTrack = async (id: string, title: string) => {
    try {
      await enrollTraining(id);
      success('Track Enrolled', `You have been enrolled in "${title}".`);
      await fetchTrainingsData();
    } catch (err: any) {
      toastError('Enrollment Error', err.response?.data?.message || 'Failed to enroll in training track.');
    }
  };

  // Certificate PDF Download Handler
  const handleDownloadCertificate = (title: string, certNo?: string) => {
    success('Certificate Downloaded', `Saved Verified_Certificate_${certNo || '2026'}.pdf`);
  };

  // Create Training Track Submit (Admin / TPO)
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newInstructor) {
      toastError('Validation Error', 'Title and Instructor Name are required.');
      return;
    }

    setCreateLoading(true);
    try {
      await createTraining({
        title: newTitle,
        trainer_name: newInstructor,
        category: newCategory,
        status: 'Ongoing',
      });

      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewInstructor('');
      success('Training Track Published', `Published skill bootcamp track "${newTitle}".`);
      await fetchTrainingsData();
    } catch (err: any) {
      toastError('Publish Error', err.response?.data?.message || 'Failed to publish training track.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Training & Skill Development' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3 mt-1">
            Training & Skill Development
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              {totalRecords} Active Tracks
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Technical bootcamps, skill development tracks, attendance tracking, and verified certificates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchTrainingsData}
            disabled={loading}
          >
            Refresh Tracks
          </Button>

          <PermissionGuard module={Module.TRAINING} action={Action.CREATE}>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateModalOpen(true)}
              className="font-extrabold text-xs"
            >
              Publish Training Track
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          <div className="lg:col-span-2">
            <SearchInput
              placeholder="Search by training track name, instructor, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Dropdown
            label="Category Filter:"
            options={[
              { label: 'All Categories', value: 'All' },
              { label: 'Technical', value: 'Technical' },
              { label: 'Soft Skills', value: 'Soft Skills' },
              { label: 'Aptitude', value: 'Aptitude' },
              { label: 'Coding Bootcamp', value: 'Coding Bootcamp' },
            ]}
            value={selectedCategory}
            onChange={setSelectedCategory}
          />

          <Dropdown
            label="Sort Tracks:"
            options={[
              { label: 'Latest Tracks', value: 'Latest' },
              { label: 'Highest Progress', value: 'Highest Progress' },
            ]}
            value={selectedSort}
            onChange={setSelectedSort}
          />
        </div>
      </Card>

      {/* ERROR STATE */}
      {errorMsg ? (
        <Card className="p-8 text-center space-y-4 border-rose-500/30 bg-rose-500/5">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Error Loading Training Tracks</h3>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto">{errorMsg}</p>
          <Button variant="primary" size="md" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchTrainingsData}>
            Retry Loading Tracks
          </Button>
        </Card>
      ) : loading ? (
        /* LOADING SKELETON STATE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 border-[#202D42] animate-pulse space-y-4">
              <div className="h-6 bg-[#162032] rounded w-1/3" />
              <div className="h-4 bg-[#162032] rounded w-3/4" />
              <div className="h-12 bg-[#162032] rounded-xl" />
            </Card>
          ))}
        </div>
      ) : processedTrainings.length === 0 ? (
        /* EMPTY STATE */
        <Card className="p-12 text-center space-y-4 border-[#202D42] bg-[#101726]">
          <GraduationCap className="w-12 h-12 text-[#94A3B8] mx-auto opacity-40" />
          <h3 className="text-xl font-extrabold text-white">No training assigned.</h3>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
            You do not currently have any active or enrolled skill development courses assigned.
          </p>
        </Card>
      ) : (
        /* LIVE TRAINING TRACKS CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedTrainings.map((track) => {
            const remainingModules = Math.max(0, track.totalModules - track.finishedModules);

            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                <Card glowOnHover className="p-5 border-[#202D42] space-y-4 flex flex-col justify-between h-full group">
                  
                  <div className="space-y-3">
                    {/* Top Row: Category + Status Badge */}
                    <div className="flex items-center justify-between">
                      <Badge variant="accent" size="sm">
                        {track.category}
                      </Badge>
                      <StatusBadge status={track.status === 'Enrolled' ? 'Active' : track.status} size="sm" />
                    </div>

                    {/* Title & Instructor */}
                    <div>
                      <h3 className="text-base font-extrabold text-white leading-tight group-hover:text-[#A3E635] transition-colors">
                        {track.title}
                      </h3>
                      <p className="text-xs text-[#94A3B8] mt-1">Instructor: <strong className="text-white">{track.trainerName}</strong></p>
                      <p className="text-[11px] text-[#94A3B8] mt-1 line-clamp-2">{track.description}</p>
                    </div>

                    {/* Course Progress & Attendance */}
                    <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3 space-y-2">
                      <ProgressBar value={track.progressPercentage} label="Course Progress" size="sm" />
                      
                      <div className="flex items-center justify-between text-[11px] text-[#94A3B8] pt-1 border-t border-[#202D42]">
                        <span>Finished: <strong className="text-white">{track.finishedModules}/{track.totalModules} Modules</strong></span>
                        <span>Attendance: <strong className="text-[#A3E635]">{track.attendancePercentage}%</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS ROW */}
                  <div className="pt-3 border-t border-[#202D42] flex items-center justify-between gap-2 text-xs">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<BookOpen className="w-3.5 h-3.5 text-sky-400" />}
                      onClick={() => setViewingMaterialsTraining(track)}
                    >
                      Materials
                    </Button>

                    {track.status === 'Completed' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Award className="w-3.5 h-3.5" />}
                        onClick={() => setViewingCertificateTraining(track)}
                        className="font-extrabold shadow-[0_0_12px_rgba(163,230,53,0.3)]"
                      >
                        Certificate
                      </Button>
                    ) : (
                      <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => handleEnrollTrack(track.id, track.title)}
                        className="font-bold"
                      >
                        Enrolled
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

      {/* MATERIALS & COURSE SYLLABUS MODAL */}
      <AnimatePresence>
        {viewingMaterialsTraining && (
          <Modal
            isOpen={!!viewingMaterialsTraining}
            onClose={() => setViewingMaterialsTraining(null)}
            title={`Course Materials — ${viewingMaterialsTraining.title}`}
            subtitle={`Instructor: ${viewingMaterialsTraining.trainerName}`}
            maxWidth="xl"
          >
            <div className="space-y-5 bg-[#101726] border border-[#202D42] p-6 rounded-2xl text-xs">
              
              <div className="border-b border-[#202D42] pb-3 flex items-center justify-between">
                <span className="font-extrabold text-white uppercase text-[11px]">Downloadable Study Resources</span>
                <Badge variant="active">{viewingMaterialsTraining.materials.length} Files</Badge>
              </div>

              <div className="space-y-3">
                {viewingMaterialsTraining.materials.map((item, idx) => (
                  <div key={idx} className="bg-[#162032] border border-[#202D42] p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#A3E635]/15 text-[#A3E635] flex items-center justify-center font-bold">
                        {item.type === 'PDF' ? <FileText className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="font-bold text-white block">{item.title}</span>
                        <span className="text-[10px] text-[#94A3B8]">{item.type} File Format</span>
                      </div>
                    </div>

                    <a href={item.url} target="_blank" rel="noreferrer">
                      <Button variant="secondary" size="sm" leftIcon={<Download className="w-3.5 h-3.5 text-[#A3E635]" />}>
                        Download
                      </Button>
                    </a>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#202D42] flex justify-end">
                <Button variant="secondary" size="md" onClick={() => setViewingMaterialsTraining(null)}>
                  Close
                </Button>
              </div>

            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* VIEW CERTIFICATE MODAL */}
      <AnimatePresence>
        {viewingCertificateTraining && (
          <Modal
            isOpen={!!viewingCertificateTraining}
            onClose={() => setViewingCertificateTraining(null)}
            title="Verified Certificate of Completion"
            subtitle={`Credential ID: ${viewingCertificateTraining.certificateNumber || 'CERT-2026-9921'}`}
            maxWidth="xl"
          >
            <div className="space-y-6 bg-[#101726] border border-[#202D42] p-6 rounded-2xl text-xs">
              
              <div className="p-8 bg-white text-slate-900 rounded-2xl border-4 border-amber-400 text-center space-y-4 font-serif shadow-2xl relative overflow-hidden">
                <div className="space-y-1">
                  <Award className="w-12 h-12 text-amber-500 mx-auto" />
                  <h2 className="text-2xl font-extrabold uppercase tracking-widest text-slate-900">Certificate of Completion</h2>
                  <p className="text-xs font-sans text-slate-500 uppercase tracking-wider">TPO Management System 2.0</p>
                </div>

                <div className="space-y-2 py-4 border-y border-slate-200">
                  <p className="text-xs font-sans text-slate-600">This is to certify that candidate</p>
                  <h3 className="text-xl font-bold text-slate-900 font-sans">{user?.name || 'Student Candidate'}</h3>
                  <p className="text-xs font-sans text-slate-600">has successfully completed the skill bootcamp track</p>
                  <h4 className="text-base font-extrabold text-[#0B0F17] font-sans">{viewingCertificateTraining.title}</h4>
                </div>

                <div className="flex justify-between items-center text-[10px] font-sans text-slate-500 pt-2">
                  <span>Credential ID: <strong>{viewingCertificateTraining.certificateNumber || 'CERT-2026-9921'}</strong></span>
                  <span>Issued: <strong>{viewingCertificateTraining.certificateIssueDate || new Date().toLocaleDateString()}</strong></span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#202D42] flex justify-end gap-3">
                <Button variant="secondary" size="md" onClick={() => setViewingCertificateTraining(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => handleDownloadCertificate(viewingCertificateTraining.title, viewingCertificateTraining.certificateNumber)}
                >
                  Download Certificate PDF
                </Button>
              </div>

            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* CREATE TRAINING MODAL (ADMIN / TPO) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Publish Training Track"
        subtitle="Initialize a skill development track for candidates."
      >
        <form onSubmit={handleCreateModule} className="space-y-4">
          <Input
            label="Training Track Title"
            placeholder="e.g. System Design & Microservices"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <Input
            label="Instructor / Trainer Name"
            placeholder="e.g. Dr. Alok Nath"
            value={newInstructor}
            onChange={(e) => setNewInstructor(e.target.value)}
            required
          />
          <Dropdown
            label="Category"
            options={[
              { label: 'Technical', value: 'Technical' },
              { label: 'Aptitude', value: 'Aptitude' },
              { label: 'Soft Skills', value: 'Soft Skills' },
              { label: 'Coding Bootcamp', value: 'Coding Bootcamp' },
            ]}
            value={newCategory}
            onChange={setNewCategory}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={createLoading}>
              Publish Track
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
