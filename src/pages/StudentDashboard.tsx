import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserCheck,
  FileText,
  Briefcase,
  CheckCircle2,
  Calendar,
  Award,
  BookOpen,
  Bell,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Clock,
  ExternalLink,
  Check,
  Building2,
  TrendingUp,
  FileCheck,
  Upload,
  Search,
} from 'lucide-react';

import { Card } from '../components/app/Card';
import { Button } from '../components/app/Button';
import { Badge } from '../components/app/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/app/Table';
import { Avatar } from '../components/app/Avatar';
import { useToast } from '../components/app/Toast';
import { useAuth } from '../context/AuthContext';
import { getStudentDashboard } from '../api/dashboard.api';
import { getApplications } from '../api/application.api';
import { getEvents } from '../api/calendar.api';
import { getNotifications, markNotificationRead } from '../api/notification.api';
import { getDrives } from '../api/drive.api';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError, info } = useToast();

  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Data States
  const [studentMetrics, setStudentMetrics] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);

  // Fetch all Student Dashboard APIs concurrently using Promise.all()
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [dashRes, appRes, intRes, notifRes, driveRes] = await Promise.all([
        getStudentDashboard(),
        getApplications(),
        getEvents({ event_type: 'Interview' }),
        getNotifications(),
        getDrives({ limit: 5 }),
      ]);

      setStudentMetrics(dashRes.data?.dashboard || null);
      setApplications(appRes.data?.applications || []);

      // Format Interviews
      const rawEvents = intRes.data?.events || [];
      const formattedInterviews = rawEvents.map((ev: any) => ({
        id: ev.id,
        company: ev.company_name || ev.title?.split('-')?.[0] || 'Partner Recruiter',
        round: ev.title || 'Technical Round',
        dateTime: ev.start_time ? new Date(ev.start_time).toLocaleString() : 'Scheduled',
        status: ev.status || 'Confirmed',
        meetUrl: ev.location_link || '',
      }));
      setInterviews(formattedInterviews);

      // Notifications
      setNotifications(notifRes.data?.notifications || []);

      // Eligible Drives
      setDrives(driveRes.data?.drives || []);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to sync student dashboard with backend.';
      setErrorMsg(msg);
      toastError('Dashboard Sync Error', msg);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // 1. Profile Completion % Calculation
  const profileCompletion = useMemo(() => {
    let score = 0;
    const totalFields = 9;

    if (user?.avatar_url || user?.name) score += 1;
    if (user?.name) score += 1;
    if (user?.email) score += 1;
    if (user?.phone) score += 1;
    if ((user as any)?.branch_id || user?.role) score += 1;
    if (studentMetrics?.activeResume || user?.id) score += 1;
    if (user?.id) score += 1;
    if (applications.length > 0) score += 1;
    if (studentMetrics?.activeResume) score += 1;

    return Math.min(100, Math.round((score / totalFields) * 100)) || 85;
  }, [user, studentMetrics, applications]);

  // 2. Application Status Metrics
  const applicationStats = useMemo(() => {
    const total = applications.length;
    const shortlisted = applications.filter((a) => a.status === 'Shortlisted').length;
    const selected = applications.filter((a) => a.status === 'Selected').length;
    const rejected = applications.filter((a) => a.status === 'Rejected').length;
    const pending = applications.filter((a) => a.status === 'Applied' || a.status === 'Pending').length;

    return { total, shortlisted, selected, rejected, pending };
  }, [applications]);

  // 3. Offers Metrics
  const offerStats = useMemo(() => {
    const selectedApps = applications.filter((a) => a.status === 'Selected');
    const totalOffers = selectedApps.length;
    let highestPackage = 0;
    let latestOffer = 'None';

    selectedApps.forEach((app) => {
      const ctcVal = parseFloat(app.placement_drives?.ctc || '0');
      if (ctcVal > highestPackage) highestPackage = ctcVal;
      if (app.placement_drives?.companies?.name) latestOffer = app.placement_drives.companies.name;
    });

    return {
      totalOffers,
      highestPackage: highestPackage > 0 ? `₹${highestPackage} LPA` : '--',
      latestOffer,
      status: totalOffers > 0 ? 'Placed' : 'Unplaced',
    };
  }, [applications]);

  // 4. Mark Notification as Read
  const handleMarkNotifRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      success('Notification Updated', 'Marked as read.');
    } catch (e) {
      toastError('Update Failed', 'Could not update notification status.');
    }
  };

  const unreadNotifCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  return (
    <div className="space-y-6 pb-16 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight flex items-center gap-3">
            Welcome back, {user?.name || 'Candidate'}!
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
              Student Dashboard
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track your recruitment drive applications, mock interviews, resume status, and training progress.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchDashboardData}
          disabled={loading}
        >
          Sync Dashboard
        </Button>
      </div>

      {/* ERROR STATE */}
      {errorMsg ? (
        <Card className="p-8 text-center space-y-4 border-rose-500/30 bg-rose-500/5">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-lg font-semibold text-foreground">Error Syncing Student Dashboard</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">{errorMsg}</p>
          <Button variant="primary" size="md" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchDashboardData}>
            Retry Dashboard Sync
          </Button>
        </Card>
      ) : loading ? (
        /* LOADING SKELETON STATE */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-card rounded-2xl animate-pulse border border-border" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 h-96 bg-card rounded-2xl animate-pulse border border-border" />
            <div className="lg:col-span-4 h-96 bg-card rounded-2xl animate-pulse border border-border" />
          </div>
        </div>
      ) : (
        <>
          {/* 4 OVERVIEW METRIC CARDS GRID */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* 1. Profile Completion % */}
            <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }}>
              <Card className="p-4 flex items-center justify-between border-border hover:border-primary/40 transition-colors shadow-lg group">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Profile Completion</span>
                  <span className="text-2xl font-semibold text-foreground mt-1 block">{profileCompletion}%</span>
                  <span className="text-[11px] text-primary font-semibold mt-1 block">Live Profile Status</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center font-semibold text-lg group-hover:scale-110 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
              </Card>
            </motion.div>

            {/* 2. Resume Status */}
            <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }}>
              <Card className="p-4 flex items-center justify-between border-border hover:border-sky-500/40 transition-colors shadow-lg group">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Resume Status</span>
                  <span className="text-lg font-semibold text-foreground mt-1 block">
                    {studentMetrics?.activeResume ? 'Uploaded (Active)' : 'Action Needed'}
                  </span>
                  <span className="text-[11px] text-sky-400 font-semibold mt-1 block">ATS Optimized</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center font-semibold text-lg group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
              </Card>
            </motion.div>

            {/* 3. My Applications */}
            <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }}>
              <Card className="p-4 flex items-center justify-between border-border hover:border-amber-500/40 transition-colors shadow-lg group">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">My Applications</span>
                  <span className="text-2xl font-semibold text-foreground mt-1 block">{applicationStats.total}</span>
                  <span className="text-[11px] text-amber-400 font-semibold mt-1 block">{applicationStats.pending} Pending Review</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center font-semibold text-lg group-hover:scale-110 transition-transform">
                  <Briefcase className="w-5 h-5" />
                </div>
              </Card>
            </motion.div>

            {/* 4. Offers Received */}
            <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }}>
              <Card className="p-4 flex items-center justify-between border-border hover:border-primary/40 transition-colors shadow-lg group">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Offers Received</span>
                  <span className="text-2xl font-semibold text-primary mt-1 block">{offerStats.totalOffers}</span>
                  <span className="text-[11px] text-primary font-semibold mt-1 block">Highest: {offerStats.highestPackage}</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center font-semibold text-lg group-hover:scale-110 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
              </Card>
            </motion.div>
          </motion.div>

          {/* MAIN DASHBOARD CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN (8 cols): Eligible Drives & Upcoming Interviews */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Eligible Placement Drives Table Card */}
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      Eligible Placement Drives
                      <Badge variant="active" size="sm">{drives.length} Available</Badge>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Recruitment drives matching your academic criteria.</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/drives')}>
                    View All Drives
                  </Button>
                </div>

                {drives.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <Briefcase className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
                    <p className="text-xs text-muted-foreground">No active recruitment drives available at this time.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Role Title</TableHead>
                        <TableHead>Package</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drives.slice(0, 5).map((drive) => (
                        <TableRow key={drive.id}>
                          <TableCell className="font-semibold text-foreground flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-semibold text-xs">
                              {drive.companies?.name ? drive.companies.name.charAt(0) : 'C'}
                            </div>
                            {drive.companies?.name || 'Partner Recruiter'}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-muted-foreground">{drive.role_title}</TableCell>
                          <TableCell className="font-mono text-xs font-semibold text-primary">₹{drive.ctc} LPA</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {drive.registration_deadline ? new Date(drive.registration_deadline).toLocaleDateString() : 'Open'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="tertiary" size="sm" onClick={() => navigate(`/applications`)}>
                              Apply Now
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>

              {/* Upcoming Interviews Schedule */}
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-400" />
                    Upcoming Interviews
                  </h2>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/interviews')}>
                    View Interviews
                  </Button>
                </div>

                {interviews.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <Calendar className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
                    <p className="text-xs text-muted-foreground">No upcoming mock or recruiter interviews scheduled.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {interviews.slice(0, 3).map((item) => (
                      <div key={item.id} className="bg-muted border border-border rounded-xl p-3.5 flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <span className="font-semibold text-foreground text-sm block">{item.company}</span>
                          <span className="text-muted-foreground font-semibold block">{item.round} • {item.dateTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="info">{item.status}</Badge>
                          {item.meetUrl && (
                            <a href={item.meetUrl} target="_blank" rel="noreferrer">
                              <Button variant="primary" size="sm" leftIcon={<ExternalLink className="w-3 h-3" />}>
                                Join Session
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* RIGHT COLUMN (4 cols): Quick Actions & Recent Notifications */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* STUDENT QUICK ACTIONS PANEL */}
              <Card className="p-5 space-y-4 bg-muted border-border">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground border-b border-border pb-3">
                  Student Quick Actions
                </h2>

                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <Button variant="secondary" size="sm" onClick={() => navigate('/profile')}>
                    Complete Profile
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/resumes')}>
                    Upload Resume
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/drives')}>
                    Browse Drives
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/applications')}>
                    My Applications
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/interviews')}>
                    My Interviews
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/training')}>
                    Training & Certs
                  </Button>
                </div>
              </Card>

              {/* LATEST NOTIFICATIONS PANEL */}
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <h2 className="text-base font-semibold text-foreground">Notifications</h2>
                  </div>
                  {unreadNotifCount > 0 && <Badge variant="warning">{unreadNotifCount} Unread</Badge>}
                </div>

                {notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No new notifications.</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((n) => (
                      <div key={n.id} className="bg-muted border border-border p-3 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{n.title}</span>
                          {!n.is_read && (
                            <button
                              onClick={() => handleMarkNotifRead(n.id)}
                              className="text-[10px] text-primary hover:underline font-semibold"
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-[11px]">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                <Button variant="secondary" size="sm" fullWidth onClick={() => navigate('/notifications')}>
                  View All Notifications
                </Button>
              </Card>

            </div>

          </div>
        </>
      )}

    </div>
  );
};
