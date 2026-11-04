import React, { useEffect, useState } from 'react';
import { Modal } from '../app/Modal';
import { Button } from '../app/Button';
import { Input } from '../app/Input';
import { Dropdown } from '../app/Dropdown';
import { useToast } from '../app/Toast';
import { getApplications } from '../../api/application.api';
import { createInterview, rescheduleInterview } from '../../api/interview.api';
import type { Interview, InterviewMode } from '../../types';
import { getErrorMessage, toLocalInputValue } from './interviewUtils';

const SCHEDULABLE_STAGES = ['Shortlisted', 'Round 1', 'Round 2', 'Technical', 'HR'];

interface ApplicationOption {
  value: string;
  label: string;
}

interface InterviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Set to reschedule an existing interview; omit to schedule a new one. */
  interview?: Interview | null;
  /** Pre-select a candidate application when scheduling from another page. */
  applicationId?: string;
}

export const InterviewFormModal: React.FC<InterviewFormModalProps> = ({ isOpen, onClose, onSaved, interview, applicationId }) => {
  const { success, error: toastError } = useToast();
  const isReschedule = Boolean(interview);

  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [application, setApplication] = useState('');
  const [roundName, setRoundName] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [mode, setMode] = useState<InterviewMode>('Online');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [venue, setVenue] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setApplication(applicationId ?? '');
    setRoundName(interview?.round_name ?? '');
    setScheduledAt(toLocalInputValue(interview?.scheduled_at));
    setMode(interview?.mode ?? 'Online');
    setMeetingUrl(interview?.meeting_url ?? '');
    setVenue(interview?.venue ?? '');
    setInterviewer(interview?.interviewer_name ?? '');
  }, [isOpen, interview, applicationId]);

  useEffect(() => {
    if (!isOpen || isReschedule) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getApplications({ limit: 100 });
        const rows: any[] = Array.isArray(res.data) ? res.data : (res.data as any)?.applications ?? [];
        if (cancelled) return;
        setApplications(
          rows
            .filter((a) => SCHEDULABLE_STAGES.includes(a.status))
            .map((a) => ({
              value: a.id,
              label: `${a.students?.users?.full_name ?? 'Candidate'} - ${a.drives?.companies?.name ?? ''} ${a.drives?.role_title ?? ''} (${a.status})`.replace(/\s+/g, ' '),
            }))
        );
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load shortlisted candidates.'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, isReschedule]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isReschedule && !application) return setError('Select a candidate.');
    if (!roundName.trim()) return setError('Round name is required.');
    if (!scheduledAt) return setError('Pick a date and time.');
    if (mode === 'Online' && !meetingUrl.trim()) return setError('A meeting link is required for online interviews.');
    if (mode === 'Offline' && !venue.trim()) return setError('A venue is required for offline interviews.');

    const slot = {
      round_name: roundName.trim(),
      scheduled_at: new Date(scheduledAt).toISOString(),
      mode,
      meeting_url: mode === 'Online' ? meetingUrl.trim() : undefined,
      venue: mode === 'Offline' ? venue.trim() : undefined,
      interviewer_name: interviewer.trim() || undefined,
    };

    setSaving(true);
    try {
      if (interview) {
        await rescheduleInterview(interview.id, slot);
        success('Interview rescheduled', 'The candidate has been notified.');
      } else {
        await createInterview({ ...slot, application_id: application, round_name: slot.round_name, scheduled_at: slot.scheduled_at });
        success('Interview scheduled', 'The candidate has been notified.');
      }
      onSaved();
      onClose();
    } catch (err) {
      const message = getErrorMessage(err, 'Could not save the interview.');
      setError(message);
      toastError('Interview not saved', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReschedule ? 'Reschedule interview' : 'Schedule interview'}
      subtitle={isReschedule ? `${interview?.students?.users?.full_name ?? ''} - ${interview?.companies?.name ?? ''}` : 'The candidate gets a notification and email.'}
      maxWidth="lg"
    >
      <form onSubmit={submit} className="space-y-4">
        {!isReschedule && (
          <Dropdown
            label="Candidate"
            options={applications}
            value={application}
            onChange={setApplication}
            placeholder={applications.length ? 'Select shortlisted candidate' : 'No shortlisted candidates found'}
          />
        )}
        <Input label="Round" placeholder="e.g. Technical Round 1" value={roundName} onChange={(e) => setRoundName(e.target.value)} maxLength={100} />
        <Input label="Date & time" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        <Dropdown
          label="Mode"
          options={[
            { label: 'Online', value: 'Online' },
            { label: 'Offline (on campus / office)', value: 'Offline' },
          ]}
          value={mode}
          onChange={(v) => setMode(v as InterviewMode)}
        />
        {mode === 'Online' ? (
          <Input label="Meeting link" placeholder="https://meet.google.com/..." value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} />
        ) : (
          <Input label="Venue" placeholder="e.g. Seminar Hall, Block B" value={venue} onChange={(e) => setVenue(e.target.value)} maxLength={255} />
        )}
        <Input label="Interviewer (optional)" value={interviewer} onChange={(e) => setInterviewer(e.target.value)} maxLength={150} />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saving}>
            {isReschedule ? 'Save new slot' : 'Schedule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
