import React from 'react';
import { Badge } from '../app/Badge';
import { getOfferFileUrl } from '../../api/offer.api';

const STATUS_VARIANT: Record<string, 'info' | 'success' | 'alert' | 'neutral' | 'warning'> = {
  'Pending Approval': 'warning',
  Released: 'info',
  Accepted: 'success',
  Declined: 'alert',
  Rejected: 'alert',
  Expired: 'neutral',
};

export const OfferStatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <Badge variant={STATUS_VARIANT[status] ?? 'neutral'} size="sm" dot>
    {status}
  </Badge>
);

export const formatPackage = (value: number | string | null | undefined) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? `\u20B9${n} LPA` : '-';
};

export const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString([], { dateStyle: 'medium' }) : '-';

export const formatDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-';

export const daysLeft = (iso?: string | null) => {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
};

export const getErrorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

/**
 * Opens the offer PDF (served through a short-lived signed link) in a new tab.
 * The tab is opened first, inside the click, so popup blockers allow it.
 */
export const openOfferLetter = async (id: string, onError: (message: string) => void) => {
  const tab = window.open('', '_blank');
  try {
    const file = await getOfferFileUrl(id);
    if (tab) tab.location.href = file.url;
    else window.location.assign(file.url);
  } catch (err) {
    tab?.close();
    onError(getErrorMessage(err, 'Could not open the offer letter.'));
  }
};
