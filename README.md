# Document Manager

A calm, single-user document workspace built with Next.js 16 (App Router), React 19, and Tailwind CSS v4. Write, search, and organise documents entirely in the browser — no account, no backend, no file uploads required.

## What it does

- **Two-pane workspace** at `/docs` — collapsible sidebar on the left, full-width editor on the right
- **Per-document URLs** — each document gets a slug derived from its title (e.g. `/docs/meeting-notes`); direct navigation and sharing work out of the box
- **Autosave** — every keystroke is persisted to `localStorage`; documents survive full page reloads
- **Title search** — sidebar filters documents in real time as you type
- **Markdown preview** — toggle between Edit and Preview mode; headings, bold, italic, and lists render correctly
- **Empty states** — clear prompts when no documents exist or no results match a search
- **Soft delete** — documents are marked deleted rather than hard-removed, preserving the audit trail
- **Dark mode** *(optional task — see below)*

## Screenshot

![Workspace](public/screenshot-workspace.png)

## Running locally

**Prerequisites:** Node.js 18 or later, npm.

```bash
# 1. Clone the repo
git clone https://github.com/Spanin196/document-management-app.git
cd document-management-app

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- Home page: `http://localhost:3000`
- Workspace: `http://localhost:3000/docs`

No environment variables are required to run the app locally.

## Optional task: Dark mode

Dark mode is implemented with a cookie-based server-side approach so the correct theme is applied on the very first byte — no flash of the wrong theme on load.

**How it works:**

1. A `theme` cookie is written to the browser when the user toggles the sun/moon button.
2. On every request, the Next.js root layout (a Server Component) reads the cookie via `cookies()` and conditionally adds the `dark` class to `<html>` before sending HTML to the client.
3. Tailwind's `dark:` utilities are wired to `.dark` via a custom `@variant` directive, so all colour switches happen through CSS rather than JavaScript after hydration.
4. A `@media (prefers-color-scheme: dark)` block in `globals.css` handles first-time visitors who have never set a preference — their OS setting is respected until they explicitly toggle.

The toggle is available in the sidebar footer (desktop) and in the fixed header bar (mobile).

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Language | TypeScript |
| Fonts | DM Serif Display, Plus Jakarta Sans (via `next/font/google`) |
| Storage | Browser `localStorage` |
| Markdown | `react-markdown` |
