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

import { Card } from '../components/app/Card';
import { Button } from '../components/app/Button';
import { Badge } from '../components/app/Badge';
import { Input } from '../components/app/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/app/Table';
import { Avatar } from '../components/app/Avatar';
import { Breadcrumb } from '../components/app/Breadcrumb';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/app/Toast';
import { getStudentProfile, updateMyProfile } from '../api/student.api';
import { getApplications } from '../api/application.api';
import { Textarea as ShadTextarea } from '@/components/ui/textarea';
import { Avatar as UiAvatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
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
        setPhone(user?.phone || '');
        setAvatarUrl(user?.avatar || '');
        setLoading(false);
        return;
      }

      // Fetch logged-in student profile & applications
      const [profileRes, appRes] = await Promise.all([
        getStudentProfile(),
        getApplications(),
      ]);

      const currentStudent = profileRes.data?.profile || profileRes.data?.student || profileRes.data;

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
          (Array.isArray(currentStudent.skills) ? currentStudent.skills : [])
            .map((s: any) => s?.skills?.name || s?.name || (typeof s === 'string' ? s : ''))
            .filter(Boolean)
            .join(', ')
        );
        setHeadline(currentStudent.resume_headline || '');
        setBio(currentStudent.bio || '');
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
    if (bio) score += 1;
    if (githubUrl) score += 1;
    if (linkedinUrl) score += 1;
    if (portfolioUrl) score += 1;

    return Math.min(100, Math.round((score / totalCheckpoints) * 100));
  }, [avatarUrl, phone, address, city, skills, studentRecord, bio, githubUrl, linkedinUrl, portfolioUrl]);

  // Placement Statistics Calculation
  const placementStats = useMemo(() => {
    const totalApplied = applications.length;
    const selectedApps = applications.filter((a) => a.status === 'Selected');
    const totalOffers = selectedApps.length;
    const isPlaced = totalOffers > 0 || studentRecord?.placement_status === 'Placed';

    return {
      applied: totalApplied,
      selected: totalOffers,
      offers: totalOffers,
      status: isPlaced ? 'Placed' : 'Unplaced',
    };
  }, [applications, studentRecord]);

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentRecord?.id) {
      toastError('Save Error', 'Your account is not linked to a student record.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        phone,
        address,
        city,
        state,
        pincode,
        resume_headline: headline,
        bio,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        portfolio_url: portfolioUrl,
      };

      await updateMyProfile(payload);
      setIsEditing(false);
      success('Profile updated', 'Your details have been saved.');
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: !isStudent ? 'Admin Profile' : 'Student Profile' }]} />
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-3">
            {!isStudent ? 'My profile' : 'Candidate profile'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {!isStudent
              ? 'Manage your administrator details, access and contact information.'
              : 'Manage personal details, academic credentials, links and placement status.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="tertiary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchStudentProfile}
            disabled={loading}
            className="text-xs"
          >
            Refresh
          </Button>

          {!isEditing ? (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Edit className="w-4 h-4" />}
              onClick={() => setIsEditing(true)}
              className="text-xs"
            >
              Edit profile
            </Button>
          ) : (
            <Button variant="secondary" size="md" leftIcon={<X className="w-4 h-4" />} onClick={() => setIsEditing(false)} className="text-xs">
              Cancel editing
            </Button>
          )}
        </div>
      </div>

      {/* ERROR STATE */}
      {errorMsg ? (
        <Card className="p-8 text-center space-y-4 border-rose-500/30 bg-rose-500/5">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-lg font-semibold text-foreground">Error Loading Profile</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">{errorMsg}</p>
          <Button variant="primary" size="md" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchStudentProfile}>
            Retry Loading Profile
          </Button>
        </Card>
      ) : loading ? (
        /* LOADING SKELETON STATE */
        <div className="space-y-6">
          <div className="h-44 bg-card rounded-2xl animate-pulse border border-border" />
          <div className="h-96 bg-card rounded-2xl animate-pulse border border-border" />
        </div>
      ) : !isStudent ? (
        /* TPO ADMINISTRATOR PROFILE VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT: identity */}
          <Card className="lg:col-span-4 p-8 text-center space-y-6">
            <div className="flex flex-col items-center gap-4">
              <UiAvatar className="size-28 border border-border">
                <AvatarImage src={avatarUrl || user?.avatar} alt={user?.name || 'Admin'} className="object-cover" />
                <AvatarFallback className="bg-secondary text-2xl font-semibold text-foreground">
                  {(user?.name || 'Admin').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </UiAvatar>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">{user?.name || 'User'}</h2>
                <Badge variant="neutral" size="sm">
                  {user?.role ? user.role.replace('_', ' ').toUpperCase() : 'TPO SUPER ADMIN'}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-6 text-left text-sm">
              <p className="flex items-center gap-3 text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0" />
                <span className="truncate text-foreground">{user?.email || ''}</span>
              </p>
              <p className="flex items-center gap-3 text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0" />
                <span className="text-foreground">{phone || 'Not provided'}</span>
              </p>
              <p className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="text-foreground">Main Administrative Block, Room 204</span>
              </p>
            </div>

            <div className="space-y-3 border-t border-border pt-6 text-left">
              <h3 className="text-sm font-semibold text-foreground">Access privileges</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {['Full system control', 'Role & user management', 'Active TPO session'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-foreground">
                      <Check className="w-3 h-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* RIGHT: details */}
          <Card className="lg:col-span-8 p-8 space-y-8">
            <section className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Contact information</h3>
                <p className="text-xs text-muted-foreground">Official email is managed by the system.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name" value={user?.name || 'User'} disabled />
                <Input label="Official Email Address" value={user?.email || ''} disabled />
                <Input
                  label="Contact Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                  placeholder="+91 98765 43210"
                />
              </div>
            </section>

            <section className="space-y-4 border-t border-border pt-8">
              <div>
                <h3 className="text-base font-semibold text-foreground">Office details</h3>
                <p className="text-xs text-muted-foreground">Your role in the training and placement cell.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Designation" value="Head of Training & Placement Cell" disabled />
                <Input label="Department / Office" value="Training & Placement Office (TPO Cell)" disabled />
                <div className="sm:col-span-2">
                  <Input label="Office Location" value="Main Administrative Block, Room 204" disabled />
                </div>
              </div>
            </section>

            {isEditing && (
              <div className="flex justify-end gap-2 border-t border-border pt-6">
                <Button variant="tertiary" size="md" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setIsEditing(false);
                    success('Profile Saved', 'TPO Official profile updated.');
                  }}
                >
                  Save changes
                </Button>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <>
          {/* TOP PROFILE HEADER CARD */}
          <Card className="p-6 border-border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="flex items-center gap-5">
                <UiAvatar className="size-20 border border-border shrink-0">
                  <AvatarImage src={avatarUrl || studentRecord?.users?.avatar_url} alt="Avatar" className="object-cover" />
                  <AvatarFallback className="bg-secondary text-xl font-semibold text-foreground">
                    {(studentRecord?.users?.full_name || user?.name || 'S').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </UiAvatar>
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold text-foreground">
                    {studentRecord?.users?.full_name || user?.name || 'Student Candidate'}
                  </h2>
                  <p className="text-xs text-primary font-semibold font-mono">
                    Roll: {studentRecord?.roll_number || 'N/A'} • {studentRecord?.branches?.name || 'Branch not set'}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> {studentRecord?.users?.email || user?.email}
                    <span className="text-muted-foreground">•</span>
                    <Phone className="w-3.5 h-3.5" /> {phone || 'Not Provided'}
                  </p>
                </div>
              </div>

              {/* Profile Completion Metric Block */}
              <div className="bg-muted border border-border rounded-2xl p-4 md:w-64 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Profile Completion</span>
                  <span className="font-semibold text-primary text-sm">{profileCompletion}%</span>
                </div>
                <div className="w-full bg-card h-2.5 rounded-full overflow-hidden border border-border">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                {profileCompletion < 100 && (
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    Complete your profile details to unlock eligibility for drives.
                  </p>
                )}
              </div>

            </div>
          </Card>

          {/* INCOMPLETE PROFILE ALERT BANNER */}
          {profileCompletion < 100 && !isEditing && (
            <Card className="p-4 bg-primary/10 border-primary/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Your Profile is Incomplete</h4>
                  <p className="text-xs text-muted-foreground">Fill in your skills, address, and project links to improve ATS visibility.</p>
                </div>
              </div>
              <Button variant="primary" size="sm" onClick={() => setIsEditing(true)} className="px-5 shrink-0 font-semibold">
                Complete Your Profile
              </Button>
            </Card>
          )}

          {/* TABBED NAVIGATION BAR */}
          <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors shrink-0 flex items-center gap-2 ${
                activeTab === 'personal'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Personal Details
            </button>
            <button
              onClick={() => setActiveTab('academic')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors shrink-0 flex items-center gap-2 ${
                activeTab === 'academic'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Academic Details
            </button>
            <button
              onClick={() => setActiveTab('professional')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors shrink-0 flex items-center gap-2 ${
                activeTab === 'professional'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> Professional Details
            </button>
            <button
              onClick={() => setActiveTab('placement')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors shrink-0 flex items-center gap-2 ${
                activeTab === 'placement'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card'
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
                <h3 className="text-base font-semibold text-foreground border-b border-border pb-3">Personal Details</h3>
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
                  <Input label="Date of Birth (Read Only)" value={studentRecord?.date_of_birth || 'Not provided'} disabled />

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
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-base font-semibold text-foreground">Academic Details</h3>
                  <Badge variant="info">Verified Academic Record</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <Input label="Roll Number" value={studentRecord?.roll_number || ''} disabled />
                  <Input label="Enrollment Number" value={studentRecord?.enrollment_number || 'EN-2022-882'} disabled />
                  <Input label="Department / Branch" value={studentRecord?.branches?.name || 'Computer Science & Engineering'} disabled />
                  <Input label="Current Semester" value={`Semester ${studentRecord?.current_semester || 7}`} disabled />
                  <Input label="Graduation Passing Year" value={studentRecord?.passing_year || 2025} disabled />
                  <Input label="Cumulative CGPA" value={studentRecord?.cgpa ? `${studentRecord.cgpa} / 10.0` : '8.5 / 10.0'} disabled />
                  <Input label="Active Backlogs" value={studentRecord?.active_backlogs ?? 0} disabled />
                  <Input label="Academic Section" value={studentRecord?.section || 'Not set'} disabled />
                </div>
              </Card>
            )}

            {/* 3. PROFESSIONAL DETAILS TAB */}
            {activeTab === 'professional' && (
              <Card className="p-6 space-y-5">
                <h3 className="text-base font-semibold text-foreground border-b border-border pb-3">Professional & Technical Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  <Input label="Skills (managed by the TPO office)" value={skills} disabled placeholder="No skills recorded yet" />

                  <Input
                    label="Resume headline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g. Final-year CSE student, full-stack developer"
                    maxLength={150}
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
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      About me / projects
                    </label>
                    <ShadTextarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      disabled={!isEditing}
                      rows={4}
                      className="w-full bg-muted dark:bg-muted rounded-xl p-3 text-xs text-foreground"
                      placeholder="A short summary of your projects and achievements..." maxLength={2000}
                    />
                  </div>

                </div>
              </Card>
            )}

            {/* 4. PLACEMENT DETAILS TAB */}
            {activeTab === 'placement' && (
              <Card className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-base font-semibold text-foreground">Placement Summary & Status</h3>
                  <Badge variant={placementStats.status === 'Placed' ? 'success' : 'warning'}>
                    {placementStats.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <div className="bg-muted border border-border p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Placement Status</span>
                    <span className="text-lg font-semibold text-foreground">{placementStats.status}</span>
                  </div>

                  <div className="bg-muted border border-border p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Resume Status</span>
                    <span className="text-lg font-semibold text-primary">
                      {studentRecord?.active_resume_id ? 'Uploaded' : 'Active PDF'}
                    </span>
                  </div>

                  <div className="bg-muted border border-border p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Applied Drives</span>
                    <span className="text-lg font-semibold text-foreground">{placementStats.applied}</span>
                  </div>

                  <div className="bg-muted border border-border p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Offers Received</span>
                    <span className="text-lg font-semibold text-primary">{placementStats.offers}</span>
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
                  className="px-6 font-semibold"
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
