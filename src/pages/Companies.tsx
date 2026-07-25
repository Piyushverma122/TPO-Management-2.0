import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  TrendingUp,
  Search,
  Filter,
  Plus,
  X,
  ExternalLink,
  Calendar,
  Briefcase,
  Users,
  Award,
  Globe,
  MapPin,
  Clock,
  MoreVertical,
  LayoutGrid,
  List,
  Upload,
  DollarSign,
  CheckCircle2,
  Edit,
  Trash2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, LineChart, Line } from 'recharts';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Input, SearchInput, Textarea } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { RadialProgress } from '../components/ui/ProgressBar';
import { useToast } from '../components/ui/Toast';
import { Company } from '../types';
import {
  getCompanies,
  createCompany,
  deleteCompany,
  uploadCompanyLogo,
} from '../api/company.api';

// Sparkline Mock Data
const totalCompaniesSparkline = [{ v: 120 }, { v: 180 }, { v: 240 }, { v: 280 }];
const activeSparkline = [{ v: 20 }, { v: 45 }, { v: 55 }, { v: 65 }];
const topCtcSparkline = [{ v: 24 }, { v: 36 }, { v: 42 }, { v: 48 }];

// Drive History Chart Data for Details Drawer
const driveHistoryData = [
  { year: '2022', hires: 12 },
  { year: '2023', hires: 18 },
  { year: '2024', hires: 25 },
];

export const Companies: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError, info } = useToast();

  // API Data State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Company Form State
  const [newCmpName, setNewCmpName] = useState('');
  const [newCmpRole, setNewCmpRole] = useState('Software Engineer I');
  const [newCmpWebsite, setNewCmpWebsite] = useState('https://example.com');
  const [newCmpIndustry, setNewCmpIndustry] = useState('E-commerce & Tech');
  const [newCmpTier, setNewCmpTier] = useState<any>('Super Dream');

  // Logo Upload State
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchCompaniesData = async () => {
    setLoading(true);
    try {
      const res = await getCompanies({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        industry: selectedIndustry !== 'All' ? selectedIndustry : undefined,
      });

      const rawList = res.data?.companies || [];
      const total = res.data?.total || 0;

      const formattedList: Company[] = rawList.map((c: any) => ({
        id: c.id,
        name: c.name || 'Corporate Partner',
        logo: c.logo_url || 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=120',
        industry: c.industry || 'Technology & Services',
        website: c.website || 'https://example.com',
        tier: (c.tier as any) || 'Super Dream',
        minCgpa: c.min_cgpa ? parseFloat(c.min_cgpa) : 7.0,
        allowedBranches: c.allowed_branches || ['Computer Science', 'IT'],
        maxBacklogs: c.max_backlogs || 0,
        hrContact: {
          name: c.hr_name || 'Campus Recruiter',
          email: c.hr_email || 'hr@company.com',
          phone: c.hr_phone || '+91 98000 11223',
        },
        visitedYear: c.visited_year || 2024,
        hiredCount: c.hired_count || 15,
        avgPackage: c.avg_package ? `₹${c.avg_package} LPA` : '₹12 LPA',
        highestPackage: c.highest_package ? `₹${c.highest_package} LPA` : '₹25 LPA',
        status: (c.status as any) || 'Active',
      }));

      setCompanies(formattedList);
      setTotalRecords(total);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load company records.';
      toastError('Error Loading Companies', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompaniesData();
  }, [currentPage, searchQuery, selectedIndustry, selectedStatus]);

  const handleOpenDrawer = (company: Company) => {
    setSelectedCompany(company);
    setIsDrawerOpen(true);
  };

  const handleLogoUploadAction = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedCompany) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('logo', file);

    setUploadingLogo(true);
    try {
      const res = await uploadCompanyLogo(selectedCompany.id, formData);
      const newLogoUrl = res.data?.company?.logo_url;
      success('Logo Updated', `${selectedCompany.name} brand logo updated.`);

      if (newLogoUrl) {
        setSelectedCompany({ ...selectedCompany, logo: newLogoUrl });
      }
      fetchCompaniesData();
    } catch (err: any) {
      toastError('Upload Error', err.response?.data?.message || 'Failed to upload company logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCreateCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCmpName) {
      toastError('Validation Error', 'Company Name is required.');
      return;
    }

    try {
      await createCompany({
        name: newCmpName,
        industry: newCmpIndustry,
        website: newCmpWebsite,
        tier: newCmpTier,
        status: 'Active',
      });

      setIsAddModalOpen(false);
      setNewCmpName('');
      success('Company Added', `${newCmpName} registered in TPO records.`);
      fetchCompaniesData();
    } catch (err: any) {
      toastError('Create Error', err.response?.data?.message || 'Failed to create company record.');
    }
  };

  const handleDeleteCompanyAction = async (companyId: string) => {
    try {
      await deleteCompany(companyId);
      success('Company Removed', 'Company record deleted.');
      setIsDrawerOpen(false);
      fetchCompaniesData();
    } catch (err: any) {
      toastError('Delete Error', err.response?.data?.message || 'Failed to delete company.');
    }
  };

  return (
    <div className="space-y-6 pb-12 relative font-sans">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Company Management
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              {totalRecords} Corporate Partners
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Directory of campus recruitment partners, tier allocations, and package statistics.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchCompaniesData}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/companies/add')}
            className="font-extrabold text-xs shrink-0"
          >
            Add New Company
          </Button>
        </div>
      </div>

      {/* TOP 3 STATISTIC METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">Total Recruiter Partners</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">{totalRecords}</span>
            <span className="text-[11px] text-[#A3E635] font-semibold mt-1 block">+18 active recruitment drives</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 flex items-center justify-center font-bold text-xl">
            <Building2 className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">Average CTC Offered</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">₹12.5 LPA</span>
            <span className="text-[11px] text-sky-400 font-semibold mt-1 block">Across all tiers</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">Highest Package Offered</span>
            <span className="text-2xl font-extrabold text-[#A3E635] mt-1 block">₹48.0 LPA</span>
            <span className="text-[11px] text-[#A3E635] font-semibold mt-1 block">Super Dream Tier</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#A3E635]/20 text-[#A3E635] border border-[#A3E635]/40 flex items-center justify-center font-bold text-xl">
            <Award className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          <div className="w-full lg:flex-1">
            <SearchInput
              placeholder="Search companies by name, industry, or package..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <Dropdown
              options={[
                { label: 'All Industries', value: 'All' },
                { label: 'E-commerce & Tech', value: 'E-commerce' },
                { label: 'Technology & Cloud', value: 'Technology' },
                { label: 'IT Services', value: 'IT Services' },
              ]}
              value={selectedIndustry}
              onChange={setSelectedIndustry}
            />

            <Dropdown
              options={[
                { label: 'All Statuses', value: 'All' },
                { label: 'Active', value: 'Active' },
                { label: 'Upcoming', value: 'Upcoming' },
                { label: 'Completed', value: 'Completed' },
              ]}
              value={selectedStatus}
              onChange={setSelectedStatus}
            />

            {/* View Mode Toggle Switcher */}
            <div className="flex items-center gap-1 bg-[#101726] border border-[#202D42] p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-[#A3E635] text-[#0B0F17]' : 'text-[#94A3B8] hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-[#A3E635] text-[#0B0F17]' : 'text-[#94A3B8] hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* COMPANIES LIST (GRID / TABLE VIEW) */}
      {loading ? (
        <div className="bg-[#162032] border border-[#202D42] rounded-3xl p-12 text-center text-[#94A3B8]">
          <div className="w-8 h-8 border-4 border-[#A3E635] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span>Loading corporate partners dataset...</span>
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-[#162032] border border-[#202D42] rounded-3xl p-12 text-center text-[#94A3B8]">
          No matching companies found.
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((cmp) => (
            <motion.div
              key={cmp.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#162032] border border-[#202D42] rounded-2xl p-5 hover:border-[#A3E635]/40 transition-all duration-300 shadow-xl flex flex-col justify-between cursor-pointer group"
              onClick={() => handleOpenDrawer(cmp)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={cmp.logo}
                      alt={cmp.name}
                      className="w-12 h-12 rounded-xl object-cover border border-[#202D42] group-hover:border-[#A3E635]/50 transition-colors"
                    />
                    <div>
                      <h3 className="text-base font-extrabold text-white group-hover:text-[#A3E635] transition-colors">
                        {cmp.name}
                      </h3>
                      <p className="text-xs text-[#94A3B8]">{cmp.industry}</p>
                    </div>
                  </div>
                  <Badge variant={cmp.tier === 'Super Dream' ? 'accent' : 'neutral'} size="sm">
                    {cmp.tier}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#101726] border border-[#202D42] rounded-xl p-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase block font-bold">Avg Package</span>
                    <span className="font-extrabold text-white">{cmp.avgPackage}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase block font-bold">Highest CTC</span>
                    <span className="font-extrabold text-[#A3E635]">{cmp.highestPackage}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#94A3B8] pt-1">
                  <span>Hired Count: <strong className="text-white">{cmp.hiredCount}</strong></span>
                  <StatusBadge status={cmp.status} size="sm" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#202D42] flex items-center justify-between text-xs">
                <a
                  href={cmp.website}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sky-400 hover:underline flex items-center gap-1"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Website
                </a>
                <span className="text-[#A3E635] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  View Profile &rarr;
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Highest CTC</TableHead>
                <TableHead>Hired</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((cmp) => (
                <TableRow key={cmp.id} onClick={() => handleOpenDrawer(cmp)} className="cursor-pointer">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={cmp.logo} alt={cmp.name} className="w-8 h-8 rounded-lg object-cover border border-[#202D42]" />
                      <span className="font-bold text-white">{cmp.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-[#94A3B8]">{cmp.industry}</TableCell>
                  <TableCell>
                    <Badge variant={cmp.tier === 'Super Dream' ? 'accent' : 'neutral'} size="sm">
                      {cmp.tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-extrabold text-[#A3E635] text-xs">{cmp.highestPackage}</TableCell>
                  <TableCell className="font-bold text-white text-xs">{cmp.hiredCount}</TableCell>
                  <TableCell>
                    <StatusBadge status={cmp.status} size="sm" />
                  </TableCell>
                  <TableCell className="text-right">
                    <button className="text-[#94A3B8] hover:text-white p-1 rounded-lg hover:bg-[#202D42]">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Server Pagination */}
      <div className="p-4 bg-[#162032] border border-[#202D42] rounded-2xl flex items-center justify-between">
        <span className="text-xs text-[#94A3B8]">
          Page {currentPage} of {Math.ceil(totalRecords / itemsPerPage) || 1} ({totalRecords} companies)
        </span>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalRecords / itemsPerPage) || 1}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* COMPANY DETAILS DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && selectedCompany && (
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
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#202D42] pb-4">
                  <span className="text-xs font-extrabold text-[#A3E635] tracking-wider uppercase">
                    Company Profile
                  </span>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#202D42]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Company Logo & Branding */}
                <div className="flex items-center gap-4 bg-[#101726] border border-[#202D42] rounded-2xl p-4">
                  <img
                    src={selectedCompany.logo}
                    alt={selectedCompany.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#A3E635]"
                  />
                  <div>
                    <h3 className="text-lg font-extrabold text-white">{selectedCompany.name}</h3>
                    <p className="text-xs text-[#94A3B8]">{selectedCompany.industry}</p>
                    <a
                      href={selectedCompany.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-sky-400 hover:underline flex items-center gap-1 mt-1"
                    >
                      <Globe className="w-3 h-3" />
                      {selectedCompany.website}
                    </a>
                  </div>
                </div>

                {/* Logo Upload Button */}
                <div className="pt-1">
                  <label className="cursor-pointer bg-[#101726] hover:bg-[#1C293F] border border-[#202D42] text-white w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                    <Upload className="w-4 h-4 text-[#A3E635]" />
                    {uploadingLogo ? 'Uploading Logo...' : 'Upload New Company Logo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUploadAction} />
                  </label>
                </div>

                {/* Package Highlights */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3">
                    <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Avg CTC</span>
                    <span className="text-base font-extrabold text-white">{selectedCompany.avgPackage}</span>
                  </div>
                  <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3">
                    <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Highest CTC</span>
                    <span className="text-base font-extrabold text-[#A3E635]">{selectedCompany.highestPackage}</span>
                  </div>
                </div>

                {/* HR Recruiter Contact Info */}
                <div className="bg-[#101726] border border-[#202D42] rounded-2xl p-4 space-y-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-[#202D42] pb-1">
                    Primary HR Recruiter
                  </span>
                  <div className="text-xs space-y-1 pt-1">
                    <p className="font-bold text-white">{selectedCompany.hrContact.name}</p>
                    <p className="text-[#94A3B8]">{selectedCompany.hrContact.email}</p>
                    <p className="text-[#94A3B8]">{selectedCompany.hrContact.phone}</p>
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
                    onClick={() => handleDeleteCompanyAction(selectedCompany.id)}
                  >
                    Delete Company
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
