# Europass CV Builder

A full-stack web app for building EU-format Europass CVs with a live split-screen preview, photo upload, color customization, and PDF/Word export.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/cv-builder run dev` — run the frontend (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Wouter (routing) + TanStack React Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Word export: `docx` npm package
- PDF export: Server renders Europass HTML; browser prints to PDF via `window.print()`
- File uploads: `multer` (photos stored in `uploads/photos/`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/cvs.ts` — DB schema: cvs, experiences, educations, languages tables
- `artifacts/api-server/src/routes/` — Express route handlers (cvs, experiences, educations, languages, photo, export)
- `artifacts/cv-builder/src/` — React frontend (pages: dashboard `/`, editor `/cv/:id/edit`, preview `/cv/:id/preview`)

## Architecture decisions

- PDF export returns HTML with `window.print()` auto-trigger — browser renders to PDF natively. No server-side PDF library needed.
- Photo files are stored on disk under `uploads/photos/` and served via `express.static` (prevents path traversal).
- All user content interpolated into export HTML is HTML-escaped via the `esc()` helper to prevent XSS.
- Auto-save in the editor debounces 2s after any field change; `PUT /api/cvs/:id` updates the full CV record including `updatedAt`.
- Europass 2-column layout: 30% sidebar (photo, contact, skills, languages) + 70% main content — reproduced both in the live preview component and the HTML export template.

## Product

- **Dashboard `/`**: lists all saved CVs with color swatches, create/edit/delete actions
- **Editor `/cv/:id/edit`**: split-screen — tabbed form on the left (Personal, About, Experience, Education, Skills & Languages, Customization), live Europass preview on the right. Auto-saves on change.
- **Preview `/cv/:id/preview`**: full-screen Europass view with "Download PDF" (opens print dialog) and "Download Word" (downloads `.docx`) buttons.

## User preferences

_Populate as you build._

## Gotchas

- After any change to `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before touching frontend code.
- After any change to `lib/db/src/schema/`, run `pnpm --filter @workspace/db run push` and then `pnpm run typecheck:libs`.
- Photo upload endpoint (`POST /api/cvs/:id/photo`) is NOT in the OpenAPI spec (multipart/form-data causes codegen issues with `File`/`Blob` in the server-side Zod lib). Call it directly with `fetch` + `FormData`.
- `express.static` is used for `/api/uploads/photos` — do not replace with custom `sendFile` on `req.path` (path traversal risk).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
