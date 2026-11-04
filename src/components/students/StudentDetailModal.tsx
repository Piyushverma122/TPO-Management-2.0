import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Award, BookOpen, Briefcase, CalendarClock, Eye, FileText, FolderOpen, GraduationCap, History, LayoutDashboard, Mail, Phone, RefreshCw, Trash2, Upload, UserCheck } from 'lucide-react';
import { Modal } from '../app/Modal';
import { Card } from '../app/Card';
import { Button } from '../app/Button';
import { Badge } from '../app/Badge';
import { Avatar } from '../app/Avatar';
import { Tabs } from '../app/Tabs';
import { StatTile } from '../app/StatTile';
import { Skeleton } from '../app/Skeleton';
import { EmptyState } from '../app/EmptyState';
import { PdfViewerModal } from '../app/PdfViewerModal';
import { useToast } from '../app/Toast';
import { PermissionGuard } from '../auth/PermissionGuard';
import { Action, Module } from '../../config/rbac';
import { deleteResume, getDocumentFileUrl, getResumeFileUrl, getStudentOverview, uploadResume } from '../../api/student.api';
import type { StudentOverview } from '../../api/student.api';
import { OfferLetterViewer } from '../offers/OfferLetterViewer';
import { formatDate, getErrorMessage } from '../offers/offerUtils';
import { AcademicsTab, ActivityTab, ApplicationsTab, InterviewsTab, OffersTab, OnboardingBanner, OverviewTab, Section, TrainingTab } from './StudentTabs';

type Tab = 'overview' | 'academics' | 'applications' | 'interviews' | 'offers' | 'documents' | 'training' | 'activity';

const ONBOARDING_VARIANT = { Completed: 'success', Pending: 'warning', 'Not started': 'alert' } as const;
const sizeText = (bytes?: number | null) => (bytes ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : '');

interface StudentDetailModalProps {
  studentId: string | null;
  onClose: () => void;
  /** Called after the admin confirms deleting this student (the page performs the delete). */
  onDelete?: (studentId: string) => void;
}

/** One place for everything about a student: profile, onboarding, drives, interviews, offers, files and training. */
export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ studentId, onClose, onDelete }) => {
  const { success, error: toastError } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<StudentOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');

  const [viewer, setViewer] = useState<{ title: string; subtitle?: string; url: string | null; error: string | null; fileName?: string } | null>(null);
  const [offerToView, setOfferToView] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      setData(await getStudentOverview(studentId));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Could not load this student.'));
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    setData(null);
    setTab('overview');
    setConfirmDelete(false);
    load();
  }, [studentId, load]);

  /** Opens a private file in the in-app viewer through a short-lived signed link. */
  const openFile = async (title: string, getUrl: () => Promise<{ url: string; file_name?: string | null }>, subtitle?: string) => {
    setViewer({ title, subtitle, url: null, error: null });
    try {
      const file = await getUrl();
      setViewer({ title, subtitle, url: file.url, error: null, fileName: file.file_name || undefined });
    } catch (err) {
      setViewer({ title, subtitle, url: null, error: getErrorMessage(err, 'Could not open this file.') });
    }
  };

  const onResumeChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !studentId) return;
    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) return toastError('PDF only', 'Only PDF resumes are accepted.');
    if (file.size > 10 * 1024 * 1024) return toastError('File too large', 'The PDF must be 10 MB or smaller.');

    const form = new FormData();
    form.append('resume', file);
    form.append('version_title', file.name.replace(/\.pdf$/i, ''));
    setUploading(true);
    try {
      await uploadResume(studentId, form);
      success('Resume uploaded', 'It is now the active resume.');
      await load();
    } catch (err) {
      toastError('Upload failed', getErrorMessage(err, 'Could not upload the resume.'));
    } finally {
      setUploading(false);
    }
  };

  const removeResume = async (id: string) => {
    try {
      await deleteResume(id);
      success('Resume deleted');
      await load();
    } catch (err) {
      toastError('Delete failed', getErrorMessage(err, 'Could not delete the resume.'));
    }
  };

  const s = data?.student;
  const name = s?.user?.full_name || 'Student';
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = data
    ? [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'academics', label: 'Academics', icon: <GraduationCap className="w-4 h-4" /> },
        { id: 'applications', label: `Applications (${data.stats.applications})`, icon: <Briefcase className="w-4 h-4" /> },
        { id: 'interviews', label: `Interviews (${data.stats.interviews})`, icon: <CalendarClock className="w-4 h-4" /> },
        { id: 'offers', label: `Offers (${data.stats.offers})`, icon: <Award className="w-4 h-4" /> },
        { id: 'documents', label: `Files (${data.stats.resumes + data.stats.documents})`, icon: <FolderOpen className="w-4 h-4" /> },
        { id: 'training', label: 'Training', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'activity', label: 'Activity', icon: <History className="w-4 h-4" /> },
      ]
    : [];

  return (
    <>
      <Modal isOpen={Boolean(studentId)} onClose={onClose} title="Student profile" subtitle={data ? `Roll no. ${s?.roll_number ?? '-'}` : undefined} maxWidth="screen">
        {loading && !data ? (
          <div className="space-y-4">
            <Skeleton variant="rectangular" className="w-full h-24" />
            <Skeleton variant="rectangular" className="w-full h-64" />
          </div>
        ) : errorMsg ? (
          <EmptyState title="Could not load this student" description={errorMsg} actionText="Try again" onAction={load} />
        ) : data && s ? (
          <div className="space-y-6">
            <Card className="p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-center gap-5 min-w-0">
                <div className="scale-125 origin-left mr-3 shrink-0">
                  <Avatar src={s.user?.avatar_url} name={name} size="lg" />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <h2 className="text-2xl font-semibold text-foreground truncate">{name}</h2>
                  <p className="text-sm text-muted-foreground truncate">
                    {[s.department?.name, s.branch?.name, s.passing_year ? `Batch ${s.passing_year}` : null].filter(Boolean).join(' · ') || 'Branch not set yet'}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {s.user?.email && (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> {s.user.email}
                      </span>
                    )}
                    {(s.phone || s.user?.phone) && (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> {s.phone || s.user?.phone}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant={s.placement_status === 'Placed' ? 'success' : 'neutral'} size="sm" dot>
                      {s.placement_status}
                    </Badge>
                    <Badge variant={ONBOARDING_VARIANT[data.onboarding.status]} size="sm" dot>
                      Onboarding: {data.onboarding.status}
                    </Badge>
                    {s.user?.is_active === false && (
                      <Badge variant="alert" size="sm">
                        Deactivated
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 self-start lg:self-center">
                <Button variant="secondary" size="sm" leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={load} disabled={loading}>
                  Refresh
                </Button>
                {onDelete && (
                  <PermissionGuard module={Module.STUDENTS} action={Action.DELETE}>
                    <Button variant="danger" size="sm" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setConfirmDelete(true)}>
                      Delete
                    </Button>
                  </PermissionGuard>
                )}
              </div>
            </div>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              <StatTile label="CGPA" value={s.cgpa != null ? Number(s.cgpa).toFixed(2) : null} icon={<GraduationCap className="w-5 h-5" />} tone="primary" hint={`${s.active_backlogs ?? 0} active backlogs`} onClick={() => setTab('academics')} />
              <StatTile label="Applications" value={data.stats.applications} icon={<Briefcase className="w-5 h-5" />} tone="info" hint={`${data.drives.inProgress} in progress`} onClick={() => setTab('applications')} />
              <StatTile label="Interviews" value={data.stats.interviews} icon={<CalendarClock className="w-5 h-5" />} tone={data.stats.upcomingInterviews > 0 ? 'warning' : 'neutral'} hint={`${data.stats.upcomingInterviews} upcoming`} onClick={() => setTab('interviews')} />
              <StatTile label="Offers" value={data.stats.offers} icon={<Award className="w-5 h-5" />} tone={data.placement.acceptedCount > 0 ? 'success' : 'neutral'} hint={data.placement.acceptedCount > 0 ? 'placed' : 'none accepted yet'} onClick={() => setTab('offers')} />
              <StatTile label="Files" value={data.stats.resumes + data.stats.documents} icon={<FolderOpen className="w-5 h-5" />} tone="neutral" hint={`${data.stats.resumes} resume${data.stats.resumes === 1 ? '' : 's'}`} onClick={() => setTab('documents')} />
              <StatTile label="Profile" value={`${data.onboarding.completion}%`} icon={<UserCheck className="w-5 h-5" />} tone={data.onboarding.completion >= 80 ? 'success' : 'warning'} hint="details filled in" />
            </div>

            {confirmDelete && (
              <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-rose-500/40 bg-rose-500/5">
                <span className="text-sm text-foreground">Delete {name}? Their records are hidden and they can no longer log in.</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>
                    Keep
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => onDelete?.(s.id)}>
                    Yes, delete
                  </Button>
                </div>
              </Card>
            )}

            <OnboardingBanner data={data} />

            <Tabs variant="pills" activeTab={tab} onChange={(id) => setTab(id as Tab)} tabs={tabs} />

            <div className="min-h-[22rem]">
              {tab === 'overview' && <OverviewTab data={data} />}
              {tab === 'academics' && <AcademicsTab data={data} />}
              {tab === 'applications' && <ApplicationsTab data={data} />}
              {tab === 'interviews' && <InterviewsTab data={data} />}
              {tab === 'offers' && <OffersTab data={data} onOpenOffer={setOfferToView} />}
              {tab === 'training' && <TrainingTab data={data} />}
              {tab === 'activity' && <ActivityTab data={data} />}
              {tab === 'documents' && (
                <div className="space-y-6">
                  <Section
                    title={`Resumes (${data.resumes.length})`}
                    aside={
                      <>
                        <input ref={fileInput} type="file" accept="application/pdf,.pdf" className="hidden" onChange={onResumeChosen} />
                        <Button size="sm" variant="secondary" leftIcon={<Upload className="w-4 h-4" />} isLoading={uploading} onClick={() => fileInput.current?.click()}>
                          Upload PDF
                        </Button>
                      </>
                    }
                  >
                    {data.resumes.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-2xl">No resume uploaded.</p>
                    ) : (
                      <div className="space-y-2">
                        {data.resumes.map((r) => (
                          <Card key={r.id} className="p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText className="w-4 h-4 text-primary shrink-0" />
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-foreground truncate flex items-center gap-2">
                                  {r.version_title || r.file_name}
                                  {r.is_active && (
                                    <Badge variant="success" size="sm">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {r.file_name} {sizeText(r.file_size) && `· ${sizeText(r.file_size)}`} {r.uploaded_at && `· ${formatDate(r.uploaded_at)}`}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <Button size="sm" variant="secondary" leftIcon={<Eye className="w-4 h-4" />} onClick={() => openFile(r.version_title || r.file_name || 'Resume', () => getResumeFileUrl(r.id), r.file_name)}>
                                View
                              </Button>
                              <Button size="sm" variant="ghost" iconOnly aria-label="Delete resume" onClick={() => removeResume(r.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </Section>

                  <Section title={`Documents (${data.documents.length})`}>
                    {data.documents.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-2xl">No documents uploaded.</p>
                    ) : (
                      <div className="space-y-2">
                        {data.documents.map((d) => (
                          <Card key={d.id} className="p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{d.document_name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {d.document_type} &middot; {d.file_name} {sizeText(d.file_size) && `· ${sizeText(d.file_size)}`}
                              </div>
                            </div>
                            <Button size="sm" variant="secondary" leftIcon={<Eye className="w-4 h-4" />} onClick={() => openFile(d.document_name || 'Document', () => getDocumentFileUrl(d.id), d.file_name)}>
                              View
                            </Button>
                          </Card>
                        ))}
                      </div>
                    )}
                  </Section>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <PdfViewerModal
        isOpen={Boolean(viewer)}
        onClose={() => setViewer(null)}
        title={viewer?.title ?? ''}
        subtitle={viewer?.subtitle}
        url={viewer?.url ?? null}
        error={viewer?.error}
        fileName={viewer?.fileName}
      />
      <OfferLetterViewer offer={offerToView} onClose={() => setOfferToView(null)} />
    </>
  );
};
