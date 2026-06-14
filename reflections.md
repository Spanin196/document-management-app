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
