import React, { useState } from 'react';
import { AlertTriangle, Briefcase, Calendar, CheckCircle2, ChevronDown, ChevronUp, Circle, ExternalLink, FileText, MapPin, Video } from 'lucide-react';
import { Card } from '../app/Card';
import { Badge } from '../app/Badge';
import { Button } from '../app/Button';
import { CompanyCell } from '../app/EntityCell';
import { ProgressBar } from '../app/ProgressBar';
import type { StudentOverview } from '../../api/student.api';
import { InterviewStatusBadge, formatDateTime as formatInterviewTime, relativeTime } from '../interviews/interviewUtils';
import { OfferStatusBadge, formatDate, formatPackage } from '../offers/offerUtils';

export const show = (value: unknown, fallback = 'Not provided') => (value === null || value === undefined || value === '' ? fallback : String(value));

export const Field: React.FC<{ label: string; value?: React.ReactNode; href?: string }> = ({ label, value, href }) => (
  <div className="min-w-0">
    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="text-sm font-medium text-foreground mt-0.5 break-words">
      {value === null || value === undefined || value === '' ? (
        <span className="text-muted-foreground font-normal">Not provided</span>
      ) : href ? (
        <a href={href} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline inline-flex items-center gap-1">
          {value} <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        value
      )}
    </div>
  </div>
);

export const Section: React.FC<{ title: string; children: React.ReactNode; aside?: React.ReactNode }> = ({ title, children, aside }) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {aside}
    </div>
    {children}
  </section>
);

const Empty: React.FC<{ text: string }> = ({ text }) => <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-2xl">{text}</p>;

type OverviewProps = { data: StudentOverview };

const APP_VARIANT = (status: string): 'success' | 'alert' | 'warning' | 'info' | 'neutral' =>
  ['Selected', 'Offer'].includes(status) ? 'success' : status === 'Rejected' || status === 'Offer Declined' ? 'alert' : ['Shortlisted', 'Round 1', 'Round 2', 'Technical', 'HR'].includes(status) ? 'info' : 'neutral';

// ---------------------------------------------------------------- overview
export const OverviewTab: React.FC<OverviewProps> = ({ data }) => {
  const s = data.student;
  const u = s.user ?? {};
  const links: [string, string | null][] = [
    ['LinkedIn', s.linkedin_url],
    ['GitHub', s.github_url],
    ['Portfolio', s.portfolio_url],
    ['LeetCode', s.leetcode_url],
    ['HackerRank', s.hackerrank_url],
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-6">
      <Section title="Contact & personal">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email" value={u.email} />
          <Field label="Phone" value={s.phone || u.phone} />
          <Field label="Alternate phone" value={s.alternate_phone} />
          <Field label="Gender" value={s.gender} />
          <Field label="Date of birth" value={s.date_of_birth ? formatDate(s.date_of_birth) : null} />
          <Field label="Pincode" value={s.pincode} />
          <div className="col-span-2">
            <Field label="Address" value={[s.address, s.city, s.state, s.country].filter(Boolean).join(', ') || null} />
          </div>
        </div>
      </Section>

      <div className="space-y-6">
      <Section title="About">
        <div className="space-y-3">
          <Field label="Resume headline" value={s.resume_headline} />
          <Field label="Bio" value={s.bio} />
        </div>
      </Section>

      <Section title="Links">
        <div className="grid grid-cols-2 gap-4">
          {links.map(([label, url]) => (
            <Field key={label} label={label} value={url ? url.replace(/^https?:\/\/(www\.)?/, '') : null} href={url ?? undefined} />
          ))}
        </div>
      </Section>

      <Section title="Skills">
        {data.skills.length === 0 ? (
          <Empty text="No skills recorded." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.skills.map((k) => (
              <Badge key={k.id} variant={k.is_primary ? 'success' : 'info'} size="sm">
                {k.skills?.name}
                {k.proficiency_level ? ` · ${k.proficiency_level}` : ''}
              </Badge>
            ))}
          </div>
        )}
      </Section>

      <Section title="Account">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Status" value={u.is_active === false ? 'Deactivated' : 'Active'} />
          <Field label="Last login" value={u.last_login ? formatInterviewTime(u.last_login) : 'Never logged in'} />
          <Field label="Email verified" value={u.email_verified ? 'Yes' : 'No'} />
          <Field label="Joined" value={u.created_at ? formatDate(u.created_at) : null} />
        </div>
      </Section>
      </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- academics
export const AcademicsTab: React.FC<OverviewProps> = ({ data }) => {
  const s = data.student;
  const pct = (v: unknown) => (v === null || v === undefined || v === '' ? null : `${v}%`);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Roll number" value={s.roll_number} />
        <Field label="Enrollment number" value={s.enrollment_number} />
        <Field label="Department" value={s.department?.name} />
        <Field label="Branch" value={s.branch ? `${s.branch.name} (${s.branch.code})` : null} />
        <Field label="Current semester" value={s.current_semester ? `Semester ${s.current_semester}` : null} />
        <Field label="Passing-out batch" value={s.passing_year} />
        <Field label="CGPA" value={s.cgpa != null ? Number(s.cgpa).toFixed(2) : null} />
        <Field label="Placement status" value={s.placement_status} />
        <Field label="Active backlogs" value={s.active_backlogs} />
        <Field label="Backlog history" value={s.history_backlogs} />
        <Field label="10th" value={pct(s.tenth_percentage)} />
        <Field label="12th" value={pct(s.twelfth_percentage)} />
        <Field label="Diploma" value={pct(s.diploma_percentage)} />
      </div>
      <Section title="Semester-wise results">
        {data.semesters.length === 0 ? (
          <Empty text="No semester results recorded." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.semesters.map((sem) => (
              <Card key={sem.id} className="p-3">
                <div className="text-xs text-muted-foreground">Semester {sem.semester}</div>
                <div className="text-lg font-semibold text-foreground">{sem.cgpa != null ? Number(sem.cgpa).toFixed(2) : '-'}</div>
                <div className="text-[11px] text-muted-foreground">{sem.academic_year || ''}</div>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

// ---------------------------------------------------------------- applications / drives
export const ApplicationsTab: React.FC<OverviewProps> = ({ data }) => {
  const [open, setOpen] = useState<string | null>(null);
  const d = data.drives;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          ['Applied', d.applied],
          ['Reached a round', d.attended],
          ['In progress', d.inProgress],
          ['Selected / offered', d.selected],
          ['Rejected', d.rejected],
        ].map(([label, value]) => (
          <Card key={label as string} className="p-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-xl font-semibold text-foreground">{value}</div>
          </Card>
        ))}
      </div>

      <Section title={`Applications (${data.applications.length})`}>
        {data.applications.length === 0 ? (
          <Empty text="This student has not applied to any drive yet." />
        ) : (
          <div className="space-y-3">
            {data.applications.map((a) => {
              const drive = a.placement_drives;
              const expanded = open === a.id;
              return (
                <Card key={a.id} className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CompanyCell name={drive?.companies?.name} logo={drive?.companies?.logo_url} sub={`${drive?.role_title ?? ''} · ${drive?.drive_code ?? ''}`} />
                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                      <span>Applied {a.applied_date ? formatDate(a.applied_date) : '-'}</span>
                      <Badge variant={APP_VARIANT(a.status)} size="sm" dot>
                        {a.status}
                      </Badge>
                      {a.history?.length > 0 && (
                        <button type="button" onClick={() => setOpen(expanded ? null : a.id)} className="inline-flex items-center gap-1 text-primary hover:underline">
                          Timeline {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                  {a.current_round && a.current_round !== a.status && <div className="text-xs text-muted-foreground">Current round: {a.current_round}</div>}
                  {expanded && (
                    <ol className="border-l border-border ml-2 pl-4 space-y-2">
                      {a.history.map((h: any) => (
                        <li key={h.id} className="text-xs">
                          <span className="font-medium text-foreground">{h.stage}</span>
                          {h.round_name && h.round_name !== h.stage ? <span className="text-muted-foreground"> &middot; {h.round_name}</span> : null}
                          <span className="text-muted-foreground"> &middot; {formatInterviewTime(h.created_at)}</span>
                          {h.remarks && <div className="text-muted-foreground">{h.remarks}</div>}
                        </li>
                      ))}
                    </ol>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Open drives not applied to yet">
        {d.openNotApplied.length === 0 ? (
          <Empty text="No other drive is open for registration." />
        ) : (
          <div className="space-y-2">
            {d.openNotApplied.map((x) => (
              <Card key={x.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CompanyCell name={x.company?.name} logo={x.company?.logo_url} sub={`${x.role_title} · apply by ${formatDate(x.registration_deadline)}`} />
                {x.eligible ? (
                  <Badge variant="success" size="sm">
                    Eligible
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground max-w-xs">Not eligible: {x.reasons.join(' ')}</span>
                )}
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

// ---------------------------------------------------------------- interviews
const InterviewCard: React.FC<{ i: any; live?: boolean }> = ({ i, live }) => (
  <Card className="p-4 space-y-2">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="font-medium text-foreground truncate">
          {i.round_name} <span className="text-muted-foreground font-normal">&middot; {i.companies?.name} {i.placement_drives?.role_title ? `- ${i.placement_drives.role_title}` : ''}</span>
        </div>
        <div className="text-xs text-muted-foreground inline-flex items-center gap-3 mt-0.5">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {formatInterviewTime(i.scheduled_at)} ({relativeTime(i.scheduled_at)})
          </span>
          <span className="inline-flex items-center gap-1">
            {i.mode === 'Online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
            {i.mode === 'Online' ? 'Online' : i.venue || 'Venue to be shared'}
          </span>
        </div>
      </div>
      {live ? (
        <Badge variant="success" size="sm" dot>
          Live now
        </Badge>
      ) : (
        <InterviewStatusBadge status={i.status} />
      )}
    </div>
    {i.interviewer_name && <div className="text-xs text-muted-foreground">Panel: {i.interviewer_name}</div>}
    {i.feedback && <div className="text-xs bg-muted/60 rounded-xl p-2.5 text-foreground">Feedback: {i.feedback}</div>}
    {i.reschedule_count > 0 && <div className="text-[11px] text-muted-foreground">Rescheduled {i.reschedule_count}x</div>}
  </Card>
);

export const InterviewsTab: React.FC<OverviewProps> = ({ data }) => {
  const { upcoming, live, past } = data.interviews;
  const group = (title: string, items: any[], isLive = false) =>
    items.length > 0 && (
      <Section title={`${title} (${items.length})`}>
        <div className="space-y-3">
          {items.map((i) => (
            <InterviewCard key={i.id} i={i} live={isLive} />
          ))}
        </div>
      </Section>
    );
  if (!upcoming.length && !live.length && !past.length) return <Empty text="No interview has been scheduled for this student." />;
  return (
    <div className="space-y-6">
      {group('Live now', live, true)}
      {group('Upcoming', upcoming)}
      {group('Past & results', past)}
    </div>
  );
};

// ---------------------------------------------------------------- offers & placement
export const OffersTab: React.FC<OverviewProps & { onOpenOffer: (offer: any) => void }> = ({ data, onOpenOffer }) => {
  const placed = data.placement.accepted;
  return (
    <div className="space-y-6">
      <Card className={`p-4 flex items-center gap-3 ${placed ? 'border-emerald-500/40 bg-emerald-500/5' : ''}`}>
        <Briefcase className="w-5 h-5 text-primary shrink-0" />
        <div className="text-sm text-foreground">
          {placed ? (
            <>
              <strong>Placed</strong> at {placed.companies?.name} &middot; {formatPackage(placed.package)}
              {placed.joining_date ? ` · joining ${formatDate(placed.joining_date)}` : ''}
            </>
          ) : (
            <>
              Placement status: <strong>{data.placement.status || 'Unplaced'}</strong>. No accepted offer yet.
            </>
          )}
        </div>
      </Card>
      <Section title={`Offers (${data.offers.length})`}>
        {data.offers.length === 0 ? (
          <Empty text="No offer has been made to this student." />
        ) : (
          <div className="space-y-3">
            {data.offers.map((o) => (
              <Card key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CompanyCell name={o.companies?.name} logo={o.companies?.logo_url} sub={o.role_title || o.placement_drives?.role_title} />
                <div className="flex items-center gap-4 text-sm shrink-0">
                  <span className="font-semibold text-foreground">{formatPackage(o.package)}</span>
                  <span className="text-xs text-muted-foreground">Joining {formatDate(o.joining_date)}</span>
                  <OfferStatusBadge status={o.offer_status} />
                  {o.storage_path && (
                    <Button size="sm" variant="secondary" leftIcon={<FileText className="w-4 h-4" />} onClick={() => onOpenOffer(o)}>
                      Letter
                    </Button>
                  )}
                </div>
                {o.decline_reason && <div className="text-xs text-muted-foreground sm:basis-full">Reason: {o.decline_reason}</div>}
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

// ---------------------------------------------------------------- training
export const TrainingTab: React.FC<OverviewProps> = ({ data }) => {
  const t = data.training;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">Enrolled</div>
          <div className="text-xl font-semibold text-foreground">{t.enrollments.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">Certificates</div>
          <div className="text-xl font-semibold text-foreground">{t.certificates.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">Attendance</div>
          <div className="text-xl font-semibold text-foreground">{t.attendance.percentage == null ? '-' : `${t.attendance.percentage}%`}</div>
        </Card>
      </div>
      <Section title="Courses">
        {t.enrollments.length === 0 ? (
          <Empty text="Not enrolled in any training." />
        ) : (
          <div className="space-y-3">
            {t.enrollments.map((e) => (
              <Card key={e.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-foreground">{e.training_modules?.title}</div>
                  <Badge variant={e.completed ? 'success' : 'info'} size="sm">
                    {e.completed ? 'Completed' : 'In progress'}
                  </Badge>
                </div>
                <ProgressBar value={Number(e.progress_percentage) || 0} />
              </Card>
            ))}
          </div>
        )}
      </Section>
      {t.certificates.length > 0 && (
        <Section title="Certificates">
          <div className="space-y-2">
            {t.certificates.map((c) => (
              <Card key={c.id} className="p-3 text-sm flex items-center justify-between gap-2">
                <span className="text-foreground">{c.training_modules?.title}</span>
                <span className="text-xs text-muted-foreground">
                  {c.certificate_number} &middot; {c.issued_date ? formatDate(c.issued_date) : ''}
                </span>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
};

// ---------------------------------------------------------------- activity
export const ActivityTab: React.FC<OverviewProps> = ({ data }) => (
  <Section title="Recent notifications sent to this student">
    {data.notifications.length === 0 ? (
      <Empty text="No notifications yet." />
    ) : (
      <div className="space-y-2">
        {data.notifications.map((n) => (
          <Card key={n.id} className="p-3 space-y-0.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium text-foreground">{n.title}</span>
              <span className="text-xs text-muted-foreground shrink-0">{formatInterviewTime(n.created_at)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{n.message}</p>
          </Card>
        ))}
      </div>
    )}
  </Section>
);

// ---------------------------------------------------------------- onboarding banner
export const OnboardingBanner: React.FC<{ data: StudentOverview }> = ({ data }) => {
  const [open, setOpen] = useState(false);
  const { status, completion, checklist, missing } = data.onboarding;
  if (status === 'Completed') return null;
  const done = checklist.length - missing.length;
  return (
    <Card className="p-4 border-amber-500/40 bg-amber-500/5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
        <div className="flex items-start gap-3 lg:flex-1 min-w-0">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-foreground">{status === 'Not started' ? 'Has not started onboarding' : 'Onboarding is not finished'}</div>
            <div className="text-muted-foreground">
              {status === 'Not started' ? 'This student has never logged in. ' : ''}
              {missing.length} of {checklist.length} steps are still open.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 lg:w-80">
          <div className="flex-1">
            <ProgressBar value={completion} showValue={false} />
          </div>
          <span className="text-sm font-semibold text-foreground w-24 text-right">
            {done}/{checklist.length} done
          </span>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)} rightIcon={open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}>
          {open ? 'Hide steps' : 'Show steps'}
        </Button>
      </div>
      {open && (
        <ul className="mt-4 pt-4 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
          {checklist.map((c) => (
            <li key={c.key} className="text-sm flex items-center gap-2">
              {c.done ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Circle className="w-4 h-4 text-amber-500 shrink-0" />}
              <span className={c.done ? 'text-muted-foreground' : 'text-foreground font-medium'}>{c.label}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
