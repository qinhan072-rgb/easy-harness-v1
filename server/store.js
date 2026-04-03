import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '..');
export const STORAGE_DIR = path.join(ROOT_DIR, 'storage');
export const UPLOADS_DIR = path.join(STORAGE_DIR, 'uploads');
export const REQUESTS_FILE = path.join(STORAGE_DIR, 'requests.json');

export async function ensureStorage() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  try {
    await fs.access(REQUESTS_FILE);
  } catch {
    await fs.writeFile(
      REQUESTS_FILE,
      JSON.stringify({ requests: [] }, null, 2),
      'utf8',
    );
  }
}

export async function readRequests() {
  await ensureStorage();
  const raw = await fs.readFile(REQUESTS_FILE, 'utf8');
  const parsed = raw.trim() ? JSON.parse(raw) : { requests: [] };
  return Array.isArray(parsed.requests) ? parsed.requests : [];
}

export async function writeRequests(requests) {
  await ensureStorage();
  await fs.writeFile(
    REQUESTS_FILE,
    JSON.stringify({ requests }, null, 2),
    'utf8',
  );
}

export async function deleteUploadedFiles(files = []) {
  await Promise.all(
    files.map((file) =>
      fs.unlink(file.path).catch(() => undefined),
    ),
  );
}
