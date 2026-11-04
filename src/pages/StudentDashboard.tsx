import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Calendar, Award, Bell, RefreshCw, AlertTriangle, ExternalLink, UserCheck, FileText, MapPin, Video } from 'lucide-react';

import { Card } from '../components/app/Card';
import { Button } from '../components/app/Button';
import { Badge } from '../components/app/Badge';
import { StatTile } from '../components/app/StatTile';
import { CompanyCell } from '../components/app/EntityCell';
import { EmptyState } from '../components/app/EmptyState';
import { useToast } from '../components/app/Toast';
import { useAuth } from '../context/AuthContext';
import { getStudentDashboard } from '../api/dashboard.api';
import { markNotificationRead } from '../api/notification.api';
import { getDrives } from '../api/drive.api';

const formatWhen = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [drives, setDrives] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // One failing request must not blank the whole dashboard, so each part is settled on its own.
  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    const [dash, driveRes] = await Promise.allSettled([getStudentDashboard(), getDrives({ limit: 5 })]);

    if (dash.status === 'fulfilled') {
      const data = dash.value.data?.dashboard ?? null;
      setMetrics(data);
      setNotifications(data?.notifications ?? []);
    } else {
      const message = (dash.reason as any)?.response?.data?.message || 'Failed to load your dashboard.';
      setErrorMsg(message);
      toastError('Dashboard error', message);
    }
    setDrives(driveRes.status === 'fulfilled' ? driveRes.value.data ?? [] : []);
    setLoading(false);
  }, [toastError]);

  useEffect(() => {
    load();
  }, [load]);

  const unread = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  const markRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      success('Marked as read');
    } catch {
      toastError('Could not update the notification');
    }
  };

  const completion: number = metrics?.profileCompletion ?? 0;
  const offerStats = metrics?.offerStats;
  const appStats = metrics?.applicationStats;
  const interviews: any[] = metrics?.upcomingInterviews ?? [];

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">Welcome back, {user?.name || 'Candidate'}!</h1>
          <p className="text-sm text-muted-foreground mt-1">Your applications, interviews, offers and open drives in one place.</p>
        </div>
        <Button variant="secondary" leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {errorMsg ? (
        <EmptyState icon={<AlertTriangle className="w-8 h-8" />} title="Could not load your dashboard" description={errorMsg} actionText="Try again" onAction={load} />
      ) : (
        <>
          {metrics && !metrics.hasStudentProfile && (
            <Card className="p-4 border-amber-500/40 bg-amber-500/5 text-sm text-foreground flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              Your account is not linked to a student record yet, so applications and offers cannot show. Please contact the TPO office.
            </Card>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile
              label="Profile"
              value={loading ? null : `${completion}%`}
              icon={<UserCheck className="w-5 h-5" />}
              tone={completion >= 80 ? 'success' : 'warning'}
              hint={completion >= 80 ? 'looking good' : 'complete it to apply'}
              onClick={() => navigate('/profile')}
            />
            <StatTile
              label="Resume"
              value={loading ? null : metrics?.activeResume ? 'Active' : 'Missing'}
              icon={<FileText className="w-5 h-5" />}
              tone={metrics?.activeResume ? 'info' : 'danger'}
              hint={metrics?.activeResume ? metrics.activeResume.version_title || 'uploaded' : 'upload one to apply'}
              onClick={() => navigate('/resumes')}
            />
            <StatTile
              label="Applications"
              value={loading ? null : appStats?.total ?? 0}
              icon={<Briefcase className="w-5 h-5" />}
              tone="primary"
              hint={`${appStats?.pending ?? 0} waiting for review`}
              onClick={() => navigate('/applications')}
            />
            <StatTile
              label="Offers"
              value={loading ? null : offerStats?.total ?? 0}
              icon={<Award className="w-5 h-5" />}
              tone={(offerStats?.released ?? 0) > 0 ? 'warning' : 'success'}
              hint={(offerStats?.released ?? 0) > 0 ? `${offerStats.released} waiting for your reply` : offerStats?.highestPackage ? `highest ₹${offerStats.highestPackage} LPA` : 'none yet'}
              onClick={() => navigate('/offers')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      Open drives <Badge variant="active" size="sm">{metrics?.openDrives ?? drives.length} open</Badge>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Registration is still open for these.</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/drives')}>
                    View all drives
                  </Button>
                </div>
                {drives.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No drive is open for registration right now.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {drives.slice(0, 5).map((d) => (
                      <button key={d.id} type="button" onClick={() => navigate('/drives')} className="w-full flex items-center justify-between gap-3 py-3 text-left hover:bg-secondary/40 rounded-xl px-2">
                        <CompanyCell name={d.companies?.name} logo={d.companies?.logo_url} sub={d.role_title} />
                        <div className="text-right text-xs text-muted-foreground shrink-0">
                          <div className="font-semibold text-foreground">{Number(d.ctc) > 0 ? `₹${d.ctc} LPA` : d.stipend ? `₹${d.stipend}/month` : ''}</div>
                          {d.registration_deadline && <div>Apply by {new Date(d.registration_deadline).toLocaleDateString()}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-400" /> Upcoming interviews
                  </h2>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/interviews')}>
                    View interviews
                  </Button>
                </div>
                {interviews.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No interview is scheduled for you.</p>
                ) : (
                  <div className="space-y-3">
                    {interviews.slice(0, 3).map((i) => (
                      <div key={i.id} className="bg-muted border border-border rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-1 min-w-0">
                          <span className="font-semibold text-foreground text-sm block truncate">
                            {i.companies?.name} {i.placement_drives?.role_title ? `- ${i.placement_drives.role_title}` : ''}
                          </span>
                          <span className="text-muted-foreground block">
                            {i.round_name} &middot; {formatWhen(i.scheduled_at)}
                          </span>
                          <span className="text-muted-foreground inline-flex items-center gap-1">
                            {i.mode === 'Online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                            {i.mode === 'Online' ? 'Online' : i.venue || 'Venue to be shared'}
                          </span>
                        </div>
                        {i.mode === 'Online' && i.meeting_url && (
                          <a href={i.meeting_url} target="_blank" rel="noreferrer" className="shrink-0">
                            <Button size="sm" leftIcon={<ExternalLink className="w-3 h-3" />}>
                              Join
                            </Button>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <h2 className="text-base font-semibold text-foreground">Notifications</h2>
                  </div>
                  {unread > 0 && <Badge variant="warning">{unread} unread</Badge>}
                </div>
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nothing new.</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((n) => (
                      <div key={n.id} className="bg-muted border border-border p-3 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-foreground">{n.title}</span>
                          {!n.is_read && (
                            <button onClick={() => markRead(n.id)} className="text-[10px] text-primary hover:underline font-semibold shrink-0">
                              Mark read
                            </button>
                          )}
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-[11px]">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="secondary" size="sm" fullWidth onClick={() => navigate('/notifications')}>
                  View all notifications
                </Button>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
