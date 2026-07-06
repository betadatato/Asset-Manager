# Europass CV Builder

A full-stack web app for building professional CVs in the official Europass format. Supports live preview, photo upload, color customization, and export to PDF or Word.

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- A PostgreSQL database (see **Database** below)

### Install dependencies

```bash
pnpm install
```

### Set up environment variables

Create a `.env` file in the project root (or set these in your environment):

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
SESSION_SECRET=some-long-random-string
```

### Push the database schema

```bash
pnpm --filter @workspace/db run push
```

This creates the `cvs`, `experiences`, `educations`, and `languages` tables.

### Start the app

Run both services in separate terminals:

```bash
# Terminal 1 — API server (Express, port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (React + Vite)
pnpm --filter @workspace/cv-builder run dev
```

The frontend proxies `/api` requests to the API server automatically.

---

## Using the App

### Dashboard

The home page lists all your saved CVs. From here you can:

- **Create a new CV** — click the "+ Create New CV" button (top right) or "Create your first CV" when empty.
- **Edit a CV** — click the edit icon on any CV card.
- **Delete a CV** — click the trash icon. This permanently removes the CV and all its entries.

### Editor

The editor has two panes:

- **Left — Form** with six tabs:
  | Tab | What you fill in |
  |-----|-----------------|
  | Personal | Name, contact details, date of birth, nationality, gender |
  | About Me | Professional summary |
  | Work Experience | Job title, employer, city, dates, description |
  | Education | Degree, institution, city, grade, dates |
  | Skills & Languages | Digital skills, driving licence, hobbies/interests, languages with CEFR levels |
  | Customise | Accent color, decorative graphics on/off, photo upload |

- **Right — Live preview** — updates in real time as you type. Shows the Europass two-column layout (sidebar + main content) exactly as it will appear in the export.

Changes are **auto-saved** two seconds after you stop typing. A status indicator in the header confirms when the save completes.

#### Adding entries

In the Work Experience and Education tabs, click **+ Add** to append a new entry. Each entry can be removed with the delete button next to it.

In the Languages tab, click **+ Add Language**, choose the language, and set CEFR levels (A1–C2) for Listening, Reading, Spoken Interaction, Spoken Production, and Writing.

#### Photo upload

In the **Customise** tab, click the photo area to upload an image (JPEG, PNG, WebP — max 5 MB). The photo appears in the sidebar of the preview immediately.

#### Accent color

Also in the **Customise** tab, use the color picker to change the heading/sidebar accent color. The preview updates live.

### Preview & Export

Click **Preview** (or navigate to `/cv/:id/preview`) to see the full-screen Europass document.

| Button | What it does |
|--------|-------------|
| **Download PDF** | Opens a print-ready page in a new tab and triggers the browser print dialog. Choose "Save as PDF" in your printer settings to produce a PDF file. |
| **Download Word** | Downloads a `.docx` file styled with your chosen accent color — ready for further editing in Word or LibreOffice. |

---

## Development

### Typecheck

```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/cv-builder run typecheck
```

### Regenerate API client (after changing the OpenAPI spec)

```bash
pnpm --filter @workspace/api-spec run codegen
```

This regenerates React Query hooks in `lib/api-client-react` and Zod schemas in `lib/api-zod`.

### Database migrations

After changing `lib/db/src/schema/cvs.ts`:

```bash
pnpm --filter @workspace/db run push   # applies schema to dev DB
pnpm run typecheck:libs                # rebuilds type declarations
```

---

## Project Structure

```
.
├── artifacts/
│   ├── api-server/          # Express 5 REST API
│   │   └── src/routes/      # cvs, experiences, educations, languages, photo, export
│   └── cv-builder/          # React + Vite frontend
│       └── src/
│           ├── pages/       # Dashboard, Editor, Preview
│           └── components/  # EuropassPreview, form panels, etc.
├── lib/
│   ├── api-spec/            # openapi.yaml (source of truth for the API contract)
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod schemas
│   └── db/                  # Drizzle ORM schema and client
└── uploads/
    └── photos/              # Uploaded CV photos (persisted on disk)
```

---

## Notes

- **PDF generation** uses the browser's built-in print-to-PDF — no server-side PDF library required. The export endpoint returns a fully styled HTML page that auto-triggers the print dialog.
- **Photo files** are stored in `uploads/photos/` relative to the API server's working directory and served via `express.static`. Do not move or delete files in this folder manually while the server is running.
- **Session secret** (`SESSION_SECRET`) must be set in production; it is used to sign cookies if session middleware is added later.
