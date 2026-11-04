import React from 'react';
import { Badge } from '../app/Badge';
import type { Interview, InterviewStatus } from '../../types';

const STATUS_VARIANT: Record<InterviewStatus, 'info' | 'success' | 'alert' | 'neutral' | 'warning'> = {
  Scheduled: 'info',
  Completed: 'neutral',
  Passed: 'success',
  Failed: 'alert',
  Cancelled: 'warning',
};

export const InterviewStatusBadge: React.FC<{ status: InterviewStatus }> = ({ status }) => (
  <Badge variant={STATUS_VARIANT[status] ?? 'neutral'} size="sm" dot>
    {status}
  </Badge>
);

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export const getErrorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

export const interviewEnd = (i: Interview) =>
  i.end_at ? new Date(i.end_at) : new Date(new Date(i.scheduled_at).getTime() + 60 * 60 * 1000);

const toCalendarStamp = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

const calendarTitle = (i: Interview) => `Interview: ${i.round_name} - ${i.companies?.name ?? ''}`.trim();
const calendarPlace = (i: Interview) => (i.mode === 'Online' ? i.meeting_url : i.venue) || 'To be shared';

export const googleCalendarUrl = (i: Interview) =>
  `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calendarTitle(i))}` +
  `&dates=${toCalendarStamp(new Date(i.scheduled_at))}/${toCalendarStamp(interviewEnd(i))}` +
  `&details=${encodeURIComponent(i.placement_drives?.role_title ?? 'Campus recruitment interview')}` +
  `&location=${encodeURIComponent(calendarPlace(i))}`;

export const downloadIcs = (i: Interview) => {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TPO Management System//EN',
    'BEGIN:VEVENT',
    `UID:${i.id}@tpo`,
    `SUMMARY:${calendarTitle(i)}`,
    `LOCATION:${calendarPlace(i)}`,
    `DTSTART:${toCalendarStamp(new Date(i.scheduled_at))}`,
    `DTEND:${toCalendarStamp(interviewEnd(i))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${i.round_name.replace(/\s+/g, '_')}_interview.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/** `<input type="datetime-local">` works in local time without a zone. */
export const toLocalInputValue = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** "in 2 hours", "tomorrow", "5 minutes ago" - for the small muted line under a date. */
export const relativeTime = (iso: string) => {
  const diff = new Date(iso).getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (Math.abs(diff) < 60 * 60 * 1000) return rtf.format(Math.round(diff / 60000), 'minute');
  if (Math.abs(diff) < 24 * 60 * 60 * 1000) return rtf.format(Math.round(diff / 3600000), 'hour');
  return rtf.format(Math.round(diff / 86400000), 'day');
};
