import React from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { Card } from '../app/Card';
import { Badge } from '../app/Badge';
import { CompanyCell } from '../app/EntityCell';
import { RadialProgress } from '../app/ProgressBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../app/Table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import type { ReportDashboard } from '../../api/report.api';

const PALETTE = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-5)', 'var(--chart-3)', 'var(--chart-4)'];

const Empty: React.FC<{ text: string }> = ({ text }) => <p className="py-14 text-center text-sm text-muted-foreground">{text}</p>;

const CardHeader: React.FC<{ title: string; subtitle?: string; aside?: React.ReactNode }> = ({ title, subtitle, aside }) => (
  <div className="flex items-start justify-between gap-3">
    <div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
    {aside}
  </div>
);

const lpa = (n: number) => `₹${n} LPA`;

// ---------------------------------------------------------------- trend
export const TrendCard: React.FC<{ data: ReportDashboard['trend'] }> = ({ data }) => {
  const total = data.reduce((sum, m) => sum + m.placed, 0);
  const config = { cumulative: { label: 'Total placed so far', color: 'var(--chart-1)' }, placed: { label: 'Placed that month', color: 'var(--chart-5)' } } satisfies ChartConfig;
  return (
    <Card className="p-6">
      <CardHeader title="Placements over time" subtitle="Accepted offers per month, with the running total" aside={<div className="text-right"><div className="text-2xl font-semibold text-foreground">{total}</div><div className="text-xs text-muted-foreground">in this period</div></div>} />
      {total === 0 ? (
        <Empty text="No accepted offers in this period yet." />
      ) : (
        <ChartContainer config={config} className="aspect-auto mt-6 h-72 w-full">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="reportCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-cumulative)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-cumulative)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Area type="monotone" dataKey="cumulative" stroke="var(--color-cumulative)" strokeWidth={2} fill="url(#reportCumulative)" />
            <Area type="monotone" dataKey="placed" stroke="var(--color-placed)" strokeWidth={2} fill="none" />
          </AreaChart>
        </ChartContainer>
      )}
    </Card>
  );
};

// ---------------------------------------------------------------- donut (department / batch / branch)
export const SplitCard: React.FC<{ title: string; subtitle: string; data: { name: string; count: number }[]; total: number }> = ({ title, subtitle, data, total }) => {
  const rows = data.map((d, i) => ({ ...d, fill: PALETTE[i % PALETTE.length] }));
  const config: ChartConfig = Object.fromEntries(rows.map((r) => [r.name, { label: r.name, color: r.fill }]));
  return (
    <Card className="p-6">
      <CardHeader title={title} subtitle={subtitle} />
      {total === 0 ? (
        <Empty text="Nothing to split yet." />
      ) : (
        <>
          <div className="relative mt-4">
            <ChartContainer config={config} className="aspect-auto mx-auto h-48 w-full">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie data={rows} innerRadius={58} outerRadius={80} paddingAngle={3} dataKey="count" nameKey="name" strokeWidth={0}>
                  {rows.map((r) => (
                    <Cell key={r.name} fill={r.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold text-foreground">{total}</span>
              <span className="text-xs text-muted-foreground">placed</span>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {rows.map((r) => (
              <li key={r.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.fill }} />
                  {r.name}
                </span>
                <span className="font-medium text-foreground">
                  {r.count} <span className="text-xs text-muted-foreground">({Math.round((r.count / total) * 100)}%)</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
};

// ---------------------------------------------------------------- horizontal bars (package split, funnel)
export const BarsCard: React.FC<{ title: string; subtitle: string; rows: { label: string; value: number }[]; unit: string; emptyText: string }> = ({ title, subtitle, rows, unit, emptyText }) => {
  const config = { value: { label: unit, color: 'var(--chart-1)' } } satisfies ChartConfig;
  const hasData = rows.some((r) => r.value > 0);
  return (
    <Card className="p-6">
      <CardHeader title={title} subtitle={subtitle} />
      {!hasData ? (
        <Empty text={emptyText} />
      ) : (
        <ChartContainer config={config} className="aspect-auto mt-4 h-64 w-full">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="label" width={110} fontSize={11} tickLine={false} axisLine={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={6} />
          </BarChart>
        </ChartContainer>
      )}
    </Card>
  );
};

// ---------------------------------------------------------------- tables
export const RecruitersCard: React.FC<{ rows: ReportDashboard['topRecruiters'] }> = ({ rows }) => (
  <Card className="p-0 overflow-hidden">
    <div className="p-6 pb-3">
      <CardHeader title="Top recruiters" subtitle="Companies that hired the most students" />
    </div>
    {rows.length === 0 ? (
      <Empty text="No hires recorded yet." />
    ) : (
      <Table bare>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Placed</TableHead>
            <TableHead>Average</TableHead>
            <TableHead>Highest</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.name}>
              <TableCell>
                <CompanyCell name={r.name} sub={r.tier || undefined} />
              </TableCell>
              <TableCell className="font-semibold text-foreground">{r.placed}</TableCell>
              <TableCell>{lpa(r.averagePackage)}</TableCell>
              <TableCell>{lpa(r.highestPackage)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </Card>
);

export const LatestCard: React.FC<{ rows: ReportDashboard['latestPlacements'] }> = ({ rows }) => (
  <Card className="p-0 overflow-hidden">
    <div className="p-6 pb-3">
      <CardHeader title="Latest placements" subtitle="Most recently accepted offers" />
    </div>
    {rows.length === 0 ? (
      <Empty text="No placement records yet." />
    ) : (
      <Table bare>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Company / role</TableHead>
            <TableHead>Package</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <div className="font-medium text-foreground">{r.student}</div>
                <div className="text-xs text-muted-foreground">{r.branch}</div>
              </TableCell>
              <TableCell>
                <div className="text-foreground">{r.company}</div>
                <div className="text-xs text-muted-foreground">{r.role}</div>
              </TableCell>
              <TableCell className="font-semibold text-foreground whitespace-nowrap">{lpa(r.package)}</TableCell>
              <TableCell className="whitespace-nowrap">{new Date(r.date).toLocaleDateString([], { dateStyle: 'medium' })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </Card>
);

// ---------------------------------------------------------------- small cards
const STATUS_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'alert' | 'neutral'> = { Passed: 'success', Completed: 'neutral', Scheduled: 'info', Failed: 'alert', Cancelled: 'warning', Ongoing: 'success', Upcoming: 'info', Conducted: 'neutral' };

export const CountsCard: React.FC<{ title: string; subtitle: string; rows: { name: string; count: number }[]; emptyText: string }> = ({ title, subtitle, rows, emptyText }) => (
  <Card className="p-6">
    <CardHeader title={title} subtitle={subtitle} />
    {rows.length === 0 ? (
      <Empty text={emptyText} />
    ) : (
      <ul className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between text-sm">
            <Badge variant={STATUS_VARIANT[r.name] ?? 'neutral'} size="sm" dot>
              {r.name}
            </Badge>
            <span className="font-semibold text-foreground">{r.count}</span>
          </li>
        ))}
      </ul>
    )}
  </Card>
);

export const TrainingCard: React.FC<{ data: NonNullable<ReportDashboard['training']> }> = ({ data }) => (
  <Card className="p-6">
    <CardHeader title="Training completion" subtitle={`${data.completed} of ${data.enrolled} enrolments completed`} />
    {data.enrolled === 0 ? (
      <Empty text="No training enrolments yet." />
    ) : (
      <div className="mt-4 flex flex-col items-center gap-2">
        <RadialProgress value={data.completionRate} size={140} strokeWidth={12} label="Complete" />
        <p className="text-xs text-muted-foreground">Average progress {data.averageProgress}%</p>
      </div>
    )}
  </Card>
);
