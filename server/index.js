import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { buildRequestWorkbook } from './export-workbook-final.js';
import { deleteUploadedFiles, ensureStorage, readRequests, ROOT_DIR, UPLOADS_DIR, writeRequests } from './store.js';
import { createRequestRecord, isValidStatus, normalizeStoredRequest, REQUEST_STATUSES, updateRequestRecord } from './request-utils.js';

await ensureStorage();

const app = express();
const upload = multer({
  dest: UPLOADS_DIR,
  limits: {
    files: 8,
    fileSize: 20 * 1024 * 1024,
  },
});
const OPS_PASSCODE = (process.env.EASY_HARNESS_OPS_PASSCODE ?? 'easy-harness-ops').trim();

function hasValidOpsPasscode(value) {
  return typeof value === 'string' && value.trim() === OPS_PASSCODE;
}

function applyExportOverrides(existingRequest, payload = {}) {
  const request = normalizeStoredRequest(existingRequest);

  return normalizeStoredRequest({
    ...request,
    status: isValidStatus(payload.status) ? payload.status : request.status,
    draftSummary:
      typeof payload.draftSummary === 'string'
        ? payload.draftSummary
        : request.draftSummary,
    manufacturableNotes:
      typeof payload.manufacturableNotes === 'string'
        ? payload.manufacturableNotes
        : request.manufacturableNotes,
    quotePlaceholder:
      typeof payload.quotePlaceholder === 'string'
        ? payload.quotePlaceholder
        : request.quotePlaceholder,
    leadTimeNote:
      typeof payload.leadTimeNote === 'string'
        ? payload.leadTimeNote
        : request.leadTimeNote,
    assumptions:
      payload.assumptions !== undefined ? payload.assumptions : request.assumptions,
    missingInfo:
      payload.missingInfo !== undefined ? payload.missingInfo : request.missingInfo,
    internalNotes:
      typeof payload.internalNotes === 'string'
        ? payload.internalNotes
        : request.internalNotes,
  });
}

function sanitizeFilename(value) {
  return value.replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

app.use((request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization',
  );
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  next();
});

app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, root: ROOT_DIR });
});

app.get('/api/request-statuses', (_request, response) => {
  response.json({ statuses: REQUEST_STATUSES });
});

app.post('/api/ops/access', (request, response) => {
  if (!hasValidOpsPasscode(request.body?.passcode)) {
    response.status(403).json({ message: 'Passcode not accepted.' });
    return;
  }

  response.json({ ok: true });
});

app.get('/api/requests', async (_request, response) => {
  const requests = await readRequests();
  const sorted = [...requests].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
  response.json(sorted.map((item) => normalizeStoredRequest(item)));
});

app.get('/api/requests/:id', async (request, response) => {
  const requests = await readRequests();
  const match = requests.find((item) => item.id === request.params.id);

  if (!match) {
    response.status(404).json({ message: 'Request not found.' });
    return;
  }

  response.json(normalizeStoredRequest(match));
});

async function createRequest(response, { source, fields, files = [] }) {
  const requestSummary =
    typeof fields.requestSummary === 'string' ? fields.requestSummary.trim() : '';
  const projectName =
    typeof fields.projectName === 'string' ? fields.projectName.trim() : '';

  if (!projectName) {
    await deleteUploadedFiles(files);
    response.status(400).json({ message: 'Project name is required.' });
    return;
  }

  if (!requestSummary) {
    await deleteUploadedFiles(files);
    response.status(400).json({ message: 'Request summary is required.' });
    return;
  }

  const nextRequest = createRequestRecord({
    source,
    fields,
    files,
  });
  const requests = await readRequests();
  requests.unshift(nextRequest);
  await writeRequests(requests);
  response.status(201).json(nextRequest);
}

app.post('/api/requests/ai', upload.array('attachments', 8), async (request, response) => {
  await createRequest(response, {
    source: 'ai',
    fields: request.body,
    files: request.files ?? [],
  });
});

app.post('/api/requests/upload', upload.array('attachments', 8), async (request, response) => {
  await createRequest(response, {
    source: 'upload',
    fields: request.body,
    files: request.files ?? [],
  });
});

app.post('/api/requests/canvas', async (request, response) => {
  await createRequest(response, {
    source: 'canvas',
    fields: request.body,
  });
});

app.patch('/api/requests/:id', async (request, response) => {
  const requests = await readRequests();
  const requestIndex = requests.findIndex((item) => item.id === request.params.id);

  if (requestIndex === -1) {
    response.status(404).json({ message: 'Request not found.' });
    return;
  }

  if (
    request.body.status !== undefined &&
    !isValidStatus(request.body.status)
  ) {
    response.status(400).json({ message: 'Invalid request status.' });
    return;
  }

  const updatedRequest = updateRequestRecord(requests[requestIndex], request.body);
  requests[requestIndex] = updatedRequest;
  await writeRequests(requests);
  response.json(updatedRequest);
});

app.post('/api/ops/requests/:id/export.xlsx', async (request, response) => {
  const passcodeHeader = request.headers['x-ops-passcode'];
  const passcode = Array.isArray(passcodeHeader) ? passcodeHeader[0] : passcodeHeader;

  if (!hasValidOpsPasscode(passcode)) {
    response
      .status(403)
      .json({ message: 'Enter the ops passcode again to export the handoff sheet.' });
    return;
  }

  const requests = await readRequests();
  const match = requests.find((item) => item.id === request.params.id);

  if (!match) {
    response.status(404).json({ message: 'Request not found.' });
    return;
  }

  const exportRequest = applyExportOverrides(match, request.body);
  const workbookBuffer = buildRequestWorkbook(exportRequest);
  const safeProjectName = sanitizeFilename(exportRequest.projectName || exportRequest.id) || exportRequest.id;

  response.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  response.setHeader(
    'Content-Disposition',
    `attachment; filename="${safeProjectName}-${exportRequest.id}.xlsx"`,
  );
  response.send(workbookBuffer);
});

const port = Number(process.env.PORT ?? 8787);

app.listen(port, () => {
  console.log(`Easy Harness API listening on http://127.0.0.1:${port}`);
});
