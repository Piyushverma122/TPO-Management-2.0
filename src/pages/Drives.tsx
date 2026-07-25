import React, { useState, useEffect, useMemo } from 'react';
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
  ListFilter,
  RefreshCw,
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
import {
  getDrives,
  createDrive,
  deleteDrive,
} from '../api/drive.api';

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

export const Drives: React.FC = () => {
  const { success, error: toastError } = useToast();

  // API Data State
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const [viewMode, setViewMode] = useState<'cards' | 'details'>('cards');
  const [selectedDrive, setSelectedDrive] = useState<PlacementDrive | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedJobType, setSelectedJobType] = useState('All');

  // Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newCtc, setNewCtc] = useState('₹18 LPA');

  const fetchDrivesData = async () => {
    setLoading(true);
    try {
      const res = await getDrives({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        job_type: selectedJobType !== 'All' ? selectedJobType : undefined,
      });

      const rawList = res.data?.drives || [];
      const total = res.data?.total || 0;

      const formattedList: PlacementDrive[] = rawList.map((d: any) => ({
        id: d.id,
        driveCode: d.drive_code || 'DRV-101',
        companyId: d.company_id || 'cmp-1',
        companyName: d.companies?.name || d.company_name || 'Corporate Partner',
        companyLogo: d.companies?.logo_url || 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=120',
        roleTitle: d.role_title || 'Software Engineer',
        jobType: (d.job_type as any) || 'Full Time',
        ctc: d.ctc ? `₹${d.ctc} LPA` : '₹12 LPA',
        location: d.location || 'College Campus',
        eligibility: {
          minCgpa: d.min_cgpa ? parseFloat(d.min_cgpa) : 7.0,
          maxBacklogs: d.max_backlogs || 0,
          branches: d.allowed_branches || ['CS', 'IT'],
          passingYear: d.passing_year || 2025,
        },
        registrationDeadline: d.registration_deadline ? new Date(d.registration_deadline).toLocaleDateString() : 'Active',
        driveDate: d.drive_date ? new Date(d.drive_date).toLocaleDateString() : 'Upcoming',
        rounds: d.selection_rounds || ['Online Assessment', 'Technical Interview', 'HR Round'],
        status: (d.status as any) || 'Upcoming',
        appliedStudentsCount: d.applied_count || 0,
        shortlistedCount: d.shortlisted_count || 0,
        placedCount: d.selected_count || 0,
      }));

      setDrives(formattedList);
      setTotalRecords(total);
      if (formattedList.length > 0 && !selectedDrive) {
        setSelectedDrive(formattedList[0]);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load placement drives.';
      toastError('Error Loading Drives', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivesData();
  }, [currentPage, searchQuery, selectedStatus, selectedJobType]);

  const handleOpenDetailsView = (drive: PlacementDrive) => {
    setSelectedDrive(drive);
    setViewMode('details');
  };

  const handleCreateDriveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany || !newRole) {
      toastError('Validation Error', 'Company Name and Role Title are required.');
      return;
    }

    try {
      await createDrive({
        role_title: newRole,
        job_type: 'Full Time',
        ctc: parseFloat(newCtc.replace(/[^0-9.]/g, '')) || 18,
        drive_date: new Date().toISOString(),
        registration_deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
        status: 'Upcoming',
      });

      setIsAddModalOpen(false);
      setNewCompany('');
      setNewRole('');
      success('Placement Drive Published', `${newCompany} drive is now live for registration.`);
      fetchDrivesData();
    } catch (err: any) {
      toastError('Create Error', err.response?.data?.message || 'Failed to publish placement drive.');
    }
  };

  const handleDeleteDriveAction = async (driveId: string) => {
    try {
      await deleteDrive(driveId);
      success('Drive Deleted', 'Placement drive record removed.');
      fetchDrivesData();
    } catch (err: any) {
      toastError('Delete Error', err.response?.data?.message || 'Failed to delete drive.');
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Placement Drives' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-1">
            Placement Drives Overview
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              {totalRecords} Active Drives
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchDrivesData}
            disabled={loading}
          >
            Refresh
          </Button>

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

      {/* VIEW MODE 1: CARDS GRID OVERVIEW */}
      {viewMode === 'cards' ? (
        <div className="space-y-6">
          {/* SEARCH & FILTER CONTROLS */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:flex-1">
                <SearchInput
                  placeholder="Search drive by company name, role, or drive code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Dropdown
                  options={[
                    { label: 'All Statuses', value: 'All' },
                    { label: 'Ongoing', value: 'Ongoing' },
                    { label: 'Upcoming', value: 'Upcoming' },
                    { label: 'Conducted', value: 'Conducted' },
                  ]}
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                />

                <Dropdown
                  options={[
                    { label: 'All Job Types', value: 'All' },
                    { label: 'Full Time', value: 'Full Time' },
                    { label: 'Internship', value: 'Internship' },
                  ]}
                  value={selectedJobType}
                  onChange={setSelectedJobType}
                />
              </div>
            </div>
          </Card>

          {/* DRIVES CARDS GRID */}
          {loading ? (
            <div className="bg-[#162032] border border-[#202D42] rounded-3xl p-12 text-center text-[#94A3B8]">
              <div className="w-8 h-8 border-4 border-[#A3E635] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span>Loading recruitment drive records...</span>
            </div>
          ) : drives.length === 0 ? (
            <div className="bg-[#162032] border border-[#202D42] rounded-3xl p-12 text-center text-[#94A3B8]">
              No recruitment drives found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drives.map((drive) => (
                <motion.div
                  key={drive.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#162032] border border-[#202D42] rounded-2xl p-5 hover:border-[#A3E635]/40 transition-all duration-300 shadow-xl flex flex-col justify-between group cursor-pointer"
                  onClick={() => handleOpenDetailsView(drive)}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={drive.companyLogo}
                          alt={drive.companyName}
                          className="w-11 h-11 rounded-xl object-cover border border-[#202D42]"
                        />
                        <div>
                          <span className="text-[11px] font-mono font-bold text-[#A3E635] block">
                            {drive.driveCode}
                          </span>
                          <h3 className="text-base font-extrabold text-white group-hover:text-[#A3E635] transition-colors leading-snug">
                            {drive.companyName}
                          </h3>
                        </div>
                      </div>
                      <StatusBadge status={drive.status} size="sm" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-white line-clamp-1">{drive.roleTitle}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{drive.jobType} • {drive.location}</p>
                    </div>

                    <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-[#94A3B8] uppercase block font-bold">Package Offered</span>
                        <span className="font-extrabold text-[#A3E635]">{drive.ctc}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#94A3B8] uppercase block font-bold">Min CGPA</span>
                        <span className="font-extrabold text-white">{drive.eligibility.minCgpa.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[#94A3B8] pt-1">
                      <div>Deadline: <strong className="text-white block truncate">{drive.registrationDeadline}</strong></div>
                      <div>Drive Date: <strong className="text-white block truncate">{drive.driveDate}</strong></div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#202D42] flex items-center justify-between text-xs">
                    <span className="text-slate-400">Applications: <strong className="text-white">{drive.appliedStudentsCount}</strong></span>
                    <span className="text-[#A3E635] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      View Drive Dashboard &rarr;
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Server Pagination */}
          <div className="p-4 bg-[#162032] border border-[#202D42] rounded-2xl flex items-center justify-between">
            <span className="text-xs text-[#94A3B8]">
              Page {currentPage} of {Math.ceil(totalRecords / itemsPerPage) || 1} ({totalRecords} placement drives)
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalRecords / itemsPerPage) || 1}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: DETAILED DASHBOARD VIEW FOR SELECTED DRIVE */
        selectedDrive && (
          <div className="space-y-6">
            {/* Selected Drive Header Card */}
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedDrive.companyLogo}
                    alt={selectedDrive.companyName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#A3E635]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#A3E635]">{selectedDrive.driveCode}</span>
                      <StatusBadge status={selectedDrive.status} size="sm" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white mt-0.5">{selectedDrive.companyName}</h2>
                    <p className="text-sm font-semibold text-[#94A3B8]">{selectedDrive.roleTitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="secondary" size="md" onClick={() => setViewMode('cards')}>
                    &larr; Back to Grid
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => handleDeleteDriveAction(selectedDrive.id)}
                  >
                    Delete Drive
                  </Button>
                </div>
              </div>

              {/* Stat Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#202D42]">
                <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3">
                  <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Package Offered</span>
                  <span className="text-base font-extrabold text-[#A3E635]">{selectedDrive.ctc}</span>
                </div>
                <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3">
                  <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Total Applications</span>
                  <span className="text-base font-extrabold text-white">{selectedDrive.appliedStudentsCount}</span>
                </div>
                <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3">
                  <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Shortlisted</span>
                  <span className="text-base font-extrabold text-sky-400">{selectedDrive.shortlistedCount}</span>
                </div>
                <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3">
                  <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Selected Candidates</span>
                  <span className="text-base font-extrabold text-emerald-400">{selectedDrive.placedCount}</span>
                </div>
              </div>
            </Card>
          </div>
        )
      )}

      {/* PUBLISH NEW DRIVE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Publish Placement Drive"
        subtitle="Configure new recruitment drive parameters."
      >
        <form onSubmit={handleCreateDriveSubmit} className="space-y-4">
          <Input
            label="Company Name"
            placeholder="e.g. Microsoft / Google"
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            required
          />
          <Input
            label="Role Title"
            placeholder="e.g. Software Engineer I"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            required
          />
          <Input
            label="CTC Package (LPA)"
            placeholder="e.g. 18"
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
