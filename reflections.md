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

### Direction given to the agent

The brief was anchored to two references: the Ridwell app (warm, community-centric, friendly interface) and the Midnight Gospel light palette (soft pastels with unexpected pops of cosmic colour). The target feeling was **Approachable Clarity** — a document tool that feels calm and human rather than clinical and corporate. The specific axes were:

- **Colour:** replace the pure white background and cold gray scale with a warm alabaster cream (`#FAF9F5`) canvas and a rich charcoal ink (`#2E2D30`). Introduce a single brand colour, teal (`#1EA2A4`), as the only strong accent — used exclusively for the primary action and active states.
- **Typography:** load DM Serif Display as `font-display` for document titles and headings (editorial, warm, not a form field), and Plus Jakarta Sans as the UI body font (friendly, rounded geometry replacing Geist).
- **Spacing:** generous horizontal padding in the editor (`px-16` on desktop) with a `max-w-2xl` centred column, so the text reads like a page on a desk rather than a panel flush against the sidebar.
- **Component shape:** move from small `rounded` (4 px) to `rounded-xl` (12 px) on sidebar items and inputs, `rounded-2xl` on the home CTA, and `rounded-full` on the Edit/Preview toggle — softer, friendlier edges throughout.
- **Hierarchy:** make one thing clearly primary. The New Document button should be the loudest element in the sidebar; everything else should recede.

### What changed from the scaffolded default

| Element | Before (scaffold) | After (design pass) |
|---|---|---|
| **Background** | `bg-white` — pure cold white | `bg-canvas` — warm alabaster `#FAF9F5` |
| **Text colour** | `text-gray-900` — neutral gray | `text-ink` — rich charcoal `#2E2D30` |
| **Heading font** | Geist Sans `text-2xl font-semibold` | DM Serif Display `font-display text-3xl` |
| **UI font** | Geist Sans | Plus Jakarta Sans |
| **New Document button** | `border border-gray-200` — identical style to the search input, no hierarchy | `bg-brand text-white rounded-xl` — solid teal fill, unmistakably primary |
| **Search input** | Same border and padding as the button, `text-sm` | Ghost background, `text-xs`, near-invisible border — recedes behind the button |
| **Active sidebar item** | `bg-gray-100` gray fill | `bg-brand/10` teal tint + `text-brand font-medium` link — colour carries meaning |
| **Border radius** | `rounded` (4 px) on most elements | `rounded-xl` (12 px) on sidebar, `rounded-full` on pill toggle |
| **Edit/Preview toggle** | Rectangular bordered box, gray active fill | Pill shape `rounded-full`, ink-filled active state (`bg-ink text-surface`) |
| **Editor padding** | `p-6 md:p-10` — text runs edge-to-edge | `px-16 md:py-12` + `max-w-2xl mx-auto` — centred column with breathing room |
| **Line height** | `leading-relaxed` | `leading-loose` — slightly more open |
| **Home page CTA** | `border border-gray-300` outlined button | `bg-brand rounded-2xl` solid teal pill |
| **Home page headline** | `text-3xl font-semibold` Sans-serif | `font-display text-5xl` DM Serif Display |
| **Dark mode tokens** | Per-element `dark:` classes throughout | Semantic CSS variables (`--canvas`, `--ink`, `--surface`) that flip in `.dark` — most `dark:` variants removed |

### Which iteration felt right

The first pass submitted was refactored before the PR was opened: the initial attempt kept neutral grays and tightened spacing but added no personality. After reviewing it in the browser it was clear the app still looked like a utility — the only change a user would notice was slightly tighter rows.

The second pass (the one that shipped) committed to the brief fully: warm cream background, DM Serif Display on the title, solid teal button. The shift in the title field was the most noticeable improvement — going from a `text-2xl font-semibold` Geist input to a `text-3xl font-display` DM Serif heading changes how the document feels to write in. The serif signals "this is a document", not a web form.

The teal button in the sidebar was the second clearest win: in the scaffold, the search input and New Document button were visually indistinguishable — same border, same padding, same font size. After the pass, the button is the only thing with colour in the sidebar; the search input disappears into the background.

The PR review caught two regressions before merge: `activeId` was frozen in `useState` (navigating between documents showed the wrong one), and the `@media (prefers-color-scheme: dark)` block had been removed (first-time OS dark-mode visitors always saw the light theme). Both were fixed in a follow-up commit before the branch was squashed.

---

## 5. Harder Than Expected
*One thing that was harder than expected compared to the plain-HTML app from the static-site lesson.*

### Getting the design to match what was in my head

In the static-site lesson, visual changes are immediate: you edit a CSS rule, save, and the browser reflects it in under a second. Working through an agent adds a layer of indirection that turns visual iteration into a slower, more verbal process. Describing colour, weight, and spatial relationships in natural language is imprecise — "a light note of lavender" means something specific to me and something slightly different to the model, and the gap only becomes visible once the change lands in the browser.

This showed up concretely during the design pass: the first submitted version was technically consistent with the brief (correct hex codes, correct font names) but felt wrong when reviewed in the browser — it had the components of the design without its feeling. A second full pass was needed before it read as intentionally warm rather than accidentally off-white. The sidebar colour went through a similar cycle in a later session: cosmic lavender `#B3A2C7` was too saturated, a pale tint `#EDE9F6` still felt arbitrary, and the final answer was simply to remove the colour and use the cream baseline — a decision that only became clear by seeing the alternatives in context.

The underlying constraint is that the agent cannot see the screen. Every review loop requires the human to open the browser, evaluate the result, and translate a visual reaction ("too intense", "too clinical") back into language precise enough to produce a different outcome. In plain HTML this feedback loop is sub-second and direct. Here it takes at least one full round-trip per adjustment, and colour decisions often take two or three.

A secondary challenge was the `localStorage` hydration mismatch. In a plain-HTML app all code runs in the browser and `localStorage` is always available. In Next.js the initial render runs on the server, where `localStorage` does not exist. Reading it inside a `useEffect` avoids the crash, but it introduces a render where the document list is empty before snapping to the stored state — a flash that required a `loaded` guard flag to suppress. There is no equivalent concept in a static site; the problem does not exist until you move to a framework with server-side rendering.

---

## 6. The docs/ Folder Retrospective
*What you would keep or change in your docs/ folder next time: what was useful, what was noise?*

### What to keep

**`design-brief.md`** was the most useful document in the folder. Having exact hex codes, font names, and labelled categories (brand, accent, semantic) meant the agent never had to guess at colour values or invent a typographic pairing. Every concrete token in the brief (`#1EA2A4`, `DM Serif Display`, `rounded-xl`) landed in the code correctly on the first attempt. Vague direction ("make it feel warm") would have produced a first pass that required far more correction.

**Reference docs cited explicitly in the prompt** (the `nextjs-link-component.md` snippet pasted in Section 2) were effective precisely because they were attached at the moment of use. The agent read them, applied them, and the correct import paths ended up in the code.

### What to change

**The design brief was written for a human reader, not for an agent.** The narrative sections — the executive summary, the general atmosphere description, the iconography guidance — consumed space without influencing the output. The agent extracted the colour table and the font names and largely ignored the rest. Next time the document would be shorter: a token table, a component-by-component description, and a one-line feeling statement. Everything else is better kept in a mood board or a separate human-facing document that is never pasted into the conversation.

**Reference docs should be versioned.** `nextjs-link-component.md` was a snapshot of the Link API at one point in time. The node_modules docs superseded it in the same session. Keeping both creates ambiguity about which is authoritative. A note at the top of each reference doc stating the Next.js version it was written against would have made it immediately clear when to defer to the bundled docs instead.

---
