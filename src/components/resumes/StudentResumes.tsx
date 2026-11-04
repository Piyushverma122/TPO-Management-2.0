import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Eye, FileText, RefreshCw, Trash2, Upload } from 'lucide-react';
import { Card } from '../app/Card';
import { Button } from '../app/Button';
import { Input } from '../app/Input';
import { Badge } from '../app/Badge';
import { Skeleton } from '../app/Skeleton';
import { EmptyState } from '../app/EmptyState';
import { Breadcrumb } from '../app/Breadcrumb';
import { Modal } from '../app/Modal';
import { PdfViewerModal } from '../app/PdfViewerModal';
import { useToast } from '../app/Toast';
import { deleteResume, getResumeFileUrl, getResumes, getStudentProfile, uploadResume } from '../../api/student.api';

const MAX_BYTES = 10 * 1024 * 1024;

interface ResumeRow {
  id: string;
  version_title: string | null;
  file_name: string | null;
  file_size: number | null;
  file_url: string | null;
  is_active: boolean;
  is_verified?: boolean;
  uploaded_at?: string;
  created_at?: string;
}

const errorText = (err: unknown, fallback: string) => (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
const sizeText = (bytes?: number | null) => (bytes ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : '');

/** A student's own resumes: upload a new version (it becomes the active one), open or delete old ones. */
export const StudentResumes: React.FC = () => {
  const { success, error: toastError } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [studentId, setStudentId] = useState<string | null>(null);
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState<ResumeRow | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ResumeRow | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const profile = await getStudentProfile();
      const student = profile.data?.profile || profile.data?.student;
      if (!student?.id) throw new Error('Your account is not linked to a student record. Please contact the TPO office.');
      setStudentId(student.id);
      const res = await getResumes(student.id);
      setResumes(res.data?.resumes ?? []);
    } catch (err) {
      setErrorMsg(errorText(err, (err as Error)?.message || 'Failed to load your resumes.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!studentId) return;
    if (!file) return setFormError('Choose a PDF file.');
    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) return setFormError('Only PDF files are accepted. Word, image and other formats are not allowed.');
    if (file.size > MAX_BYTES) return setFormError('The PDF must be 10 MB or smaller.');

    const form = new FormData();
    form.append('resume', file);
    form.append('version_title', title.trim() || file.name.replace(/\.pdf$/i, ''));
    setUploading(true);
    try {
      await uploadResume(studentId, form);
      success('Resume uploaded', 'It is now your active resume for applications.');
      setFile(null);
      setTitle('');
      if (fileInput.current) fileInput.current.value = '';
      await load();
    } catch (err) {
      setFormError(errorText(err, 'Could not upload the resume.'));
    } finally {
      setUploading(false);
    }
  };

  const openResume = async (resume: ResumeRow) => {
    setViewing(resume);
    setViewUrl(null);
    setViewError(null);
    try {
      setViewUrl((await getResumeFileUrl(resume.id)).url);
    } catch (err) {
      setViewError(errorText(err, 'Could not open this resume.'));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setRemoving(true);
    try {
      await deleteResume(deleting.id);
      success('Resume deleted');
      setDeleting(null);
      await load();
    } catch (err) {
      toastError('Could not delete', errorText(err, 'Please try again.'));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'My Resumes' }]} />
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-1">My Resumes</h1>
          <p className="text-sm text-muted-foreground mt-1">You need an active resume to apply to drives. Uploading a new one replaces the active resume.</p>
        </div>
        <Button variant="secondary" leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Card className="p-5">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          <Input label="Title (optional)" placeholder="e.g. Resume - Full Stack" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
          <div className="space-y-1.5">
            <label htmlFor="resume-file" className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
              PDF only (max 10 MB)
            </label>
            <input
              ref={fileInput}
              id="resume-file"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium"
            />
          </div>
          <Button type="submit" leftIcon={<Upload className="w-4 h-4" />} isLoading={uploading} disabled={!studentId}>
            Upload
          </Button>
        </form>
        {formError && <p className="text-sm text-destructive mt-3">{formError}</p>}
      </Card>

      {loading ? (
        <Skeleton variant="rectangular" className="w-full h-40" />
      ) : errorMsg ? (
        <EmptyState title="Could not load your resumes" description={errorMsg} actionText="Try again" onAction={load} />
      ) : resumes.length === 0 ? (
        <EmptyState icon={<FileText className="w-8 h-8" />} title="No resume yet" description="Upload your resume as a PDF above. You cannot apply to a drive without one." />
      ) : (
        <div className="space-y-3">
          {resumes.map((r) => (
            <Card key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-foreground truncate flex items-center gap-2">
                    {r.version_title || r.file_name}
                    {r.is_active && (
                      <Badge variant="success" size="sm" dot>
                        Active
                      </Badge>
                    )}
                    {r.is_verified && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.file_name} {sizeText(r.file_size) && `· ${sizeText(r.file_size)}`}{' '}
                    {(r.uploaded_at || r.created_at) && `· ${new Date(r.uploaded_at || r.created_at!).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="secondary" leftIcon={<Eye className="w-4 h-4" />} onClick={() => openResume(r)}>
                  View
                </Button>
                <Button size="sm" variant="ghost" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setDeleting(r)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PdfViewerModal
        isOpen={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing?.version_title || viewing?.file_name || 'Resume'}
        subtitle={viewing?.file_name || undefined}
        url={viewUrl}
        error={viewError}
        fileName={viewing?.file_name || undefined}
      />

      <Modal isOpen={Boolean(deleting)} onClose={() => !removing && setDeleting(null)} title="Delete this resume?" subtitle={deleting?.version_title || deleting?.file_name || undefined} maxWidth="md">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Applications that already used this resume keep working. This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleting(null)} disabled={removing}>
              Keep
            </Button>
            <Button variant="danger" onClick={confirmDelete} isLoading={removing}>
              Delete resume
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
