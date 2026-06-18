@AGENTS.md

# Document Management App

A centralised document management system built with Next.js (App Router), React, and Node.js. The app lets organisations store, organise, search, and collaborate on documents securely, with access available remotely from any device.

## Purpose

Replace scattered file storage (email attachments, local drives, ad-hoc cloud folders) with a single system that enforces access control, keeps a full audit trail, and enables teams to work on documents together in real time.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Language | TypeScript |
| Backend | Node.js via Next.js Route Handlers (`app/api/`) |
| Auth | To be decided — ask before adding a library |
| Database | To be decided — ask before adding a library |
| File storage | To be decided — ask before adding a library |

## Key Features

### Smart Search with OCR
- Full-text search across document contents, not just filenames
- OCR extracts text from scanned PDFs and images so they are searchable
- Filters by date, owner, type, tag, and folder

### Strict Access Control
- Role-based permissions: Admin, Editor, Viewer, Guest
- Per-document and per-folder permission overrides
- All access events are logged to an immutable audit trail
- Documents can be shared via expiring, token-protected links

### Workflow Automation
- Configurable approval workflows (e.g. draft → review → approved)
- Automated notifications when a document changes state
- Rules engine for auto-tagging, auto-routing, and retention policies

### Real-Time Collaboration with Version Control
- Multiple users can view and comment on a document simultaneously
- Every save creates a numbered version; any version can be restored
- Diff view between versions
- Conflict detection when two users edit the same document

## Project Structure

```
app/                   Pages and API routes (all new pages go here)
app/api/               Backend route handlers
app/dashboard/         Main authenticated area
app/documents/         Document browsing, viewing, and editing
app/search/            Search interface
app/settings/          User and workspace settings
app/auth/              Login, registration, password reset
public/                Static assets
```

## Data Model (high-level)

- **User** — profile, role, team memberships
- **Document** — metadata, current version pointer, permissions
- **Version** — file content, author, timestamp, change summary
- **Folder** — hierarchical container, inherits and overrides permissions
- **AuditLog** — immutable record of every action (view, edit, share, delete)
- **Workflow** — state machine definition attached to a document or folder

## Running the App

```bash
npm run dev
```

The app runs at http://localhost:3000.

## Rules

1. **Do not add any new libraries without asking first.** This includes npm packages, UI component kits, ORMs, auth libraries, and file-handling utilities. Propose the library, explain why it is needed, and wait for approval before installing.

2. **Use the `app/` folder for all new pages.** Follow Next.js App Router conventions: each route is a folder with a `page.tsx` inside it. Do not create pages outside `app/`.

3. **Never commit secrets or credentials.** Environment variables go in `.env.local` (already gitignored). Reference them via `process.env` and document required variables in `.env.example`.

4. **Access control is non-negotiable.** Every API route must verify the caller's session and permissions before returning data or mutating state. There are no public data endpoints.

5. **Preserve the audit trail.** Documents and versions are never hard-deleted by default — use soft deletes with a `deletedAt` timestamp. Audit log rows are append-only.

## Context — Feature Backlog

All planned features are implemented. See "Already implemented" below.

Already implemented:
- **Dark mode** — sun/moon toggle in the editor header and mobile header bar; theme persisted via cookie so the server renders `<html class="dark">` from the first byte with no flash; `@variant dark` in Tailwind v4 wires all `dark:` utilities to the `.dark` class (Task 13) ✓
- **Markdown support** — body field renders headings, bold, italic, bullet lists in preview mode; Edit/Preview toggle in the editor header; `react-markdown@10` (Task 10) ✓
- **Responsive layout** — collapsible sidebar overlay on mobile/tablet (< md); hamburger toggle in a fixed header bar; side-by-side panes on desktop (Task 12) ✓
- **Sidebar sorted by recently updated** — `updatedAt: number` on `Doc`; stamped on new doc + every title/body edit; sidebar sorted descending before filtering (Task 3) ✓
- **Empty states** — "No Documents Yet" with New Document CTA; "No Documents Match Your Search" with Clear Search CTA in the sidebar (Task 9) ✓
- **Home page at `/`** — short description and a link to the workspace (Task 1) ✓
- **Delete control** — per-document delete button in the sidebar; asks for confirmation before removing (Task 8) ✓
- **Workspace at `/docs`** — two-pane layout at `/docs`; home page at `/` (Task 2) ✓
- **Per-document route `/docs/[id]`** — each document gets its own URL; title + body editor lives at that route; changes autosave (Tasks 5, 6-partial) ✓
- **Direct navigation to `/docs/[id]`** — loading the URL directly opens the correct document from localStorage (Task 6-partial) ✓
- **Document not found page** — navigating to a non-existent document ID shows a clear message and a link back to `/docs` (Task 7) ✓
- **New document button** — creates a blank doc and opens it immediately (Task 4) ✓
- **Persistence across reload** — documents survive a full page reload via localStorage (Task 6-partial) ✓
- **Enter key jumps to body** — pressing Enter in the title field moves the cursor to the body; no mouse needed (Task 11) ✓
- **Title search** — sidebar filters documents by title as the user types (Task 3-partial) ✓

## Next To Do

All backlog items are complete.
