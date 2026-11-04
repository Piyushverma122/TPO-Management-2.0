import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, CalendarClock, MapPin, RefreshCw } from 'lucide-react';
import { Card } from '../app/Card';
import { Button } from '../app/Button';
import { SearchInput } from '../app/Input';
import { Dropdown } from '../app/Dropdown';
import { Badge } from '../app/Badge';
import { Pagination } from '../app/Pagination';
import { Skeleton } from '../app/Skeleton';
import { EmptyState } from '../app/EmptyState';
import { Breadcrumb } from '../app/Breadcrumb';
import { Modal } from '../app/Modal';
import { CompanyCell } from '../app/EntityCell';
import { useToast } from '../app/Toast';
import { getDriveById, getDrives, getMyEligibility } from '../../api/drive.api';
import type { DriveRecord, Eligibility } from '../../api/drive.api';
import { applyForDrive, getApplications } from '../../api/application.api';
import { DriveDetail } from './DriveDetail';
import { deadlineText, driveHeadline, formatDate, getErrorMessage } from './driveUtils';

const PAGE_SIZE = 9;
const TYPES = [{ label: 'All types', value: '' }, ...['Full Time', 'Internship', 'PPO', 'Dual (Intern + FT)'].map((v) => ({ label: v, value: v }))];

/** What a student sees: published drives only, each opens as a full announcement with a real eligibility check. */
export const StudentDrives: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [params] = useSearchParams();

  const [rows, setRows] = useState<DriveRecord[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState(params.get('search') ?? '');
  const [search, setSearch] = useState(searchInput);
  const [jobType, setJobType] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [open, setOpen] = useState<DriveRecord | null>(null);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [checking, setChecking] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [res, apps] = await Promise.all([
        getDrives({ page, limit: PAGE_SIZE, search: search || undefined, job_type: jobType || undefined }),
        getApplications({ limit: 100 }).catch(() => null),
      ]);
      setRows(res.data ?? []);
      setTotal(res.pagination?.totalEntries ?? 0);
      setTotalPages(res.pagination?.totalPages ?? 1);
      const list: any[] = (apps?.data as any)?.applications ?? (Array.isArray(apps?.data) ? (apps?.data as any[]) : []);
      setApplied(new Set(list.map((a) => a.drive_id ?? a.driveId).filter(Boolean)));
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load drives.');
      setErrorMsg(message);
      toastError('Error loading drives', message);
    } finally {
      setLoading(false);
    }
  }, [page, search, jobType, toastError]);

  useEffect(() => {
    load();
  }, [load]);

  const openDrive = async (drive: DriveRecord) => {
    setOpen(drive);
    setEligibility(null);
    setChecking(true);
    try {
      const [full, result] = await Promise.all([getDriveById(drive.id), getMyEligibility(drive.id)]);
      setOpen(full);
      setEligibility(result);
    } catch (err) {
      toastError('Could not open the drive', getErrorMessage(err, 'Please try again.'));
    } finally {
      setChecking(false);
    }
  };

  const apply = async () => {
    if (!open) return;
    setApplying(true);
    try {
      await applyForDrive({ drive_id: open.id });
      success('Application sent', `You applied to ${open.companies?.name ?? 'the drive'}. Track it under My Applications.`);
      setApplied((prev) => new Set(prev).add(open.id));
    } catch (err) {
      toastError('Could not apply', getErrorMessage(err, 'Please try again.'));
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Available Drives' }]} />
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-1">Available Drives</h1>
          <p className="text-sm text-muted-foreground mt-1">Open a drive to see every profile, the pay, the process and whether you are eligible.</p>
        </div>
        <Button variant="secondary" leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Card className="p-3 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 min-w-0">
          <SearchInput placeholder="Search by role, company or location..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
        <Dropdown
          className="w-full md:w-48 shrink-0"
          options={TYPES}
          value={jobType}
          onChange={(v) => {
            setJobType(v);
            setPage(1);
          }}
        />
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} variant="rectangular" className="w-full h-48" />
          ))}
        </div>
      ) : errorMsg ? (
        <EmptyState title="Could not load drives" description={errorMsg} actionText="Try again" onAction={load} />
      ) : rows.length === 0 ? (
        <EmptyState icon={<Briefcase className="w-8 h-8" />} title="No drives to show" description="New drives appear here as soon as the TPO publishes them." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rows.map((d) => {
              const dl = deadlineText(d.registration_deadline);
              const profiles = d.drive_profiles ?? [];
              return (
                <Card key={d.id} className="p-5 flex flex-col gap-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <CompanyCell name={d.companies?.name} logo={d.companies?.logo_url} sub={d.job_type} />
                    {applied.has(d.id) ? (
                      <Badge variant="success" size="sm" dot>
                        Applied
                      </Badge>
                    ) : dl?.closed ? (
                      <Badge variant="neutral" size="sm">
                        Closed
                      </Badge>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-foreground">{profiles.length > 1 ? `${profiles.length} profiles open` : d.role_title}</h3>
                    {profiles.length > 1 && <p className="text-xs text-muted-foreground line-clamp-2">{profiles.map((p) => p.title).join(' · ')}</p>}
                    {driveHeadline(d) && <p className="text-sm font-semibold text-primary">{driveHeadline(d)}</p>}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 mt-auto">
                    {d.location && (
                      <div className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> {d.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5" /> Register by {formatDate(d.registration_deadline)} {dl && <span className={dl.closed ? '' : 'text-primary'}>({dl.label})</span>}
                    </div>
                  </div>
                  <Button variant="secondary" fullWidth onClick={() => openDrive(d)}>
                    View details
                  </Button>
                </Card>
              );
            })}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalEntries={total} />
        </>
      )}

      <Modal isOpen={Boolean(open)} onClose={() => setOpen(null)} title="Drive details" maxWidth="5xl">
        {open && (
          <DriveDetail
            drive={open}
            eligibility={eligibility}
            checkingEligibility={checking}
            apply={{ applied: applied.has(open.id), applying, onApply: apply }}
          />
        )}
      </Modal>
    </div>
  );
};
