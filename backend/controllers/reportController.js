const reportService = require('../services/reportService');
const exportService = require('../services/exportService');
const { sendSuccess } = require('../utils/responseHandler');

/**
 * @desc    Get Filtered Student Report JSON
 * @route   GET /api/v1/reports/students
 * @access  Private (Admin, TPO, Faculty)
 */
const getStudentsReport = async (req, res, next) => {
  try {
    const report = await reportService.getStudentReport(req.query);
    return sendSuccess(res, 'Student report generated successfully', { count: report.length, report }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Filtered Company Report JSON
 * @route   GET /api/v1/reports/companies
 * @access  Private (Admin, TPO, Faculty)
 */
const getCompaniesReport = async (req, res, next) => {
  try {
    const report = await reportService.getCompanyReport(req.query);
    return sendSuccess(res, 'Company report generated successfully', { count: report.length, report }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Filtered Placement Analytics Report JSON
 * @route   GET /api/v1/reports/placements
 * @access  Private (Admin, TPO, Faculty)
 */
const getPlacementsReport = async (req, res, next) => {
  try {
    const report = await reportService.getPlacementReport(req.query);
    return sendSuccess(res, 'Placement report generated successfully', { count: report.length, report }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Filtered Training Progress Report JSON
 * @route   GET /api/v1/reports/trainings
 * @access  Private (Admin, TPO, Faculty)
 */
const getTrainingsReport = async (req, res, next) => {
  try {
    const report = await reportService.getTrainingReport(req.query);
    return sendSuccess(res, 'Training report generated successfully', { count: report.length, report }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Filtered Placement Drives Report JSON
 * @route   GET /api/v1/reports/drives
 * @access  Private (Admin, TPO, Faculty, Recruiter)
 */
const getDrivesReport = async (req, res, next) => {
  try {
    const report = await reportService.getDriveReport(req.query);
    return sendSuccess(res, 'Drive report generated successfully', { count: report.length, report }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export Report Dataset as CSV Download
 * @route   GET /api/v1/reports/export/csv
 * @access  Private (Authenticated)
 */
const exportCSV = async (req, res, next) => {
  try {
    const type = req.query.type || 'placements';
    let data = [];

    if (type === 'students') data = await reportService.getStudentReport(req.query);
    else if (type === 'companies') data = await reportService.getCompanyReport(req.query);
    else if (type === 'trainings') data = await reportService.getTrainingReport(req.query);
    else if (type === 'drives') data = await reportService.getDriveReport(req.query);
    else data = await reportService.getPlacementReport(req.query);

    const csvContent = exportService.convertToCSV(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=TPO_Report_${type}_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export Report Dataset as Excel CSV (.xlsx compatible) Download
 * @route   GET /api/v1/reports/export/excel
 * @access  Private (Authenticated)
 */
const exportExcel = async (req, res, next) => {
  try {
    const type = req.query.type || 'placements';
    let data = [];

    if (type === 'students') data = await reportService.getStudentReport(req.query);
    else if (type === 'companies') data = await reportService.getCompanyReport(req.query);
    else if (type === 'trainings') data = await reportService.getTrainingReport(req.query);
    else if (type === 'drives') data = await reportService.getDriveReport(req.query);
    else data = await reportService.getPlacementReport(req.query);

    const excelCSV = exportService.convertToExcelCSV(data);

    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=TPO_Report_${type}_${Date.now()}.csv`);
    return res.status(200).send(excelCSV);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export Report Dataset as Printable PDF Payload
 * @route   GET /api/v1/reports/export/pdf
 * @access  Private (Authenticated)
 */
const exportPDF = async (req, res, next) => {
  try {
    const type = req.query.type || 'placements';
    let data = [];

    if (type === 'students') data = await reportService.getStudentReport(req.query);
    else if (type === 'companies') data = await reportService.getCompanyReport(req.query);
    else if (type === 'trainings') data = await reportService.getTrainingReport(req.query);
    else if (type === 'drives') data = await reportService.getDriveReport(req.query);
    else data = await reportService.getPlacementReport(req.query);

    const pdfPayload = exportService.formatPDFPayload(`TPO Official Report - ${type.toUpperCase()}`, data);

    return sendSuccess(res, 'PDF report payload generated successfully', { pdfPayload }, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudentsReport,
  getCompaniesReport,
  getPlacementsReport,
  getTrainingsReport,
  getDrivesReport,
  exportCSV,
  exportExcel,
  exportPDF,
};
