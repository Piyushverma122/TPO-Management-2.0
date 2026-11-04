const reportService = require('../services/reportService');
const exportService = require('../services/exportService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const FILTER_KEYS = ['batch', 'department_id', 'branch_id', 'from', 'to', 'status', 'tier', 'cgpa_min', 'cgpa_max'];
const filtersOf = (query) => Object.fromEntries(FILTER_KEYS.filter((k) => query[k] !== undefined && query[k] !== '').map((k) => [k, query[k]]));
const describeFilters = (f) => {
  const parts = Object.entries(f).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`);
  return parts.length ? `Filters - ${parts.join(', ')}` : 'All records';
};

/** @route GET /api/v1/reports/dashboard */
const getDashboard = async (req, res, next) => {
  try {
    const report = await reportService.getReportDashboard(req.user, filtersOf(req.query));
    return sendSuccess(res, 'Report dashboard retrieved', report, 200);
  } catch (error) {
    next(error);
  }
};

/** @route GET /api/v1/reports/:type  (placements | students | companies | drives | trainings) */
const getReportRows = async (req, res, next) => {
  try {
    const rows = await reportService.getDataset(req.params.type, req.user, filtersOf(req.query));
    return sendSuccess(res, `${req.params.type} report retrieved`, { rows, count: rows.length }, 200);
  } catch (error) {
    next(error);
  }
};

const stamp = () => new Date().toISOString().slice(0, 10);
const download = (res, filename, contentType, body) => {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  return res.status(200).send(body);
};

/** The dashboard flattened into tables, so Excel and PDF can show it. */
const summaryTables = (d) => {
  const kpis = [
    d.kpis.totalStudents != null && { label: 'Students', value: d.kpis.totalStudents },
    { label: 'Placed', value: d.kpis.placedStudents },
    d.kpis.placementRate != null && { label: 'Placement rate', value: `${d.kpis.placementRate}%` },
    { label: 'Highest (LPA)', value: d.kpis.highestPackage },
    { label: 'Average (LPA)', value: d.kpis.averagePackage },
    { label: 'Median (LPA)', value: d.kpis.medianPackage },
    { label: 'Companies hiring', value: d.kpis.companiesHiring },
    { label: 'Drives', value: d.kpis.totalDrives },
    { label: 'Applications', value: d.kpis.totalApplications },
  ].filter(Boolean);

  const sheets = [
    { name: 'Summary', rows: kpis.map((k) => ({ Metric: k.label, Value: k.value })) },
    { name: 'Monthly trend', rows: d.trend.map((t) => ({ Month: t.month, Placed: t.placed, Cumulative: t.cumulative })) },
    { name: 'By department', rows: d.byDepartment.map((x) => ({ Department: x.name, Placed: x.count })) },
    { name: 'By batch', rows: d.byBatch.map((x) => ({ Batch: x.name, Placed: x.count })) },
    { name: 'Top recruiters', rows: d.topRecruiters.map((x) => ({ Company: x.name, Tier: x.tier || '', Placed: x.placed, 'Average (LPA)': x.averagePackage, 'Highest (LPA)': x.highestPackage })) },
    { name: 'Package split', rows: d.packageDistribution.map((x) => ({ Range: x.name, Students: x.count })) },
    { name: 'Funnel', rows: d.funnel.map((x) => ({ Stage: x.stage, Applications: x.count })) },
    { name: 'Latest placements', rows: d.latestPlacements.map((x) => ({ Student: x.student, Company: x.company, Role: x.role, 'Package (LPA)': x.package, Date: String(x.date).slice(0, 10) })) },
  ];
  return { kpis, sheets };
};

/**
 * @route GET /api/v1/reports/export/:format?type=summary|placements|students|companies|drives|trainings&<filters>
 * format: csv | excel (real .xlsx) | pdf (real PDF).
 */
const exportReport = async (req, res, next) => {
  try {
    const { format } = req.params;
    if (!['csv', 'excel', 'pdf'].includes(format)) return sendError(res, 'Format must be csv, excel or pdf.', null, 400);

    const type = req.query.type || 'summary';
    const filters = filtersOf(req.query);
    const label = describeFilters(filters);

    let kpis = [];
    let sheets;
    let title;
    if (type === 'summary') {
      const tables = summaryTables(await reportService.getReportDashboard(req.user, filters));
      title = 'Placement Summary Report';
      kpis = tables.kpis;
      sheets = tables.sheets;
    } else {
      const rows = await reportService.getDataset(type, req.user, filters);
      title = `${type.charAt(0).toUpperCase()}${type.slice(1)} Report`;
      sheets = [{ name: type, rows }];
    }

    const base = `TPO_${type}_report_${stamp()}`;
    if (format === 'csv') return download(res, `${base}.csv`, 'text/csv; charset=utf-8', exportService.convertToCSV(sheets[0].rows));
    if (format === 'excel') {
      const buffer = await exportService.buildWorkbook(sheets, { title, filtersText: label });
      return download(res, `${base}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', Buffer.from(buffer));
    }
    const pdf = await exportService.buildPdf({
      title,
      subtitle: `${label}  |  Generated ${new Date().toLocaleString('en-IN')}`,
      kpis,
      sections: sheets.map((s) => ({ heading: s.name, rows: s.rows })),
    });
    return download(res, `${base}.pdf`, 'application/pdf', pdf);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getReportRows, exportReport };
