import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../app/Modal';
import { Button } from '../app/Button';
import { Input, Textarea } from '../app/Input';
import { Dropdown } from '../app/Dropdown';
import { Checkbox } from '../app/Checkbox';
import { Tabs } from '../app/Tabs';
import { Card } from '../app/Card';
import { useToast } from '../app/Toast';
import { createDrive, getDriveLookups, updateDrive, uploadDriveJd } from '../../api/drive.api';
import type { DriveLookups, DrivePayload, DriveProfile, DriveRecord } from '../../api/drive.api';
import { getErrorMessage, roundName, toDateInput, toDateTimeLocal } from './driveUtils';

type Step = 'basics' | 'profiles' | 'eligibility' | 'process' | 'extras';

const STEPS: { id: Step; label: string }[] = [
  { id: 'basics', label: '1. Basics' },
  { id: 'profiles', label: '2. Profiles' },
  { id: 'eligibility', label: '3. Eligibility' },
  { id: 'process', label: '4. Process' },
  { id: 'extras', label: '5. JD & contact' },
];

const JOB_TYPES = ['Full Time', 'Internship', 'PPO', 'Dual (Intern + FT)'].map((v) => ({ label: v, value: v }));
const MODES = ['On Campus', 'Off Campus', 'Pool Campus', 'Virtual'].map((v) => ({ label: v, value: v }));
const INTERVIEW_MODES = [{ label: 'Not decided', value: '' }, ...['Virtual', 'Physical', 'Hybrid'].map((v) => ({ label: v, value: v }))];
const ROUND_MODES = [{ label: 'Any', value: '' }, ...['Online', 'In person'].map((v) => ({ label: v, value: v }))];

interface ProfileForm extends Omit<DriveProfile, 'streams'> {
  streams: string; // comma separated while typing
}

const emptyProfile = (): ProfileForm => ({
  title: '',
  streams: '',
  openings: '',
  probation_months: '',
  stipend_min: '',
  stipend_max: '',
  ctc_min: '',
  ctc_max: '',
  ppo_ctc_min: '',
  ppo_ctc_max: '',
  interview_mode: '',
  interview_location: '',
  responsibilities: '',
});

interface FormState {
  company_id: string;
  job_type: string;
  drive_mode: string;
  location: string;
  location_note: string;
  drive_date: string;
  registration_deadline: string;
  registration_link: string;
  passing_year: string;
  min_cgpa: string;
  max_backlogs: string;
  branch_ids: string[];
  department_ids: string[];
  rounds: { name: string; mode: string }[];
  description: string;
  bond_details: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  profiles: ProfileForm[];
}

const blank = (): FormState => ({
  company_id: '',
  job_type: 'Full Time',
  drive_mode: 'On Campus',
  location: '',
  location_note: '',
  drive_date: '',
  registration_deadline: '',
  registration_link: '',
  passing_year: String(new Date().getFullYear() + 1),
  min_cgpa: '6',
  max_backlogs: '0',
  branch_ids: [],
  department_ids: [],
  rounds: [{ name: 'Aptitude Test', mode: '' }, { name: 'Technical Interview', mode: '' }, { name: 'HR Interview', mode: '' }],
  description: '',
  bond_details: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  profiles: [emptyProfile()],
});

const fromDrive = (d: DriveRecord): FormState => ({
  company_id: d.company_id,
  job_type: d.job_type,
  drive_mode: d.drive_mode || 'On Campus',
  location: d.location ?? '',
  location_note: d.location_note ?? '',
  drive_date: toDateInput(d.drive_date),
  registration_deadline: toDateTimeLocal(d.registration_deadline),
  registration_link: d.registration_link ?? '',
  passing_year: d.passing_year ? String(d.passing_year) : '',
  min_cgpa: d.min_cgpa != null ? String(d.min_cgpa) : '',
  max_backlogs: d.max_backlogs != null ? String(d.max_backlogs) : '0',
  branch_ids: (d.drive_eligible_branches ?? []).map((b) => b.branches?.id).filter(Boolean),
  department_ids: (d.drive_eligible_departments ?? []).map((x) => x.department_id),
  rounds: (d.rounds ?? []).map((r) => ({ name: roundName(r), mode: typeof r === 'string' ? '' : r.mode ?? '' })),
  description: d.description ?? '',
  bond_details: d.bond_details ?? '',
  contact_name: d.contact_name ?? '',
  contact_email: d.contact_email ?? '',
  contact_phone: d.contact_phone ?? '',
  profiles: (d.drive_profiles?.length ? d.drive_profiles : [{ title: d.role_title, streams: [] }]).map((p) => ({
    ...emptyProfile(),
    ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v ?? ''])),
    streams: (p.streams ?? []).join(', '),
  })) as ProfileForm[],
});

interface DriveFormModalProps {
  isOpen: boolean;
  /** Pass a drive to edit it; omit to create. */
  drive?: DriveRecord | null;
  /** True for a recruiter: company is fixed and the drive goes for approval instead of being published. */
  isRecruiter: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const DriveFormModal: React.FC<DriveFormModalProps> = ({ isOpen, drive, isRecruiter, onClose, onSaved }) => {
  const { success, warning } = useToast();
  const jdInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(blank);
  const [step, setStep] = useState<Step>('basics');
  const [lookups, setLookups] = useState<DriveLookups | null>(null);
  const [jd, setJd] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(drive ? fromDrive(drive) : blank());
    setStep('basics');
    setJd(null);
    setError(null);
    if (jdInput.current) jdInput.current.value = '';

    let cancelled = false;
    getDriveLookups()
      .then((data) => {
        if (cancelled) return;
        setLookups(data);
        // A recruiter has exactly one company; staff pick one.
        setForm((f) => (!drive && isRecruiter && data.companies[0] ? { ...f, company_id: data.companies[0].id } : f));
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err, 'Could not load form options.')));
    return () => {
      cancelled = true;
    };
  }, [isOpen, drive, isRecruiter]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setProfile = (index: number, patch: Partial<ProfileForm>) => setForm((f) => ({ ...f, profiles: f.profiles.map((p, i) => (i === index ? { ...p, ...patch } : p)) }));
  const toggle = (key: 'branch_ids' | 'department_ids', id: string) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id] }));

  /** Returns the first problem and the step it lives on. */
  const validate = (): { message: string; step: Step } | null => {
    if (!isRecruiter && !form.company_id) return { message: 'Select the company.', step: 'basics' };
    if (!form.drive_date) return { message: 'Enter the drive date.', step: 'basics' };
    if (!form.registration_deadline) return { message: 'Enter the registration deadline.', step: 'basics' };
    if (!drive && new Date(form.registration_deadline).getTime() < Date.now()) return { message: 'The registration deadline is already over.', step: 'basics' };
    if (form.registration_link && !/^https?:\/\//i.test(form.registration_link)) return { message: 'The registration link must start with http:// or https://', step: 'basics' };
    if (!form.passing_year) return { message: 'Enter the passing-out batch.', step: 'eligibility' };
    for (const [i, p] of form.profiles.entries()) {
      if (!p.title.trim()) return { message: `Profile ${i + 1} needs a title.`, step: 'profiles' };
      if (p.stipend_min && p.stipend_max && Number(p.stipend_max) < Number(p.stipend_min)) return { message: `Profile "${p.title}": stipend maximum is below the minimum.`, step: 'profiles' };
      if (p.ctc_min && p.ctc_max && Number(p.ctc_max) < Number(p.ctc_min)) return { message: `Profile "${p.title}": CTC maximum is below the minimum.`, step: 'profiles' };
      if (p.ppo_ctc_min && p.ppo_ctc_max && Number(p.ppo_ctc_max) < Number(p.ppo_ctc_min)) return { message: `Profile "${p.title}": PPO CTC maximum is below the minimum.`, step: 'profiles' };
    }
    if (form.contact_email && !/^\S+@\S+\.\S+$/.test(form.contact_email)) return { message: 'The contact email looks invalid.', step: 'extras' };
    if (jd && !jd.name.toLowerCase().endsWith('.pdf')) return { message: 'The job description must be a PDF.', step: 'extras' };
    if (jd && jd.size > 10 * 1024 * 1024) return { message: 'The job description must be 10 MB or smaller.', step: 'extras' };
    return null;
  };

  const buildPayload = (submit: boolean): DrivePayload => ({
    ...(isRecruiter || drive ? {} : { company_id: form.company_id }),
    job_type: form.job_type,
    drive_mode: form.drive_mode,
    location: form.location.trim() || undefined,
    location_note: form.location_note.trim(),
    drive_date: form.drive_date ? new Date(form.drive_date).toISOString() : undefined,
    registration_deadline: form.registration_deadline ? new Date(form.registration_deadline).toISOString() : undefined,
    registration_link: form.registration_link.trim(),
    passing_year: form.passing_year,
    min_cgpa: form.min_cgpa === '' ? undefined : form.min_cgpa,
    max_backlogs: form.max_backlogs === '' ? undefined : form.max_backlogs,
    branch_ids: form.branch_ids,
    department_ids: form.department_ids,
    rounds: form.rounds.filter((r) => r.name.trim()).map((r) => ({ name: r.name.trim(), mode: r.mode || undefined })),
    description: form.description.trim(),
    bond_details: form.bond_details.trim(),
    contact_name: form.contact_name.trim(),
    contact_email: form.contact_email.trim(),
    contact_phone: form.contact_phone.trim(),
    profiles: form.profiles.map((p) => ({
      ...p,
      title: p.title.trim(),
      streams: p.streams.split(',').map((s) => s.trim()).filter(Boolean),
      interview_mode: p.interview_mode || null,
    })) as DriveProfile[],
    submit,
  });

  const save = async (submit: boolean) => {
    setError(null);
    const problem = validate();
    if (problem) {
      setStep(problem.step);
      setError(problem.message);
      return;
    }

    setSaving(true);
    try {
      const saved = drive ? await updateDrive(drive.id, buildPayload(submit)) : await createDrive(buildPayload(submit));
      if (jd) {
        try {
          await uploadDriveJd(saved.id, jd);
        } catch (err) {
          warning('Drive saved, but the job description failed', getErrorMessage(err, 'Open the drive and upload the PDF again.'));
        }
      }
      success(
        !submit ? 'Draft saved' : isRecruiter ? 'Sent for approval' : 'Drive published',
        !submit ? 'You can finish it later.' : isRecruiter ? 'The TPO will review it before students can see it.' : 'Eligible students have been notified.'
      );
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the drive.'));
    } finally {
      setSaving(false);
    }
  };

  const published = drive?.approval_status === 'Approved';
  const primaryLabel = published ? 'Save changes' : isRecruiter ? 'Submit for approval' : 'Publish drive';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !saving && onClose()}
      title={drive ? 'Edit drive' : 'Create placement drive'}
      subtitle={isRecruiter ? 'The TPO reviews your drive before students can see it.' : 'Published drives are announced to eligible students.'}
      maxWidth="4xl"
    >
      <div className="space-y-5">
        <Tabs variant="pills" activeTab={step} onChange={(id) => setStep(id as Step)} tabs={STEPS} />

        {step === 'basics' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Dropdown
              label="Company"
              options={(lookups?.companies ?? []).map((c) => ({ label: c.name, value: c.id }))}
              value={form.company_id}
              onChange={(v) => set('company_id', v)}
              placeholder={lookups ? 'Select company' : 'Loading...'}
              className={isRecruiter || drive ? 'pointer-events-none opacity-70' : undefined}
            />
            <Dropdown label="Employment type" options={JOB_TYPES} value={form.job_type} onChange={(v) => set('job_type', v)} />
            <Dropdown label="Drive mode" options={MODES} value={form.drive_mode} onChange={(v) => set('drive_mode', v)} />
            <Input label="Location" placeholder="e.g. Delhi NCR" value={form.location} onChange={(e) => set('location', e.target.value)} maxLength={255} />
            <Input label="Drive date" type="date" value={form.drive_date} onChange={(e) => set('drive_date', e.target.value)} />
            <Input label="Register by" type="datetime-local" value={form.registration_deadline} onChange={(e) => set('registration_deadline', e.target.value)} />
            <div className="sm:col-span-2">
              <Input label="External registration link (optional)" placeholder="https://..." value={form.registration_link} onChange={(e) => set('registration_link', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Textarea
                label="Important note for students (relocation, travel...)"
                rows={3}
                value={form.location_note}
                onChange={(e) => set('location_note', e.target.value)}
                placeholder="e.g. Interested students must be comfortable relocating to Delhi NCR."
                maxLength={2000}
              />
            </div>
          </div>
        )}

        {step === 'profiles' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Add one profile per role. Each can have its own streams, pay and interview mode.</p>
            {form.profiles.map((p, i) => (
              <Card key={i} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">Profile {i + 1}</h4>
                  {form.profiles.length > 1 && (
                    <Button size="sm" variant="ghost" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => set('profiles', form.profiles.filter((_, j) => j !== i))}>
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Title" placeholder="e.g. Full Stack Developer" value={p.title} onChange={(e) => setProfile(i, { title: e.target.value })} maxLength={150} />
                  <Input label="Streams (comma separated)" placeholder="B.Tech, MBA" value={p.streams} onChange={(e) => setProfile(i, { streams: e.target.value })} />
                  <Input label="Openings" type="number" min="0" value={String(p.openings ?? '')} onChange={(e) => setProfile(i, { openings: e.target.value })} />
                  <Input label="Probation (months)" type="number" min="0" value={String(p.probation_months ?? '')} onChange={(e) => setProfile(i, { probation_months: e.target.value })} />
                  <Input label="Stipend min (₹ / month)" type="number" min="0" value={String(p.stipend_min ?? '')} onChange={(e) => setProfile(i, { stipend_min: e.target.value })} />
                  <Input label="Stipend max (₹ / month)" type="number" min="0" value={String(p.stipend_max ?? '')} onChange={(e) => setProfile(i, { stipend_max: e.target.value })} />
                  <Input label="CTC min (LPA)" type="number" min="0" step="0.1" value={String(p.ctc_min ?? '')} onChange={(e) => setProfile(i, { ctc_min: e.target.value })} />
                  <Input label="CTC max (LPA)" type="number" min="0" step="0.1" value={String(p.ctc_max ?? '')} onChange={(e) => setProfile(i, { ctc_max: e.target.value })} />
                  <Input label="PPO / post-probation CTC min (LPA)" type="number" min="0" step="0.1" value={String(p.ppo_ctc_min ?? '')} onChange={(e) => setProfile(i, { ppo_ctc_min: e.target.value })} />
                  <Input label="PPO / post-probation CTC max (LPA)" type="number" min="0" step="0.1" value={String(p.ppo_ctc_max ?? '')} onChange={(e) => setProfile(i, { ppo_ctc_max: e.target.value })} />
                  <Dropdown label="Interview mode" options={INTERVIEW_MODES} value={p.interview_mode ?? ''} onChange={(v) => setProfile(i, { interview_mode: v as ProfileForm['interview_mode'] })} />
                  <Input label="Interview location" placeholder="Company office / our campus" value={p.interview_location ?? ''} onChange={(e) => setProfile(i, { interview_location: e.target.value })} />
                  <div className="sm:col-span-2">
                    <Textarea label="Responsibilities / skills (optional)" rows={2} value={p.responsibilities ?? ''} onChange={(e) => setProfile(i, { responsibilities: e.target.value })} maxLength={2000} />
                  </div>
                </div>
              </Card>
            ))}
            {form.profiles.length < 20 && (
              <Button variant="secondary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => set('profiles', [...form.profiles, emptyProfile()])}>
                Add another profile
              </Button>
            )}
          </div>
        )}

        {step === 'eligibility' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Passing-out batch" type="number" value={form.passing_year} onChange={(e) => set('passing_year', e.target.value)} />
              <Input label="Minimum CGPA" type="number" min="0" max="10" step="0.1" value={form.min_cgpa} onChange={(e) => set('min_cgpa', e.target.value)} />
              <Input label="Max active backlogs" type="number" min="0" value={form.max_backlogs} onChange={(e) => set('max_backlogs', e.target.value)} />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Eligible branches <span className="font-normal text-muted-foreground">(none selected = all branches)</span></h4>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {(lookups?.branches ?? []).map((b) => (
                  <Checkbox key={b.id} label={`${b.name} (${b.code})`} checked={form.branch_ids.includes(b.id)} onChange={() => toggle('branch_ids', b.id)} />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Eligible departments <span className="font-normal text-muted-foreground">(none selected = all)</span></h4>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {(lookups?.departments ?? []).map((d) => (
                  <Checkbox key={d.id} label={d.name} checked={form.department_ids.includes(d.id)} onChange={() => toggle('department_ids', d.id)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'process' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Selection rounds, in order</h4>
              {form.rounds.map((r, i) => (
                <div key={i} className="grid grid-cols-[1fr_9rem_auto] gap-2 items-end">
                  <Input label={i === 0 ? 'Round' : undefined} value={r.name} onChange={(e) => set('rounds', form.rounds.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder={`Round ${i + 1}`} />
                  <Dropdown label={i === 0 ? 'Mode' : undefined} options={ROUND_MODES} value={r.mode} onChange={(v) => set('rounds', form.rounds.map((x, j) => (j === i ? { ...x, mode: v } : x)))} />
                  <Button size="sm" variant="ghost" iconOnly aria-label="Remove round" onClick={() => set('rounds', form.rounds.filter((_, j) => j !== i))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="secondary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => set('rounds', [...form.rounds, { name: '', mode: '' }])}>
                Add round
              </Button>
            </div>
            <Textarea label="Description (what students should know)" rows={6} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Company background, role details, compensation structure..." maxLength={10000} />
            <Textarea label="Service agreement / bond (optional)" rows={2} value={form.bond_details} onChange={(e) => set('bond_details', e.target.value)} maxLength={2000} />
          </div>
        )}

        {step === 'extras' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="drive-jd" className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                Job description (PDF, max 10 MB){drive?.jd_name ? ` - current: ${drive.jd_name}` : ''}
              </label>
              <input
                ref={jdInput}
                id="drive-jd"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setJd(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Contact person" value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} maxLength={150} />
              <Input label="Contact email" type="email" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} />
              <Input label="Contact phone" value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} maxLength={30} />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap justify-between gap-2 pt-2 border-t border-border">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {!published && (
              <Button variant="tertiary" onClick={() => save(false)} disabled={saving}>
                Save draft
              </Button>
            )}
            <Button onClick={() => save(true)} isLoading={saving}>
              {primaryLabel}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
