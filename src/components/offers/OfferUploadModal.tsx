import React, { useEffect, useRef, useState } from 'react';
import { Modal } from '../app/Modal';
import { Button } from '../app/Button';
import { Input } from '../app/Input';
import { Dropdown } from '../app/Dropdown';
import { useToast } from '../app/Toast';
import { getApplications } from '../../api/application.api';
import { createOffer } from '../../api/offer.api';
import { getErrorMessage } from './offerUtils';

const MAX_BYTES = 10 * 1024 * 1024;

interface OfferUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** True for TPO/admin: the offer goes straight to the candidate instead of waiting for approval. */
  releasesDirectly: boolean;
}

export const OfferUploadModal: React.FC<OfferUploadModalProps> = ({ isOpen, onClose, onSaved, releasesDirectly }) => {
  const { success, error: toastError } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [applications, setApplications] = useState<{ value: string; label: string; role: string }[]>([]);
  const [application, setApplication] = useState('');
  const [pkg, setPkg] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setApplication('');
    setPkg('');
    setJoiningDate('');
    setDeadline('');
    setRoleTitle('');
    setFile(null);
    if (fileInput.current) fileInput.current.value = '';

    let cancelled = false;
    (async () => {
      try {
        const res = await getApplications({ limit: 100 });
        const rows: any[] = Array.isArray(res.data) ? res.data : (res.data as any)?.applications ?? [];
        if (cancelled) return;
        setApplications(
          rows
            .filter((a) => a.status === 'Selected' && !a.offer_status)
            .map((a) => ({
              value: a.id,
              role: a.drives?.role_title ?? '',
              label: `${a.students?.users?.full_name ?? 'Candidate'} - ${a.drives?.companies?.name ?? ''} ${a.drives?.role_title ?? ''}`.replace(/\s+/g, ' ').trim(),
            }))
        );
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load selected candidates.'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = Number(pkg);
    if (!application) return setError('Select a candidate.');
    if (!Number.isFinite(amount) || amount <= 0) return setError('Enter the package in LPA.');
    if (!file) return setError('Attach the offer letter PDF.');
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return setError('The offer letter must be a PDF.');
    if (file.size > MAX_BYTES) return setError('The PDF must be 10 MB or smaller.');
    if (deadline && new Date(deadline).getTime() <= Date.now()) return setError('The response deadline must be in the future.');

    const form = new FormData();
    form.append('application_id', application);
    form.append('package', String(amount));
    if (joiningDate) form.append('joining_date', joiningDate);
    if (deadline) form.append('response_deadline', new Date(deadline).toISOString());
    if (roleTitle.trim()) form.append('role_title', roleTitle.trim());
    form.append('offer_letter', file);

    setSaving(true);
    try {
      await createOffer(form);
      success(releasesDirectly ? 'Offer released' : 'Offer submitted', releasesDirectly ? 'The candidate has been notified.' : 'The TPO will review it before the candidate sees it.');
      onSaved();
      onClose();
    } catch (err) {
      const message = getErrorMessage(err, 'Could not upload the offer.');
      setError(message);
      toastError('Offer not saved', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !saving && onClose()}
      title="Upload offer letter"
      subtitle={releasesDirectly ? 'The candidate sees it immediately.' : 'The TPO approves it before the candidate sees it.'}
      maxWidth="lg"
    >
      <form onSubmit={submit} className="space-y-4">
        <Dropdown
          label="Selected candidate"
          options={applications}
          value={application}
          onChange={(v) => {
            setApplication(v);
            setRoleTitle(applications.find((a) => a.value === v)?.role ?? '');
          }}
          placeholder={applications.length ? 'Select candidate' : 'No selected candidates without an offer'}
        />
        <Input label="Role title" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} maxLength={150} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Package (LPA)" type="number" min="0" step="0.01" value={pkg} onChange={(e) => setPkg(e.target.value)} />
          <Input label="Joining date (optional)" type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
        </div>
        <Input label="Respond by (optional)" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        <div className="space-y-1.5">
          <label htmlFor="offer-file" className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
            Offer letter (PDF, max 10 MB)
          </label>
          <input
            ref={fileInput}
            id="offer-file"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saving}>
            {releasesDirectly ? 'Release offer' : 'Submit for approval'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
