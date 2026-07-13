@AGENTS.md

# Notes Workspace App

A single-workspace notes app built with Next.js (App Router), React, and Supabase. Users sign in with email and password; each user sees only their own notes. The app is deployed on Vercel at https://document-management-4hu81hju9-bready.vercel.app/ and runs locally via `npm run dev`.

## Purpose

Give individual users a private, persistent space to create, edit, and delete notes. Notes are stored in Supabase (not localStorage) and are scoped to the signed-in user so no account can access another's data.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Language | TypeScript |
| Backend | Node.js via Next.js Route Handlers (`app/api/`) |
| Auth | Supabase Auth via `@supabase/ssr` |
| Database | Supabase (PostgreSQL) |
| File storage | To be decided — ask before adding a library |

## Project Structure

```
app/                   Pages and API routes (all new pages go here)
app/api/               Backend route handlers
app/auth/              Sign-in page (and optional sign-up page)
app/docs/              Notes workspace (protected — requires sign-in)
app/docs/[id]/         Per-note editor route
public/                Static assets
```

## Data Model (high-level)

- **User** — managed by Supabase Auth; identified by `auth.uid()`
- **Note** — `id`, `user_id` (FK → auth.users), `title`, `body`, `created_at`, `updated_at`

## Running the App

```bash
npm run dev
```

The app runs locally at http://localhost:3000 and is deployed on Vercel at https://document-management-4hu81hju9-bready.vercel.app/.

## Rules

1. **Do not add any new libraries without asking first.** This includes npm packages, UI component kits, ORMs, auth libraries, and file-handling utilities. Propose the library, explain why it is needed, and wait for approval before installing.

2. **Use the `app/` folder for all new pages.** Follow Next.js App Router conventions: each route is a folder with a `page.tsx` inside it. Do not create pages outside `app/`.

3. **Never commit secrets or credentials.** Environment variables go in `.env.local` (already gitignored). Reference them via `process.env` and document required variables in `.env.example`.

4. **Use `@supabase/ssr` for all Supabase auth integration.** Do not use `@supabase/auth-helpers-nextjs` or any other auth helper package.

5. **Always use `getUser()` in server code — never `getSession()`.** `getSession()` reads from the cookie without re-validating the JWT with Supabase's server; `getUser()` makes a network call that guarantees the token is still valid. Any diff that introduces `getSession()` in a server file must be flagged before merging.

6. **All workspace routes (`/docs` and below) must redirect unauthenticated visitors to `/auth/sign-in`.** Implement this check server-side. Do not rely on client-side guards alone.

7. **No note data may live in `localStorage` or `sessionStorage` — ever.** All persistence goes through Supabase. This replaces the previous localStorage approach.

8. **No custom password handling.** Let Supabase Auth own the full credential lifecycle. Do not hash, store, or transmit passwords yourself.

9. **Never expose the Supabase service-role key to the client.** It must only appear in server-side env vars (prefixed without `NEXT_PUBLIC_`). Only the anon key goes in `NEXT_PUBLIC_` variables.

10. **Test accounts are created by hand in the Supabase dashboard's Authentication tab.** A self-service sign-up page is an optional task, not a core requirement.

11. **MCP vs. Skills usage:** Use the CLI for one-off tasks. Use MCP when the agent needs to repeat or
react to what's on screen.

## Context — Feature Backlog

### Already implemented (localStorage era — to be migrated/superseded by Supabase tasks below)

- **Dark mode** — sun/moon toggle in the editor header and mobile header bar; theme persisted via cookie so the server renders `<html class="dark">` from the first byte with no flash; `@variant dark` in Tailwind v4 wires all `dark:` utilities to the `.dark` class ✓
- **Markdown support** — body field renders headings, bold, italic, bullet lists in preview mode; Edit/Preview toggle in the editor header; `react-markdown@10` ✓
- **Responsive layout** — collapsible sidebar overlay on mobile/tablet (< md); hamburger toggle in a fixed header bar; side-by-side panes on desktop ✓
- **Sidebar sorted by recently updated** — `updatedAt` stamped on new doc + every title/body edit; sidebar sorted descending before filtering ✓
- **Empty states** — "No Documents Yet" with New Document CTA; "No Documents Match Your Search" with Clear Search CTA in the sidebar ✓
- **Home page at `/`** — short description and a link to the workspace ✓
- **Delete control** — per-document delete button in the sidebar; asks for confirmation before removing ✓
- **Workspace at `/docs`** — two-pane layout; home page at `/` ✓
- **Per-document route `/docs/[id]`** — each document gets its own URL; title + body editor lives at that route; changes autosave ✓
- **Direct navigation to `/docs/[id]`** — loading the URL directly opens the correct document ✓
- **Document not found page** — navigating to a non-existent document ID shows a clear message and a link back to `/docs` ✓
- **New document button** — creates a blank doc and opens it immediately ✓
- **Enter key jumps to body** — pressing Enter in the title field moves the cursor to the body ✓
- **Title search** — sidebar filters documents by title as the user types ✓

### Supabase auth + persistence sprint — complete

- **Email/password auth via Supabase** — sign-in page at `/auth/sign-in`; sign-out button or link accessible once signed in; accounts created manually in the Supabase dashboard's Authentication tab; no self-service sign-up required for core ✓

- **Protected routes** — any route under `/docs` redirects unauthenticated visitors to `/auth/sign-in`; check implemented server-side with `getClaims()` (equivalent to `getUser()` — validates the JWT server-side rather than trusting the cookie) ✓

- **Notes persisted in Supabase, scoped to the signed-in user** — chosen approach recorded in `REFLECTION.md` (direct queries via `@supabase/ssr` + RLS, not a proxy API layer); each note row carries a `user_id` tied to `auth.uid()`; RLS enforces per-user isolation; localStorage/sessionStorage removed ✓

- **Full CRUD persists across reloads** — create, edit, and delete all round-trip through Supabase ✓

- **Local verification checklist** — confirmed by user ✓
  - Create a test account, sign in, and land on the workspace ✓
  - Create a note, reload the page — the note is still there ✓
  - Sign out — the workspace is inaccessible; navigating to it directly redirects to sign-in ✓
  - Create a second test account, sign in as that account, confirm it sees none of the first account's notes ✓ (user-confirmed: "users see only their notes")

### Optional tasks

- **Export to Markdown** — button (download icon) on each note's title row downloads the note content as a `.md` file; matches design-brief icon styling; no new dependency (`Blob` + `URL.createObjectURL`) ✓

- **Self-service sign-up** — a `/auth/sign-up` page so users can register without needing a manual account in the Supabase dashboard; uses Supabase's default `signUp()` flow; cross-linked with `/auth/sign-in` ✓
