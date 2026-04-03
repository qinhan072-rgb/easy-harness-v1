# Easy Harness

Minimal AI-first harness intake prototype with a local API, persistent request storage, and a lightweight internal inbox.

## Local Run

1. Install dependencies:

```powershell
npm install
```

2. Start the API in one terminal:

```powershell
npm run server
```

The API listens on `http://127.0.0.1:8787`.

3. Start the Vite app in a second terminal:

```powershell
npm run dev
```

4. Open the local app URL shown by Vite, usually:

```text
http://127.0.0.1:5173/
```

## What This Phase Includes

- Real request creation from:
  - AI Agent
  - Configurator Canvas
  - Upload / Assisted Intake
- One unified internal request object for all intake paths
- Persistent local request storage
- Local file upload storage for attachment metadata and downloads
- Internal inbox list and request detail pages
- Real request-backed processing and order draft pages

## Storage

- Requests are persisted in `storage/requests.json`
- Uploaded files are stored in `storage/uploads`

## Build

```powershell
npm run build
```

## Notes

- This phase keeps the backend intentionally minimal.
- AI behavior is still placeholder and human-assisted.
- The canvas remains a bounded structured path, not a complete harness system.
