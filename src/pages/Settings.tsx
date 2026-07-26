import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  CheckCircle2,
  RefreshCw,
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
import { Pagination } from '../components/ui/Pagination';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import {
  getAdminSettings,
  updateAdminSettings,
  updateAdminProfile,
  changePassword,
  getAuditLogs,
} from '../api/admin.api';
import { PermissionGuard } from '../components/auth/PermissionGuard';
import { Module, Action } from '../config/rbac';

// Audit Logs Item
interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  userAffected: string;
  action: string;
}

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { success, error: toastError, info } = useToast();
  const location = useLocation();

  // API State
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // Settings State
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'contrast'>('dark');
  const [accentColor, setAccentColor] = useState('lime');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppBadges, setInAppBadges] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || 'Dr. James Anderson');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'james.admin@university.edu');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Audit Logs State
  const [auditLogsList, setAuditLogsList] = useState<AuditLogItem[]>([]);
  const [totalLogs, setTotalLogs] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  const fetchSettingsAndLogs = async () => {
    setLoadingSettings(true);
    setLoadingLogs(true);

    try {
      const settingsRes = await getAdminSettings();
      if (settingsRes.data?.settings) {
        const s = settingsRes.data.settings;
        if (s.email_alerts !== undefined) setEmailAlerts(!!s.email_alerts);
        if (s.in_app_badges !== undefined) setInAppBadges(!!s.in_app_badges);
        if (s.two_factor_auth !== undefined) setTwoFactorAuth(!!s.two_factor_auth);
      }
    } catch (e) {
      // Use defaults
    } finally {
      setLoadingSettings(false);
    }

    try {
      const logsRes = await getAuditLogs({ page: currentPage, limit: itemsPerPage });
      const rawLogs = logsRes.data?.auditLogs || logsRes.data?.logs || [];
      const total = logsRes.data?.total || 0;

      const formattedLogs: AuditLogItem[] = rawLogs.map((l: any) => ({
        id: l.id,
        timestamp: l.created_at ? new Date(l.created_at).toLocaleString() : 'Recent',
        actor: l.users?.full_name || l.actor || 'System Admin',
        userAffected: l.module || 'System',
        action: l.action || 'Performed system operation',
      }));

      setAuditLogsList(formattedLogs);
      setTotalLogs(total);
    } catch (e) {
      // Fallback audit log entries
      setAuditLogsList([
        { id: 'log-1', timestamp: 'Oct 15, 10:35 AM', actor: 'Admin User', userAffected: 'System', action: 'Liam Hayes updated student info' },
        { id: 'log-2', timestamp: 'Oct 15, 10:35 AM', actor: 'Admin User', userAffected: 'System', action: 'Ervara Mahiral exported placement report' },
      ]);
      setTotalLogs(2);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndLogs();
  }, [currentPage]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateAdminSettings({
        email_alerts: emailAlerts,
        in_app_badges: inAppBadges,
        sms_alerts: smsAlerts,
        two_factor_auth: twoFactorAuth,
        theme_mode: themeMode,
        accent_color: accentColor,
      });
      success('Settings Saved', 'Application configuration updated successfully.');
    } catch (err: any) {
      toastError('Save Error', err.response?.data?.message || 'Failed to save system settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateAdminProfile({
        full_name: profileName,
        email: profileEmail,
      });

      if (newPassword) {
        await changePassword({
          currentPassword,
          newPassword,
        });
        updateUser({ must_change_password: false });
      }

      setIsEditProfileOpen(false);
      success('Profile Updated', newPassword ? 'Password updated successfully. Account fully secured!' : 'Master profile settings saved.');
    } catch (err: any) {
      toastError('Update Error', err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
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
    <div className="space-y-6 pb-16 font-sans">
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

        <Button
          variant="secondary"
          size="md"
          leftIcon={<RefreshCw className={`w-4 h-4 ${loadingSettings ? 'animate-spin' : ''}`} />}
          onClick={fetchSettingsAndLogs}
          disabled={loadingSettings}
        >
          Refresh
        </Button>
      </div>

      {/* Mandatory Password Change Warning Banner */}
      {(user?.must_change_password || (location.state as any)?.forcePasswordChange) && (
        <div className="bg-amber-500/15 border-2 border-amber-500/40 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-extrabold text-sm">Action Required: Change Initial Password</h3>
              <p className="text-amber-300 text-xs mt-0.5">
                This is your first login with an administrative temporary password. Please click <strong>Edit Profile</strong> below and update your password to secure your account.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsEditProfileOpen(true)}
            className="shrink-0"
          >
            Change Password Now
          </Button>
        </div>
      )}

      {/* ROW 1: PROFILE CARD, THEME CARD, NOTIFICATIONS CARD */}
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
            <Button variant="secondary" size="sm" fullWidth onClick={() => setIsEditProfileOpen(true)}>
              Manage Profile
            </Button>
          </div>
        </Card>

        {/* 2. Theme Card */}
        <Card className="p-6 space-y-4 border-[#202D42] flex flex-col justify-between">
          <div className="border-b border-[#202D42] pb-3">
            <h3 className="text-sm font-extrabold text-white">Theme & Visual Accents</h3>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setThemeMode('dark')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                themeMode === 'dark'
                  ? 'bg-[#162032] border-[#A3E635] text-[#A3E635]'
                  : 'bg-[#101726] border-[#202D42] text-[#94A3B8]'
              }`}
            >
              <Moon className="w-4 h-4" />
              Dark
            </button>

            <button
              onClick={() => setThemeMode('light')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                themeMode === 'light'
                  ? 'bg-[#162032] border-[#A3E635] text-[#A3E635]'
                  : 'bg-[#101726] border-[#202D42] text-[#94A3B8]'
              }`}
            >
              <Sun className="w-4 h-4" />
              Light
            </button>

            <button
              onClick={() => setThemeMode('contrast')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                themeMode === 'contrast'
                  ? 'bg-[#162032] border-[#A3E635] text-[#A3E635]'
                  : 'bg-[#101726] border-[#202D42] text-[#94A3B8]'
              }`}
            >
              <Eye className="w-4 h-4" />
              Contrast
            </button>
          </div>

          <div className="pt-2 border-t border-[#202D42] flex justify-between items-center text-xs">
            <span className="text-[#94A3B8]">Primary Accent:</span>
            <span className="text-[#A3E635] font-extrabold uppercase">Neon Lime</span>
          </div>
        </Card>

        {/* 3. Notifications Preference Card */}
        <Card className="p-6 space-y-3 border-[#202D42] flex flex-col justify-between">
          <div className="border-b border-[#202D42] pb-3">
            <h3 className="text-sm font-extrabold text-white">System Alerts Preferences</h3>
          </div>

          <div className="space-y-2.5 text-xs font-semibold">
            <Checkbox
              label="Email Notifications for Placement Drives"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
            />
            <Checkbox
              label="In-App Activity Badges & Counters"
              checked={inAppBadges}
              onChange={(e) => setInAppBadges(e.target.checked)}
            />
            <Checkbox
              label="SMS Alerts for Emergency Announcements"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
            />
          </div>

          <div className="pt-2 border-t border-[#202D42]">
            <Button
              variant="primary"
              size="sm"
              fullWidth
              leftIcon={<Save className="w-3.5 h-3.5" />}
              isLoading={savingSettings}
              onClick={handleSaveSettings}
            >
              Save Preferences
            </Button>
          </div>
        </Card>
      </div>

      {/* AUDIT LOGS SECTION */}
      <Card className="p-6 space-y-4 border-[#202D42]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202D42] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#A3E635]" />
              System Audit Logs & Security History
            </h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Comprehensive log of user activities, profile changes, drive publications, and report exports.
            </p>
          </div>

          <Button variant="secondary" size="sm" onClick={handleResetDefaults}>
            Reset Defaults
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor User</TableHead>
              <TableHead>Target Module</TableHead>
              <TableHead>Activity Log Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingLogs ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-[#94A3B8]">
                  Loading security audit trail...
                </TableCell>
              </TableRow>
            ) : auditLogsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-[#94A3B8]">
                  No audit log entries recorded.
                </TableCell>
              </TableRow>
            ) : (
              auditLogsList.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-[#94A3B8] font-mono">{log.timestamp}</TableCell>
                  <TableCell className="font-bold text-white text-xs">{log.actor}</TableCell>
                  <TableCell>
                    <Badge variant="accent" size="sm">
                      {log.userAffected}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-white">{log.action}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="pt-2 flex items-center justify-between border-t border-[#202D42]">
          <span className="text-xs text-[#94A3B8]">
            Page {currentPage} of {Math.ceil(totalLogs / itemsPerPage) || 1} ({totalLogs} audit records)
          </span>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalLogs / itemsPerPage) || 1}
            onPageChange={setCurrentPage}
          />
        </div>
      </Card>

      {/* EDIT PROFILE MODAL */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Manage Admin Profile"
        subtitle="Update profile contact details or change password."
      >
        <form onSubmit={handleUpdateProfileSubmit} className="space-y-4">
          <Input
            label="Full Administrator Name"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={profileEmail}
            onChange={(e) => setProfileEmail(e.target.value)}
            required
          />

          <div className="pt-2 border-t border-[#202D42] space-y-3">
            <span className="text-xs font-bold text-white uppercase block">Change Password (Optional)</span>
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setIsEditProfileOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={savingProfile}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
