import React, { useState } from 'react';
import { AlertTriangle, Building2, CalendarClock, CheckCircle2, FileText, Link2, MapPin, Phone, Mail, XCircle } from 'lucide-react';
import { Card } from '../app/Card';
import { Button } from '../app/Button';
import { Badge } from '../app/Badge';
import { PdfViewerModal } from '../app/PdfViewerModal';
import { Skeleton } from '../app/Skeleton';
import { useToast } from '../app/Toast';
import { getDriveJdUrl } from '../../api/drive.api';
import type { DriveRecord, Eligibility } from '../../api/drive.api';
import { ApprovalBadge, ctcText, deadlineText, formatDate, formatDateTime, getErrorMessage, ppoText, roundName, stipendText } from './driveUtils';

interface DriveDetailProps {
  drive: DriveRecord;
  /** Only for students: result of the real eligibility check. */
  eligibility?: Eligibility | null;
  checkingEligibility?: boolean;
  /** Only for students. Omit to hide the Apply area. */
  apply?: { applied: boolean; applying: boolean; onApply: () => void };
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-2">
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    {children}
  </section>
);

const Fact: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) =>
  value ? (
    <div className="rounded-2xl bg-muted/60 border border-border px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground mt-0.5">{value}</div>
    </div>
  ) : null;

/** Everything about a drive laid out like the TPO's announcement mail. */
export const DriveDetail: React.FC<DriveDetailProps> = ({ drive, eligibility, checkingEligibility, apply }) => {
  const { error: toastError } = useToast();
  const [jdUrl, setJdUrl] = useState<string | null>(null);
  const [jdOpen, setJdOpen] = useState(false);
  const [jdError, setJdError] = useState<string | null>(null);

  const profiles = drive.drive_profiles ?? [];
  const rounds = (drive.rounds ?? []).map(roundName).filter(Boolean);
  const deadline = deadlineText(drive.registration_deadline);
  const branches = drive.allowed_branches ?? (drive.drive_eligible_branches ?? []).map((b) => b.branches?.name).filter(Boolean);

  const openJd = async () => {
    setJdOpen(true);
    setJdUrl(null);
    setJdError(null);
    try {
      setJdUrl((await getDriveJdUrl(drive.id)).url);
    } catch (err) {
      const message = getErrorMessage(err, 'Could not open the job description.');
      setJdError(message);
      toastError('Job description', message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0 overflow-hidden">
            {drive.companies?.logo_url ? <img src={drive.companies.logo_url} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-foreground truncate">{drive.companies?.name}</h2>
            <p className="text-sm text-muted-foreground truncate">
              {drive.drive_code} &middot; {drive.job_type} &middot; {drive.drive_mode}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ApprovalBadge status={drive.approval_status} />
          {deadline && (
            <Badge variant={deadline.closed ? 'neutral' : 'info'} size="sm">
              {deadline.label}
            </Badge>
          )}
        </div>
      </div>

      {drive.approval_status === 'Rejected' && drive.rejection_reason && (
        <Card className="p-4 border-rose-500/40 bg-rose-500/5 text-sm text-foreground flex gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <strong>Rejected:</strong> {drive.rejection_reason}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Fact label="Drive date" value={formatDate(drive.drive_date)} />
        <Fact label="Register by" value={formatDateTime(drive.registration_deadline)} />
        <Fact label="Location" value={drive.location} />
        <Fact label="Batch" value={drive.passing_year} />
      </div>

      {drive.description && (
        <Section title="About this opportunity">
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{drive.description}</p>
        </Section>
      )}

      <Section title={`Available profiles (${profiles.length})`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {profiles.map((p, i) => (
            <Card key={p.id ?? i} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-foreground">{p.title}</h4>
                {p.openings ? <span className="text-xs text-muted-foreground shrink-0">{p.openings} openings</span> : null}
              </div>
              {p.streams?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {p.streams.map((s) => (
                    <Badge key={s} variant="info" size="sm">
                      {s}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <dl className="text-sm space-y-1">
                {stipendText(p) && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Stipend{p.probation_months ? ` (${p.probation_months} months probation)` : ''}</dt>
                    <dd className="font-medium text-foreground text-right">{stipendText(p)}</dd>
                  </div>
                )}
                {!stipendText(p) && p.probation_months ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Probation</dt>
                    <dd className="font-medium text-foreground">{p.probation_months} months</dd>
                  </div>
                ) : null}
                {ctcText(p) && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">CTC</dt>
                    <dd className="font-medium text-foreground">{ctcText(p)}</dd>
                  </div>
                )}
                {ppoText(p) && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">After probation / PPO</dt>
                    <dd className="font-medium text-foreground">{ppoText(p)}</dd>
                  </div>
                )}
                {p.interview_mode && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Interview</dt>
                    <dd className="font-medium text-foreground text-right">
                      {p.interview_mode}
                      {p.interview_location ? ` · ${p.interview_location}` : ''}
                    </dd>
                  </div>
                )}
              </dl>
              {p.responsibilities && <p className="text-xs text-muted-foreground whitespace-pre-line">{p.responsibilities}</p>}
            </Card>
          ))}
        </div>
      </Section>

      {rounds.length > 0 && (
        <Section title="Selection process">
          <ol className="flex flex-wrap items-center gap-2 text-sm">
            {rounds.map((r, i) => (
              <li key={`${r}-${i}`} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                <span className="text-foreground">{r}</span>
                {i < rounds.length - 1 && <span className="text-muted-foreground">&rarr;</span>}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {drive.location_note && (
        <Section title="Important">
          <Card className="p-4 border-amber-500/40 bg-amber-500/5 flex gap-3 text-sm text-foreground">
            <MapPin className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="whitespace-pre-line">{drive.location_note}</p>
          </Card>
        </Section>
      )}

      <Section title="Eligibility">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Fact label="Minimum CGPA" value={drive.min_cgpa} />
          <Fact label="Active backlogs" value={`Up to ${drive.max_backlogs ?? 0}`} />
          <Fact label="Batch" value={drive.passing_year} />
          <Fact label="Branches" value={branches.length ? branches.join(', ') : 'All branches'} />
        </div>
        {drive.bond_details && <p className="text-sm text-muted-foreground"><strong className="text-foreground">Service agreement:</strong> {drive.bond_details}</p>}
      </Section>

      {(drive.registration_link || drive.jd_name || drive.contact_name || drive.contact_email || drive.contact_phone) && (
        <Section title="Registration & contact">
          <div className="flex flex-wrap items-center gap-2">
            {drive.jd_name && (
              <Button variant="secondary" size="sm" leftIcon={<FileText className="w-4 h-4" />} onClick={openJd}>
                View job description
              </Button>
            )}
            {drive.registration_link && (
              <a href={drive.registration_link} target="_blank" rel="noreferrer noopener">
                <Button variant="secondary" size="sm" leftIcon={<Link2 className="w-4 h-4" />}>
                  Registration form
                </Button>
              </a>
            )}
          </div>
          <div className="text-sm text-muted-foreground flex flex-wrap gap-x-5 gap-y-1">
            {drive.contact_name && <span className="text-foreground font-medium">{drive.contact_name}</span>}
            {drive.contact_email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {drive.contact_email}
              </span>
            )}
            {drive.contact_phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {drive.contact_phone}
              </span>
            )}
          </div>
        </Section>
      )}

      {apply && (
        <Card className="p-4 space-y-3 sticky bottom-0">
          {checkingEligibility ? (
            <Skeleton variant="rectangular" className="w-full h-10" />
          ) : eligibility && !eligibility.eligible && !apply.applied ? (
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <XCircle className="w-4 h-4 text-rose-500" /> You are not eligible for this drive
              </div>
              <ul className="list-disc pl-6 text-muted-foreground">
                {eligibility.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {apply.applied ? 'You have applied to this drive.' : 'You meet the eligibility criteria.'}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <CalendarClock className="w-3.5 h-3.5" /> {deadline?.label ?? ''}
            </span>
            <Button
              onClick={apply.onApply}
              isLoading={apply.applying}
              disabled={apply.applied || checkingEligibility || (eligibility ? !eligibility.eligible : false)}
            >
              {apply.applied ? 'Applied' : 'Apply now'}
            </Button>
          </div>
        </Card>
      )}

      <PdfViewerModal isOpen={jdOpen} onClose={() => setJdOpen(false)} title="Job description" subtitle={drive.jd_name || undefined} url={jdUrl} error={jdError} fileName={drive.jd_name || undefined} />
    </div>
  );
};
