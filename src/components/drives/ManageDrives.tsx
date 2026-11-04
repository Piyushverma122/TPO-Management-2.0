import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Briefcase, CalendarClock, Check, CheckCircle2, Clock, Eye, Pencil, Plus, Radio, RefreshCw, Trash2, Users, X, XCircle } from 'lucide-react';
import { Card } from '../app/Card';
import { Button } from '../app/Button';
import { SearchInput } from '../app/Input';
import { Textarea } from '../app/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../app/Table';
import { Pagination } from '../app/Pagination';
import { Skeleton } from '../app/Skeleton';
import { EmptyState } from '../app/EmptyState';
import { Breadcrumb } from '../app/Breadcrumb';
import { Tabs } from '../app/Tabs';
import { Modal } from '../app/Modal';
import { Badge } from '../app/Badge';
import { StatTile } from '../app/StatTile';
import { CompanyCell } from '../app/EntityCell';
import { useToast } from '../app/Toast';
import { PermissionGuard } from '../auth/PermissionGuard';
import { useAuth } from '../../context/AuthContext';
import { Action, Module, Role, normalizeRole } from '../../config/rbac';
import { approveDrive, deleteDrive, getDriveById, getDriveSummary, getDrives, rejectDrive } from '../../api/drive.api';
import type { ApprovalStatus, DriveRecord, DriveSummary } from '../../api/drive.api';
import { DriveDetail } from './DriveDetail';
import { DriveFormModal } from './DriveFormModal';
import { ApprovalBadge, deadlineText, driveHeadline, formatDate, getErrorMessage } from './driveUtils';

const PAGE_SIZE = 10;
type Tab = 'Pending' | 'Approved' | 'Rejected' | 'Draft' | 'all';

/** Drives for TPO/admin (all companies, with the approval queue) and recruiters (their own company). */
export const ManageDrives: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const role = normalizeRole(user?.role);
  const isRecruiter = role === Role.RECRUITER;
  const canApprove = role === Role.ADMIN || role === Role.TPO;

  const [rows, setRows] = useState<DriveRecord[]>([]);
  const [summary, setSummary] = useState<DriveSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>('all');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [viewing, setViewing] = useState<DriveRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DriveRecord | null>(null);
  const [reviewing, setReviewing] = useState<{ drive: DriveRecord; action: 'approve' | 'reject' } | null>(null);
  const [reason, setReason] = useState('');
  const [deleting, setDeleting] = useState<DriveRecord | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [res, counts] = await Promise.all([
        getDrives({ page, limit: PAGE_SIZE, search: search || undefined, approval_status: tab === 'all' ? undefined : (tab as ApprovalStatus) }),
        getDriveSummary(),
      ]);
      setRows(res.data ?? []);
      setTotal(res.pagination?.totalEntries ?? 0);
      setTotalPages(res.pagination?.totalPages ?? 1);
      setSummary(counts);
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load drives.');
      setErrorMsg(message);
      toastError('Error loading drives', message);
    } finally {
      setLoading(false);
    }
  }, [page, search, tab, toastError]);

  useEffect(() => {
    load();
  }, [load]);

  const openTab = (next: Tab) => {
    setTab(next);
    setPage(1);
  };

  const openView = async (drive: DriveRecord) => {
    setViewing(drive);
    try {
      setViewing(await getDriveById(drive.id)); // fresh copy with every field
    } catch {
      /* the list row is still shown */
    }
  };

  const submitReview = async () => {
    if (!reviewing) return;
    if (reviewing.action === 'reject' && !reason.trim()) {
      toastError('Reason required', 'Tell the recruiter why the drive is rejected.');
      return;
    }
    setSaving(true);
    try {
      if (reviewing.action === 'approve') await approveDrive(reviewing.drive.id);
      else await rejectDrive(reviewing.drive.id, reason.trim());
      success(reviewing.action === 'approve' ? 'Drive approved' : 'Drive rejected', reviewing.action === 'approve' ? 'It is live and eligible students were notified.' : 'The recruiter was notified.');
      setReviewing(null);
      setViewing(null);
      await load();
    } catch (err) {
      toastError('Review failed', getErrorMessage(err, 'Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await deleteDrive(deleting.id);
      success('Drive deleted');
      setDeleting(null);
      await load();
    } catch (err) {
      toastError('Could not delete', getErrorMessage(err, 'Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const canEditRow = (d: DriveRecord) => canApprove || ['Draft', 'Rejected', 'Pending'].includes(d.approval_status);

  const tabs: { id: Tab; label: string }[] = [
    ...(canApprove ? [{ id: 'Pending' as Tab, label: `Pending approval${summary ? ` (${summary.pending})` : ''}` }] : []),
    { id: 'Approved', label: 'Published' },
    ...(isRecruiter ? [{ id: 'Rejected' as Tab, label: `Rejected${summary ? ` (${summary.rejected})` : ''}` }] : []),
    { id: 'Draft', label: 'Drafts' },
    { id: 'all', label: 'All' },
  ];

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Placement Drives' }]} />
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-1">{isRecruiter ? 'My Drives' : 'Placement Drives'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRecruiter ? 'Create drives for your company. The TPO approves them before students see them.' : 'Review recruiter drives, publish your own and track registrations.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={load} disabled={loading}>
            Refresh
          </Button>
          <PermissionGuard module={Module.PLACEMENT_DRIVES} action={Action.CREATE}>
            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Create drive
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {canApprove ? (
          <StatTile label="Pending approval" value={summary?.pending} icon={<Clock className="w-5 h-5" />} tone={(summary?.pending ?? 0) > 0 ? 'warning' : 'neutral'} hint="from recruiters" active={tab === 'Pending'} onClick={() => openTab('Pending')} />
        ) : (
          <StatTile label="Awaiting TPO" value={summary?.pending} icon={<Clock className="w-5 h-5" />} tone="warning" hint="submitted by you" active={tab === 'Pending'} onClick={() => openTab('Pending')} />
        )}
        <StatTile label="Live" value={summary?.live} icon={<Radio className="w-5 h-5" />} tone="success" hint="drive in progress" pulse={(summary?.live ?? 0) > 0} />
        <StatTile label="Upcoming" value={summary?.upcoming} icon={<CalendarClock className="w-5 h-5" />} tone="info" hint="registration open" />
        <StatTile label="Completed" value={summary?.closed} icon={<CheckCircle2 className="w-5 h-5" />} tone="neutral" hint="finished drives" />
      </div>

      {canApprove && (summary?.pending ?? 0) > 0 && tab !== 'Pending' && (
        <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-amber-500/40 bg-amber-500/5">
          <div className="flex items-center gap-3 text-sm text-foreground">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <span>
              <strong>{summary?.pending}</strong> drive{summary?.pending === 1 ? ' is' : 's are'} waiting for approval. Students cannot see {summary?.pending === 1 ? 'it' : 'them'} yet.
            </span>
          </div>
          <Button size="sm" variant="secondary" onClick={() => openTab('Pending')}>
            Review now
          </Button>
        </Card>
      )}

      <Card className="p-3 flex flex-col lg:flex-row lg:items-center gap-3">
        <Tabs variant="pills" activeTab={tab} onChange={(id) => openTab(id as Tab)} tabs={tabs} />
        <div className="flex-1 min-w-0">
          <SearchInput placeholder="Search by role, drive code or location..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <Card className="p-4 space-y-3">
          {[0, 1, 2, 3].map((n) => (
            <Skeleton key={n} variant="rectangular" className="w-full h-12" />
          ))}
        </Card>
      ) : errorMsg ? (
        <EmptyState title="Could not load drives" description={errorMsg} actionText="Try again" onAction={load} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-8 h-8" />}
          title={tab === 'Pending' ? 'Nothing waiting for approval' : 'No drives here'}
          description={tab === 'Pending' ? 'Drives submitted by recruiters appear here.' : 'Create a drive to get started.'}
          actionText={tab !== 'all' ? 'View all drives' : undefined}
          onAction={() => openTab('all')}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table bare>
            <TableHeader>
              <TableRow>
                <TableHead>Company / profiles</TableHead>
                <TableHead>Pay</TableHead>
                <TableHead>Drive date</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Applicants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d) => {
                const dl = deadlineText(d.registration_deadline);
                const profileCount = d.drive_profiles?.length ?? 0;
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <CompanyCell name={d.companies?.name} logo={d.companies?.logo_url} sub={profileCount > 1 ? `${d.drive_profiles?.[0]?.title} +${profileCount - 1} more` : d.role_title} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium text-foreground">{driveHeadline(d) || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(d.drive_date)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div>{formatDate(d.registration_deadline)}</div>
                      {dl && <div className={`text-xs ${dl.closed ? 'text-muted-foreground' : 'text-primary'}`}>{dl.label}</div>}
                    </TableCell>
                    <TableCell>
                      <button type="button" onClick={() => navigate(`/applications?drive_id=${d.id}`)} className="inline-flex items-center gap-1.5 text-sm hover:text-primary">
                        <Users className="w-3.5 h-3.5" /> {d.applied_count ?? 0}
                      </button>
                    </TableCell>
                    <TableCell>
                      <ApprovalBadge status={d.approval_status} />
                      {d.approval_status === 'Approved' && (
                        <div className="mt-1">
                          <Badge variant="neutral" size="sm">
                            {d.status}
                          </Badge>
                        </div>
                      )}
                      {d.approval_status === 'Rejected' && d.rejection_reason && <div className="text-xs text-muted-foreground mt-1 max-w-[14rem]">{d.rejection_reason}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        {canApprove && d.approval_status === 'Pending' && (
                          <>
                            <Button size="sm" leftIcon={<Check className="w-4 h-4" />} onClick={() => { setReason(''); setReviewing({ drive: d, action: 'approve' }); }}>
                              Approve
                            </Button>
                            <Button size="sm" variant="ghost" leftIcon={<X className="w-4 h-4" />} onClick={() => { setReason(''); setReviewing({ drive: d, action: 'reject' }); }}>
                              Reject
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="secondary" leftIcon={<Eye className="w-4 h-4" />} onClick={() => openView(d)}>
                          View
                        </Button>
                        {canEditRow(d) && (
                          <PermissionGuard module={Module.PLACEMENT_DRIVES} action={Action.EDIT}>
                            <Button
                              size="sm"
                              variant="ghost"
                              iconOnly
                              aria-label="Edit drive"
                              onClick={async () => {
                                try {
                                  setEditing(await getDriveById(d.id));
                                  setFormOpen(true);
                                } catch (err) {
                                  toastError('Could not open the drive', getErrorMessage(err, 'Please try again.'));
                                }
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </PermissionGuard>
                        )}
                        <PermissionGuard module={Module.PLACEMENT_DRIVES} action={Action.DELETE}>
                          <Button size="sm" variant="ghost" iconOnly aria-label="Delete drive" onClick={() => setDeleting(d)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </PermissionGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="p-3 border-t border-border">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalEntries={total} />
          </div>
        </Card>
      )}

      <Modal isOpen={Boolean(viewing)} onClose={() => setViewing(null)} title="Drive details" maxWidth="5xl">
        {viewing && (
          <div className="space-y-5">
            <DriveDetail drive={viewing} />
            {canApprove && viewing.approval_status === 'Pending' && (
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button variant="ghost" leftIcon={<XCircle className="w-4 h-4" />} onClick={() => { setReason(''); setReviewing({ drive: viewing, action: 'reject' }); }}>
                  Reject
                </Button>
                <Button leftIcon={<Check className="w-4 h-4" />} onClick={() => { setReason(''); setReviewing({ drive: viewing, action: 'approve' }); }}>
                  Approve and publish
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <DriveFormModal isOpen={formOpen} drive={editing} isRecruiter={isRecruiter} onClose={() => setFormOpen(false)} onSaved={load} />

      <Modal
        isOpen={Boolean(reviewing)}
        onClose={() => !saving && setReviewing(null)}
        title={reviewing?.action === 'approve' ? 'Approve and publish this drive?' : 'Reject this drive?'}
        subtitle={reviewing ? `${reviewing.drive.companies?.name ?? ''} · ${reviewing.drive.role_title}` : undefined}
        maxWidth="md"
      >
        {reviewing && (
          <div className="space-y-4">
            {reviewing.action === 'approve' ? (
              <p className="text-sm text-muted-foreground">Eligible students get a notification and an email. This cannot be taken back.</p>
            ) : (
              <Textarea label="Reason (sent to the recruiter)" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
            )}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setReviewing(null)} disabled={saving}>
                Go back
              </Button>
              <Button variant={reviewing.action === 'approve' ? 'primary' : 'danger'} onClick={submitReview} isLoading={saving}>
                {reviewing.action === 'approve' ? 'Approve and publish' : 'Reject drive'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={Boolean(deleting)} onClose={() => !saving && setDeleting(null)} title="Delete this drive?" subtitle={deleting?.role_title} maxWidth="md">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Students will no longer see it. Existing applications are kept.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleting(null)} disabled={saving}>
              Keep
            </Button>
            <Button variant="danger" onClick={confirmDelete} isLoading={saving}>
              Delete drive
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
