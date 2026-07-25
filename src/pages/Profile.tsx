import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Shield,
  Key,
  Edit,
  Save,
  RefreshCcw,
  AlertTriangle,
  Lock,
  Smartphone,
  CheckCircle2,
  Sparkles,
  LogOut
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Avatar } from '../components/ui/Avatar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { success, warning, info } = useToast();

  // Profile Form State
  const [fullName, setFullName] = useState(user?.name || 'JAMES ANDERSON');
  const [workEmail, setWorkEmail] = useState(user?.email || 'james.admin@university.edu');
  const [phone, setPhone] = useState('+1 234 567 8900');
  const [employeeId] = useState('TPO-SRA-102');
  const [department] = useState('Computer Science TPO');
  const [jobRole] = useState('Senior Admin');

  // Password State
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [twoFa, setTwoFa] = useState(true);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || newPass !== confirmPass) {
      warning('Password Mismatch', 'New passwords do not match.');
      return;
    }
    setCurrPass('');
    setNewPass('');
    setConfirmPass('');
    success('Password Updated', 'Your security password has been changed.');
  };

  const handleSaveProfile = () => {
    success('Profile Saved', 'Profile changes updated successfully.');
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'My Profile' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-1">
            My Profile & Security Center
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              Verified Administrator
            </span>
          </h1>
        </div>
      </div>

      {/* TOP ROW: PROFILE AVATAR CARD & PERSONAL INFORMATION CARD strictly matching Design User Profile.jpg */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Profile Avatar Card (4 cols) */}
        <Card className="lg:col-span-4 p-6 bg-gradient-to-br from-[#162032] via-[#101726] to-[#162032] border-[#A3E635]/40 text-center space-y-4 shadow-[0_0_20px_rgba(163,230,53,0.1)] flex flex-col justify-center items-center">
          <div className="relative">
            <Avatar
              src={user?.avatar}
              name={fullName}
              size="xl"
              border
              borderColor="border-[#A3E635]"
              className="w-24 h-24 text-2xl shadow-[0_0_25px_rgba(163,230,53,0.4)]"
            />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">{fullName}</h2>
            <p className="text-xs font-semibold text-[#A3E635]">{jobRole}</p>
          </div>

          <Badge variant="active" size="md">
            Member Since: Oct 12, 2021
          </Badge>
        </Card>

        {/* Personal Information Form Card (8 cols) */}
        <Card className="lg:col-span-8 p-6 space-y-4 border-[#202D42]">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider border-b border-[#202D42] pb-3">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[#94A3B8] font-semibold flex items-center justify-between">
                <span>Full Name</span>
                <Edit className="w-3 h-3 text-[#A3E635] cursor-pointer" />
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#101726] border border-[#202D42] rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-[#A3E635]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[#94A3B8] font-semibold flex items-center justify-between">
                <span>Work Email</span>
                <Edit className="w-3 h-3 text-[#A3E635] cursor-pointer" />
              </label>
              <input
                type="email"
                value={workEmail}
                onChange={(e) => setWorkEmail(e.target.value)}
                className="w-full bg-[#101726] border border-[#202D42] rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-[#A3E635]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[#94A3B8] font-semibold flex items-center justify-between">
                <span>Phone Number</span>
                <Edit className="w-3 h-3 text-[#A3E635] cursor-pointer" />
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#101726] border border-[#202D42] rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-[#A3E635]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[#94A3B8] font-semibold">Employee ID</label>
              <div className="bg-[#101726] border border-[#202D42] rounded-xl px-3 py-2 text-white font-mono font-bold">
                {employeeId}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[#94A3B8] font-semibold">Department</label>
              <div className="bg-[#101726] border border-[#202D42] rounded-xl px-3 py-2 text-white font-bold">
                {department}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[#94A3B8] font-semibold">Job Role</label>
              <div className="bg-[#101726] border border-[#202D42] rounded-xl px-3 py-2 text-[#A3E635] font-bold">
                {jobRole}
              </div>
            </div>
          </div>
        </Card>

      </div>

      {/* MIDDLE ROW: CHANGE PASSWORD & SECURITY CENTER / ACTIVITY LOG strictly matching Design User Profile.jpg */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Change Password Card (4 cols) */}
        <Card className="lg:col-span-4 p-6 space-y-4 border-[#202D42] flex flex-col justify-between">
          <div className="border-b border-[#202D42] pb-3">
            <h3 className="text-sm font-extrabold text-white">Change Password</h3>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-3 text-xs">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={currPass}
              onChange={(e) => setCurrPass(e.target.value)}
              required
            />
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              required
            />

            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-[#94A3B8] font-bold uppercase">Password Strength Meter</span>
              <div className="h-2 w-full bg-[#101726] rounded-full overflow-hidden border border-[#202D42]">
                <div className="h-full w-4/5 bg-[#A3E635]" />
              </div>
            </div>

            <Button type="submit" variant="primary" size="sm" fullWidth className="font-extrabold mt-2">
              Update Password
            </Button>
          </form>
        </Card>

        {/* Security Center & Personal Activity Log (8 cols) strictly matching design */}
        <Card className="lg:col-span-8 p-6 space-y-4 border-[#202D42]">
          <div className="flex items-center justify-between border-b border-[#202D42] pb-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#A3E635]" />
              Security Center & Personal Activity Log
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#94A3B8] font-semibold">2FA Enabled</span>
              <input
                type="checkbox"
                checked={twoFa}
                onChange={(e) => setTwoFa(e.target.checked)}
                className="w-4 h-4 accent-[#A3E635] cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-4 text-xs">
            
            {/* Recognized Devices & Sessions */}
            <div className="bg-[#101726] border border-[#202D42] rounded-2xl p-4 space-y-2">
              <span className="font-bold text-white uppercase text-[11px] block">Recognized Active Sessions</span>
              <div className="flex items-center justify-between py-1">
                <span className="text-[#94A3B8]">Chrome on Windows 11 (Current)</span>
                <Button variant="secondary" size="sm" onClick={() => info('Session Logged Out', 'Revoked session.')}>
                  Log Out
                </Button>
              </div>
            </div>

            {/* Audit Actions List */}
            <div className="space-y-2">
              <span className="font-bold text-white uppercase text-[11px] block">Personal Activity Log</span>
              
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#101726] border border-[#202D42]">
                <div className="flex items-center gap-2">
                  <Badge variant="active">Updated</Badge>
                  <span className="font-bold text-white">Updated student info: Liam Hayes</span>
                </div>
                <span className="text-[10px] text-[#64748B]">24m ago</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#101726] border border-[#202D42]">
                <div className="flex items-center gap-2">
                  <Badge variant="info">Invited</Badge>
                  <span className="font-bold text-white">Invited company HR: Sarah Kim</span>
                </div>
                <span className="text-[10px] text-[#64748B]">24m ago</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#101726] border border-[#202D42]">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Created</Badge>
                  <span className="font-bold text-white">Created placement drive: Google SWE</span>
                </div>
                <span className="text-[10px] text-[#64748B]">14m ago</span>
              </div>
            </div>

          </div>
        </Card>

      </div>

      {/* FOOTER ACTIONS BAR strictly matching Design User Profile.jpg */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#202D42]">
        <Button
          variant="danger"
          size="md"
          onClick={() => warning('Account Action', 'Deactivation requires main admin approval.')}
        >
          Deactivate Account
        </Button>

        <Button
          variant="secondary"
          size="md"
          leftIcon={<RefreshCcw className="w-4 h-4" />}
          onClick={() => info('Reset Form', 'Reverted unsaved edits.')}
        >
          Reset Changes
        </Button>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Save className="w-4 h-4 text-[#0B0F17]" />}
          onClick={handleSaveProfile}
          className="px-8 font-extrabold shadow-[0_0_15px_rgba(163,230,53,0.3)]"
        >
          Save Profile Changes
        </Button>
      </div>

    </div>
  );
};
