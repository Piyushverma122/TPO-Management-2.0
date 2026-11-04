import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Briefcase, Building2, CalendarClock, Clock, Download, FileSpreadsheet, FileText, IndianRupee, Percent, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { Card } from '../components/app/Card';
import { Button } from '../components/app/Button';
import { Input } from '../components/app/Input';
import { Dropdown } from '../components/app/Dropdown';
import { Modal } from '../components/app/Modal';
import { StatTile } from '../components/app/StatTile';
import { Skeleton } from '../components/app/Skeleton';
import { EmptyState } from '../components/app/EmptyState';
import { Breadcrumb } from '../components/app/Breadcrumb';
import { useToast } from '../components/app/Toast';
import { PermissionGuard } from '../components/auth/PermissionGuard';
import { useAuth } from '../context/AuthContext';
import { Action, Module, Role, normalizeRole } from '../config/rbac';
import { downloadReport, getReportDashboard } from '../api/report.api';
import type { ExportFormat, ReportDashboard, ReportFilters, ReportType } from '../api/report.api';
import { getDriveLookups } from '../api/drive.api';
import type { DriveLookups } from '../api/drive.api';
import { BarsCard, CountsCard, LatestCard, RecruitersCard, SplitCard, TrainingCard, TrendCard } from '../components/reports/ReportCharts';

const thisYear = new Date().getFullYear();
const BATCHES = [{ label: 'All batches', value: '' }, ...Array.from({ length: 6 }, (_, i) => String(thisYear - 1 + i)).map((y) => ({ label: `${y} batch`, value: y }))];

const REPORT_TYPES: { value: ReportType; label: string; staffOnly?: boolean }[] = [
  { value: 'summary', label: 'Summary (all charts as tables)' },
  { value: 'placements', label: 'Placements (accepted offers)' },
  { value: 'drives', label: 'Drives and applicants' },
  { value: 'companies', label: 'Companies and hiring' },
  { value: 'students', label: 'Students (contact details included)', staffOnly: true },
  { value: 'trainings', label: 'Training enrolments', staffOnly: true },
];

const FORMATS: { id: ExportFormat; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: 'pdf', label: 'PDF', icon: <FileText className="w-5 h-5" />, hint: 'Print-ready' },
  { id: 'excel', label: 'Excel', icon: <FileSpreadsheet className="w-5 h-5" />, hint: '.xlsx workbook' },
  { id: 'csv', label: 'CSV', icon: <Download className="w-5 h-5" />, hint: 'Plain data' },
];

const errorText = (err: unknown, fallback: string) => (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
const lpa = (n: number) => `₹${n} LPA`;

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const isRecruiter = normalizeRole(user?.role) === Role.RECRUITER;

  const [filters, setFilters] = useState<ReportFilters>({});
  const [data, setData] = useState<ReportDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lookups, setLookups] = useState<DriveLookups | null>(null);

  const [exportOpen, setExportOpen] = useState(false);
  const [exportType, setExportType] = useState<ReportType>('summary');
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      setData(await getReportDashboard(filters));
    } catch (err) {
      setErrorMsg(errorText(err, 'Failed to load the report.'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  // Department names come from the same options endpoint the drive form uses (staff only; others just skip the filter).
  useEffect(() => {
    getDriveLookups().then(setLookups).catch(() => setLookups(null));
  }, []);

  const set = (patch: Partial<ReportFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const hasFilters = Object.values(filters).some(Boolean);
  const departments = useMemo(() => [{ label: 'All departments', value: '' }, ...(lookups?.departments ?? []).map((d) => ({ label: d.name, value: d.id }))], [lookups]);

  const runExport = async (format: ExportFormat) => {
    setExporting(format);
    try {
      const filename = await downloadReport(format, exportType, filters);
      success('Report downloaded', filename);
      setExportOpen(false);
    } catch (err) {
      // The server answers errors as JSON even when a file was requested.
      let message = 'Could not generate the report.';
      const blob = (err as { response?: { data?: Blob } })?.response?.data;
      if (blob instanceof Blob) {
        try {
          message = JSON.parse(await blob.text()).message || message;
        } catch {
          /* keep the default message */
        }
      }
      toastError('Export failed', message);
    } finally {
      setExporting(null);
    }
  };

  const k = data?.kpis;
  const placed = k?.placedStudents ?? 0;

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Reports & Export' }]} />
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-1">Placement reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRecruiter ? 'Hiring numbers for your company only.' : 'Live numbers from accepted offers, drives, applications and interviews.'}
            {data && ` Updated ${new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={load} disabled={loading}>
            Refresh
          </Button>
          <PermissionGuard module={Module.REPORTS} action={Action.EXPORT}>
            <Button leftIcon={<Download className="w-4 h-4" />} onClick={() => setExportOpen(true)}>
              Export
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <Dropdown label="Batch" options={BATCHES} value={filters.batch ?? ''} onChange={(v) => set({ batch: v || undefined })} />
        {!isRecruiter && <Dropdown label="Department" options={departments} value={filters.department_id ?? ''} onChange={(v) => set({ department_id: v || undefined })} />}
        <Input label="From" type="date" value={filters.from ?? ''} max={filters.to || undefined} onChange={(e) => set({ from: e.target.value || undefined })} />
        <Input label="To" type="date" value={filters.to ?? ''} min={filters.from || undefined} onChange={(e) => set({ to: e.target.value || undefined })} />
        <Button variant="ghost" onClick={() => setFilters({})} disabled={!hasFilters}>
          Reset filters
        </Button>
      </Card>

      {errorMsg ? (
        <EmptyState title="Could not load the report" description={errorMsg} actionText="Try again" onAction={load} />
      ) : loading && !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((n) => (
              <Skeleton key={n} variant="rectangular" className="w-full h-24" />
            ))}
          </div>
          <Skeleton variant="rectangular" className="w-full h-80" />
        </div>
      ) : data && k ? (
        <div className={loading ? 'opacity-60 transition-opacity space-y-6' : 'space-y-6'}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile label="Students placed" value={placed} icon={<Users className="w-5 h-5" />} tone="success" hint={k.totalStudents != null ? `of ${k.totalStudents} students` : 'accepted offers'} />
            {k.placementRate != null ? (
              <StatTile label="Placement rate" value={`${k.placementRate}%`} icon={<Percent className="w-5 h-5" />} tone="primary" hint="placed / all students" />
            ) : (
              <StatTile label="Companies hiring" value={k.companiesHiring} icon={<Building2 className="w-5 h-5" />} tone="primary" hint="with accepted offers" />
            )}
            <StatTile label="Highest package" value={k.highestPackage ? lpa(k.highestPackage) : '-'} icon={<TrendingUp className="w-5 h-5" />} tone="info" hint="best accepted offer" />
            <StatTile label="Average / median" value={k.averagePackage ? lpa(k.averagePackage) : '-'} icon={<IndianRupee className="w-5 h-5" />} tone="neutral" hint={k.medianPackage ? `median ${lpa(k.medianPackage)}` : 'no offers yet'} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile label="Open drives" value={k.openDrives} icon={<Briefcase className="w-5 h-5" />} tone="info" hint={`${k.totalDrives} drives in total`} />
            <StatTile label="Applications" value={k.totalApplications} icon={<Award className="w-5 h-5" />} tone="neutral" hint="across all drives" />
            <StatTile label="Offers awaiting reply" value={k.offersAwaitingReply} icon={<Clock className="w-5 h-5" />} tone={k.offersAwaitingReply > 0 ? 'warning' : 'neutral'} hint={k.offersAwaitingApproval ? `${k.offersAwaitingApproval} awaiting approval` : 'released to students'} />
            <StatTile label="Upcoming interviews" value={k.upcomingInterviews} icon={<CalendarClock className="w-5 h-5" />} tone="success" hint="scheduled ahead" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <TrendCard data={data.trend} />
            </div>
            <div className="lg:col-span-4">
              <SplitCard title="Department split" subtitle="Share of placements by department" data={data.byDepartment} total={placed} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BarsCard title="Package distribution" subtitle="How many accepted offers fall in each range" rows={data.packageDistribution.map((x) => ({ label: x.name, value: x.count }))} unit="Students" emptyText="No accepted offers yet." />
            <BarsCard title="Recruitment funnel" subtitle="Applications that reached each stage" rows={data.funnel.map((x) => ({ label: x.stage, value: x.count }))} unit="Applications" emptyText="No applications yet." />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <RecruitersCard rows={data.topRecruiters} />
            </div>
            <div className="lg:col-span-4 space-y-4">
              <CountsCard title="Interview outcomes" subtitle="All scheduled interviews" rows={data.interviewOutcomes} emptyText="No interviews yet." />
              {data.training && <TrainingCard data={data.training} />}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <LatestCard rows={data.latestPlacements} />
            </div>
            <div className="lg:col-span-4 space-y-4">
              <SplitCard title="By batch" subtitle="Placements by passing-out year" data={data.byBatch} total={placed} />
              <CountsCard title="Drives by status" subtitle="Published drives" rows={data.drivesByStatus} emptyText="No published drives." />
            </div>
          </div>
        </div>
      ) : null}

      <Modal isOpen={exportOpen} onClose={() => !exporting && setExportOpen(false)} title="Export report" subtitle={hasFilters ? 'Your current filters are applied.' : 'All records.'} maxWidth="md">
        <div className="space-y-5">
          <Dropdown
            label="What to export"
            options={REPORT_TYPES.filter((t) => !(isRecruiter && t.staffOnly)).map((t) => ({ label: t.label, value: t.value }))}
            value={exportType}
            onChange={(v) => setExportType(v as ReportType)}
          />
          <div className="grid grid-cols-3 gap-3">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                disabled={Boolean(exporting)}
                onClick={() => runExport(f.id)}
                className="rounded-2xl border border-border bg-card p-4 text-center hover:border-primary/60 transition-colors disabled:opacity-60"
              >
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">{exporting === f.id ? <RefreshCw className="w-5 h-5 animate-spin" /> : f.icon}</div>
                <div className="text-sm font-semibold text-foreground">{f.label}</div>
                <div className="text-[11px] text-muted-foreground">{f.hint}</div>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
