import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer } from 'recharts';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { useToast } from '../components/ui/Toast';
import {
  getTrainings,
  createTraining,
  deleteTraining,
  enrollTraining,
  getTrainingStatistics,
} from '../api/training.api';

interface TrainingModule {
  id: string;
  title: string;
  category: 'Technical' | 'Aptitude' | 'Soft Skills' | 'Coding Bootcamp';
  instructor: string;
  duration: string;
  enrolledStudents: number;
  completionRate: number;
  status: 'Active' | 'Upcoming' | 'Completed';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
}

const enrolledSparkline = [{ v: 400 }, { v: 800 }, { v: 1400 }, { v: 2100 }];
const completionSparkline = [{ v: 65 }, { v: 75 }, { v: 82 }, { v: 88 }];
const certSparkline = [{ v: 500 }, { v: 950 }, { v: 1400 }, { v: 1850 }];

export const Training: React.FC = () => {
  const { success, error: toastError, info } = useToast();

  // API State
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newInstructor, setNewInstructor] = useState('');
  const [newCategory, setNewCategory] = useState<any>('Technical');

  const fetchTrainingsData = async () => {
    setLoading(true);
    try {
      const res = await getTrainings({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
      });

      const rawList = res.data?.trainings || [];
      const total = res.data?.total || 0;

      const formattedList: TrainingModule[] = rawList.map((t: any) => ({
        id: t.id,
        title: t.title || 'Placement Training Track',
        category: (t.category as any) || 'Technical',
        instructor: t.trainer_name || 'Senior Instructor',
        duration: t.duration || '4 Weeks',
        enrolledStudents: t.enrolled_count || 100,
        completionRate: t.completion_rate ? parseFloat(t.completion_rate) : 85,
        status: (t.status as any) || 'Active',
        level: (t.level as any) || 'Intermediate',
      }));

      setModules(formattedList);
      setTotalRecords(total);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load training tracks directory.';
      toastError('Error Loading Training', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainingsData();
  }, [currentPage, searchQuery, selectedCategory]);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newInstructor) {
      toastError('Validation Error', 'Title and Instructor Name are required.');
      return;
    }

    try {
      await createTraining({
        title: newTitle,
        trainer_name: newInstructor,
        category: newCategory,
        status: 'Active',
      });

      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewInstructor('');
      success('Training Track Published', `Successfully initialized "${newTitle}".`);
      fetchTrainingsData();
    } catch (err: any) {
      toastError('Creation Error', err.response?.data?.message || 'Failed to create training track.');
    }
  };

  const handleEnrollStudentAction = async (trainingId: string, title: string) => {
    try {
      await enrollTraining(trainingId);
      success('Enrollment Confirmed', `You have been enrolled in "${title}".`);
      fetchTrainingsData();
    } catch (err: any) {
      toastError('Enrollment Failed', err.response?.data?.message || 'Failed to enroll in training track.');
    }
  };

  const handleDeleteTrainingAction = async (trainingId: string) => {
    try {
      await deleteTraining(trainingId);
      success('Training Deleted', 'Training module record removed.');
      fetchTrainingsData();
    } catch (err: any) {
      toastError('Delete Error', err.response?.data?.message || 'Failed to delete training track.');
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Training & Skill Development
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              {totalRecords} Active Tracks
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Technical skill bootcamps, mock assessment tracks, and student performance metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchTrainingsData}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
            className="font-extrabold text-xs shrink-0"
          >
            Create Training Track
          </Button>
        </div>
      </div>

      {/* Top Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-[#94A3B8]" />
              <span>Enrolled Candidates</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">4,280</div>
          <div className="h-10 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enrolledSparkline}>
                <Area type="monotone" dataKey="v" stroke="#A3E635" fill="#A3E635" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center text-xs font-semibold text-[#94A3B8] pt-1 border-t border-[#202D42]">
            <span>Active Tracks</span>
            <span className="text-white font-extrabold">{totalRecords} Modules</span>
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-[#94A3B8]" />
              <span>Avg Completion Rate</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#A3E635]">88.4%</div>
          <div className="h-10 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={completionSparkline}>
                <Area type="monotone" dataKey="v" stroke="#A3E635" fill="#A3E635" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center text-xs font-semibold text-[#94A3B8] pt-1 border-t border-[#202D42]">
            <span>Assigned Assessments</span>
            <span className="text-[#A3E635] font-extrabold">92% Cleared</span>
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <Award className="w-4 h-4 text-[#94A3B8]" />
              <span>Certificates Issued</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">1,850</div>
          <div className="h-10 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={certSparkline}>
                <Area type="monotone" dataKey="v" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center text-xs font-semibold text-[#94A3B8] pt-1 border-t border-[#202D42]">
            <span>Verified Credentials</span>
            <span className="text-sky-400 font-extrabold">100% Authenticated</span>
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <BrainCircuit className="w-4 h-4 text-[#94A3B8]" />
              <span>Mock Interview Cleared</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">95.2%</div>
          <div className="h-10 mt-1 flex items-center">
            <ProgressBar value={95} variant="emerald" showValue={false} />
          </div>
          <div className="flex justify-between items-center text-xs font-semibold text-[#94A3B8] pt-1 border-t border-[#202D42]">
            <span>Feedback Rating</span>
            <span className="text-emerald-400 font-extrabold">4.9 / 5.0</span>
          </div>
        </Card>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1">
            <SearchInput
              placeholder="Search training modules by title or instructor name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Dropdown
              options={[
                { label: 'All Categories', value: 'All' },
                { label: 'Technical', value: 'Technical' },
                { label: 'Aptitude', value: 'Aptitude' },
                { label: 'Soft Skills', value: 'Soft Skills' },
                { label: 'Coding Bootcamp', value: 'Coding Bootcamp' },
              ]}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
          </div>
        </div>
      </Card>

      {/* TRAINING MODULES LIST GRID */}
      {loading ? (
        <div className="bg-[#162032] border border-[#202D42] rounded-3xl p-12 text-center text-[#94A3B8]">
          <div className="w-8 h-8 border-4 border-[#A3E635] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span>Loading skill training catalog...</span>
        </div>
      ) : modules.length === 0 ? (
        <div className="bg-[#162032] border border-[#202D42] rounded-3xl p-12 text-center text-[#94A3B8]">
          No training tracks found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#162032] border border-[#202D42] rounded-2xl p-5 hover:border-[#A3E635]/40 transition-all duration-300 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <Badge variant={mod.category === 'Coding Bootcamp' ? 'accent' : 'info'} size="sm">
                    {mod.category}
                  </Badge>
                  <StatusBadge status={mod.status} size="sm" />
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-white leading-snug">{mod.title}</h3>
                  <p className="text-xs text-[#94A3B8] mt-1">Instructor: <strong className="text-white">{mod.instructor}</strong></p>
                </div>

                <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#94A3B8]">Duration: <strong className="text-white">{mod.duration}</strong></span>
                    <span className="text-[#94A3B8]">Enrolled: <strong className="text-[#A3E635]">{mod.enrolledStudents}</strong></span>
                  </div>
                  <ProgressBar value={mod.completionRate} label="Track Completion" size="sm" />
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#202D42] flex items-center justify-between gap-2">
                <button
                  onClick={() => handleDeleteTrainingAction(mod.id)}
                  className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                  title="Delete Training Track"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleEnrollStudentAction(mod.id, mod.title)}
                  className="font-bold text-xs"
                >
                  Enroll Track
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CREATE NEW TRAINING MODULE MODAL */}
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
            <Button type="submit" variant="primary" size="md">
              Publish Track
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
