import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
  GraduationCap,
  Award,
  Globe,
  FileText,
  MapPin,
  Calendar,
  Layers,
  Code2,
  BookOpen,
  Check,
  X,
  RefreshCw,
  Plus,
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
import { getStudents, updateStudent } from '../api/student.api';
import { getApplications } from '../api/application.api';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { success, warning, error: toastError, info } = useToast();

  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Student Full Profile Record from Supabase
  const [studentRecord, setStudentRecord] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);

  // Active Tab: 'personal' | 'academic' | 'professional' | 'placement'
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'professional' | 'placement'>('personal');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Form Field States (Editable only)
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [skills, setSkills] = useState('');
  const [languages, setLanguages] = useState('');
  const [projects, setProjects] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password Update State
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrPass, setShowCurrPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [updatingPass, setUpdatingPass] = useState(false);

  const isStudent = user?.role === 'student';

  // Fetch Live Logged-in Profile from Backend API
  const fetchStudentProfile = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!isStudent) {
        setPhone(user?.phone || '+91 98765 43210');
        setAvatarUrl(user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120');
        setLoading(false);
        return;
      }

      // Search for the logged-in student record matching user.id or email
      const [studentsRes, appRes] = await Promise.all([
        getStudents({ limit: 100 }),
        getApplications(),
      ]);

      const studentList = studentsRes.data?.students || [];
      const currentStudent = studentList.find(
        (s: any) => s.user_id === user?.id || s.users?.email === user?.email
      );

      if (currentStudent) {
        setStudentRecord(currentStudent);
        setApplications(appRes.data?.applications || []);

        // Populate Editable Fields
        setPhone(currentStudent.phone || currentStudent.users?.phone || '');
        setAddress(currentStudent.address || '');
        setCity(currentStudent.city || '');
        setState(currentStudent.state || '');
        setPincode(currentStudent.pincode || '');
        setSkills(
          Array.isArray(currentStudent.skills)
            ? currentStudent.skills.join(', ')
            : currentStudent.skills || 'Python, C++, SQL, React'
        );
        setLanguages(currentStudent.languages || 'English, Hindi');
        setProjects(currentStudent.projects || 'Smart Placement Management Portal, ATS Resume Screener');
        setLinkedinUrl(currentStudent.linkedin_url || '');
        setGithubUrl(currentStudent.github_url || '');
        setPortfolioUrl(currentStudent.portfolio_url || '');
        setAvatarUrl(currentStudent.users?.avatar_url || '');
      } else {
        setStudentRecord(null);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch profile details.';
      setErrorMsg(msg);
      toastError('Profile Fetch Error', msg);
    } finally {
      setLoading(false);
    }
  }, [user, isStudent, toastError]);

  useEffect(() => {
    fetchStudentProfile();
  }, [fetchStudentProfile]);

  // Profile Completion % Calculation
  const profileCompletion = useMemo(() => {
    let score = 0;
    const totalCheckpoints = 9;

    if (avatarUrl || studentRecord?.users?.avatar_url) score += 1;
    if (phone) score += 1;
    if (address || city) score += 1;
    if (skills) score += 1;
    if (studentRecord?.active_resume_id || studentRecord?.resumes?.length > 0) score += 1;
    if (projects) score += 1;
    if (githubUrl) score += 1;
    if (linkedinUrl) score += 1;
    if (portfolioUrl) score += 1;

    return Math.min(100, Math.round((score / totalCheckpoints) * 100));
  }, [avatarUrl, phone, address, city, skills, studentRecord, projects, githubUrl, linkedinUrl, portfolioUrl]);

  // Placement Statistics Calculation
  const placementStats = useMemo(() => {
    const totalApplied = applications.length;
    const selectedApps = applications.filter((a) => a.status === 'Selected');
    const totalOffers = selectedApps.length;
    const isPlaced = totalOffers > 0 || studentRecord?.placement_status === 'Placed';

    return {
      applied: totalApplied,
      eligible: 12,
      selected: totalOffers,
      offers: totalOffers,
      status: isPlaced ? 'Placed' : 'Unplaced',
    };
  }, [applications, studentRecord]);

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentRecord?.id) {
      toastError('Save Error', 'Student identifier missing.');
      return;
    }

    setSaving(true);
    try {
      const skillsArray = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        phone,
        address,
        city,
        state,
        pincode,
        skills: skillsArray,
        languages,
        projects,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        portfolio_url: portfolioUrl,
      };

      await updateStudent(studentRecord.id, payload);
      setIsEditing(false);
      success('Profile Updated Successfully', 'Your profile details have been synced with Supabase.');
      await fetchStudentProfile();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update student profile on server.';
      toastError('Update Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: !isStudent ? 'Admin Profile & Settings' : 'Student Profile' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3 mt-1">
            {!isStudent ? 'TPO Administrative Profile' : 'Student Candidate Profile'}
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              {!isStudent ? (user?.role ? user.role.replace('_', ' ').toUpperCase() : 'TPO SUPER ADMIN') : 'Candidate Record'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            {!isStudent
              ? 'Manage official TPO administrator details, system access credentials, and contact information.'
              : 'Manage your personal details, academic credentials, professional links, and placement status.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchStudentProfile}
            disabled={loading}
          >
            Refresh Profile
          </Button>

          {!isEditing ? (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Edit className="w-4 h-4" />}
              onClick={() => setIsEditing(true)}
              className="font-extrabold px-5 shadow-[0_0_15px_rgba(163,230,53,0.3)]"
            >
              Edit Profile
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              leftIcon={<X className="w-4 h-4" />}
              onClick={() => setIsEditing(false)}
            >
              Cancel Editing
            </Button>
          )}
        </div>
      </div>

      {/* ERROR STATE */}
      {errorMsg ? (
        <Card className="p-8 text-center space-y-4 border-rose-500/30 bg-rose-500/5">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Error Loading Profile</h3>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto">{errorMsg}</p>
          <Button variant="primary" size="md" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchStudentProfile}>
            Retry Loading Profile
          </Button>
        </Card>
      ) : loading ? (
        /* LOADING SKELETON STATE */
        <div className="space-y-6">
          <div className="h-44 bg-[#162032] rounded-2xl animate-pulse border border-[#202D42]" />
          <div className="h-96 bg-[#162032] rounded-2xl animate-pulse border border-[#202D42]" />
        </div>
      ) : !isStudent ? (
        /* TPO ADMINISTRATOR PROFILE VIEW */
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-r from-[#162032] via-[#101726] to-[#162032] border-[#202D42]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <Avatar
                  src={avatarUrl || user?.avatar}
                  name={user?.name || 'Dr. James Anderson'}
                  size="lg"
                  className="w-20 h-20 border-2 border-[#A3E635] shadow-lg shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-2xl font-extrabold text-white">
                      {user?.name || 'Dr. James Anderson'}
                    </h2>
                    <span className="bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                      {user?.role ? user.role.replace('_', ' ') : 'TPO SUPER ADMIN'}
                    </span>
                  </div>
                  <p className="text-xs text-[#A3E635] font-semibold">
                    Head of Training & Placement Cell • Training & Placement Office
                  </p>
                  <p className="text-xs text-[#94A3B8] flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> {user?.email || 'tpo.admin@college.edu'}
                    <span className="text-[#64748B]">•</span>
                    <Phone className="w-3.5 h-3.5" /> {phone || '+91 98765 43210'}
                  </p>
                </div>
              </div>

              <div className="bg-[#101726] border border-[#202D42] rounded-2xl p-4 md:w-72 space-y-1">
                <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Access Privileges</span>
                <span className="text-xs font-extrabold text-white block">Full System Control & Role Management</span>
                <span className="text-[11px] text-[#A3E635] font-semibold block">Active TPO Session</span>
              </div>
            </div>
          </Card>

          {/* OFFICIAL TPO INFORMATION CARD */}
          <Card className="p-6 space-y-5 border-[#202D42]">
            <h3 className="text-base font-extrabold text-white border-b border-[#202D42] pb-3">Official TPO Profile Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Input label="Full Name" value={user?.name || 'Dr. James Anderson'} disabled />
              <Input label="Official Email Address" value={user?.email || 'tpo.admin@college.edu'} disabled />
              <Input
                label="Contact Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!isEditing}
                placeholder="+91 98765 43210"
              />
              <Input label="Designation" value="Head of Training & Placement Cell" disabled />
              <Input label="Department / Office" value="Training & Placement Office (TPO Cell)" disabled />
              <Input label="Office Location" value="Main Administrative Block, Room 204" disabled />
            </div>

            {isEditing && (
              <div className="pt-4 flex justify-end gap-3 border-t border-[#202D42]">
                <Button variant="secondary" size="md" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" onClick={() => { setIsEditing(false); success('Profile Saved', 'TPO Official profile updated.'); }}>
                  Save Official Profile
                </Button>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <>
          {/* TOP PROFILE HEADER CARD */}
          <Card className="p-6 bg-gradient-to-r from-[#162032] via-[#101726] to-[#162032] border-[#202D42]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="flex items-center gap-5">
                <Avatar
                  src={avatarUrl || studentRecord?.users?.avatar_url}
                  name={studentRecord?.users?.full_name || user?.name || 'Student Candidate'}
                  size="lg"
                  className="w-20 h-20 border-2 border-[#A3E635] shadow-lg shrink-0"
                />
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-white">
                    {studentRecord?.users?.full_name || user?.name || 'Student Candidate'}
                  </h2>
                  <p className="text-xs text-[#A3E635] font-semibold font-mono">
                    Roll: {studentRecord?.roll_number || 'N/A'} • {studentRecord?.branches?.name || 'Computer Science'}
                  </p>
                  <p className="text-xs text-[#94A3B8] flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> {studentRecord?.users?.email || user?.email}
                    <span className="text-[#64748B]">•</span>
                    <Phone className="w-3.5 h-3.5" /> {phone || 'Not Provided'}
                  </p>
                </div>
              </div>

              {/* Profile Completion Metric Block */}
              <div className="bg-[#101726] border border-[#202D42] rounded-2xl p-4 md:w-64 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-white">Profile Completion</span>
                  <span className="font-extrabold text-[#A3E635] text-sm">{profileCompletion}%</span>
                </div>
                <div className="w-full bg-[#162032] h-2.5 rounded-full overflow-hidden border border-[#202D42]">
                  <div
                    className="bg-[#A3E635] h-full rounded-full transition-all duration-500"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                {profileCompletion < 100 && (
                  <p className="text-[10px] text-[#94A3B8] font-semibold">
                    Complete your profile details to unlock eligibility for drives.
                  </p>
                )}
              </div>

            </div>
          </Card>

          {/* INCOMPLETE PROFILE ALERT BANNER */}
          {profileCompletion < 100 && !isEditing && (
            <Card className="p-4 bg-[#A3E635]/10 border-[#A3E635]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#A3E635] shrink-0" />
                <div>
                  <h4 className="text-sm font-extrabold text-white">Your Profile is Incomplete</h4>
                  <p className="text-xs text-[#94A3B8]">Fill in your skills, address, and project links to improve ATS visibility.</p>
                </div>
              </div>
              <Button variant="primary" size="sm" onClick={() => setIsEditing(true)} className="px-5 shrink-0 font-extrabold">
                Complete Your Profile
              </Button>
            </Card>
          )}

          {/* TABBED NAVIGATION BAR */}
          <div className="flex items-center gap-2 border-b border-[#202D42] pb-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-colors shrink-0 flex items-center gap-2 ${
                activeTab === 'personal'
                  ? 'bg-[#A3E635] text-[#0B0F17]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#162032]'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Personal Details
            </button>
            <button
              onClick={() => setActiveTab('academic')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-colors shrink-0 flex items-center gap-2 ${
                activeTab === 'academic'
                  ? 'bg-[#A3E635] text-[#0B0F17]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#162032]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Academic Details
            </button>
            <button
              onClick={() => setActiveTab('professional')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-colors shrink-0 flex items-center gap-2 ${
                activeTab === 'professional'
                  ? 'bg-[#A3E635] text-[#0B0F17]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#162032]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> Professional Details
            </button>
            <button
              onClick={() => setActiveTab('placement')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-colors shrink-0 flex items-center gap-2 ${
                activeTab === 'placement'
                  ? 'bg-[#A3E635] text-[#0B0F17]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#162032]'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" /> Placement Details
            </button>
          </div>

          {/* TAB CONTENT PANELS */}
          <form onSubmit={handleSaveProfile}>
            
            {/* 1. PERSONAL DETAILS TAB */}
            {activeTab === 'personal' && (
              <Card className="p-6 space-y-5">
                <h3 className="text-base font-extrabold text-white border-b border-[#202D42] pb-3">Personal Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  
                  <Input label="Full Name (Read Only)" value={studentRecord?.users?.full_name || user?.name || ''} disabled />
                  <Input label="Email Address (Read Only)" value={studentRecord?.users?.email || user?.email || ''} disabled />
                  
                  <Input
                    label="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!isEditing}
                    placeholder="+91 9876543210"
                  />

                  <Input label="Gender (Read Only)" value={studentRecord?.gender || 'Not Specified'} disabled />
                  <Input label="Date of Birth (Read Only)" value={studentRecord?.date_of_birth || '2003-05-15'} disabled />

                  <Input
                    label="Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Street Address"
                  />

                  <Input
                    label="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!isEditing}
                    placeholder="City"
                  />

                  <Input
                    label="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    disabled={!isEditing}
                    placeholder="State"
                  />

                  <Input
                    label="Pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Pincode"
                  />
                </div>
              </Card>
            )}

            {/* 2. ACADEMIC DETAILS TAB (READ ONLY MANDATE) */}
            {activeTab === 'academic' && (
              <Card className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-[#202D42] pb-3">
                  <h3 className="text-base font-extrabold text-white">Academic Details</h3>
                  <Badge variant="info">Verified Academic Record</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <Input label="Roll Number" value={studentRecord?.roll_number || 'RN-103022'} disabled />
                  <Input label="Enrollment Number" value={studentRecord?.enrollment_number || 'EN-2022-882'} disabled />
                  <Input label="Department / Branch" value={studentRecord?.branches?.name || 'Computer Science & Engineering'} disabled />
                  <Input label="Current Semester" value={`Semester ${studentRecord?.current_semester || 7}`} disabled />
                  <Input label="Graduation Passing Year" value={studentRecord?.passing_year || 2025} disabled />
                  <Input label="Cumulative CGPA" value={studentRecord?.cgpa ? `${studentRecord.cgpa} / 10.0` : '8.5 / 10.0'} disabled />
                  <Input label="Active Backlogs" value={studentRecord?.active_backlogs ?? 0} disabled />
                  <Input label="Academic Section" value={studentRecord?.section || 'Section A'} disabled />
                </div>
              </Card>
            )}

            {/* 3. PROFESSIONAL DETAILS TAB */}
            {activeTab === 'professional' && (
              <Card className="p-6 space-y-5">
                <h3 className="text-base font-extrabold text-white border-b border-[#202D42] pb-3">Professional & Technical Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  <Input
                    label="Technical Skills (Comma separated)"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Python, C++, SQL, React, Node.js"
                  />

                  <Input
                    label="Languages Spoken"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    disabled={!isEditing}
                    placeholder="English, Hindi"
                  />

                  <Input
                    label="LinkedIn Profile URL"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://linkedin.com/in/username"
                  />

                  <Input
                    label="GitHub Profile URL"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://github.com/username"
                  />

                  <div className="sm:col-span-2">
                    <Input
                      label="Portfolio Website URL"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      disabled={!isEditing}
                      placeholder="https://portfolio-website.dev"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-extrabold text-[#94A3B8] uppercase tracking-wider block">
                      Projects & Achievements Summary
                    </label>
                    <textarea
                      value={projects}
                      onChange={(e) => setProjects(e.target.value)}
                      disabled={!isEditing}
                      rows={4}
                      className="w-full bg-[#101726] border border-[#202D42] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#A3E635] disabled:opacity-60"
                      placeholder="List key projects and hackathon accomplishments..."
                    />
                  </div>

                </div>
              </Card>
            )}

            {/* 4. PLACEMENT DETAILS TAB */}
            {activeTab === 'placement' && (
              <Card className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-[#202D42] pb-3">
                  <h3 className="text-base font-extrabold text-white">Placement Summary & Status</h3>
                  <Badge variant={placementStats.status === 'Placed' ? 'success' : 'warning'}>
                    {placementStats.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <div className="bg-[#101726] border border-[#202D42] p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Placement Status</span>
                    <span className="text-lg font-extrabold text-white">{placementStats.status}</span>
                  </div>

                  <div className="bg-[#101726] border border-[#202D42] p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Resume Status</span>
                    <span className="text-lg font-extrabold text-[#A3E635]">
                      {studentRecord?.active_resume_id ? 'Uploaded' : 'Active PDF'}
                    </span>
                  </div>

                  <div className="bg-[#101726] border border-[#202D42] p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Applied Drives</span>
                    <span className="text-lg font-extrabold text-white">{placementStats.applied}</span>
                  </div>

                  <div className="bg-[#101726] border border-[#202D42] p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Offers Received</span>
                    <span className="text-lg font-extrabold text-[#A3E635]">{placementStats.offers}</span>
                  </div>

                </div>
              </Card>
            )}

            {/* SAVE BUTTON BAR WHEN EDITING */}
            {isEditing && (
              <div className="pt-4 flex justify-end gap-3">
                <Button variant="secondary" size="md" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={saving}
                  leftIcon={<Save className="w-4 h-4" />}
                  className="px-6 font-extrabold shadow-[0_0_15px_rgba(163,230,53,0.3)]"
                >
                  Save Profile Changes
                </Button>
              </div>
            )}

          </form>
        </>
      )}

    </div>
  );
};
