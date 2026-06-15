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

Tasks ranked easiest → hardest. Status noted where work is complete or partial.

| # | Feature | Status |
|---|---|---|
| 1 | **Empty states** — readable messages when no documents exist and when search returns no results (Task 9) | Not started |
| 2 | **Home page at `/`** — short description and a link to the workspace (Task 1) | Not started |
| 3 | **Delete control** — per-document delete button in the sidebar; asks for confirmation before removing (Task 8) | Not started |
| 4 | **Workspace at `/docs`** — move the two-pane layout to `/docs`; current `app/page.tsx` becomes the home page (Task 2) | Not started |
| 5 | **Sidebar sorted by recently updated** — add an `updatedAt` timestamp to the `Doc` type, set it on every change, sort sidebar list by it (Task 3) | Not started |
| 6 | **Per-document route `/docs/[id]`** — each document gets its own URL; title + body editor lives at that route; changes autosave (Tasks 5, 6-partial) | Not started |
| 7 | **Direct navigation to `/docs/[id]`** — loading the URL directly opens the correct document from localStorage; depends on Task 6 above (Task 6-partial) | Not started |
| 8 | **Document not found page** — navigating to a non-existent document ID shows a clear message and a link back to `/docs` (Task 7) | Not started |
| 9 | **Responsive layout** — side-by-side at desktop width; stacked or collapsible sidebar at phone width (Task 12) | Not started |
| 10 | **Markdown support** — body field supports headings, bold, italic, bullet lists; toggle or split edit/preview mode (Task 10) | Not started |

Already implemented (not listed above):
- **New document button** — creates a blank doc and opens it immediately (Task 4) ✓
- **Persistence across reload** — documents survive a full page reload via localStorage (Task 6-partial) ✓
- **Enter key jumps to body** — pressing Enter in the title field moves the cursor to the body; no mouse needed (Task 11) ✓
- **Title search** — sidebar filters documents by title as the user types (Task 3-partial) ✓

## Next To Do

**Home page + workspace routing (Backlog items 2 & 4)**

Create `app/docs/page.tsx` and move the two-pane layout there. Convert `app/page.tsx` into a simple home page with a short description and a "Go to workspace" link pointing to `/docs`. This sets up the routing skeleton that all subsequent per-document routes (`/docs/[id]`) depend on, and it is a prerequisite for direct navigation, the not-found page, and the per-document editor.
