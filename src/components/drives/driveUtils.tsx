import React from 'react';
import { Badge } from '../app/Badge';
import type { ApprovalStatus, DriveProfile, DriveRecord, DriveRound } from '../../api/drive.api';

export const getErrorMessage = (err: unknown, fallback: string) => {
  const data = (err as { response?: { data?: { message?: string; error?: { field: string; message: string }[] | string } } })?.response?.data;
  if (Array.isArray(data?.error) && data.error.length) return data.error.map((e) => e.message).join(' ');
  return data?.message || fallback;
};

const money = (n?: number | string | null) => {
  if (n === null || n === undefined || n === '') return null;
  const value = Number(n);
  return Number.isFinite(value) && value > 0 ? value.toLocaleString('en-IN') : null;
};

/** "₹12,500–₹20,000" or "₹3.6–7 LPA"; null when nothing is set. */
const formatRange = (min?: number | string | null, max?: number | string | null, suffix = '') => {
  const a = money(min);
  const b = money(max);
  if (!a && !b) return null;
  if (!a || !b || a === b) return `₹${a || b}${suffix}`;
  return `₹${a}–${b}${suffix}`;
};

export const stipendText = (p: DriveProfile) => formatRange(p.stipend_min, p.stipend_max, ' / month');
export const ctcText = (p: DriveProfile) => formatRange(p.ctc_min, p.ctc_max, ' LPA');
export const ppoText = (p: DriveProfile) => formatRange(p.ppo_ctc_min, p.ppo_ctc_max, ' LPA');

/** One-line pay summary for list rows: the best figure across all profiles. */
export const driveHeadline = (drive: DriveRecord) => {
  const profiles = drive.drive_profiles ?? [];
  const best = (key: keyof DriveProfile) => profiles.reduce((m, p) => Math.max(m, Number(p[key]) || 0), 0);
  const ctc = best('ctc_max') || best('ppo_ctc_max') || best('ctc_min');
  if (ctc) return `Up to ₹${ctc} LPA`;
  const stipend = best('stipend_max') || best('stipend_min');
  if (stipend) return `Up to ₹${stipend.toLocaleString('en-IN')} / month`;
  return Number(drive.ctc) > 0 ? `₹${drive.ctc} LPA` : '';
};

export const roundName = (r: string | DriveRound) => (typeof r === 'string' ? r : r?.name || '');

export const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString([], { dateStyle: 'medium' }) : '-');
export const formatDateTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-');

/** "3 days left" / "closes today" / "closed". */
export const deadlineText = (iso?: string | null) => {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return { label: 'Registration closed', closed: true };
  const days = Math.ceil(diff / 86400000);
  return { label: days <= 1 ? 'Closes today' : `${days} days left`, closed: false };
};

const APPROVAL_VARIANT: Record<ApprovalStatus, 'neutral' | 'warning' | 'success' | 'alert'> = {
  Draft: 'neutral',
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'alert',
};

export const ApprovalBadge: React.FC<{ status: ApprovalStatus }> = ({ status }) => (
  <Badge variant={APPROVAL_VARIANT[status] ?? 'neutral'} size="sm" dot>
    {status === 'Pending' ? 'Pending approval' : status}
  </Badge>
);

export const toDateTimeLocal = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const toDateInput = (iso?: string | null) => (iso ? String(iso).slice(0, 10) : '');
