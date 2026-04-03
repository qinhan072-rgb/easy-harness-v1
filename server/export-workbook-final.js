import * as XLSX from 'xlsx';

const SHEET_NAME = 'Manufacturing Handoff \u5236\u9020\u4ea4\u63a5\u5355';

const sourceLabels = {
  ai: 'AI Agent / AI \u667a\u80fd\u5165\u53e3',
  canvas: 'Configurator Canvas / \u914d\u7f6e\u753b\u5e03',
  upload: 'Upload Intake / \u4e0a\u4f20\u8d44\u6599',
};

const border = {
  top: { style: 'thin', color: { rgb: 'D0D5DD' } },
  bottom: { style: 'thin', color: { rgb: 'D0D5DD' } },
  left: { style: 'thin', color: { rgb: 'D0D5DD' } },
  right: { style: 'thin', color: { rgb: 'D0D5DD' } },
};

const titleStyle = {
  font: { bold: true, sz: 17, color: { rgb: '0F172A' } },
  alignment: { horizontal: 'left', vertical: 'center' },
  fill: { fgColor: { rgb: 'EAF2FF' } },
  border,
};

const sectionStyle = {
  font: { bold: true, sz: 12, color: { rgb: '0F172A' } },
  alignment: { horizontal: 'left', vertical: 'center' },
  fill: { fgColor: { rgb: 'DDE7F7' } },
  border,
};

const labelStyle = {
  font: { bold: true, color: { rgb: '344054' } },
  alignment: { vertical: 'top', wrapText: true },
  fill: { fgColor: { rgb: 'F8FAFC' } },
  border,
};

const valueStyle = {
  alignment: { vertical: 'top', wrapText: true },
  border,
};

const tableHeaderStyle = {
  font: { bold: true, color: { rgb: '344054' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  fill: { fgColor: { rgb: 'F2F4F7' } },
  border,
};

const editableLabelStyle = {
  ...labelStyle,
  fill: { fgColor: { rgb: 'FFF6E5' } },
};

const editableValueStyle = {
  ...valueStyle,
  fill: { fgColor: { rgb: 'FFFDF5' } },
};

function text(value, fallback = '') {
  if (value === null || value === undefined) {
    return fallback;
  }

  const normalized = String(value).trim();
  return normalized || fallback;
}

function joinList(items, fallback) {
  return items.length > 0 ? items.join('\n') : fallback;
}

function pushRow(rows, values = []) {
  const padded = [...values];

  while (padded.length < 6) {
    padded.push('');
  }

  rows.push(padded);
  return rows.length;
}

function addMergedValueRow(rows, merges, label, value) {
  const rowIndex = pushRow(rows, [label, value]);
  merges.push({
    s: { r: rowIndex - 1, c: 1 },
    e: { r: rowIndex - 1, c: 5 },
  });
  return rowIndex;
}

function addSectionHeader(rows, merges, title) {
  const rowIndex = pushRow(rows, [title]);
  merges.push({
    s: { r: rowIndex - 1, c: 0 },
    e: { r: rowIndex - 1, c: 5 },
  });
  return rowIndex;
}

function addListTable(rows, merges, title, items, emptyText) {
  const sectionRow = addSectionHeader(rows, merges, title);
  const headerRow = pushRow(rows, ['No. / \u5e8f\u53f7', 'Description / \u8bf4\u660e']);
  merges.push({
    s: { r: headerRow - 1, c: 1 },
    e: { r: headerRow - 1, c: 5 },
  });

  const content = items.length > 0 ? items : [emptyText];
  const itemRows = content.map((item, index) => {
    const rowIndex = pushRow(rows, [index + 1, item]);
    merges.push({
      s: { r: rowIndex - 1, c: 1 },
      e: { r: rowIndex - 1, c: 5 },
    });
    return rowIndex;
  });

  pushRow(rows, []);
  return { sectionRow, headerRow, itemRows };
}

function applyRowStyle(sheet, rowIndex, style, fromColumn = 0, toColumn = 5) {
  for (let columnIndex = fromColumn; columnIndex <= toColumn; columnIndex += 1) {
    const address = XLSX.utils.encode_cell({ r: rowIndex - 1, c: columnIndex });
    if (sheet[address]) {
      sheet[address].s = style;
    }
  }
}

function applyCellStyle(sheet, rowIndex, columnIndex, style) {
  const address = XLSX.utils.encode_cell({ r: rowIndex - 1, c: columnIndex });
  if (sheet[address]) {
    sheet[address].s = style;
  }
}

function buildCanvasSummary(request) {
  if (!request.canvasSnapshot) {
    return 'No canvas snapshot / \u65e0\u753b\u5e03\u5feb\u7167';
  }

  return [
    `Connectors ${request.canvasSnapshot.connectors.length}`,
    `Elements ${request.canvasSnapshot.midElements.length}`,
    `Wires ${request.canvasSnapshot.wires.length}`,
  ].join(' | ');
}

export function buildRequestWorkbook(request) {
  const rows = [];
  const merges = [];
  const sectionRows = [];
  const longValueRows = [];
  const tableHeaderRows = [];
  const editableRows = [];

  const titleRow = pushRow(rows, ['Manufacturing Handoff \u5236\u9020\u4ea4\u63a5\u5355']);
  merges.push({ s: { r: titleRow - 1, c: 0 }, e: { r: titleRow - 1, c: 5 } });

  const generatedRow = pushRow(rows, [
    'Prepared At / \u6574\u7406\u65f6\u95f4',
    new Date().toLocaleString(),
    'Current Status / \u5f53\u524d\u72b6\u6001',
    text(request.status, 'new'),
    'Reference Files / \u9644\u4ef6\u6570\u91cf',
    String(request.attachments.length),
  ]);

  pushRow(rows, []);

  sectionRows.push(addSectionHeader(rows, merges, '1. Request Info / \u8bf7\u6c42\u4fe1\u606f'));
  pushRow(rows, [
    'Request ID / \u8bf7\u6c42\u7f16\u53f7',
    request.id,
    'Intake Source / \u6765\u6e90',
    sourceLabels[request.source] ?? request.source,
    'Project Name / \u9879\u76ee\u540d\u79f0',
    request.projectName,
  ]);
  pushRow(rows, [
    'Quantity / \u6570\u91cf',
    String(request.quantity),
    'Requested Lead Time / \u9700\u6c42\u4ea4\u671f',
    text(request.leadTimePreference, 'Not specified / \u672a\u8bf4\u660e'),
    'Created At / \u521b\u5efa\u65f6\u95f4',
    text(request.createdAt),
  ]);
  pushRow(rows, [
    'Last Updated / \u6700\u8fd1\u66f4\u65b0',
    text(request.updatedAt),
    'Draft Status / \u8349\u7a3f\u72b6\u6001',
    text(request.status),
    'Attachment List / \u9644\u4ef6\u6e05\u5355',
    joinList(
      request.attachments.map((attachment) => attachment.originalName),
      'No attachments / \u65e0\u9644\u4ef6',
    ),
  ]);
  longValueRows.push(generatedRow);

  pushRow(rows, []);

  sectionRows.push(addSectionHeader(rows, merges, '2. User Intent / \u7528\u6237\u539f\u59cb\u9700\u6c42'));
  longValueRows.push(
    addMergedValueRow(
      rows,
      merges,
      'User Request / \u7528\u6237\u9700\u6c42',
      text(request.requestSummary, 'No summary / \u65e0\u6458\u8981'),
    ),
  );
  longValueRows.push(
    addMergedValueRow(
      rows,
      merges,
      'Intended Use / \u7528\u9014',
      text(request.intendedUse, 'Not specified / \u672a\u8bf4\u660e'),
    ),
  );
  longValueRows.push(
    addMergedValueRow(
      rows,
      merges,
      'Environment Notes / \u73af\u5883\u8bf4\u660e',
      text(request.environmentNotes, 'Not specified / \u672a\u8bf4\u660e'),
    ),
  );

  pushRow(rows, []);

  sectionRows.push(addSectionHeader(rows, merges, '3. Structured Summary / \u7ed3\u6784\u5316\u6458\u8981'));
  longValueRows.push(
    addMergedValueRow(
      rows,
      merges,
      'Structured Summary / \u7ed3\u6784\u5316\u6458\u8981',
      text(request.draftSummary || request.requestSummary, 'To be prepared / \u5f85\u6574\u7406'),
    ),
  );
  longValueRows.push(
    addMergedValueRow(
      rows,
      merges,
      'Canvas Snapshot / \u753b\u5e03\u6982\u89c8',
      buildCanvasSummary(request),
    ),
  );

  pushRow(rows, []);

  {
    const table = addListTable(
      rows,
      merges,
      '4. Connectors / \u8fde\u63a5\u5668',
      request.knownConnectors,
      'No connector entries / \u65e0\u8fde\u63a5\u5668\u6761\u76ee',
    );
    sectionRows.push(table.sectionRow);
    tableHeaderRows.push(table.headerRow);
  }

  {
    const table = addListTable(
      rows,
      merges,
      '5. Elements / \u5143\u4ef6',
      request.knownElements,
      'No element entries / \u65e0\u5143\u4ef6\u6761\u76ee',
    );
    sectionRows.push(table.sectionRow);
    tableHeaderRows.push(table.headerRow);
  }

  {
    const table = addListTable(
      rows,
      merges,
      '6. Wires / \u7ebf\u7f06',
      request.knownWires,
      'No wire entries / \u65e0\u7ebf\u7f06\u6761\u76ee',
    );
    sectionRows.push(table.sectionRow);
    tableHeaderRows.push(table.headerRow);
  }

  {
    const table = addListTable(
      rows,
      merges,
      '7. Assumptions / \u5f53\u524d\u5047\u8bbe',
      request.assumptions,
      'No assumptions listed / \u65e0\u5047\u8bbe\u9879',
    );
    sectionRows.push(table.sectionRow);
    tableHeaderRows.push(table.headerRow);
  }

  {
    const table = addListTable(
      rows,
      merges,
      '8. Missing Items / \u5f85\u786e\u8ba4\u9879',
      request.missingInfo,
      'No open items listed / \u65e0\u5f85\u786e\u8ba4\u9879',
    );
    sectionRows.push(table.sectionRow);
    tableHeaderRows.push(table.headerRow);
  }

  sectionRows.push(addSectionHeader(rows, merges, '9. Internal Editable Area / \u4eba\u5de5\u8865\u5145\u533a'));
  editableRows.push(
    addMergedValueRow(
      rows,
      merges,
      'Manufacturable Notes / \u53ef\u5236\u9020\u8bf4\u660e',
      text(request.manufacturableNotes, ''),
    ),
  );
  editableRows.push(
    addMergedValueRow(rows, merges, 'Engineering Follow-up / \u5de5\u7a0b\u8865\u5145', ''),
  );
  editableRows.push(
    addMergedValueRow(rows, merges, 'Sourcing Follow-up / \u91c7\u8d2d\u8865\u5145', ''),
  );
  editableRows.push(
    addMergedValueRow(rows, merges, 'Production Follow-up / \u751f\u4ea7\u8865\u5145', ''),
  );

  pushRow(rows, []);

  sectionRows.push(addSectionHeader(rows, merges, '10. Quote & Lead Time / \u62a5\u4ef7\u4e0e\u4ea4\u671f'));
  longValueRows.push(
    addMergedValueRow(
      rows,
      merges,
      'Quote Placeholder / \u62a5\u4ef7\u5360\u4f4d',
      text(request.quotePlaceholder, 'Pending / \u5f85\u8865\u5145'),
    ),
  );
  longValueRows.push(
    addMergedValueRow(
      rows,
      merges,
      'Lead Time Note / \u4ea4\u671f\u8bf4\u660e',
      text(request.leadTimeNote, 'Pending / \u5f85\u8865\u5145'),
    ),
  );

  pushRow(rows, []);

  sectionRows.push(addSectionHeader(rows, merges, '11. Operator Notes / \u5904\u7406\u5907\u6ce8'));
  editableRows.push(
    addMergedValueRow(
      rows,
      merges,
      'Operator Notes / \u5904\u7406\u5907\u6ce8',
      text(request.internalNotes, ''),
    ),
  );

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [
    { wch: 26 },
    { wch: 38 },
    { wch: 20 },
    { wch: 24 },
    { wch: 20 },
    { wch: 30 },
  ];
  sheet['!rows'] = rows.map((row, index) => {
    if (index === 0) {
      return { hpt: 34 };
    }

    if (row.every((cell) => cell === '')) {
      return { hpt: 10 };
    }

    if (row[0] && row.slice(1).every((cell) => cell === '')) {
      return { hpt: 24 };
    }

    if (editableRows.includes(index + 1)) {
      return { hpt: 56 };
    }

    if (longValueRows.includes(index + 1)) {
      return { hpt: 42 };
    }

    return { hpt: 22 };
  });
  sheet['!merges'] = merges;
  sheet['!freeze'] = {
    xSplit: 0,
    ySplit: 3,
    topLeftCell: 'A4',
    activePane: 'bottomLeft',
    state: 'frozen',
  };

  applyRowStyle(sheet, titleRow, titleStyle);
  applyRowStyle(sheet, generatedRow, valueStyle);
  applyCellStyle(sheet, generatedRow, 0, labelStyle);
  applyCellStyle(sheet, generatedRow, 2, labelStyle);
  applyCellStyle(sheet, generatedRow, 4, labelStyle);

  for (const rowIndex of sectionRows) {
    applyRowStyle(sheet, rowIndex, sectionStyle);
  }

  for (let rowIndex = 1; rowIndex <= rows.length; rowIndex += 1) {
    const row = rows[rowIndex - 1];

    if (row.every((cell) => cell === '')) {
      continue;
    }

    if (
      sectionRows.includes(rowIndex) ||
      tableHeaderRows.includes(rowIndex) ||
      rowIndex === titleRow
    ) {
      continue;
    }

    if (row[0] && row[2] && row[4]) {
      applyCellStyle(sheet, rowIndex, 0, labelStyle);
      applyCellStyle(sheet, rowIndex, 1, valueStyle);
      applyCellStyle(sheet, rowIndex, 2, labelStyle);
      applyCellStyle(sheet, rowIndex, 3, valueStyle);
      applyCellStyle(sheet, rowIndex, 4, labelStyle);
      applyCellStyle(sheet, rowIndex, 5, valueStyle);
    }
  }

  for (const rowIndex of longValueRows) {
    applyCellStyle(sheet, rowIndex, 0, labelStyle);
    applyRowStyle(sheet, rowIndex, valueStyle, 1, 5);
  }

  for (const rowIndex of tableHeaderRows) {
    applyRowStyle(sheet, rowIndex, tableHeaderStyle);
  }

  for (const rowIndex of editableRows) {
    applyCellStyle(sheet, rowIndex, 0, editableLabelStyle);
    applyRowStyle(sheet, rowIndex, editableValueStyle, 1, 5);
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, SHEET_NAME);
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer', cellStyles: true });
}
