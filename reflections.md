# Project Reflections

## 1. The Persistence Consultation
*What you asked Claude Code, what mechanism it recommended, what alternatives it surfaced, and why you went with the option you did. This is the decision you will walk your reviewer through.*

### The question
How do we make documents persist across page reloads in a local, single-user app with no backend and no user accounts?

### Alternatives surfaced

**Option 1 — `localStorage` (chosen)**
Serialize the `docs` array to JSON on every state change; read it back on first render. ~10 lines of code, synchronous, universally supported. Hard limit of ~5–10 MB and strings only — binary files would need base64 encoding.

**Option 2 — `IndexedDB`**
A real key-value database built into the browser. Async, can store binary blobs, storage limit is effectively the available disk (~50%). The right long-term foundation if the app grows to file attachments or large version histories. Requires more code and a wrapper library (`idb`), which would need approval under the project's no-new-libraries rule.

**Option 3 — File System Access API**
Reads and writes actual files on the user's disk. Data is portable and survives beyond the browser. Works in Chrome/Edge but has incomplete support in Firefox and Safari; requires a user permission prompt on first use. Overkill as a primary storage layer.

### Follow-up questions asked
- *Can `localStorage` support version history across reloads?* Technically yes — snapshots are just strings — but the 5–10 MB cap makes it impractical once you accumulate many documents with many versions.
- *Can `localStorage` support rich text (bold, italic, bullet points)?* Yes. `localStorage` is format-agnostic: it stores whatever string the editor produces, whether that is HTML, Markdown, or a JSON document tree. The format is an editor concern, not a storage concern.

### Next session
Implement `localStorage` persistence in `app/page.tsx` — wire up a `useEffect` to save `docs` on every change and load them on first render.

### Decision and rationale
`localStorage` was chosen for this stage of the project. The current data model is plain text with three fields per document (`id`, `title`, `body`). The implementation is trivial and introduces no new dependencies, which respects the project's constraint of asking before adding libraries. The storage limit is not a concern while documents are text-only and there is no version history. The ceiling is well understood: migrate to `IndexedDB` if binary attachments, large version histories, or storage pressure become real requirements.

---

## 2. The Search → Paste → Cite Pattern
*One prompt where this pattern changed the outcome: what did you search for, what did you paste, and what would the agent have done without it?*

### The prompt
Implement home page routing, a `/docs` workspace, and direct navigation to `/docs/[id]` — and refer to `@docs/nextjs-link-component.md` for the Link component.

### What was searched and pasted
The reference file `docs/nextjs-link-component.md` was pasted into the conversation. It showed the exact import path (`next/link`) and the basic `<Link href="…">` usage. Alongside it, the agent read the official Next.js docs bundled in `node_modules/next/dist/docs/` — specifically `03-layouts-and-pages.md` and `04-linking-and-navigating.md` — which revealed two breaking-change details not in the short reference:

1. **`params` is now a Promise.** In this version of Next.js, dynamic route parameters arrive as `Promise<{ id: string }>` and must be `await`-ed inside an `async` Server Component. Without reading the docs, the agent would have written `params.id` directly, which would have produced a TypeScript error and a runtime failure.

2. **`useRouter` comes from `next/navigation`, not `next/router`.** The pasted reference only covered `<Link>`. For the "New document" button — which must navigate imperatively after writing to `localStorage` — the agent needed `useRouter`. Reading the navigation doc confirmed the correct import is `from 'next/navigation'`. Using the Pages Router import (`next/router`) would have thrown at runtime in the App Router.

### How the agent would have operated without citation
Without the pasted reference and the node_modules docs read, the agent would have relied on training-data knowledge of Next.js — which reflects versions before these breaking changes. It would likely have:
- Written `params.id` instead of `await params.id`, silently producing `undefined` when navigating directly to `/docs/abc123`
- Imported `useRouter` from `next/router`, causing a runtime error in every client component that tries to navigate imperatively

Both bugs would have been invisible until the feature was tested in the browser. The citation forced the agent to read the version-specific docs first, and the AGENTS.md instruction ("Read the relevant guide in `node_modules/next/dist/docs/` before writing any code") enforced it.

---

## 3. CLAUDE.md Catching Drift
*One moment where CLAUDE.md caught the agent drifting: what did it attempt, and how did CLAUDE.md correct it?*

---

## 4. The Design Pass
*What specific visual direction did you give Claude Code (tone, typography, spacing, colour, components), what changed from the scaffolded default, and which iteration finally felt right?*

---

## 5. Harder Than Expected
*One thing that was harder than expected compared to the plain-HTML app from the static-site lesson.*

---

## 6. The docs/ Folder Retrospective
*What you would keep or change in your docs/ folder next time: what was useful, what was noise?*

---
