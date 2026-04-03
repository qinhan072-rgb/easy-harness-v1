import * as XLSX from 'xlsx';

const sourceLabels = {
  ai: 'AI Agent Intake / AI 智能入口',
  canvas: 'Configurator Canvas / 配置画布',
  upload: 'Upload / Assisted Intake / 上传辅助入口',
};

function joinList(items, fallback) {
  return items.length > 0 ? items.join('\n') : fallback;
}

function buildOverviewSheet(request) {
  const rows = [
    ['Easy Harness Internal Handoff / Easy Harness 内部交接'],
    [],
    ['Field / 字段', 'Value / 内容'],
    ['Request ID / 请求编号', request.id],
    ['Source / 来源', sourceLabels[request.source] ?? request.source],
    ['Project Name / 项目名称', request.projectName],
    ['Status / 状态', request.status],
    ['Quantity / 数量', request.quantity],
    ['Lead Time / 交期', request.leadTimePreference],
    ['Quote Placeholder / 报价占位', request.quotePlaceholder || 'Pending / 待定'],
    ['Lead Time Note / 交期备注', request.leadTimeNote || 'Not prepared / 未准备'],
    ['Attachment List / 附件清单', joinList(
      request.attachments.map((attachment) => attachment.originalName),
      'No attachments / 无附件',
    )],
  ];

  return XLSX.utils.aoa_to_sheet(rows);
}

function buildStructuredDraftSheet(request) {
  const rows = [
    ['Structured Draft / 结构化草稿'],
    [],
    ['Section / 分区', 'Content / 内容'],
    ['Structured Summary / 结构化摘要', request.draftSummary || request.requestSummary],
    ['Original Request Summary / 原始请求摘要', request.requestSummary],
    ['Intended Use / 用途', request.intendedUse || 'Not specified / 未说明'],
    ['Environment Notes / 环境说明', request.environmentNotes || 'Not specified / 未说明'],
    ['Manufacturable Notes / 可制造说明', request.manufacturableNotes || 'Not prepared / 未准备'],
    ['Internal Notes / 内部备注', request.internalNotes || 'None / 无'],
  ];

  return XLSX.utils.aoa_to_sheet(rows);
}

function buildStructuredItemsSheet(request) {
  const rows = [
    ['Connectors - Elements - Wires / 连接器 - 元件 - 线缆'],
    [],
    ['Section / 分区', 'Item / 条目'],
    ...(
      request.knownConnectors.length > 0
        ? request.knownConnectors.map((item) => ['Known Connectors / 已知连接器', item])
        : [['Known Connectors / 已知连接器', 'None / 无']]
    ),
    [],
    ...(
      request.knownElements.length > 0
        ? request.knownElements.map((item) => ['Known Elements / 已知中间元件', item])
        : [['Known Elements / 已知中间元件', 'None / 无']]
    ),
    [],
    ...(
      request.knownWires.length > 0
        ? request.knownWires.map((item) => ['Known Wires / 已知线缆', item])
        : [['Known Wires / 已知线缆', 'None / 无']]
    ),
  ];

  return XLSX.utils.aoa_to_sheet(rows);
}

function buildAssumptionsSheet(request) {
  const rows = [
    ['Assumptions - Missing Info / 假设与缺失项'],
    [],
    ['Section / 分区', 'Item / 条目'],
    ...(
      request.assumptions.length > 0
        ? request.assumptions.map((item) => ['Assumptions / 假设项', item])
        : [['Assumptions / 假设项', 'None / 无']]
    ),
    [],
    ...(
      request.missingInfo.length > 0
        ? request.missingInfo.map((item) => ['Missing Info / 缺失信息', item])
        : [['Missing Info / 缺失信息', 'None / 无']]
    ),
  ];

  return XLSX.utils.aoa_to_sheet(rows);
}

function setColumnWidths(sheet, widths) {
  sheet['!cols'] = widths.map((width) => ({ wch: width }));
}

export function buildRequestWorkbook(request) {
  const workbook = XLSX.utils.book_new();
  const overviewSheet = buildOverviewSheet(request);
  const draftSheet = buildStructuredDraftSheet(request);
  const structuredItemsSheet = buildStructuredItemsSheet(request);
  const assumptionsSheet = buildAssumptionsSheet(request);

  setColumnWidths(overviewSheet, [32, 72]);
  setColumnWidths(draftSheet, [32, 88]);
  setColumnWidths(structuredItemsSheet, [38, 88]);
  setColumnWidths(assumptionsSheet, [32, 88]);

  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview 总览');
  XLSX.utils.book_append_sheet(workbook, draftSheet, 'Structured Draft 结构化草稿');
  XLSX.utils.book_append_sheet(
    workbook,
    structuredItemsSheet,
    'CEW 连接器元件线缆',
  );
  XLSX.utils.book_append_sheet(
    workbook,
    assumptionsSheet,
    'Assumptions 缺失项',
  );

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
}
