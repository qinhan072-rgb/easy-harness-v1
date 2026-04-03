import type {
  CanvasRequestPayload,
  UnifiedRequest,
  UpdateRequestPayload,
} from '../types/request';

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'We could not complete the request.';

    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Ignore JSON parse failures and use the default message.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function listRequests() {
  const response = await fetch('/api/requests');
  return readJson<UnifiedRequest[]>(response);
}

export async function getRequestById(requestId: string) {
  const response = await fetch(`/api/requests/${requestId}`);
  return readJson<UnifiedRequest>(response);
}

export async function createAiRequest(formData: FormData) {
  const response = await fetch('/api/requests/ai', {
    method: 'POST',
    body: formData,
  });
  return readJson<UnifiedRequest>(response);
}

export async function createUploadRequest(formData: FormData) {
  const response = await fetch('/api/requests/upload', {
    method: 'POST',
    body: formData,
  });
  return readJson<UnifiedRequest>(response);
}

export async function createCanvasRequest(payload: CanvasRequestPayload) {
  const response = await fetch('/api/requests/canvas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return readJson<UnifiedRequest>(response);
}

export async function updateRequest(requestId: string, payload: UpdateRequestPayload) {
  const response = await fetch(`/api/requests/${requestId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return readJson<UnifiedRequest>(response);
}

export async function verifyOpsAccess(passcode: string) {
  const response = await fetch('/api/ops/access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ passcode }),
  });

  return readJson<{ ok: boolean }>(response);
}

export async function exportOpsRequestWorkbook(
  requestId: string,
  passcode: string,
  payload: UpdateRequestPayload,
) {
  const response = await fetch(`/api/ops/requests/${requestId}/export.xlsx`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ops-passcode': passcode,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = 'We could not export the handoff workbook.';

    try {
      const detail = (await response.json()) as { message?: string };
      if (detail.message) {
        message = detail.message;
      }
    } catch {
      // Ignore JSON parse failures and use the default message.
    }

    throw new Error(message);
  }

  return response.blob();
}
