import * as XLSX from 'xlsx';

const SHEET_NAME = 'Manufacturing Handoff 制造交接单';

const sourceLabels = {
  ai: 'AI Agent / AI 智能入口',
  canvas: 'Configurator Canvas / 配置画布',
  upload: 'Upload Intake / 上传资料',
};

const border = {
  top: { style: 'thin', color: { rgb: 'D0D5DD' } },
  bottom: { style: 'thin', color: { rgb: 'D0D5DD' } },
  left: { style: 'thin', color: { rgb: 'D0D5DD' } },
  right: { style: 'thin', color: { rgb: 'D0D5DD' } },
};

const titleStyle = {
  font: { bold: true, sz: 16, color: { rgb: '0F172A' } },
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
  const headerRow = pushRow(rows, ['No. / 序号', 'Item / 内容']);
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
    return 'No canvas snapshot / 无画布快照';
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

  const titleRow = pushRow(rows, ['Manufacturing Handoff 制造交接单']);
  merges.push({ s: { r: titleRow - 1, c: 0 }, e: { r: titleRow - 1, c: 5 } });

  const generatedRow = pushRow(rows, [
    'Generated At / 生成时间',
    new Date().toLocaleString(),
    'Status / 状态',
    text(request.status, 'new'),
    'Attachment Count / 附件数量',
    String(request.attachments.length),
  ]);

  pushRow(rows, []);

  sectionRows.push(addSectionHeader(rows, merges, '1. Request Info / 请求信息'));
  pushRow(rows, [
    'Request ID / 请求编号',
    request.id,
    'Source / 来源',
    sourceLabels[request.source] ?? request.source,
    'Project Name / 项目名称',
    request.projectName,
  ]);
  pushRow(rows, [
    'Quantity / 数量',
    String(request.quantity),
    'Lead Time / 交期',
    text(request.leadTimePreference, 'Not specified / 未说明'),
    'Created At / 创建时间',
    text(request.createdAt),
  ]);
  pushRow(rows, [
    'Updated At / 更新时间',
    text(request.updatedAt),
    'Draft Status / 草稿状态',
    text(request.status),
    'Attachment List / 附件清单',
    joinList(
      request.attachments.map((attachment) => attachment.originalName),
      'No attachments / 无附件',
    ),
  ]);
  longValueRows.push(generatedRow);

  pushRow(rows, []);

  sectionRows.push(addSectionHeader(rows, merges, '2. User Intent / 用户原始需求'));
  longValueRows.push(
    addMergedValueRow(
      rows,
      merges,
      'Original Request / 原始需求',
      text(request.requestSummary, 'No summary / 无摘要'),
    ),
  );
  longValueRows.push(
    addMergedValueRow(
      rows,
      merges,
      'Intended Use / 用途',
      text(request.intendedUse, 'Not specified / 未说明'),
    ),
  );
  longValueRows.push(
    addMergedValueRow(
      rows,
      merges,
      'Environment Notes / 环境说明',
      text(request.environmentNotes, 'Not specified / 未说明'),
    ),
  );

  pushRow(rows, []);

  sectionRows.push(addSectionHeader(rows, merges, '3. Structured Summary / 结构化摘要'));
  longValueRows.push(
    addMergedValueRow(
      rows,
      merges,
      'Structured Summary / 结构化摘要',
      text(request.draftSummary || request.requestSummary, 'Pending / 待整理'),
    ),
  );
  longValueRows.push(
    addMergedValueRow(
      rows,
      merges,
      'Canvas Snapshot / 画布概览',
      buildCanvasSummary(request),
    ),
  );

  pushRow(rows, []);

  {
    const table = addListTable(
      rows,
      merges,
      '4. Connectors / 连接器',
      request.knownConnectors,
      'No connector entries / 无连接器条目',
    );
    sectionRows.push(table.sectionRow);
    tableHeaderRows.push(table.headerRow);
  }

  {
    const table = addListTable(
      rows,
      merges,
      '5. Elements / 元件',
      request.knownElements,
      'No element entries / 无元件条目',
    );
    sectionRows.push(table.sectionRow);
    tableHeaderRows.push(table.headerRow);
  }

  {
    const table = addListTable(
      rows,
      merges,
      '6. Wires / 线缆',
      request.knownWires,
      'No wire entries / 无线缆条目',
    );
    sectionRows.push(table.sectionRow);
    tableHeaderRows.push(table.headerRow);
  }

  {
    const table = addListTable(
      rows,
      merges,
      '7. Assumptions / 当前假设',
      request.assumptions,
      'No assumptions listed / 无假设项',
    );
    sectionRows.push(table.sectionRow);
    tableHeaderRows.push(table.headerRow);
  }

  {
    const table = addListTable(
      rows,
      merges,
      '8. Missing Items / 待确认项',
      request.missingInfo,
      'No open items listed / 无待确认项',
    );
    sectionRows.push(table.sectionRow);
    tableHeaderRows.push(table.headerRow);
  }

  sectionRows.push(addSectionHeader(rows, merges, '9. Internal Editable Area / 人工补充区'));
  editableRows.push(
    addMergedValueRow(
      rows,
      merges,
      'Manufacturable Notes / 可制造说明',
      text(request.manufacturableNotes, ''),
    ),
  );
  editableRows.push(
    addMergedValueRow(rows, merges, 'Manual Additions / 人工补充', ''),
  );
  editableRows.push(
    addMergedValueRow(rows, merges, 'Parts Follow-up / 物料补充', ''),
  );
  editableRows.push(
    addMergedValueRow(rows, merges, 'Routing Follow-up / 走线补充', ''),
  );

  pushRow(rows, []);

  sectionRows.push(addSectionHeader(rows, merges, '10. Quote & Lead Time / 报价与交期'));
  longValueRows.push(
    addMergedValueRow(
      rows,
      merges,
      'Quote Placeholder / 报价占位',
      text(request.quotePlaceholder, 'Pending / 待补充'),
    ),
  );
  longValueRows.push(
    addMergedValueRow(
      rows,
      merges,
      'Lead Time Note / 交期说明',
      text(request.leadTimeNote, 'Pending / 待补充'),
    ),
  );

  pushRow(rows, []);

  sectionRows.push(addSectionHeader(rows, merges, '11. Operator Notes / 处理备注'));
  editableRows.push(
    addMergedValueRow(
      rows,
      merges,
      'Operator Notes / 处理备注',
      text(request.internalNotes, ''),
    ),
  );

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [
    { wch: 24 },
    { wch: 34 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 26 },
  ];
  sheet['!rows'] = rows.map((row, index) => {
    if (index === 0) {
      return { hpt: 28 };
    }

    if (row.every((cell) => cell === '')) {
      return { hpt: 8 };
    }

    if (row[0] && row.slice(1).every((cell) => cell === '')) {
      return { hpt: 22 };
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

    if (sectionRows.includes(rowIndex) || tableHeaderRows.includes(rowIndex) || rowIndex === titleRow) {
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
