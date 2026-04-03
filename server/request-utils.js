import crypto from 'node:crypto';

export const REQUEST_STATUSES = [
  'new',
  'needs-info',
  'draft-in-progress',
  'draft-ready',
  'awaiting-confirmation',
  'order-submitted',
  'quoted',
  'closed',
];

const LEGACY_STATUS_ALIASES = {
  'awaiting-user-confirmation': 'awaiting-confirmation',
  'in-production': 'quoted',
};

const LEAD_TIME_OPTIONS = ['standard', 'expedite', 'flexible'];

function trimString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeArray(value) {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return Array.isArray(value) ? value : [];
}

function normalizeObject(value, fallback = null) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  if (value && typeof value === 'object') {
    return value;
  }

  return fallback;
}

function normalizePositiveNumber(value, fallback = 1) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeLeadTime(value) {
  return LEAD_TIME_OPTIONS.includes(value) ? value : 'standard';
}

function normalizeRequestStatus(value) {
  const candidate = LEGACY_STATUS_ALIASES[value] ?? value;
  return REQUEST_STATUSES.includes(candidate) ? candidate : 'new';
}

function normalizeStringArray(value, fallback = []) {
  const normalized = normalizeArray(value)
    .map((item) => trimString(item))
    .filter(Boolean);
  return normalized.length > 0 ? normalized : fallback;
}

function nowIso() {
  return new Date().toISOString();
}

export function generateRequestId() {
  const dateStamp = nowIso().slice(0, 10).replaceAll('-', '');
  const token = crypto.randomUUID().split('-')[0].toUpperCase();
  return `EH-${dateStamp}-${token}`;
}

export function buildAttachmentMetadata(files = []) {
  const uploadedAt = nowIso();

  return files.map((file) => ({
    id: crypto.randomUUID(),
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    url: `/uploads/${file.filename}`,
    uploadedAt,
  }));
}

function buildDefaultAssumptions(source) {
  switch (source) {
    case 'canvas':
      return [
        'Canvas requests stay inside the current structured ordering boundary.',
      ];
    case 'upload':
      return [
        'Uploaded references may still need interpretation before drafting.',
      ];
    default:
      return [
        'Plain-language intake still needs structured review before drafting.',
      ];
  }
}

function buildDefaultMissingInfo(source, fields, attachments) {
  const missingInfo = [];

  if (source !== 'canvas') {
    missingInfo.push(
      'Connectors, elements, and wire routing still need structured review.',
    );
  }

  if (attachments.length === 0 && source !== 'canvas') {
    missingInfo.push('No attachments were included with this request yet.');
  }

  if (!trimString(fields.environmentNotes)) {
    missingInfo.push('Environment or operating context is still unspecified.');
  }

  return missingInfo;
}

export function createRequestRecord({ source, fields, files = [] }) {
  const createdAt = nowIso();
  const attachments = buildAttachmentMetadata(files);
  const assumptions = normalizeStringArray(fields.assumptions);
  const missingInfo = normalizeStringArray(fields.missingInfo);
  const knownConnectors = normalizeStringArray(fields.knownConnectors);
  const knownElements = normalizeStringArray(fields.knownElements);
  const knownWires = normalizeStringArray(fields.knownWires);

  return {
    id: generateRequestId(),
    source,
    projectName: trimString(fields.projectName) || `Untitled ${source} request`,
    requestSummary: trimString(fields.requestSummary),
    draftSummary: trimString(fields.draftSummary),
    manufacturableNotes: trimString(fields.manufacturableNotes),
    quotePlaceholder: trimString(fields.quotePlaceholder),
    leadTimeNote: trimString(fields.leadTimeNote),
    quantity: normalizePositiveNumber(fields.quantity, 1),
    leadTimePreference: normalizeLeadTime(fields.leadTimePreference),
    attachments,
    canvasSnapshot:
      source === 'canvas'
        ? normalizeObject(fields.canvasSnapshot, null)
        : normalizeObject(fields.canvasSnapshot, null),
    knownConnectors,
    knownElements,
    knownWires,
    intendedUse: trimString(fields.intendedUse),
    environmentNotes: trimString(fields.environmentNotes),
    assumptions:
      assumptions.length > 0 ? assumptions : buildDefaultAssumptions(source),
    missingInfo:
      missingInfo.length > 0
        ? missingInfo
        : buildDefaultMissingInfo(source, fields, attachments),
    status: isValidStatus(fields.status)
      ? normalizeRequestStatus(fields.status)
      : 'new',
    internalNotes: '',
    createdAt,
    updatedAt: createdAt,
  };
}

export function normalizeStoredRequest(record) {
  if (!record || typeof record !== 'object') {
    return record;
  }

  return {
    ...record,
    projectName: trimString(record.projectName),
    requestSummary: trimString(record.requestSummary),
    draftSummary: trimString(record.draftSummary),
    manufacturableNotes: trimString(record.manufacturableNotes),
    quotePlaceholder: trimString(record.quotePlaceholder),
    leadTimeNote: trimString(record.leadTimeNote),
    quantity: normalizePositiveNumber(record.quantity, 1),
    leadTimePreference: normalizeLeadTime(record.leadTimePreference),
    attachments: Array.isArray(record.attachments) ? record.attachments : [],
    canvasSnapshot: normalizeObject(record.canvasSnapshot, null),
    knownConnectors: normalizeStringArray(record.knownConnectors),
    knownElements: normalizeStringArray(record.knownElements),
    knownWires: normalizeStringArray(record.knownWires),
    intendedUse: trimString(record.intendedUse),
    environmentNotes: trimString(record.environmentNotes),
    assumptions: normalizeStringArray(record.assumptions),
    missingInfo: normalizeStringArray(record.missingInfo),
    status: normalizeRequestStatus(record.status),
    internalNotes: trimString(record.internalNotes),
    createdAt: trimString(record.createdAt),
    updatedAt: trimString(record.updatedAt),
  };
}

export function isValidStatus(value) {
  return value in LEGACY_STATUS_ALIASES || REQUEST_STATUSES.includes(value);
}

export function updateRequestRecord(existingRequest, payload) {
  const request = normalizeStoredRequest(existingRequest);

  return {
    ...request,
    status: isValidStatus(payload.status)
      ? normalizeRequestStatus(payload.status)
      : request.status,
    draftSummary:
      typeof payload.draftSummary === 'string'
        ? payload.draftSummary.trim()
        : request.draftSummary,
    manufacturableNotes:
      typeof payload.manufacturableNotes === 'string'
        ? payload.manufacturableNotes.trim()
        : request.manufacturableNotes,
    quotePlaceholder:
      typeof payload.quotePlaceholder === 'string'
        ? payload.quotePlaceholder.trim()
        : request.quotePlaceholder,
    leadTimeNote:
      typeof payload.leadTimeNote === 'string'
        ? payload.leadTimeNote.trim()
        : request.leadTimeNote,
    assumptions:
      payload.assumptions !== undefined
        ? normalizeStringArray(payload.assumptions)
        : request.assumptions,
    missingInfo:
      payload.missingInfo !== undefined
        ? normalizeStringArray(payload.missingInfo)
        : request.missingInfo,
    internalNotes:
      typeof payload.internalNotes === 'string'
        ? payload.internalNotes
        : request.internalNotes,
    updatedAt: nowIso(),
  };
}
