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

import { Card } from '../components/app/Card';
import { Button } from '../components/app/Button';
import { Badge } from '../components/app/Badge';
import { Input } from '../components/app/Input';
import { Checkbox } from '../components/app/Checkbox';
import { Dropdown } from '../components/app/Dropdown';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/app/Table';
import { Avatar } from '../components/app/Avatar';
import { Modal } from '../components/app/Modal';
import { Breadcrumb } from '../components/app/Breadcrumb';
import { Pagination } from '../components/app/Pagination';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/app/Toast';
import {
  getAdminSettings,
  updateAdminSettings,
  updateAdminProfile,
  changePassword,
  getAuditLogs,
} from '../api/admin.api';
import { PermissionGuard } from '../components/auth/PermissionGuard';
import { Module, Action } from '../config/rbac';
import { Switch } from '@/components/ui/switch';
import { applyTheme, getStoredTheme } from '@/lib/theme';

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
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(getStoredTheme());
  const [accentColor, setAccentColor] = useState('lime');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppBadges, setInAppBadges] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
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
      setAuditLogsList([]);
      setTotalLogs(0);
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
      if (newPassword) {
        await changePassword({
          currentPassword,
          newPassword,
        });
        updateUser({ must_change_password: false });
      }

      await updateAdminProfile({
        full_name: profileName,
        email: profileEmail,
      });

      setIsEditProfileOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      success('Profile Updated', newPassword ? 'Password updated successfully. Account fully secured!' : 'Master profile settings saved.');
    } catch (err: any) {
      toastError('Update Error', err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResetDefaults = () => {
    setThemeMode('dark');
    applyTheme('dark');
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Settings' }]} />
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-3">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your profile, appearance, notifications and security.
          </p>
        </div>

        <Button
          variant="tertiary"
          size="md"
          leftIcon={<RefreshCw className={`w-4 h-4 ${loadingSettings ? 'animate-spin' : ''}`} />}
          onClick={fetchSettingsAndLogs}
          disabled={loadingSettings}
          className="text-xs"
        >
          Refresh
        </Button>
      </div>

      {/* Mandatory Password Change Warning Banner */}
      {(user?.must_change_password || (location.state as any)?.forcePasswordChange) && (
        <div className="flex flex-col gap-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Action required: change your initial password</h3>
              <p className="mt-0.5 text-xs text-amber-200/80">
                This is your first login with a temporary administrative password. Update it to secure your account.
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsEditProfileOpen(true)} className="shrink-0">
            Change password
          </Button>
        </div>
      )}

      {/* SETTINGS SECTIONS */}
      <Card className="divide-y divide-border">
        {/* Profile */}
        <section className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3 lg:p-8">
          <div>
            <h3 className="text-base font-semibold text-foreground">Profile</h3>
            <p className="mt-1 text-sm text-muted-foreground">Your account identity across the portal.</p>
          </div>
          <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar src={user?.avatar} name={profileName} size="lg" />
              <div className="min-w-0">
                <h4 className="truncate text-base font-semibold text-foreground">{profileName}</h4>
                <p className="truncate text-sm text-muted-foreground">{profileEmail}</p>
                <Badge variant="neutral" size="sm" className="mt-2">Senior Admin</Badge>
              </div>
            </div>
            <Button variant="tertiary" size="md" leftIcon={<Edit className="w-4 h-4" />} onClick={() => setIsEditProfileOpen(true)} className="text-xs">
              Edit profile
            </Button>
          </div>
        </section>

        {/* Appearance */}
        <section className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3 lg:p-8">
          <div>
            <h3 className="text-base font-semibold text-foreground">Appearance</h3>
            <p className="mt-1 text-sm text-muted-foreground">Choose how the portal looks for you.</p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 gap-3 max-w-md">
            {[
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'light', label: 'Light', icon: Sun },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setThemeMode(id as 'dark' | 'light');
                  applyTheme(id as 'dark' | 'light');
                }}
                className={`flex cursor-pointer flex-col items-start gap-6 rounded-2xl border p-4 text-left transition-colors ${
                  themeMode === id
                    ? 'border-foreground/60 bg-secondary text-foreground'
                    : 'border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground'
                }`}
              >
                <span className="flex w-full items-center justify-between">
                  <Icon className="w-5 h-5" />
                  {themeMode === id && <Check className="w-4 h-4" />}
                </span>
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3 lg:p-8">
          <div>
            <h3 className="text-base font-semibold text-foreground">Notifications</h3>
            <p className="mt-1 text-sm text-muted-foreground">Decide which alerts reach you.</p>
          </div>
          <ul className="lg:col-span-2 max-w-xl divide-y divide-border">
            {[
              { label: 'Email notifications', desc: 'Placement drive announcements by email.', checked: emailAlerts, set: setEmailAlerts },
              { label: 'In-app badges', desc: 'Activity badges and unread counters.', checked: inAppBadges, set: setInAppBadges },
              { label: 'SMS alerts', desc: 'Emergency announcements by text message.', checked: smsAlerts, set: setSmsAlerts },
            ].map(({ label, desc, checked, set }) => (
              <li key={label} className="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch checked={checked} onCheckedChange={set} aria-label={label} />
              </li>
            ))}
          </ul>
        </section>

        {/* Save bar */}
        <div className="flex flex-wrap items-center justify-end gap-2 bg-muted px-6 py-4 lg:px-8">
          <Button variant="tertiary" size="md" onClick={handleResetDefaults} className="text-xs">
            Reset defaults
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Save className="w-4 h-4" />}
            isLoading={savingSettings}
            onClick={handleSaveSettings}
            className="text-xs"
          >
            Save preferences
          </Button>
        </div>
      </Card>

      {/* AUDIT LOGS */}
      <Card className="overflow-hidden">
        <div className="flex items-start gap-3 p-6">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
            <Shield className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-foreground">Audit log</h3>
            <p className="text-xs text-muted-foreground">Activity, profile changes, drive publications and report exports.</p>
          </div>
        </div>

        <Table bare>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingLogs ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  Loading security audit trail...
                </TableCell>
              </TableRow>
            ) : auditLogsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No audit log entries recorded.
                </TableCell>
              </TableRow>
            ) : (
              auditLogsList.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{log.timestamp}</TableCell>
                  <TableCell className="text-sm text-foreground">{log.actor}</TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      {log.userAffected}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-foreground">{log.action}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="border-t border-border px-4 py-2">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalLogs / itemsPerPage) || 1}
            onPageChange={setCurrentPage}
            totalEntries={totalLogs}
            pageSize={itemsPerPage}
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

          <div className="pt-2 border-t border-border space-y-3">
            <span className="text-xs font-semibold text-foreground uppercase block">Change Password (Optional)</span>
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
