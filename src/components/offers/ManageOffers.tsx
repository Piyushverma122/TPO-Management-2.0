import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Award, Check, CheckCircle2, Clock, FileText, Plus, RefreshCw, Send, X, XCircle } from 'lucide-react';
import { Card } from '../app/Card';
import { Button } from '../app/Button';
import { Textarea } from '../app/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../app/Table';
import { Pagination } from '../app/Pagination';
import { Skeleton } from '../app/Skeleton';
import { EmptyState } from '../app/EmptyState';
import { Breadcrumb } from '../app/Breadcrumb';
import { Tabs } from '../app/Tabs';
import { StatTile } from '../app/StatTile';
import { CompanyCell, PersonCell } from '../app/EntityCell';
import { Modal } from '../app/Modal';
import { useToast } from '../app/Toast';
import { PermissionGuard } from '../auth/PermissionGuard';
import { useAuth } from '../../context/AuthContext';
import { Action, Module, Role, normalizeRole } from '../../config/rbac';
import { getOfferSummary, getOffers, reviewOffer } from '../../api/offer.api';
import type { OfferSummary } from '../../api/offer.api';
import type { Offer, OfferStatus } from '../../types';
import { OfferUploadModal } from './OfferUploadModal';
import { OfferLetterViewer } from './OfferLetterViewer';
import { OfferStatusBadge, formatDate, formatPackage, getErrorMessage } from './offerUtils';

const PAGE_SIZE = 10;

type Tab = 'Pending Approval' | 'Released' | 'Accepted' | 'all';

export const ManageOffers: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const role = normalizeRole(user?.role);
  const isRecruiter = role === Role.RECRUITER;

  const [rows, setRows] = useState<Offer[]>([]);
  const [summary, setSummary] = useState<OfferSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>('all');
  const [page, setPage] = useState(1);

  const [showUpload, setShowUpload] = useState(false);
  const [viewing, setViewing] = useState<Offer | null>(null);
  const [reviewing, setReviewing] = useState<{ offer: Offer; action: 'approve' | 'reject' } | null>(null);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [res, counts] = await Promise.all([
        getOffers({ page, limit: PAGE_SIZE, status: tab === 'all' ? undefined : (tab as OfferStatus) }),
        getOfferSummary(),
      ]);
      setSummary(counts);
      setRows(res.data ?? []);
      setTotal(res.pagination?.totalEntries ?? 0);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load offers.');
      setErrorMsg(message);
      toastError('Error loading offers', message);
    } finally {
      setLoading(false);
    }
  }, [page, tab, toastError]);

  useEffect(() => {
    load();
  }, [load]);

  const openTab = (next: Tab) => {
    setTab(next);
    setPage(1);
  };

  const startReview = (offer: Offer, action: 'approve' | 'reject') => {
    setRemarks('');
    setReviewing({ offer, action });
  };

  const submitReview = async () => {
    if (!reviewing) return;
    if (reviewing.action === 'reject' && !remarks.trim()) {
      toastError('Reason required', 'Tell the recruiter why the offer is rejected.');
      return;
    }
    setSaving(true);
    try {
      await reviewOffer(reviewing.offer.id, { action: reviewing.action, remarks: remarks.trim() || undefined });
      success(reviewing.action === 'approve' ? 'Offer approved' : 'Offer rejected', reviewing.action === 'approve' ? 'The candidate has been notified.' : 'The recruiter has been notified.');
      setReviewing(null);
      await load();
    } catch (err) {
      toastError('Review failed', getErrorMessage(err, 'Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Offer Letters' }]} />
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-1">Offer Letters</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isRecruiter
              ? 'Upload offers for selected candidates. The TPO approves them before candidates see them.'
              : 'Approve recruiter offers, release your own, and track what candidates decide.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={load} disabled={loading}>
            Refresh
          </Button>
          <PermissionGuard module={Module.OFFER_LETTERS} action={Action.UPLOAD}>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowUpload(true)}>
              Upload offer
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label="Pending approval"
          value={summary?.pending}
          icon={<Clock className="w-5 h-5" />}
          tone={(summary?.pending ?? 0) > 0 ? 'warning' : 'neutral'}
          hint={isRecruiter ? 'waiting for the TPO' : 'needs your decision'}
          active={tab === 'Pending Approval'}
          onClick={() => openTab('Pending Approval')}
        />
        <StatTile label="Released" value={summary?.released} icon={<Send className="w-5 h-5" />} tone="info" hint="awaiting the candidate" active={tab === 'Released'} onClick={() => openTab('Released')} />
        <StatTile label="Accepted" value={summary?.accepted} icon={<CheckCircle2 className="w-5 h-5" />} tone="success" hint="became placements" active={tab === 'Accepted'} onClick={() => openTab('Accepted')} />
        <StatTile label="Closed" value={summary?.closed} icon={<XCircle className="w-5 h-5" />} tone="neutral" hint="declined, rejected or expired" onClick={() => openTab('all')} />
      </div>

      {!isRecruiter && (summary?.pending ?? 0) > 0 && tab !== 'Pending Approval' && (
        <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-amber-500/40 bg-amber-500/5">
          <div className="flex items-center gap-3 text-sm text-foreground">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <span>
              <strong>{summary?.pending}</strong> offer{summary?.pending === 1 ? ' is' : 's are'} waiting for approval before the candidate can see {summary?.pending === 1 ? 'it' : 'them'}.
            </span>
          </div>
          <Button size="sm" variant="secondary" onClick={() => openTab('Pending Approval')}>
            Review now
          </Button>
        </Card>
      )}

      <Card className="p-3">
        <Tabs
          variant="pills"
          activeTab={tab}
          onChange={(id) => openTab(id as Tab)}
          tabs={[
            { id: 'Pending Approval', label: `Pending approval${summary ? ` (${summary.pending})` : ''}` },
            { id: 'Released', label: `Released${summary ? ` (${summary.released})` : ''}` },
            { id: 'Accepted', label: `Accepted${summary ? ` (${summary.accepted})` : ''}` },
            { id: 'all', label: 'All' },
          ]}
        />
      </Card>

      {loading ? (
        <Skeleton variant="rectangular" className="w-full h-64" />
      ) : errorMsg ? (
        <EmptyState title="Could not load offers" description={errorMsg} actionText="Try again" onAction={load} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Award className="w-8 h-8" />}
          title={tab === 'Pending Approval' ? 'Nothing waiting for approval' : 'No offers here'}
          description={tab === 'Pending Approval' ? 'Offers uploaded by recruiters show up here until you approve them.' : 'Offers appear once a selected candidate receives an offer letter.'}
          actionText={tab === 'Pending Approval' && (summary?.released ?? 0) + (summary?.accepted ?? 0) > 0 ? 'View all offers' : undefined}
          onAction={() => openTab('all')}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table bare>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Company / role</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Joining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <PersonCell name={o.students?.users?.full_name} sub={o.students?.roll_number} />
                  </TableCell>
                  <TableCell>
                    <CompanyCell name={o.companies?.name} logo={o.companies?.logo_url} sub={o.role_title || o.placement_drives?.role_title} />
                  </TableCell>
                  <TableCell>{formatPackage(o.package)}</TableCell>
                  <TableCell>{formatDate(o.joining_date)}</TableCell>
                  <TableCell>
                    <OfferStatusBadge status={o.offer_status} />
                    {o.offer_status === 'Rejected' && o.review_remarks && <div className="text-xs text-muted-foreground mt-1 max-w-[16rem]">{o.review_remarks}</div>}
                    {o.offer_status === 'Declined' && o.decline_reason && <div className="text-xs text-muted-foreground mt-1 max-w-[16rem]">{o.decline_reason}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      {o.storage_path && (
                        <Button size="sm" variant="secondary" leftIcon={<FileText className="w-4 h-4" />} onClick={() => setViewing(o)}>
                          Letter
                        </Button>
                      )}
                      {o.offer_status === 'Pending Approval' && (
                        <PermissionGuard module={Module.OFFER_LETTERS} action={Action.APPROVE}>
                          <Button size="sm" leftIcon={<Check className="w-4 h-4" />} onClick={() => startReview(o, 'approve')}>
                            Approve
                          </Button>
                          <Button size="sm" variant="ghost" leftIcon={<X className="w-4 h-4" />} onClick={() => startReview(o, 'reject')}>
                            Reject
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

      <OfferLetterViewer offer={viewing} onClose={() => setViewing(null)} />
      <OfferUploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} onSaved={load} releasesDirectly={!isRecruiter} />

      <Modal
        isOpen={Boolean(reviewing)}
        onClose={() => !saving && setReviewing(null)}
        title={reviewing?.action === 'approve' ? 'Approve and release offer?' : 'Reject offer?'}
        subtitle={reviewing ? `${reviewing.offer.students?.users?.full_name ?? ''} · ${reviewing.offer.companies?.name ?? ''}` : undefined}
        maxWidth="md"
      >
        {reviewing && (
          <div className="space-y-4">
            <Textarea
              label={reviewing.action === 'approve' ? 'Remarks (optional)' : 'Reason (sent to the recruiter)'}
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              maxLength={500}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setReviewing(null)} disabled={saving}>
                Go back
              </Button>
              <Button variant={reviewing.action === 'approve' ? 'primary' : 'danger'} onClick={submitReview} isLoading={saving}>
                {reviewing.action === 'approve' ? 'Approve and release' : 'Reject offer'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
