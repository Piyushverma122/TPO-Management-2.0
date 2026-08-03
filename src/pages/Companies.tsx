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
import { PermissionGuard } from '../components/auth/PermissionGuard';
import { Module, Action } from '../config/rbac';
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
  const [selectedTier, setSelectedTier] = useState('All');
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
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

      const rawList = Array.isArray(res.data) ? res.data : (res.data?.companies || (res as any).companies || []);
      const total = (res as any).pagination?.totalEntries || res.data?.total || (res as any).total || rawList.length;

      const formattedList: Company[] = rawList.map((c: any) => {
        const contact = c.company_contacts?.find((ct: any) => ct.is_primary) || c.company_contacts?.[0];
        
        const avgPkg = c.avg_package && parseFloat(c.avg_package) > 0 ? `₹${c.avg_package} LPA` : (c.highest_package && parseFloat(c.highest_package) > 0 ? `₹${c.highest_package} LPA` : 'N/A');
        const highestPkg = c.highest_package && parseFloat(c.highest_package) > 0 ? `₹${c.highest_package} LPA` : (c.avg_package && parseFloat(c.avg_package) > 0 ? `₹${c.avg_package} LPA` : 'N/A');

        return {
          id: c.id,
          name: c.name || 'Corporate Partner',
          logo: c.logo_url || 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=120',
          industry: c.industry || 'Technology & Services',
          website: c.website || 'https://example.com',
          tier: (c.tier as any) || 'Standard',
          minCgpa: c.min_cgpa ? parseFloat(c.min_cgpa) : 6.0,
          allowedBranches: c.allowed_branches || ['Computer Science', 'Information Tech', 'Electronics'],
          maxBacklogs: c.max_backlogs !== undefined ? parseInt(c.max_backlogs) : 0,
          hrContact: {
            name: c.hr_name || contact?.hr_name || 'Not Specified',
            email: c.hr_email || contact?.email || 'N/A',
            phone: c.hr_phone || contact?.phone || 'N/A',
          },
          visitedYear: c.visited_year || new Date().getFullYear(),
          hiredCount: c.hired_count || 0,
          avgPackage: avgPkg,
          highestPackage: highestPkg,
          status: (c.status as any) || 'Active',
          location: c.headquarters || 'Bengaluru, India',
          description: c.description || 'Corporate recruitment partner conducting placement drives.',
        };
      });

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
  }, [currentPage, searchQuery, selectedTier, selectedStatus, selectedIndustry]);

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

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
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
      setActionMenuOpenId(null);
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
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              {totalRecords} Active Recruiter Partners
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Manage recruiter profiles, packages, primary contact details, and tier status.
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

          <PermissionGuard module={Module.COMPANIES} action={Action.CREATE}>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddModalOpen(true)}
              className="font-extrabold text-xs shrink-0"
            >
              Add New Company
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* TOP 3 STATISTIC METRIC CARDS ROW */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-5"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 22 } },
          }}
          whileHover={{ y: -4 }}
        >
          <Card className="p-5 flex items-center justify-between group">
            <div>
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">Total Recruiter Partners</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">{totalRecords}</span>
              <span className="text-[11px] text-[#A3E635] font-semibold mt-1 block">+18 active recruitment drives</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 22 } },
          }}
          whileHover={{ y: -4 }}
        >
          <Card className="p-5 flex items-center justify-between group">
            <div>
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">Average CTC Offered</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">₹12.5 LPA</span>
              <span className="text-[11px] text-sky-400 font-semibold mt-1 block">Across all tiers</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 22 } },
          }}
          whileHover={{ y: -4 }}
        >
          <Card className="p-5 flex items-center justify-between group">
            <div>
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">Highest Package Offered</span>
              <span className="text-2xl font-extrabold text-[#A3E635] mt-1 block">₹48.0 LPA</span>
              <span className="text-[11px] text-[#A3E635] font-semibold mt-1 block">Super Dream Tier</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#A3E635]/20 text-[#A3E635] border border-[#A3E635]/40 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <Card className="p-3 relative z-30 bg-[#101726] border-[#202D42] shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full min-w-0">
            <SearchInput
              placeholder="Search companies by name, industry, or package..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto shrink-0">
            <Dropdown
              className="w-full sm:w-44 shrink-0"
              options={[
                { label: 'All Tiers', value: 'All' },
                { label: 'Super Dream (>₹20L)', value: 'Super Dream' },
                { label: 'Dream (₹10-20L)', value: 'Dream' },
                { label: 'Standard (<₹10L)', value: 'Standard' },
              ]}
              value={selectedTier}
              onChange={setSelectedTier}
            />

            <Dropdown
              className="w-full sm:w-36 shrink-0"
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
                    Company Profile Details
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
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-white">{selectedCompany.name}</h3>
                      <Badge variant={selectedCompany.tier === 'Super Dream' ? 'accent' : 'neutral'} size="sm">{selectedCompany.tier}</Badge>
                    </div>
                    <p className="text-xs text-[#94A3B8]">{selectedCompany.industry}</p>
                    <a
                      href={selectedCompany.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#A3E635] hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Globe className="w-3 h-3" />
                      {selectedCompany.website}
                    </a>
                  </div>
                </div>

                {/* Logo Upload Button */}
                <div>
                  <label className="cursor-pointer bg-[#101726] hover:bg-[#1C293F] border border-[#202D42] text-white w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                    <Upload className="w-4 h-4 text-[#A3E635]" />
                    {uploadingLogo ? 'Uploading Logo...' : 'Upload New Company Logo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUploadAction} />
                  </label>
                </div>

                {/* Package Highlights Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3">
                    <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Avg Package</span>
                    <span className="text-base font-extrabold text-white mt-0.5 block">{selectedCompany.avgPackage}</span>
                  </div>
                  <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3">
                    <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Highest Package</span>
                    <span className="text-base font-extrabold text-[#A3E635] mt-0.5 block">{selectedCompany.highestPackage}</span>
                  </div>
                  <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3">
                    <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Min CGPA Cut-off</span>
                    <span className="text-base font-extrabold text-sky-400 mt-0.5 block">{selectedCompany.minCgpa} CGPA</span>
                  </div>
                  <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3">
                    <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Max Backlogs</span>
                    <span className="text-base font-extrabold text-rose-400 mt-0.5 block">{selectedCompany.maxBacklogs} Allowed</span>
                  </div>
                </div>

                {/* Primary HR Recruiter Contact Info */}
                <div className="bg-[#101726] border border-[#202D42] rounded-2xl p-4 space-y-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-[#202D42] pb-2">
                    Primary HR Recruiter Contact
                  </span>
                  <div className="text-xs space-y-2 pt-1">
                    <p className="font-extrabold text-white text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#A3E635]" />
                      {selectedCompany.hrContact.name}
                    </p>
                    <p className="text-[#94A3B8] flex items-center gap-2">
                      <span className="font-semibold text-white">Email:</span> {selectedCompany.hrContact.email}
                    </p>
                    <p className="text-[#94A3B8] flex items-center gap-2">
                      <span className="font-semibold text-white">Phone:</span> {selectedCompany.hrContact.phone}
                    </p>
                  </div>
                </div>

                {/* Allowed Branches */}
                <div className="bg-[#101726] border border-[#202D42] rounded-2xl p-4 space-y-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-[#202D42] pb-2">
                    Eligible Branches / Departments
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedCompany.allowedBranches.map((br) => (
                      <span
                        key={br}
                        className="bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 text-[11px] font-bold px-2.5 py-1 rounded-lg"
                      >
                        {br}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Job Description & Location */}
                <div className="bg-[#101726] border border-[#202D42] rounded-2xl p-4 space-y-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-[#202D42] pb-2">
                    Company Description & Location
                  </span>
                  <div className="text-xs space-y-2 pt-1">
                    <p className="text-[#94A3B8]">
                      <span className="font-semibold text-white block mb-0.5">Headquarters / Office Location:</span>
                      {selectedCompany.location}
                    </p>
                    <p className="text-[#94A3B8] leading-relaxed">
                      <span className="font-semibold text-white block mb-0.5">Overview & Job Requirements:</span>
                      {selectedCompany.description}
                    </p>
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
