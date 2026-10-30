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

import { Card } from '../components/app/Card';
import { Button } from '../components/app/Button';
import { Badge, StatusBadge } from '../components/app/Badge';
import { Input, SearchInput } from '../components/app/Input';
import { Dropdown } from '../components/app/Dropdown';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/app/Table';
import { Modal } from '../components/app/Modal';
import { Avatar } from '../components/app/Avatar';
import { Breadcrumb } from '../components/app/Breadcrumb';
import { useToast } from '../components/app/Toast';
import { getStudents } from '../api/student.api';
import { getCompanies } from '../api/company.api';
import { Button as ShadButton } from '@/components/ui/button';

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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Users & Access Control' }]} />
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-3">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.total} accounts. Manage admins, recruiters and student access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="tertiary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchUsers}
            disabled={loading}
            className="text-xs"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs shrink-0"
          >
            Add user
          </Button>
        </div>
      </div>

      {/* STATS STRIP */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 [&>div]:border-border max-lg:[&>div:nth-child(n+3)]:border-t lg:[&>div+div]:border-l max-lg:[&>div:nth-child(even)]:border-l">
          {[
            { label: 'Total accounts', value: stats.total, note: 'Active directory', icon: Users },
            { label: 'Admins & officers', value: stats.admins, note: 'System administrators', icon: Shield },
            { label: 'Recruiters', value: stats.recruiters, note: 'Corporate HR accounts', icon: Building2 },
            { label: 'Students', value: stats.students, note: 'Candidate accounts', icon: GraduationCap },
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

      {/* DIRECTORY CARD */}
      <Card className="overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 border-b border-border">
          <div className="flex-1 min-w-0">
            <SearchInput
              placeholder="Search by name, email or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
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
              <ShadButton
                variant="ghost"
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRole('All');
                  setSelectedStatus('All');
                }}
                className="h-10 rounded-full px-4 text-xs text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </ShadButton>
            )}
          </div>
        </div>

        <Table bare>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  No matching user accounts found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar} name={u.name} size="md" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{u.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="neutral"
                      size="sm"
                      icon={
                        u.role === 'super_admin' ? (
                          <Shield className="w-3 h-3" />
                        ) : u.role === 'tpo_officer' ? (
                          <UserCheck className="w-3 h-3" />
                        ) : u.role === 'recruiter' ? (
                          <Building2 className="w-3 h-3" />
                        ) : (
                          <GraduationCap className="w-3 h-3" />
                        )
                      }
                    >
                      {u.role === 'super_admin'
                        ? 'TPO Super Admin'
                        : u.role === 'tpo_officer'
                        ? 'TPO Officer'
                        : u.role === 'recruiter'
                        ? 'Recruiter HR'
                        : 'Student'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.status === 'Active' ? 'success' : 'alert'} size="sm" dot>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      aria-label={`Delete ${u.name}`}
                      title="Delete user"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

          <div className="pt-4 flex justify-end gap-3 border-t border-border">
            <Button variant="secondary" size="md" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" className="font-semibold">
              Create User Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
