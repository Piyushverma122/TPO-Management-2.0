import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  Plus,
  Radio,
  RefreshCw,
  Video,
  XCircle,
} from 'lucide-react';
import { Card } from '../app/Card';
import { Button } from '../app/Button';
import { SearchInput } from '../app/Input';
import { Dropdown } from '../app/Dropdown';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../app/Table';
import { Pagination } from '../app/Pagination';
import { Skeleton } from '../app/Skeleton';
import { EmptyState } from '../app/EmptyState';
import { Breadcrumb } from '../app/Breadcrumb';
import { Tabs } from '../app/Tabs';
import { Badge } from '../app/Badge';
import { StatTile } from '../app/StatTile';
import { CompanyCell, PersonCell } from '../app/EntityCell';
import { useToast } from '../app/Toast';
import { PermissionGuard } from '../auth/PermissionGuard';
import { useAuth } from '../../context/AuthContext';
import { Action, Module, canPerformAction } from '../../config/rbac';
import { getInterviews, getInterviewSummary } from '../../api/interview.api';
import type { InterviewSummary, InterviewView } from '../../api/interview.api';
import type { Interview, InterviewStatus } from '../../types';
import { InterviewFormModal } from './InterviewFormModal';
import { CancelInterviewModal, InterviewResultModal } from './InterviewActionModals';
import { InterviewStatusBadge, formatDateTime, getErrorMessage, interviewEnd, relativeTime } from './interviewUtils';

const PAGE_SIZE = 10;

type Tab = InterviewView | 'all';

const STATUS_OPTIONS = [
  { label: 'All statuses', value: '' },
  { label: 'Scheduled', value: 'Scheduled' },
  { label: 'Passed', value: 'Passed' },
  { label: 'Failed', value: 'Failed' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
];

const EMPTY_COPY: Record<Tab, { title: string; description: string }> = {
  upcoming: { title: 'Nothing scheduled ahead', description: 'Shortlisted candidates can be scheduled for their next round from here.' },
  live: { title: 'No interview is live right now', description: 'Interviews show up here while they are in progress.' },
  awaiting: { title: 'No results are pending', description: 'Every finished interview has a result recorded.' },
  history: { title: 'No finished interviews yet', description: 'Passed, failed, completed and cancelled interviews are kept here.' },
  all: { title: 'No interviews match these filters', description: 'Try a different search or status.' },
};

export const ManageInterviews: React.FC = () => {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const canCreate = canPerformAction(user?.role, Module.INTERVIEWS, Action.CREATE);

  const [rows, setRows] = useState<Interview[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [view, setView] = useState<Tab>('upcoming');
  const [summary, setSummary] = useState<InterviewSummary | null>(null);
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [reschedule, setReschedule] = useState<Interview | null>(null);
  const [cancelling, setCancelling] = useState<Interview | null>(null);
  const [recording, setRecording] = useState<Interview | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setErrorMsg(null);
      try {
        const [res, counts] = await Promise.all([
          getInterviews({
            page,
            limit: PAGE_SIZE,
            search: search || undefined,
            view: view === 'all' ? undefined : view,
            status: (view === 'all' || view === 'history') && status ? (status as InterviewStatus) : undefined,
          }),
          getInterviewSummary(),
        ]);
        setRows(res.data ?? []);
        setTotal(res.pagination?.totalEntries ?? 0);
        setTotalPages(res.pagination?.totalPages ?? 1);
        setSummary(counts);
      } catch (err) {
        const message = getErrorMessage(err, 'Failed to load interviews.');
        setErrorMsg(message);
        if (!silent) toastError('Error loading interviews', message);
      } finally {
        setLoading(false);
      }
    },
    [page, search, view, status, toastError]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Keep "Live now" and "Result pending" honest while the page stays open.
  useEffect(() => {
    const timer = setInterval(() => load(true), 60_000);
    return () => clearInterval(timer);
  }, [load]);

  const openTab = (next: Tab) => {
    setView(next);
    setStatus('');
    setPage(1);
  };

  const hasStarted = (i: Interview) => new Date(i.scheduled_at).getTime() <= Date.now();
  const isLive = (i: Interview) => i.status === 'Scheduled' && hasStarted(i) && interviewEnd(i).getTime() >= Date.now();
  const awaitingResult = (i: Interview) => i.status === 'Scheduled' && interviewEnd(i).getTime() < Date.now();

  const empty = EMPTY_COPY[view];

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Interviews' }]} />
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-1">Interviews</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            What is coming up, what is live right now, and the full history. Schedule, reschedule, cancel and record results.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={() => load()} disabled={loading}>
            Refresh
          </Button>
          <PermissionGuard module={Module.INTERVIEWS} action={Action.CREATE}>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
              Schedule interview
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatTile label="Today" value={summary?.today} icon={<CalendarDays className="w-5 h-5" />} tone="primary" hint="on the calendar" />
        <StatTile
          label="Upcoming"
          value={summary?.upcoming}
          icon={<CalendarClock className="w-5 h-5" />}
          tone="info"
          hint="scheduled ahead"
          active={view === 'upcoming'}
          onClick={() => openTab('upcoming')}
        />
        <StatTile
          label="Live now"
          value={summary?.live}
          icon={<Radio className="w-5 h-5" />}
          tone="success"
          hint="in progress"
          pulse={(summary?.live ?? 0) > 0}
          active={view === 'live'}
          onClick={() => openTab('live')}
        />
        <StatTile
          label="Result pending"
          value={summary?.awaiting}
          icon={<ClipboardCheck className="w-5 h-5" />}
          tone={(summary?.awaiting ?? 0) > 0 ? 'warning' : 'neutral'}
          hint="finished, no result yet"
          active={view === 'awaiting'}
          onClick={() => openTab('awaiting')}
        />
        <StatTile
          label="Passed"
          value={summary?.passed}
          icon={<CheckCircle2 className="w-5 h-5" />}
          tone="success"
          hint="cleared a round"
          onClick={() => {
            openTab('history');
            setStatus('Passed');
          }}
        />
      </div>

      {(summary?.awaiting ?? 0) > 0 && view !== 'awaiting' && (
        <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-amber-500/40 bg-amber-500/5">
          <div className="flex items-center gap-3 text-sm text-foreground">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <span>
              <strong>{summary?.awaiting}</strong> interview{summary?.awaiting === 1 ? ' has' : 's have'} finished without a recorded result. Candidates are waiting to hear back.
            </span>
          </div>
          <Button size="sm" variant="secondary" onClick={() => openTab('awaiting')}>
            Review now
          </Button>
        </Card>
      )}

      <Card className="p-3 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <Tabs
            variant="pills"
            activeTab={view}
            onChange={(id) => openTab(id as Tab)}
            tabs={[
              { id: 'upcoming', label: `Upcoming${summary ? ` (${summary.upcoming})` : ''}` },
              { id: 'live', label: `Live now${summary ? ` (${summary.live})` : ''}` },
              { id: 'awaiting', label: `Result pending${summary ? ` (${summary.awaiting})` : ''}` },
              { id: 'history', label: `History${summary ? ` (${summary.history})` : ''}` },
              { id: 'all', label: 'All' },
            ]}
          />
          <div className="flex-1 min-w-0">
            <SearchInput placeholder="Search by round name..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          {(view === 'all' || view === 'history') && (
            <Dropdown
              className="w-full lg:w-44 shrink-0"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            />
          )}
        </div>
      </Card>

      {loading ? (
        <Card className="p-4 space-y-3">
          {[0, 1, 2, 3].map((n) => (
            <Skeleton key={n} variant="rectangular" className="w-full h-12" />
          ))}
        </Card>
      ) : errorMsg ? (
        <EmptyState title="Could not load interviews" description={errorMsg} actionText="Try again" onAction={() => load()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="w-8 h-8" />}
          title={empty.title}
          description={empty.description}
          actionText={canCreate && (view === 'upcoming' || view === 'all') ? 'Schedule an interview' : undefined}
          onAction={canCreate ? () => setShowForm(true) : undefined}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table bare>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Company / role</TableHead>
                <TableHead>Round</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <PersonCell name={i.students?.users?.full_name} sub={i.students?.roll_number} />
                  </TableCell>
                  <TableCell>
                    <CompanyCell name={i.companies?.name} logo={i.companies?.logo_url} sub={i.placement_drives?.role_title} />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{i.round_name}</div>
                    {i.interviewer_name && <div className="text-xs text-muted-foreground">{i.interviewer_name}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="text-foreground whitespace-nowrap">{formatDateTime(i.scheduled_at)}</div>
                    <div className="text-xs text-muted-foreground">
                      {relativeTime(i.scheduled_at)}
                      {i.reschedule_count > 0 && ` · rescheduled ${i.reschedule_count}x`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                      {i.mode === 'Online' ? <Video className="w-3.5 h-3.5 text-muted-foreground" /> : <MapPin className="w-3.5 h-3.5 text-muted-foreground" />}
                      {i.mode}
                    </span>
                    {i.feedback && i.status !== 'Scheduled' && (
                      <div className="text-xs text-muted-foreground max-w-[14rem] truncate" title={i.feedback}>
                        {i.feedback}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {isLive(i) ? (
                      <Badge variant="success" size="sm" dot>
                        Live now
                      </Badge>
                    ) : awaitingResult(i) ? (
                      <Badge variant="warning" size="sm" dot>
                        Result pending
                      </Badge>
                    ) : (
                      <InterviewStatusBadge status={i.status} />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      {i.status === 'Scheduled' && (
                        <PermissionGuard module={Module.INTERVIEWS} action={Action.EDIT}>
                          {hasStarted(i) ? (
                            <Button size="sm" leftIcon={<CheckCircle2 className="w-4 h-4" />} onClick={() => setRecording(i)}>
                              Result
                            </Button>
                          ) : (
                            <Button size="sm" variant="secondary" leftIcon={<CalendarClock className="w-4 h-4" />} onClick={() => setReschedule(i)}>
                              Reschedule
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" leftIcon={<XCircle className="w-4 h-4" />} onClick={() => setCancelling(i)}>
                            Cancel
                          </Button>
                        </PermissionGuard>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-3 border-t border-border">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalEntries={total} />
          </div>
        </Card>
      )}

      <InterviewFormModal isOpen={showForm} onClose={() => setShowForm(false)} onSaved={() => load()} />
      <InterviewFormModal isOpen={Boolean(reschedule)} interview={reschedule} onClose={() => setReschedule(null)} onSaved={() => load()} />
      <CancelInterviewModal interview={cancelling} onClose={() => setCancelling(null)} onSaved={() => load()} />
      <InterviewResultModal interview={recording} onClose={() => setRecording(null)} onSaved={() => load()} />
    </div>
  );
};
