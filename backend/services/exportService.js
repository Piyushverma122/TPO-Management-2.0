/**
 * Helper to convert array of objects to standard CSV string format
 */
const convertToCSV = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  data.forEach((row) => {
    const values = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) {
        return '""';
      }
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\r\n');
};

/**
 * Format CSV with UTF-8 BOM for Microsoft Excel compatibility
 */
const convertToExcelCSV = (data) => {
  const csv = convertToCSV(data);
  return '\ufeff' + csv; // UTF-8 BOM prefix
};

/**
 * Format PDF Document payload structure
 */
const formatPDFPayload = (title, reportData) => {
  return {
    reportTitle: title,
    generatedAt: new Date().toISOString(),
    totalRecords: Array.isArray(reportData) ? reportData.length : 1,
    data: reportData,
  };
};

module.exports = {
  convertToCSV,
  convertToExcelCSV,
  formatPDFPayload,
};
