import React, { useEffect, useState } from 'react';
import { Modal } from '../app/Modal';
import { Button } from '../app/Button';
import { Textarea } from '../app/Input';
import { Dropdown } from '../app/Dropdown';
import { Checkbox } from '../app/Checkbox';
import { useToast } from '../app/Toast';
import { cancelInterview, recordInterviewResult } from '../../api/interview.api';
import type { Interview } from '../../types';
import { getErrorMessage } from './interviewUtils';

interface BaseProps {
  interview: Interview | null;
  onClose: () => void;
  onSaved: () => void;
}

const who = (i: Interview) => `${i.students?.users?.full_name ?? 'Candidate'} - ${i.round_name}`;

export const CancelInterviewModal: React.FC<BaseProps> = ({ interview, onClose, onSaved }) => {
  const { success, error: toastError } = useToast();
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (interview) setReason('');
  }, [interview]);

  const confirm = async () => {
    if (!interview) return;
    setSaving(true);
    try {
      await cancelInterview(interview.id, reason.trim() || undefined);
      success('Interview cancelled', 'The candidate has been notified.');
      onSaved();
      onClose();
    } catch (err) {
      toastError('Could not cancel', getErrorMessage(err, 'Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={Boolean(interview)} onClose={onClose} title="Cancel interview" subtitle={interview ? who(interview) : undefined} maxWidth="md">
      <div className="space-y-4">
        <Textarea label="Reason (shared with the candidate)" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Keep interview
          </Button>
          <Button variant="danger" onClick={confirm} isLoading={saving}>
            Cancel interview
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const InterviewResultModal: React.FC<BaseProps> = ({ interview, onClose, onSaved }) => {
  const { success, error: toastError } = useToast();
  const [result, setResult] = useState<'Passed' | 'Failed'>('Passed');
  const [feedback, setFeedback] = useState('');
  const [isFinal, setIsFinal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (interview) {
      setResult('Passed');
      setFeedback('');
      setIsFinal(false);
    }
  }, [interview]);

  const save = async () => {
    if (!interview) return;
    setSaving(true);
    try {
      await recordInterviewResult(interview.id, { result, feedback: feedback.trim() || undefined, is_final: result === 'Passed' && isFinal });
      success('Result recorded', result === 'Failed' ? 'The application was marked Rejected.' : isFinal ? 'The candidate is now Selected.' : 'The candidate moves on.');
      onSaved();
      onClose();
    } catch (err) {
      toastError('Could not save result', getErrorMessage(err, 'Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={Boolean(interview)} onClose={onClose} title="Record result" subtitle={interview ? who(interview) : undefined} maxWidth="md">
      <div className="space-y-4">
        <Dropdown
          label="Result"
          options={[
            { label: 'Passed', value: 'Passed' },
            { label: 'Failed (rejects the application)', value: 'Failed' },
          ]}
          value={result}
          onChange={(v) => setResult(v as 'Passed' | 'Failed')}
        />
        {result === 'Passed' && <Checkbox label="This was the final round (select the candidate)" checked={isFinal} onChange={(e) => setIsFinal(e.target.checked)} />}
        <Textarea label="Feedback (shared with the candidate)" rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} maxLength={2000} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Close
          </Button>
          <Button onClick={save} isLoading={saving}>
            Save result
          </Button>
        </div>
      </div>
    </Modal>
  );
};
