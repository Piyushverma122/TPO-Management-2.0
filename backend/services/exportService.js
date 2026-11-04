const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

/** Rows (array of flat objects) -> CSV text, quoted and escaped. */
const convertToCSV = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(',')];
  rows.forEach((row) => {
    lines.push(
      headers
        .map((h) => {
          const v = row[h];
          // Cells starting with = + - @ would run as formulas when opened in Excel (CSV injection).
          const text = v === null || v === undefined ? '' : String(v);
          const safe = /^[=+\-@]/.test(text) && Number.isNaN(Number(text)) ? `'${text}` : text;
          return `"${safe.replace(/"/g, '""')}"`;
        })
        .join(',')
    );
  });
  return `\ufeff${lines.join('\r\n')}`; // BOM so Excel reads UTF-8 correctly
};

const safeCell = (v) => {
  if (typeof v !== 'string') return v;
  return /^[=+\-@]/.test(v) && Number.isNaN(Number(v)) ? `'${v}` : v;
};

/**
 * Real .xlsx workbook. `sheets` = [{ name, rows: [{col: value}] }]. Header row is styled and frozen,
 * columns are sized to their content.
 */
const buildWorkbook = async (sheets, { title, filtersText } = {}) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'TPO Management System';
  wb.created = new Date();

  sheets.forEach(({ name, rows }) => {
    const ws = wb.addWorksheet(String(name).slice(0, 31));
    let startRow = 1;
    if (title && sheets[0].name === name) {
      ws.addRow([title]).font = { bold: true, size: 14 };
      ws.addRow([filtersText || `Generated ${new Date().toLocaleString('en-IN')}`]).font = { italic: true, color: { argb: 'FF666666' } };
      ws.addRow([]);
      startRow = 4;
    }
    if (!rows.length) {
      ws.addRow(['No records for the selected filters.']);
      return;
    }
    const headers = Object.keys(rows[0]);
    const header = ws.addRow(headers);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.eachCell((c) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF292524' } };
      c.alignment = { vertical: 'middle' };
    });
    rows.forEach((r) => ws.addRow(headers.map((h) => safeCell(r[h]))));
    ws.views = [{ state: 'frozen', ySplit: startRow }];
    headers.forEach((h, i) => {
      const longest = Math.max(String(h).length, ...rows.slice(0, 200).map((r) => String(r[h] ?? '').length));
      ws.getColumn(i + 1).width = Math.min(Math.max(longest + 2, 10), 48);
    });
  });
  return wb.xlsx.writeBuffer();
};

/**
 * Real PDF. `sections` = [{ heading, rows }] where rows are flat objects shown as a table (landscape A4).
 * `kpis` = [{ label, value }] printed as a summary block under the title.
 */
const buildPdf = ({ title, subtitle, kpis = [], sections = [] }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36, info: { Title: title, Author: 'TPO Management System' } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const width = () => doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const ensureSpace = (needed) => {
      if (doc.y + needed > doc.page.height - doc.page.margins.bottom) doc.addPage();
    };

    doc.font('Helvetica-Bold').fontSize(18).fillColor('#1c1917').text(title);
    doc.font('Helvetica').fontSize(9).fillColor('#78716c').text(subtitle || `Generated ${new Date().toLocaleString('en-IN')}`);
    doc.moveDown(0.8);

    if (kpis.length) {
      const colW = width() / Math.min(kpis.length, 5);
      let rowY = doc.y;
      kpis.forEach((k, i) => {
        if (i % 5 === 0) {
          ensureSpace(46);
          rowY = doc.y;
        }
        const x = doc.page.margins.left + (i % 5) * colW;
        doc.font('Helvetica').fontSize(8).fillColor('#78716c').text(String(k.label).toUpperCase(), x, rowY, { width: colW - 8 });
        doc.font('Helvetica-Bold').fontSize(15).fillColor('#1c1917').text(String(k.value), x, rowY + 11, { width: colW - 8 });
        if (i % 5 === 4 || i === kpis.length - 1) doc.y = rowY + 40;
      });
      doc.moveDown(0.6);
    }

    sections.forEach(({ heading, rows }) => {
      ensureSpace(60);
      doc.x = doc.page.margins.left;
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1c1917').text(heading);
      doc.moveDown(0.3);
      if (!rows.length) {
        doc.font('Helvetica-Oblique').fontSize(9).fillColor('#78716c').text('No records for the selected filters.');
        doc.moveDown(0.8);
        return;
      }
      const headers = Object.keys(rows[0]);
      const colW = width() / headers.length;
      const drawRow = (cells, bold) => {
        const heights = cells.map((c) => doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8).heightOfString(String(c ?? ''), { width: colW - 6 }));
        const h = Math.max(...heights) + 6;
        ensureSpace(h);
        const y = doc.y;
        if (bold) doc.rect(doc.page.margins.left, y - 2, width(), h).fill('#e7e0d5');
        cells.forEach((c, i) => {
          doc.fillColor('#1c1917').font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8).text(String(c ?? ''), doc.page.margins.left + i * colW + 3, y + 1, { width: colW - 6 });
        });
        doc.y = y + h;
        doc.x = doc.page.margins.left;
      };
      drawRow(headers, true);
      rows.slice(0, 1500).forEach((r) => drawRow(headers.map((h) => r[h]), false));
      if (rows.length > 1500) doc.font('Helvetica-Oblique').fontSize(8).fillColor('#78716c').text(`Showing the first 1500 of ${rows.length} rows. Export Excel for the full list.`);
      doc.moveDown(0.8);
    });

    doc.end();
  });

module.exports = { convertToCSV, buildWorkbook, buildPdf };
