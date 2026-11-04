import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Award, Building2, CalendarDays, CheckCircle2, FileText, RefreshCw, XCircle } from 'lucide-react';
import { Card } from '../app/Card';
import { Button } from '../app/Button';
import { Textarea } from '../app/Input';
import { Skeleton } from '../app/Skeleton';
import { EmptyState } from '../app/EmptyState';
import { Breadcrumb } from '../app/Breadcrumb';
import { Modal } from '../app/Modal';
import { useToast } from '../app/Toast';
import { PermissionGuard } from '../auth/PermissionGuard';
import { Action, Module } from '../../config/rbac';
import { getOfferFileUrl, getOffers, respondToOffer } from '../../api/offer.api';
import type { Offer } from '../../types';
import { OfferStatusBadge, daysLeft, formatDate, formatDateTime, formatPackage, getErrorMessage } from './offerUtils';

export const StudentOffers: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [viewing, setViewing] = useState<Offer | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [answering, setAnswering] = useState<{ offer: Offer; decision: 'accept' | 'decline' } | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getOffers({ limit: 50 });
      setOffers(res.data ?? []);
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load your offers.');
      setErrorMsg(message);
      toastError('Error loading offers', message);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPdfUrl(null);
    setPdfError(null);
    if (!viewing?.storage_path) return;
    let cancelled = false;
    getOfferFileUrl(viewing.id)
      .then((file) => !cancelled && setPdfUrl(file.url))
      .catch((err) => !cancelled && setPdfError(getErrorMessage(err, 'Could not load the offer letter.')));
    return () => {
      cancelled = true;
    };
  }, [viewing]);

  const confirmAnswer = async () => {
    if (!answering) return;
    setSaving(true);
    try {
      await respondToOffer(answering.offer.id, { decision: answering.decision, reason: reason.trim() || undefined });
      success(answering.decision === 'accept' ? 'Offer accepted' : 'Offer declined', answering.decision === 'accept' ? 'Congratulations! The TPO has been informed.' : 'The TPO and recruiter have been informed.');
      setAnswering(null);
      setViewing(null);
      await load();
    } catch (err) {
      toastError('Could not save your response', getErrorMessage(err, 'Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const openAnswer = (offer: Offer, decision: 'accept' | 'decline') => {
    setReason('');
    setAnswering({ offer, decision });
  };

  const actionable = (o: Offer) => o.offer_status === 'Released';

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Offers' }]} />
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-1">My Offers</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Review your offer letters and accept or decline before the deadline.</p>
        </div>
        <Button variant="secondary" leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((n) => (
            <Skeleton key={n} variant="rectangular" className="w-full h-32" />
          ))}
        </div>
      ) : errorMsg ? (
        <EmptyState title="Could not load offers" description={errorMsg} actionText="Try again" onAction={load} />
      ) : offers.length === 0 ? (
        <EmptyState
          icon={<Award className="w-8 h-8" />}
          title="No offers yet"
          description="When a company releases an offer to you, it will appear here and you will get a notification."
        />
      ) : (
        <div className="grid gap-4">
          {offers.map((o) => {
            const left = daysLeft(o.response_deadline);
            return (
              <Card key={o.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground truncate flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      {o.companies?.name ?? 'Company'}
                    </h3>
                    <OfferStatusBadge status={o.offer_status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{o.role_title || o.placement_drives?.role_title || 'Role'}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{formatPackage(o.package)}</span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" /> Joining: {formatDate(o.joining_date)}
                    </span>
                    {actionable(o) && o.response_deadline && (
                      <span className={`inline-flex items-center gap-1.5 ${left !== null && left <= 2 ? 'text-destructive' : ''}`}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Respond by {formatDate(o.response_deadline)}
                        {left !== null && left >= 0 ? ` (${left} day${left === 1 ? '' : 's'} left)` : ''}
                      </span>
                    )}
                    {o.offer_status === 'Declined' && o.decline_reason && <span>Reason: {o.decline_reason}</span>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button size="sm" variant="secondary" leftIcon={<FileText className="w-4 h-4" />} onClick={() => setViewing(o)}>
                    View letter
                  </Button>
                  {actionable(o) && (
                    <PermissionGuard module={Module.OFFER_LETTERS} action={Action.RESPOND}>
                      <Button size="sm" leftIcon={<CheckCircle2 className="w-4 h-4" />} onClick={() => openAnswer(o, 'accept')}>
                        Accept
                      </Button>
                      <Button size="sm" variant="ghost" leftIcon={<XCircle className="w-4 h-4" />} onClick={() => openAnswer(o, 'decline')}>
                        Decline
                      </Button>
                    </PermissionGuard>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? `${viewing.companies?.name ?? 'Offer'} - ${viewing.role_title || viewing.placement_drives?.role_title || ''}` : 'Offer'}
        subtitle={viewing ? `${formatPackage(viewing.package)} · Joining ${formatDate(viewing.joining_date)}` : undefined}
        maxWidth="4xl"
      >
        {viewing && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <OfferStatusBadge status={viewing.offer_status} />
              {viewing.response_deadline && <span className="text-muted-foreground">Respond by {formatDateTime(viewing.response_deadline)}</span>}
              {viewing.responded_at && <span className="text-muted-foreground">Answered {formatDateTime(viewing.responded_at)}</span>}
            </div>

            {viewing.storage_path ? (
              pdfUrl ? (
                <iframe title="Offer letter" src={pdfUrl} className="w-full h-[60vh] rounded-2xl border border-border bg-muted" />
              ) : pdfError ? (
                <p className="text-sm text-destructive">{pdfError}</p>
              ) : (
                <Skeleton variant="rectangular" className="w-full h-[60vh]" />
              )
            ) : (
              <p className="text-sm text-muted-foreground">No offer letter file is attached.</p>
            )}

            {actionable(viewing) && (
              <PermissionGuard module={Module.OFFER_LETTERS} action={Action.RESPOND}>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => openAnswer(viewing, 'decline')}>
                    Decline
                  </Button>
                  <Button onClick={() => openAnswer(viewing, 'accept')}>Accept offer</Button>
                </div>
              </PermissionGuard>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(answering)}
        onClose={() => !saving && setAnswering(null)}
        title={answering?.decision === 'accept' ? 'Accept this offer?' : 'Decline this offer?'}
        subtitle={answering ? `${answering.offer.companies?.name ?? ''} · ${formatPackage(answering.offer.package)}` : undefined}
        maxWidth="md"
      >
        {answering && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {answering.decision === 'accept'
                ? 'Accepting marks you as placed. This cannot be undone from your side.'
                : 'Declining cannot be undone. The TPO and the recruiter will be informed.'}
            </p>
            {answering.decision === 'decline' && (
              <Textarea label="Reason (optional)" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
            )}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAnswering(null)} disabled={saving}>
                Go back
              </Button>
              <Button variant={answering.decision === 'accept' ? 'primary' : 'danger'} onClick={confirmAnswer} isLoading={saving}>
                {answering.decision === 'accept' ? 'Yes, accept' : 'Yes, decline'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
