import React, { useState, useMemo } from 'react';
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
  Sparkles
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

// Initial Companies List
const initialCompanies: Company[] = [
  {
    id: 'cmp-1',
    name: 'Amazon',
    logo: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=120',
    industry: 'E-commerce & Tech',
    website: 'https://amazon.jobs',
    tier: 'Super Dream',
    minCgpa: 8.0,
    allowedBranches: ['Computer Science', 'IT'],
    maxBacklogs: 0,
    hrContact: {
      name: 'Sarah Jenkins',
      email: 'sjenkins-recruitment@amazon.com',
      phone: '+1 415 890 1234',
    },
    visitedYear: 2024,
    hiredCount: 25,
    avgPackage: '₹28 LPA',
    highestPackage: '₹45 LPA',
    status: 'Active',
  },
  {
    id: 'cmp-2',
    name: 'Google',
    logo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&q=80&w=120',
    industry: 'Technology & Cloud',
    website: 'https://careers.google.com',
    tier: 'Super Dream',
    minCgpa: 8.5,
    allowedBranches: ['Computer Science', 'IT', 'EE'],
    maxBacklogs: 0,
    hrContact: {
      name: 'Michael Chang',
      email: 'mchang-campus@google.com',
      phone: '+1 650 253 0000',
    },
    visitedYear: 2024,
    hiredCount: 20,
    avgPackage: '₹32 LPA',
    highestPackage: '₹48 LPA',
    status: 'Active',
  },
  {
    id: 'cmp-3',
    name: 'Deloitte',
    logo: 'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&q=80&w=120',
    industry: 'Consulting & Advisory',
    website: 'https://deloitte.com/careers',
    tier: 'Dream',
    minCgpa: 7.0,
    allowedBranches: ['Computer Science', 'IT', 'Mechanical', 'Civil', 'Electronics'],
    maxBacklogs: 1,
    hrContact: {
      name: 'Ananya Deshmukh',
      email: 'adeshmukh@deloitte.com',
      phone: '+91 98201 11223',
    },
    visitedYear: 2024,
    hiredCount: 45,
    avgPackage: '₹12.5 LPA',
    highestPackage: '₹18 LPA',
    status: 'Active',
  },
  {
    id: 'cmp-4',
    name: 'IBM',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=120',
    industry: 'Enterprise Software',
    website: 'https://ibm.com/employment',
    tier: 'Dream',
    minCgpa: 7.2,
    allowedBranches: ['Computer Science', 'IT', 'EE'],
    maxBacklogs: 0,
    hrContact: {
      name: 'David Vance',
      email: 'dvance@ibm.com',
      phone: '+1 800 426 4968',
    },
    visitedYear: 2024,
    hiredCount: 30,
    avgPackage: '₹14 LPA',
    highestPackage: '₹22 LPA',
    status: 'Upcoming',
  },
  {
    id: 'cmp-5',
    name: 'Tech Mahindra',
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=120',
    industry: 'IT Services',
    website: 'https://techmahindra.com',
    tier: 'Mass Recruiter',
    minCgpa: 6.5,
    allowedBranches: ['All Branches'],
    maxBacklogs: 2,
    hrContact: {
      name: 'Rakesh Verma',
      email: 'rverma@techmahindra.com',
      phone: '+91 98190 44332',
    },
    visitedYear: 2024,
    hiredCount: 80,
    avgPackage: '₹6.5 LPA',
    highestPackage: '₹9.0 LPA',
    status: 'Completed',
  },
  {
    id: 'cmp-6',
    name: 'Infosys',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=120',
    industry: 'IT Services',
    website: 'https://infosys.com/careers',
    tier: 'Mass Recruiter',
    minCgpa: 6.5,
    allowedBranches: ['All Branches'],
    maxBacklogs: 1,
    hrContact: {
      name: 'Pooja Hegde',
      email: 'pooja_h@infosys.com',
      phone: '+91 80 2852 0261',
    },
    visitedYear: 2024,
    hiredCount: 95,
    avgPackage: '₹7.5 LPA',
    highestPackage: '₹11 LPA',
    status: 'Completed',
  },
];

export const Companies: React.FC = () => {
  const navigate = useNavigate();
  const { success, info } = useToast();
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // New Company Form State
  const [newCmpName, setNewCmpName] = useState('');
  const [newCmpRole, setNewCmpRole] = useState('Software Engineer I');
  const [newCmpWebsite, setNewCmpWebsite] = useState('www.example.com');
  const [newCmpLocation, setNewCmpLocation] = useState('Bengaluru, India');
  const [newCmpCtc, setNewCmpCtc] = useState('₹20-₹28 LPA');
  const [newCmpIndustry, setNewCmpIndustry] = useState('E-commerce & Tech');

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.highestPackage.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesIndustry = selectedIndustry === 'All' || c.industry.includes(selectedIndustry);
      const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;

      return matchesSearch && matchesIndustry && matchesStatus;
    });
  }, [companies, searchQuery, selectedIndustry, selectedStatus]);

  const handleOpenDetails = (cmp: Company) => {
    setSelectedCompany(cmp);
    setIsDrawerOpen(true);
  };

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCmpName) return;

    const newCompany: Company = {
      id: `cmp-${Date.now()}`,
      name: newCmpName,
      logo: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=120',
      industry: newCmpIndustry,
      website: newCmpWebsite,
      tier: 'Super Dream',
      minCgpa: 8.0,
      allowedBranches: ['Computer Science', 'IT'],
      maxBacklogs: 0,
      hrContact: {
        name: 'HR Manager',
        email: `hr@${newCmpName.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: '+91 99000 11223',
      },
      visitedYear: 2024,
      hiredCount: 25,
      avgPackage: newCmpCtc,
      highestPackage: newCmpCtc,
      status: 'Active',
    };

    setCompanies([newCompany, ...companies]);
    setIsAddModalOpen(false);
    setNewCmpName('');
    success('Company Onboarded', `${newCmpName} added to placement portal.`);
  };

  return (
    <div className="space-y-6 pb-12 relative">
      
      {/* Page Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Company Management</h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Corporate recruiters, job openings, CTC packages, and placement drives history.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Grid vs Table View Switcher */}
          <div className="bg-[#101726] border border-[#202D42] p-1 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid' ? 'bg-[#A3E635] text-[#0B0F17]' : 'text-[#94A3B8] hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table' ? 'bg-[#A3E635] text-[#0B0F17]' : 'text-[#94A3B8] hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/companies/add')}
            className="font-extrabold text-xs"
          >
            + Add Company
          </Button>
        </div>
      </div>

      {/* TOP 4 METRIC CARDS ROW strictly matching Design Company Management..jpg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Companies */}
        <Card className="p-5 space-y-2">
          <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Total Companies
          </span>
          <div className="text-3xl font-extrabold text-white">280+</div>
          <div className="h-10 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={totalCompaniesSparkline}>
                <Bar dataKey="v" fill="#A3E635" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Card 2: Active Drive Companies */}
        <Card className="p-5 space-y-2">
          <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Active Drive Companies
          </span>
          <div className="text-3xl font-extrabold text-white">65</div>
          <div className="h-10 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeSparkline}>
                <Area type="monotone" dataKey="v" stroke="#A3E635" fill="#A3E635" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Card 3: HIGHLIGHTED NEON GREEN Top CTC Offered */}
        <Card variant="accent" className="p-5 space-y-2 relative overflow-hidden shadow-[0_0_30px_rgba(163,230,53,0.35)]">
          <span className="text-xs font-extrabold text-[#0B0F17]/80 uppercase tracking-wider block">
            Top CTC Offered (₹)
          </span>
          <div className="text-3xl font-extrabold text-[#0B0F17]">₹48 LPA</div>
          <div className="h-10 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={topCtcSparkline}>
                <Line type="monotone" dataKey="v" stroke="#0B0F17" strokeWidth={3} dot={{ fill: '#0B0F17', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Card 4: Total Positions Offered */}
        <Card className="p-5 space-y-2">
          <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Total Positions Offered
          </span>
          <div className="text-3xl font-extrabold text-white flex items-center justify-between">
            <span>2,100+</span>
            <RadialProgress value={75} size={48} strokeWidth={5} />
          </div>
        </Card>

      </div>

      {/* SEARCH & FILTER CONTROLS BAR */}
      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          <div className="lg:col-span-2">
            <SearchInput
              placeholder="Search Companies by name, industry, or CTC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm"
            />
          </div>

          <Dropdown
            label="Industry:"
            options={[
              { label: 'All Industries', value: 'All' },
              { label: 'E-commerce & Tech', value: 'Tech' },
              { label: 'Consulting & Advisory', value: 'Consulting' },
              { label: 'Enterprise Software', value: 'Software' },
              { label: 'IT Services', value: 'IT Services' },
            ]}
            value={selectedIndustry}
            onChange={setSelectedIndustry}
          />

          <Dropdown
            label="Drive Status:"
            options={[
              { label: 'All Statuses', value: 'All' },
              { label: 'Active', value: 'Active' },
              { label: 'Upcoming', value: 'Upcoming' },
              { label: 'Completed', value: 'Completed' },
            ]}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />
        </div>
      </Card>

      {/* VIEW MODE 1: COMPANY CARDS GRID strictly matching Design Company Management..jpg */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((cmp) => (
            <motion.div
              key={cmp.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card glowOnHover className="p-6 space-y-4 border-[#202D42]">
                
                {/* Card Header (Logo + Name + Status Badge) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={cmp.logo} alt={cmp.name} className="w-12 h-12 rounded-xl object-cover border border-[#202D42]" />
                    <div>
                      <h3 className="text-lg font-extrabold text-white leading-tight">{cmp.name}</h3>
                      <p className="text-xs text-[#94A3B8]">{cmp.industry}</p>
                    </div>
                  </div>
                  <StatusBadge status={cmp.status} size="sm" />
                </div>

                {/* Package Tag Pill matching design CTC: ₹28-₹45 LPA */}
                <div className="bg-[#101726] border border-[#202D42] rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#94A3B8]">Offered Package:</span>
                  <span className="text-sm font-extrabold text-[#A3E635]">CTC: {cmp.avgPackage} - {cmp.highestPackage}</span>
                </div>

                {/* Details Breakdown Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs text-[#94A3B8] pt-1">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#64748B]">Drive Date</span>
                    <span className="font-bold text-white">Oct 25, 2024</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#64748B]">Eligibility</span>
                    <span className="font-bold text-white">CGPA &gt; {cmp.minCgpa}</span>
                  </div>
                  <div className="pt-2">
                    <span className="block text-[10px] uppercase font-bold text-[#64748B]">Open Positions</span>
                    <span className="font-bold text-white">{cmp.hiredCount} Seats</span>
                  </div>
                  <div className="pt-2">
                    <span className="block text-[10px] uppercase font-bold text-[#64748B]">Apps / Offers</span>
                    <span className="font-bold text-[#A3E635]">150 / 15</span>
                  </div>
                </div>

                {/* Action Buttons Row matching design View Details & Manage Drive */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#202D42]">
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => handleOpenDetails(cmp)}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="tertiary"
                    size="sm"
                    fullWidth
                    onClick={() => info('Manage Drive', `Managing drive settings for ${cmp.name}`)}
                  >
                    Manage Drive
                  </Button>
                </div>

              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        /* VIEW MODE 2: COMPANY TABLE VIEW */
        <Card className="p-6 space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Highest Package</TableHead>
                <TableHead>Min CGPA</TableHead>
                <TableHead>Positions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((cmp) => (
                <TableRow key={cmp.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={cmp.logo} alt={cmp.name} className="w-8 h-8 rounded-lg object-cover border border-[#202D42]" />
                      <span className="font-bold text-white">{cmp.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#94A3B8]">{cmp.industry}</TableCell>
                  <TableCell className="font-extrabold text-[#A3E635]">{cmp.highestPackage}</TableCell>
                  <TableCell className="font-bold text-white">{cmp.minCgpa}</TableCell>
                  <TableCell className="text-white font-semibold">{cmp.hiredCount} Seats</TableCell>
                  <TableCell>
                    <StatusBadge status={cmp.status} size="sm" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handleOpenDetails(cmp)}>
                        Details
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => info('Manage Drive', `Drive options for ${cmp.name}`)}>
                        Manage
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination Footer */}
      <Card className="p-2">
        <Pagination currentPage={currentPage} totalPages={68} onPageChange={setCurrentPage} totalEntries={280} />
      </Card>

      {/* COMPANY DETAILS SLIDE-OVER DRAWER strictly matching Design Company Management..jpg */}
      <AnimatePresence>
        {isDrawerOpen && selectedCompany && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-[#0B0F17]/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full max-w-md bg-[#162032] border-l border-[#202D42] h-full shadow-2xl relative z-10 p-6 overflow-y-auto space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-[#202D42] pb-4">
                  <div className="flex items-center gap-3">
                    <img src={selectedCompany.logo} alt={selectedCompany.name} className="w-10 h-10 rounded-xl object-cover border border-[#202D42]" />
                    <div>
                      <h3 className="text-lg font-extrabold text-white">{selectedCompany.name}</h3>
                      <p className="text-xs text-[#94A3B8]">Company Details ({selectedCompany.name.slice(0, 3).toUpperCase()}-SDE1)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#202D42] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Company Overview Profile */}
                <div className="space-y-2 bg-[#101726] border border-[#202D42] rounded-2xl p-4 text-xs">
                  <span className="font-extrabold text-white block uppercase tracking-wider text-[11px] text-[#A3E635]">
                    Company Profile
                  </span>
                  <p className="text-[#94A3B8] leading-relaxed">
                    {selectedCompany.name} is a global leader in {selectedCompany.industry}. E-e structures, cloud data networks, and campus placements.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>Founded: Oct 25, 2024</span>
                    <span>Industry: {selectedCompany.industry}</span>
                  </div>
                </div>

                {/* Drive History Chart */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block">
                    Drive History Hires
                  </span>
                  <div className="h-28 bg-[#101726] border border-[#202D42] rounded-2xl p-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={driveHistoryData}>
                        <Line type="monotone" dataKey="hires" stroke="#A3E635" strokeWidth={3} dot={{ fill: '#A3E635', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Job Roles Badges */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block">Job Roles</span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="bg-[#101726] border border-[#202D42] text-[#A3E635] text-xs font-bold px-2.5 py-1 rounded-lg">
                      SDE 1
                    </span>
                    <span className="bg-[#101726] border border-[#202D42] text-white text-xs font-medium px-2.5 py-1 rounded-lg">
                      Data Engineer
                    </span>
                    <span className="bg-[#101726] border border-[#202D42] text-white text-xs font-medium px-2.5 py-1 rounded-lg">
                      DevOps
                    </span>
                  </div>
                </div>

                {/* Round Schedule & Contact Info */}
                <div className="space-y-3 bg-[#101726] border border-[#202D42] rounded-2xl p-4 text-xs">
                  <span className="font-extrabold text-white block uppercase tracking-wider text-[11px] text-[#A3E635]">
                    Drive Schedule (Rounds)
                  </span>
                  <div className="space-y-1.5 text-[#94A3B8]">
                    <p><strong className="text-white">Round 1:</strong> Online Assessment (Coding & Aptitude)</p>
                    <p><strong className="text-white">Round 2:</strong> Technical Deep-dive Interview</p>
                    <p><strong className="text-white">Round 3:</strong> HR & Cultural Fitment</p>
                  </div>
                  <div className="pt-2 border-t border-[#202D42]">
                    <span className="font-bold text-white block mb-1">HR Contact List:</span>
                    <p className="text-[#94A3B8]">{selectedCompany.hrContact.name} ({selectedCompany.hrContact.email})</p>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Action Button */}
              <div className="pt-4 border-t border-[#202D42] flex gap-2">
                <Button variant="secondary" size="md" fullWidth onClick={() => setIsDrawerOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => {
                    setIsDrawerOpen(false);
                    success('Action Triggered', `Drive published for ${selectedCompany.name}`);
                  }}
                >
                  Action Button
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD NEW COMPANY MODAL strictly matching Design Add Company page..jpg */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Company"
        subtitle="Onboard a new recruiter partner to the system."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateCompany} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Upload Logo Dropzone */}
            <div className="md:col-span-1 border-2 border-dashed border-[#A3E635]/50 bg-[#101726] rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-2 hover:border-[#A3E635] transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-[#A3E635]" />
              <span className="text-xs font-bold text-white">Upload Logo</span>
              <span className="text-[10px] text-[#64748B]">(Drag & Drop or Click)</span>
            </div>

            {/* Inputs Right Side */}
            <div className="md:col-span-2 space-y-3">
              <Input
                label="Company Name"
                placeholder="e.g. Intel / Microsoft"
                value={newCmpName}
                onChange={(e) => setNewCmpName(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Website"
                  placeholder="www.example.com"
                  value={newCmpWebsite}
                  onChange={(e) => setNewCmpWebsite(e.target.value)}
                />
                <Input
                  label="CTC (Cost to Company)"
                  placeholder="₹20-₹28 LPA"
                  value={newCmpCtc}
                  onChange={(e) => setNewCmpCtc(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Location"
              placeholder="Bengaluru, India"
              value={newCmpLocation}
              onChange={(e) => setNewCmpLocation(e.target.value)}
            />
            <Dropdown
              label="Bond Requirement"
              options={[
                { label: 'None', value: 'None' },
                { label: '1 Year', value: '1 Year' },
                { label: '2 Years', value: '2 Years' },
              ]}
              value="2 Years"
              onChange={() => {}}
            />
          </div>

          {/* Eligibility Criteria Subpanel */}
          <div className="bg-[#101726] border border-[#202D42] rounded-2xl p-4 space-y-3">
            <span className="text-xs font-extrabold text-white block uppercase tracking-wider text-[#A3E635]">
              Eligibility Criteria
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="Allowed Branches" value="Computer Science, IT, EE" readOnly />
              <Input label="Min. CGPA" value="> 8.0" readOnly />
              <Input label="Backlogs Allowed" value="<= 2" readOnly />
            </div>
          </div>

          <Textarea label="Description & Job Role Details" rows={3} placeholder="Company profile, role responsibilities..." />

          <div className="flex justify-end gap-3 pt-2 border-t border-[#202D42]">
            <Button type="button" variant="secondary" size="md" onClick={() => setIsAddModalOpen(false)}>
              Save Draft
            </Button>
            <Button type="submit" variant="primary" size="md">
              Publish
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
