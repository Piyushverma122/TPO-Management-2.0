import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Sun,
  Moon,
  Eye,
  Lock,
  Key,
  Database,
  Users,
  Check,
  Edit,
  Plus,
  RefreshCcw,
  Save,
  Sparkles,
  Search,
  CheckCircle2
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Checkbox } from '../components/ui/Checkbox';
import { Dropdown } from '../components/ui/Dropdown';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

// Audit Logs Item
interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  userAffected: string;
  action: string;
}

const auditLogs: AuditLogItem[] = [
  { id: 'log-1', timestamp: 'Oct 15, 10:35 AM', actor: 'Actor 2', userAffected: 'Actor 2', action: 'Liam Hayes updated student info' },
  { id: 'log-2', timestamp: 'Oct 15, 10:35 AM', actor: 'Actor 3', userAffected: 'Actor 3', action: 'Ervara Mahiral exported a report' },
  { id: 'log-3', timestamp: 'Oct 15, 10:35 AM', actor: 'Actor 2', userAffected: 'Actor 3', action: 'James Name created a new user' },
  { id: 'log-4', timestamp: 'Oct 15, 10:35 AM', actor: 'Actor 3', userAffected: 'Actor 3', action: 'Ervara Mahiral exported a report' },
  { id: 'log-5', timestamp: 'Oct 15, 10:35 AM', actor: 'Actor 2', userAffected: 'Actor 3', action: 'James Name created a new user' },
];

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, info } = useToast();

  // Settings State
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'contrast'>('dark');
  const [accentColor, setAccentColor] = useState('lime');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppBadges, setInAppBadges] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Form State
  const [profileName, setProfileName] = useState(user?.name || 'Dr. James Anderson');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'james.admin@university.edu');

  const handleSaveSettings = () => {
    success('Settings Saved', 'Application configuration updated successfully.');
  };

  const handleResetDefaults = () => {
    setThemeMode('dark');
    setAccentColor('lime');
    setEmailAlerts(true);
    setInAppBadges(true);
    setSmsAlerts(false);
    setTwoFactorAuth(true);
    info('Reset to Defaults', 'Restored default application preferences.');
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Settings Page' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-1">
            Settings & System Preferences
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              System Admin
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Manage your personal profile, theme accents, notification alerts, user permissions, and security policies.
          </p>
        </div>
      </div>

      {/* ROW 1: PROFILE CARD, THEME CARD, NOTIFICATIONS CARD strictly matching Design Settings Page..jpg */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. My Profile Card */}
        <Card className="p-6 space-y-4 border-[#202D42] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#202D42] pb-3">
            <h3 className="text-sm font-extrabold text-white">My Profile</h3>
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-[#101726] border border-[#202D42] text-xs font-semibold text-[#A3E635] hover:border-[#A3E635]/40 transition-all"
            >
              Edit
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Avatar src={user?.avatar} name={profileName} size="lg" border borderColor="border-[#A3E635]" />
            <div className="truncate">
              <h4 className="text-base font-extrabold text-white truncate">{profileName}</h4>
              <p className="text-xs text-[#A3E635] font-semibold">Role: Senior Admin</p>
              <p className="text-[11px] text-[#94A3B8] truncate">{profileEmail}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#202D42]">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => setIsEditProfileOpen(true)}
            >
              Manage Profile
            </Button>
          </div>
        </Card>

        {/* 2. Theme Card */}
        <Card className="p-6 space-y-4 border-[#202D42] flex flex-col justify-between">
          <div className="border-b border-[#202D42] pb-3">
            <h3 className="text-sm font-extrabold text-white">Theme & Visual Accents</h3>
          </div>

          {/* Dark / Light / High Contrast Switcher */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setThemeMode('dark')}
              className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                themeMode === 'dark'
                  ? 'bg-[#162032] border-[#A3E635] text-[#A3E635] shadow-[0_0_10px_rgba(163,230,53,0.2)]'
                  : 'bg-[#101726] border-[#202D42] text-[#94A3B8]'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark</span>
            </button>

            <button
              type="button"
              onClick={() => setThemeMode('light')}
              className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                themeMode === 'light'
                  ? 'bg-[#162032] border-[#A3E635] text-[#A3E635]'
                  : 'bg-[#101726] border-[#202D42] text-[#94A3B8]'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => setThemeMode('contrast')}
              className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                themeMode === 'contrast'
                  ? 'bg-[#162032] border-[#A3E635] text-[#A3E635]'
                  : 'bg-[#101726] border-[#202D42] text-[#94A3B8]'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Contrast</span>
            </button>
          </div>

          {/* Primary Accent Color Pickers */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-semibold text-[#94A3B8]">Primary Accent Color</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAccentColor('lime')}
                className={`w-6 h-6 rounded-full bg-[#A3E635] border-2 transition-all ${accentColor === 'lime' ? 'border-white scale-110' : 'border-transparent'}`}
              />
              <button
                onClick={() => setAccentColor('cyan')}
                className={`w-6 h-6 rounded-full bg-sky-400 border-2 transition-all ${accentColor === 'cyan' ? 'border-white scale-110' : 'border-transparent'}`}
              />
              <button
                onClick={() => setAccentColor('purple')}
                className={`w-6 h-6 rounded-full bg-purple-500 border-2 transition-all ${accentColor === 'purple' ? 'border-white scale-110' : 'border-transparent'}`}
              />
            </div>
          </div>
        </Card>

        {/* 3. Notifications Card */}
        <Card className="p-6 space-y-4 border-[#202D42] flex flex-col justify-between">
          <div className="border-b border-[#202D42] pb-3">
            <h3 className="text-sm font-extrabold text-white">Notification Alerts</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8] font-semibold">Email Alerts</span>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#A3E635] cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8] font-semibold">In-App Badges</span>
              <input
                type="checkbox"
                checked={inAppBadges}
                onChange={(e) => setInAppBadges(e.target.checked)}
                className="w-4 h-4 accent-[#A3E635] cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8] font-semibold">SMS Alerts</span>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#A3E635] cursor-pointer"
              />
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => info('Review Notifications', 'Notification preferences reviewed.')}
          >
            Review Settings
          </Button>
        </Card>

      </div>

      {/* ROW 2: SYSTEM SETTINGS, USERS LIST, PERMISSIONS MATRIX strictly matching design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* System Settings Card */}
        <Card className="p-6 space-y-4 border-[#202D42] flex flex-col justify-between">
          <div className="border-b border-[#202D42] pb-3">
            <h3 className="text-sm font-extrabold text-white">System Settings</h3>
          </div>

          <div className="space-y-2 text-xs text-[#94A3B8]">
            <p><strong className="text-white">Basic info:</strong> Campus Placement Portal</p>
            <p><strong className="text-white">College Name:</strong> State University of Technology</p>
            <p><strong className="text-white">Drive settings:</strong> Min duration 7 days, 10 max applications/student</p>
          </div>

          <Button variant="secondary" size="sm" fullWidth onClick={() => info('System Config', 'Managing system params...')}>
            Manage System
          </Button>
        </Card>

        {/* Users Card */}
        <Card className="p-6 space-y-4 border-[#202D42] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#202D42] pb-3">
            <h3 className="text-sm font-extrabold text-white">Users</h3>
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="text-xs font-bold text-[#A3E635] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add User
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#101726] border border-[#202D42]">
              <span className="font-bold text-white">Liam Hayes</span>
              <Badge variant="active" size="sm">Admin</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#101726] border border-[#202D42]">
              <span className="font-bold text-white">Ervara Mahiral</span>
              <Badge variant="info" size="sm">Recruiter</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#101726] border border-[#202D42]">
              <span className="font-bold text-white">Rahul Sharma</span>
              <Badge variant="neutral" size="sm">Student User</Badge>
            </div>
          </div>

          <Button variant="secondary" size="sm" fullWidth onClick={() => setIsAddUserOpen(true)}>
            Add New User
          </Button>
        </Card>

        {/* Permissions Matrix Card */}
        <Card className="p-6 space-y-4 border-[#202D42] flex flex-col justify-between">
          <div className="border-b border-[#202D42] pb-3">
            <h3 className="text-sm font-extrabold text-white">Permissions Matrix</h3>
          </div>

          {/* Simple Permissions Table Grid */}
          <div className="text-[10px] space-y-1.5">
            <div className="grid grid-cols-4 font-bold text-[#94A3B8] border-b border-[#202D42] pb-1">
              <span>Roles</span><span>Students</span><span>Drives</span><span>Settings</span>
            </div>
            <div className="grid grid-cols-4 text-white font-medium py-1">
              <span className="font-bold text-[#A3E635]">Admin</span><span>✓</span><span>✓</span><span>✓</span>
            </div>
            <div className="grid grid-cols-4 text-[#94A3B8] py-1 border-t border-[#202D42]/60">
              <span className="font-bold text-white">Recruiter</span><span>✓</span><span>✓</span><span>—</span>
            </div>
            <div className="grid grid-cols-4 text-[#94A3B8] py-1 border-t border-[#202D42]/60">
              <span className="font-bold text-white">Student</span><span>✓</span><span>—</span><span>—</span>
            </div>
          </div>

          <Button variant="secondary" size="sm" fullWidth onClick={() => info('Role Matrix', 'Editing role permissions matrix...')}>
            Edit Roles
          </Button>
        </Card>

      </div>

      {/* ROW 3: SECURITY CENTER & AUDIT LOGS TABLE strictly matching design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Security Center (4 cols) */}
        <Card className="lg:col-span-4 p-6 space-y-4 border-[#202D42] flex flex-col justify-between">
          <div className="border-b border-[#202D42] pb-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#A3E635]" />
              Security Center
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#101726] border border-[#202D42]">
              <span className="font-semibold text-white">Login Security (2FA)</span>
              <input
                type="checkbox"
                checked={twoFactorAuth}
                onChange={(e) => setTwoFactorAuth(e.target.checked)}
                className="w-4 h-4 accent-[#A3E635] cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#101726] border border-[#202D42]">
              <span className="font-semibold text-white">Password Policy</span>
              <span className="font-bold text-[#A3E635]">Strong</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#101726] border border-[#202D42]">
              <span className="font-semibold text-white">IP Whitelisting</span>
              <span className="font-bold text-sky-400">Enabled</span>
            </div>
          </div>

          <Button variant="secondary" size="sm" fullWidth onClick={() => info('Security Audit', 'Reviewing security logs...')}>
            Review Security
          </Button>
        </Card>

        {/* Audit Logs Table (8 cols) strictly matching Design Settings Page..jpg */}
        <Card className="lg:col-span-8 p-6 space-y-4 border-[#202D42]">
          <div className="flex items-center justify-between border-b border-[#202D42] pb-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-[#A3E635]" />
              Audit Logs
            </h3>
            <span className="text-xs text-[#94A3B8]">Real-time Event Logging</span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs font-mono text-[#94A3B8]">{log.timestamp}</TableCell>
                  <TableCell className="font-bold text-white">{log.actor}</TableCell>
                  <TableCell className="text-xs text-white">{log.action}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

      </div>

      {/* FOOTER ACTIONS BAR strictly matching Design Settings Page..jpg */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#202D42]">
        <Button
          variant="secondary"
          size="md"
          leftIcon={<RefreshCcw className="w-4 h-4" />}
          onClick={handleResetDefaults}
        >
          Reset to Defaults
        </Button>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Save className="w-4 h-4" />}
          onClick={handleSaveSettings}
          className="px-8 font-extrabold shadow-[0_0_15px_rgba(163,230,53,0.3)]"
        >
          Save Settings
        </Button>
      </div>

      {/* EDIT PROFILE MODAL */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Edit Profile Information"
        subtitle="Update personal administrator profile data."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setIsEditProfileOpen(false);
            success('Profile Updated', 'Your profile details have been saved.');
          }}
          className="space-y-4"
        >
          <Input label="Full Name" value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
          <Input label="Email Address" type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} required />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setIsEditProfileOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ADD USER MODAL */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Add System User"
        subtitle="Grant console access to a new administrator or recruiter."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setIsAddUserOpen(false);
            success('User Added', 'New user account created.');
          }}
          className="space-y-4"
        >
          <Input label="User Name" placeholder="e.g. Alex Rivera" required />
          <Input label="Email" type="email" placeholder="alex@university.edu" required />
          <Dropdown
            label="Console Role"
            options={[
              { label: 'Administrator', value: 'Admin' },
              { label: 'Recruiter', value: 'Recruiter' },
              { label: 'Student User', value: 'Student User' },
            ]}
            value="Recruiter"
            onChange={() => {}}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Create User
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
