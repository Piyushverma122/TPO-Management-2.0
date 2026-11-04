import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, FileText, IndianRupee, RefreshCw, Trash2, TrendingUp, Users } from 'lucide-react';
import { Card } from '../components/app/Card';
import { Button } from '../components/app/Button';
import { Badge } from '../components/app/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/app/Table';
import { Pagination } from '../components/app/Pagination';
import { Skeleton } from '../components/app/Skeleton';
import { EmptyState } from '../components/app/EmptyState';
import { Breadcrumb } from '../components/app/Breadcrumb';
import { Modal } from '../components/app/Modal';
import { StatTile } from '../components/app/StatTile';
import { CompanyCell, PersonCell } from '../components/app/EntityCell';
import { useToast } from '../components/app/Toast';
import { PermissionGuard } from '../components/auth/PermissionGuard';
import { Action, Module } from '../config/rbac';
import { deletePlacement, getPlacements, getPlacementStatistics } from '../api/placement.api';
import { formatDate, formatPackage, getErrorMessage, openOfferLetter } from '../components/offers/offerUtils';

const PAGE_SIZE = 10;

interface PlacementRow {
  id: string;
  package: number | string;
  role_title: string | null;
  joining_date: string | null;
  responded_at: string | null;
  created_at: string;
  storage_path: string | null;
  students?: { roll_number?: string; users?: { full_name: string; avatar_url?: string | null }; branches?: { name: string; code: string } };
  companies?: { name: string; logo_url?: string | null };
  placement_drives?: { role_title?: string };
}

interface PlacementStats {
  totalPlacements: number;
  highestPackage: number;
  averagePackage: number;
  medianPackage: number;
}

const lpa = (n: number | undefined) => (n ? `₹${Number(n).toFixed(1)} LPA` : '-');

export const Placements: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [rows, setRows] = useState<PlacementRow[]>([]);
  const [stats, setStats] = useState<PlacementStats | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<PlacementRow | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [list, summary] = await Promise.all([getPlacements({ page, limit: PAGE_SIZE }), getPlacementStatistics()]);
      const listBody = list as any;
      setRows(Array.isArray(listBody.data) ? listBody.data : listBody.data?.placements ?? []);
      setTotal(listBody.pagination?.totalEntries ?? 0);
      setTotalPages(listBody.pagination?.totalPages ?? 1);
      setStats((summary as any).data?.statistics ?? null);
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load placements.');
      setErrorMsg(message);
      toastError('Error loading placements', message);
    } finally {
      setLoading(false);
    }
  }, [page, toastError]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmDelete = async () => {
    if (!deleting) return;
    setRemoving(true);
    try {
      await deletePlacement(deleting.id);
      success('Placement removed', 'The student goes back to Unplaced if this was their only placement.');
      setDeleting(null);
      await load();
    } catch (err) {
      toastError('Could not remove placement', getErrorMessage(err, 'Please try again.'));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Placements' }]} />
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-1">Placements</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Students who accepted an offer. Offers still waiting for a decision stay on the Offer Letters page.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button variant="secondary" leftIcon={<FileText className="w-4 h-4" />} onClick={() => navigate('/offers')}>
            Offer letters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatTile label="Students placed" value={stats ? stats.totalPlacements : undefined} icon={<Users className="w-5 h-5" />} tone="primary" hint="accepted offers" />
        <StatTile label="Highest package" value={stats ? lpa(stats.highestPackage) : undefined} icon={<TrendingUp className="w-5 h-5" />} tone="success" />
        <StatTile label="Average package" value={stats ? lpa(stats.averagePackage) : undefined} icon={<IndianRupee className="w-5 h-5" />} tone="info" />
        <StatTile label="Median package" value={stats ? lpa(stats.medianPackage) : undefined} icon={<Award className="w-5 h-5" />} tone="warning" />
      </div>

      {loading ? (
        <Card className="p-4 space-y-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} variant="rectangular" className="w-full h-12" />
          ))}
        </Card>
      ) : errorMsg ? (
        <EmptyState title="Could not load placements" description={errorMsg} actionText="Try again" onAction={load} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Award className="w-8 h-8" />}
          title="No placements yet"
          description="A placement is recorded when a student accepts an offer."
          actionText="Go to offer letters"
          onAction={() => navigate('/offers')}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table bare>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Company / role</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Joining</TableHead>
                <TableHead>Accepted on</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <PersonCell name={p.students?.users?.full_name} sub={p.students?.roll_number} avatar={p.students?.users?.avatar_url} />
                  </TableCell>
                  <TableCell>
                    {p.students?.branches ? (
                      <Badge variant="neutral" size="sm">
                        {p.students.branches.code || p.students.branches.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <CompanyCell name={p.companies?.name} logo={p.companies?.logo_url} sub={p.role_title || p.placement_drives?.role_title} />
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-foreground whitespace-nowrap">{formatPackage(p.package)}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(p.joining_date)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(p.responded_at || p.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      {p.storage_path && (
                        <Button size="sm" variant="secondary" leftIcon={<FileText className="w-4 h-4" />} onClick={() => openOfferLetter(p.id, (m) => toastError('Could not open the offer letter', m))}>
                          Letter
                        </Button>
                      )}
                      <PermissionGuard module={Module.PLACEMENTS} action={Action.DELETE}>
                        <Button size="sm" variant="ghost" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setDeleting(p)}>
                          Remove
                        </Button>
                      </PermissionGuard>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-3 border-t border-border">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalEntries={total} />
          </div>
        </Card>
      )}

      <Modal
        isOpen={Boolean(deleting)}
        onClose={() => !removing && setDeleting(null)}
        title="Remove this placement?"
        subtitle={deleting ? `${deleting.students?.users?.full_name ?? ''} · ${deleting.companies?.name ?? ''}` : undefined}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">This deletes the placement record and its offer letter entry. It cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleting(null)} disabled={removing}>
              Keep
            </Button>
            <Button variant="danger" onClick={confirmDelete} isLoading={removing}>
              Remove placement
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
