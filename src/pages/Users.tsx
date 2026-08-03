import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  UserCheck,
  Shield,
  Users,
  Building2,
  GraduationCap,
  Plus,
  X,
  Search,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Edit,
  Trash2,
  Lock,
  Mail,
  RefreshCw,
  Clock,
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';
import { getStudents } from '../api/student.api';
import { getCompanies } from '../api/company.api';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'tpo_admin' | 'tpo_officer' | 'recruiter' | 'student';
  status: 'Active' | 'Inactive' | 'Pending';
  avatar?: string;
  createdAt: string;
}

// Initial Mock User Management Dataset
const INITIAL_USERS: UserRecord[] = [
  {
    id: 'usr-1',
    name: 'Dr. James Anderson',
    email: 'tpo.admin@college.edu',
    role: 'super_admin',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    createdAt: '2024-01-15',
  },
  {
    id: 'usr-2',
    name: 'Prof. Rajesh Sharma',
    email: 'rajesh.tpo@college.edu',
    role: 'tpo_officer',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    createdAt: '2024-02-10',
  },
  {
    id: 'usr-3',
    name: 'Sarah Jenkins',
    email: 'sarah.recruiter@google.com',
    role: 'recruiter',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    createdAt: '2024-03-01',
  },
  {
    id: 'usr-4',
    name: 'Jatin Sahu',
    email: 'jatin.student@college.edu',
    role: 'student',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120',
    createdAt: '2024-08-01',
  },
  {
    id: 'usr-5',
    name: 'Priya Verma',
    email: 'priya.student@college.edu',
    role: 'student',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120',
    createdAt: '2024-08-02',
  },
  {
    id: 'usr-6',
    name: 'Amit Kumar',
    email: 'amit.recruiter@amazon.com',
    role: 'recruiter',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    createdAt: '2024-05-12',
  },
];

export const UsersPage: React.FC = () => {
  const { success, error: toastError, info } = useToast();

  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS);
  const [loading, setLoading] = useState(false);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRecord['role']>('student');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Load real students to sync dataset
      const studentsRes = await getStudents({ limit: 50 });
      const rawStudents = studentsRes.data?.students || [];

      const studentUsers: UserRecord[] = rawStudents.map((s: any) => ({
        id: s.id,
        name: s.users?.full_name || s.name || 'Student Account',
        email: s.users?.email || s.email || 'student@college.edu',
        role: 'student' as const,
        status: 'Active' as const,
        avatar: s.users?.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120',
        createdAt: s.created_at ? new Date(s.created_at).toISOString().split('T')[0] : '2024-08-01',
      }));

      // Combine admin & recruiter defaults with dynamic student accounts
      const adminsAndRecruiters = INITIAL_USERS.filter((u) => u.role !== 'student');
      setUsers([...adminsAndRecruiters, ...studentUsers]);
    } catch (e) {
      console.warn('Syncing user database fallback:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) {
      toastError('Validation Error', 'Full Name and Email are required.');
      return;
    }

    const newUser: UserRecord = {
      id: `usr-${Date.now()}`,
      name: newName,
      email: newEmail,
      role: newRole,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers([newUser, ...users]);
    setIsAddModalOpen(false);
    setNewName('');
    setNewEmail('');
    success('User Created', `${newName} added as ${newRole.replace('_', ' ').toUpperCase()}.`);
  };

  const handleDeleteUser = (id: string, name: string) => {
    setUsers(users.filter((u) => u.id !== id));
    success('User Removed', `User account for ${name} deactivated.`);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = selectedRole === 'All' || u.role === selectedRole;
      const matchesStatus = selectedStatus === 'All' || u.status === selectedStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, selectedRole, selectedStatus]);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'super_admin' || u.role === 'tpo_admin' || u.role === 'tpo_officer').length;
    const recruiters = users.filter((u) => u.role === 'recruiter').length;
    const students = users.filter((u) => u.role === 'student').length;
    return { total, admins, recruiters, students };
  }, [users]);

  return (
    <div className="space-y-6 pb-12 relative font-sans">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Users & Access Control' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3 mt-1">
            User Management
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              {stats.total} Accounts Registered
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Manage system users, TPO administrative access, recruiter accounts, and student permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchUsers}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
            className="font-extrabold text-xs shrink-0"
          >
            Add New User
          </Button>
        </div>
      </div>

      {/* TOP 4 STATISTIC METRIC CARDS ROW */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
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
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">Total Accounts</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">{stats.total}</span>
              <span className="text-[11px] text-[#A3E635] font-semibold mt-1 block">Active directory</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
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
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">TPO Officers & Admins</span>
              <span className="text-2xl font-extrabold text-sky-400 mt-1 block">{stats.admins}</span>
              <span className="text-[11px] text-sky-400 font-semibold mt-1 block">System administrators</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
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
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">Recruiter Partners</span>
              <span className="text-2xl font-extrabold text-amber-400 mt-1 block">{stats.recruiters}</span>
              <span className="text-[11px] text-amber-400 font-semibold mt-1 block">Corporate HR accounts</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
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
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">Registered Students</span>
              <span className="text-2xl font-extrabold text-indigo-400 mt-1 block">{stats.students}</span>
              <span className="text-[11px] text-indigo-400 font-semibold mt-1 block">Candidate accounts</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <Card className="p-3 relative z-30 bg-[#101726] border-[#202D42] shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full min-w-0">
            <SearchInput
              placeholder="Search user by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto shrink-0">
            <Dropdown
              className="w-full sm:w-44 shrink-0"
              options={[
                { label: 'All Roles', value: 'All' },
                { label: 'TPO Admin', value: 'super_admin' },
                { label: 'TPO Officer', value: 'tpo_officer' },
                { label: 'Recruiter', value: 'recruiter' },
                { label: 'Student', value: 'student' },
              ]}
              value={selectedRole}
              onChange={setSelectedRole}
            />

            <Dropdown
              className="w-full sm:w-40 shrink-0"
              options={[
                { label: 'All Statuses', value: 'All' },
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' },
              ]}
              value={selectedStatus}
              onChange={setSelectedStatus}
            />

            {(selectedRole !== 'All' || selectedStatus !== 'All' || searchQuery !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRole('All');
                  setSelectedStatus('All');
                }}
                className="h-10 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 px-3 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* USER MANAGEMENT DATA TABLE */}
      <Card className="p-0 overflow-hidden border-[#202D42]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Account</TableHead>
              <TableHead>System Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-[#94A3B8]">
                  No matching user accounts found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.id} className="hover:bg-[#162032]/60 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar} name={u.name} size="md" />
                      <div>
                        <p className="text-sm font-extrabold text-white">{u.name}</p>
                        <p className="text-xs text-[#94A3B8]">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.role === 'super_admin' ? (
                      <span className="bg-sky-500/15 text-sky-400 border border-sky-500/30 text-xs font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit">
                        <Shield className="w-3.5 h-3.5" />
                        TPO Super Admin
                      </span>
                    ) : u.role === 'tpo_officer' ? (
                      <span className="bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 text-xs font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit">
                        <UserCheck className="w-3.5 h-3.5" />
                        TPO Officer
                      </span>
                    ) : u.role === 'recruiter' ? (
                      <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit">
                        <Building2 className="w-3.5 h-3.5" />
                        Recruiter HR
                      </span>
                    ) : (
                      <span className="bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-xs font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit">
                        <GraduationCap className="w-3.5 h-3.5" />
                        Student
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.status === 'Active' ? (
                      <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold px-2.5 py-0.5 rounded-full inline-block">Active</span>
                    ) : (
                      <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-extrabold px-2.5 py-0.5 rounded-full inline-block">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-[#94A3B8]">
                    {u.createdAt}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* ADD NEW USER MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New System User"
      >
        <form onSubmit={handleAddUser} className="space-y-4 pt-2">
          <Input
            label="Full Name"
            placeholder="e.g. Dr. Rajesh Verma"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. rajesh@college.edu"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />

          <Dropdown
            label="Assign System Role"
            options={[
              { label: 'Student Candidate', value: 'student' },
              { label: 'TPO Administrative Officer', value: 'tpo_officer' },
              { label: 'Corporate Recruiter Partner', value: 'recruiter' },
              { label: 'TPO Super Admin', value: 'super_admin' },
            ]}
            value={newRole}
            onChange={(val) => setNewRole(val as any)}
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-[#202D42]">
            <Button variant="secondary" size="md" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" className="font-extrabold">
              Create User Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
