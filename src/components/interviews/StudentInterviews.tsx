import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CalendarPlus, Clock, ExternalLink, MapPin, MessageSquare, RefreshCw, Video } from 'lucide-react';
import { Card } from '../app/Card';
import { Button } from '../app/Button';
import { SearchInput } from '../app/Input';
import { Tabs } from '../app/Tabs';
import { Skeleton } from '../app/Skeleton';
import { EmptyState } from '../app/EmptyState';
import { Breadcrumb } from '../app/Breadcrumb';
import { Modal } from '../app/Modal';
import { useToast } from '../app/Toast';
import { getInterviews } from '../../api/interview.api';
import type { Interview } from '../../types';
import { InterviewStatusBadge, downloadIcs, formatDateTime, getErrorMessage, googleCalendarUrl } from './interviewUtils';

type Tab = 'upcoming' | 'past';

export const StudentInterviews: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Interview | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getInterviews({ limit: 100 });
      setInterviews(res.data ?? []);
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load your interviews.');
      setErrorMsg(message);
      toastError('Error loading interviews', message);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    load();
  }, [load]);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const isUpcoming = (i: Interview) => i.status === 'Scheduled' && new Date(i.scheduled_at).getTime() >= now - 60 * 60 * 1000;
    return {
      upcoming: interviews.filter(isUpcoming).sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at)),
      past: interviews.filter((i) => !isUpcoming(i)).sort((a, b) => +new Date(b.scheduled_at) - +new Date(a.scheduled_at)),
    };
  }, [interviews]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = tab === 'upcoming' ? upcoming : past;
    if (!term) return list;
    return list.filter((i) =>
      [i.companies?.name, i.placement_drives?.role_title, i.round_name].some((v) => v?.toLowerCase().includes(term))
    );
  }, [tab, upcoming, past, search]);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Interviews' }]} />
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-1">My Interviews</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Your interview slots, meeting links and the result recruiters recorded for each round.
          </p>
        </div>
        <Button variant="secondary" leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Card className="p-3 space-y-3">
        <Tabs
          variant="pills"
          activeTab={tab}
          onChange={(id) => setTab(id as Tab)}
          tabs={[
            { id: 'upcoming', label: `Upcoming (${upcoming.length})` },
            { id: 'past', label: `Past (${past.length})` },
          ]}
        />
        <SearchInput placeholder="Search by company, role or round..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} variant="rectangular" className="w-full h-28" />
          ))}
        </div>
      ) : errorMsg ? (
        <EmptyState title="Could not load interviews" description={errorMsg} actionText="Try again" onAction={load} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8" />}
          title={tab === 'upcoming' ? 'No upcoming interviews' : 'No past interviews'}
          description={
            tab === 'upcoming'
              ? 'When a recruiter schedules an interview you will get a notification and it will show up here.'
              : 'Completed and cancelled interviews appear here.'
          }
          actionText={tab === 'upcoming' ? 'Browse drives' : undefined}
          onAction={tab === 'upcoming' ? () => navigate('/drives') : undefined}
        />
      ) : (
        <div className="grid gap-4">
          {visible.map((i) => (
            <Card key={i.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground truncate">{i.companies?.name ?? 'Company'}</h3>
                  <InterviewStatusBadge status={i.status} />
                  {i.reschedule_count > 0 && <span className="text-xs text-muted-foreground">Rescheduled {i.reschedule_count}x</span>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {i.placement_drives?.role_title ?? 'Role'} &middot; {i.round_name}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {formatDateTime(i.scheduled_at)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    {i.mode === 'Online' ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                    {i.mode === 'Online' ? 'Online' : i.venue || 'Venue to be shared'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {i.status === 'Scheduled' && i.mode === 'Online' && i.meeting_url && (
                  <a href={i.meeting_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" leftIcon={<ExternalLink className="w-4 h-4" />}>
                      Join
                    </Button>
                  </a>
                )}
                <Button size="sm" variant="secondary" onClick={() => setSelected(i)}>
                  Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.companies?.name ?? 'Interview'} - ${selected.round_name}` : 'Interview'}
        subtitle={selected?.placement_drives?.role_title}
        maxWidth="lg"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <InterviewStatusBadge status={selected.status} />
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Date &amp; time</dt>
                <dd className="font-medium text-foreground">{formatDateTime(selected.scheduled_at)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Mode</dt>
                <dd className="font-medium text-foreground">{selected.mode}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{selected.mode === 'Online' ? 'Meeting link' : 'Venue'}</dt>
                <dd className="font-medium text-foreground break-all">
                  {selected.mode === 'Online' ? (
                    selected.meeting_url ? (
                      <a className="text-primary underline" href={selected.meeting_url} target="_blank" rel="noopener noreferrer">
                        {selected.meeting_url}
                      </a>
                    ) : (
                      'Will be shared soon'
                    )
                  ) : (
                    selected.venue || 'Will be shared soon'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Interviewer</dt>
                <dd className="font-medium text-foreground">{selected.interviewer_name || 'To be announced'}</dd>
              </div>
            </dl>

            {selected.feedback && (
              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                  <MessageSquare className="w-3.5 h-3.5" /> {selected.status === 'Cancelled' ? 'Reason' : 'Recruiter feedback'}
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selected.feedback}</p>
              </div>
            )}

            {selected.status === 'Scheduled' && (
              <div className="flex flex-wrap gap-2 pt-1">
                <a href={googleCalendarUrl(selected)} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm" leftIcon={<CalendarPlus className="w-4 h-4" />}>
                    Google Calendar
                  </Button>
                </a>
                <Button variant="secondary" size="sm" leftIcon={<Calendar className="w-4 h-4" />} onClick={() => downloadIcs(selected)}>
                  Download .ics
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
