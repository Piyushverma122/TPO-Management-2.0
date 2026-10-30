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

import { Card } from '../components/app/Card';
import { Button } from '../components/app/Button';
import { Badge, StatusBadge } from '../components/app/Badge';
import { Input, SearchInput, Textarea } from '../components/app/Input';
import { Dropdown } from '../components/app/Dropdown';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/app/Table';
import { Pagination } from '../components/app/Pagination';
import { Modal } from '../components/app/Modal';
import { Avatar } from '../components/app/Avatar';
import { RadialProgress } from '../components/app/ProgressBar';
import { useToast } from '../components/app/Toast';
import { Company } from '../types';
import { PermissionGuard } from '../components/auth/PermissionGuard';
import { Module, Action } from '../config/rbac';
import {
  getCompanies,
  createCompany,
  deleteCompany,
  uploadCompanyLogo,
} from '../api/company.api';
import { CompanyLogo } from '../components/app/CompanyLogo';

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
          logo: c.logo_url || '',
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalRecords} recruiter partners. Manage profiles, packages, contacts and tier status.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="tertiary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchCompaniesData}
            disabled={loading}
            className="text-xs"
          >
            Refresh
          </Button>

          <PermissionGuard module={Module.COMPANIES} action={Action.CREATE}>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/companies/add')}
              className="text-xs shrink-0"
            >
              Add Company
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* STATS STRIP */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 [&>div]:border-border max-sm:[&>div+div]:border-t sm:[&>div+div]:border-l">
          {[
            { label: 'Recruiter partners', value: String(totalRecords), note: '+18 active recruitment drives', icon: Building2 },
            { label: 'Average CTC offered', value: '₹12.5 LPA', note: 'Across all tiers', icon: TrendingUp },
            { label: 'Highest package', value: '₹48.0 LPA', note: 'Super Dream tier', icon: Award },
          ].map(({ label, value, note, icon: Icon }) => (
            <div key={label} className="p-6">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm">{label}</span>
                <Icon className="w-4 h-4" />
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{note}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 relative z-30">
        <div className="flex-1 min-w-0">
          <SearchInput
            placeholder="Search companies by name, industry or package..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
          <Dropdown
            className="w-full sm:w-48 shrink-0"
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
            className="w-full sm:w-40 shrink-0"
            options={[
              { label: 'All Statuses', value: 'All' },
              { label: 'Active', value: 'Active' },
              { label: 'Upcoming', value: 'Upcoming' },
              { label: 'Completed', value: 'Completed' },
            ]}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-full bg-secondary p-1 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Grid View"
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Table View"
              aria-label="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* COMPANIES LIST (GRID / TABLE VIEW) */}
      {loading ? (
        <Card className="p-12 text-center text-muted-foreground">Loading corporate partners...</Card>
      ) : companies.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">No matching companies found.</Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {companies.map((cmp) => (
            <motion.div
              key={cmp.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleOpenDrawer(cmp)}
              className="group flex cursor-pointer flex-col justify-between rounded-3xl border border-border bg-card p-6 transition-colors hover:border-foreground/25"
            >
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <CompanyLogo src={cmp.logo} name={cmp.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-foreground" title={cmp.name}>{cmp.name}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={cmp.tier === 'Super Dream' ? 'accent' : 'neutral'} size="sm">
                        {cmp.tier}
                      </Badge>
                      <span className="truncate text-xs text-muted-foreground">{cmp.industry}</span>
                    </div>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-4 border-y border-border py-4">
                  <div>
                    <dt className="text-xs text-muted-foreground">Avg package</dt>
                    <dd className="mt-1 text-lg font-semibold text-foreground">{cmp.avgPackage}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Highest CTC</dt>
                    <dd className="mt-1 text-lg font-semibold text-foreground">{cmp.highestPackage}</dd>
                  </div>
                </dl>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Hired <strong className="font-semibold text-foreground">{cmp.hiredCount}</strong>
                  </span>
                  <StatusBadge status={cmp.status} size="sm" />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between text-xs">
                <a
                  href={cmp.website}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Website
                </a>
                <span className="flex items-center gap-1 font-medium text-foreground transition-transform group-hover:translate-x-0.5">
                  View profile &rarr;
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table bare>
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
                      <CompanyLogo src={cmp.logo} name={cmp.name} size="sm" />
                      <span className="text-sm font-medium text-foreground">{cmp.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{cmp.industry}</TableCell>
                  <TableCell>
                    <Badge variant={cmp.tier === 'Super Dream' ? 'accent' : 'neutral'} size="sm">
                      {cmp.tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{cmp.highestPackage}</TableCell>
                  <TableCell className="text-foreground">{cmp.hiredCount}</TableCell>
                  <TableCell>
                    <StatusBadge status={cmp.status} size="sm" />
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      aria-label="Company actions"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
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
      <Card className="px-4 py-2">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalRecords / itemsPerPage) || 1}
          onPageChange={setCurrentPage}
          totalEntries={totalRecords}
          pageSize={itemsPerPage}
        />
      </Card>

      {/* COMPANY DETAILS DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && selectedCompany && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60"
              onClick={() => setIsDrawerOpen(false)}
            />

            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="relative flex w-screen max-w-lg flex-col rounded-l-3xl border-l border-border bg-card text-foreground"
              >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between px-6 py-5 border-b border-border">
                  <div>
                    <h2 className="text-base font-semibold">Company profile</h2>
                    <p className="text-xs text-muted-foreground">Details, contact and eligibility</p>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    aria-label="Close"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
                  {/* Hero */}
                  <div className="flex items-start gap-4">
                    <CompanyLogo src={selectedCompany.logo} name={selectedCompany.name} size="xl" />
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold leading-tight">{selectedCompany.name}</h3>
                        <Badge variant={selectedCompany.tier === 'Super Dream' ? 'accent' : 'neutral'} size="sm">
                          {selectedCompany.tier}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedCompany.industry}</p>
                      <a
                        href={selectedCompany.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span className="truncate">{selectedCompany.website}</span>
                      </a>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-dashed border-input px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    <Upload className="w-4 h-4" />
                    {uploadingLogo ? 'Uploading logo...' : 'Upload new logo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUploadAction} />
                  </label>

                  {/* Key numbers */}
                  <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-secondary p-5">
                    {[
                      ['Avg package', selectedCompany.avgPackage],
                      ['Highest package', selectedCompany.highestPackage],
                      ['Min CGPA cut-off', `${selectedCompany.minCgpa} CGPA`],
                      ['Max backlogs', `${selectedCompany.maxBacklogs} allowed`],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs text-muted-foreground">{k}</dt>
                        <dd className="mt-1 text-lg font-semibold">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  {/* HR contact */}
                  <section className="space-y-3">
                    <h4 className="text-sm font-semibold">Primary HR contact</h4>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                        <Users className="w-4 h-4" />
                      </span>
                      <div className="min-w-0 text-sm">
                        <p className="font-medium">{selectedCompany.hrContact.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{selectedCompany.hrContact.email}</p>
                        <p className="text-xs text-muted-foreground">{selectedCompany.hrContact.phone}</p>
                      </div>
                    </div>
                  </section>

                  {/* Branches */}
                  <section className="space-y-3">
                    <h4 className="text-sm font-semibold">Eligible branches</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCompany.allowedBranches.map((br) => (
                        <span key={br} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                          {br}
                        </span>
                      ))}
                    </div>
                  </section>

                  {/* Description */}
                  <section className="space-y-3">
                    <h4 className="text-sm font-semibold">About & location</h4>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>
                        <span className="block text-xs text-foreground">Headquarters</span>
                        {selectedCompany.location}
                      </p>
                      <p className="leading-relaxed">
                        <span className="block text-xs text-foreground">Overview & requirements</span>
                        {selectedCompany.description}
                      </p>
                    </div>
                  </section>
                </div>

                {/* Footer Actions */}
                <div className="flex shrink-0 gap-2 border-t border-border px-6 py-4">
                  <Button variant="tertiary" size="md" fullWidth onClick={() => setIsDrawerOpen(false)}>
                    Close
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    fullWidth
                    onClick={() => handleDeleteCompanyAction(selectedCompany.id)}
                  >
                    Delete company
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
