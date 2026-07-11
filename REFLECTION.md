# Persistence Approach Reflection

## Question posed

> Before implementing Supabase persistence, consult Claude Code on the best persistence approach given the existing stack, evaluate the recommendation, and record the chosen approach (and why).

## Options considered

### Option A — Direct Supabase queries from client/server components (chosen)

Use `@supabase/ssr` to instantiate a Supabase client in each component (browser client for Client Components, server client for Server Components and Server Actions) and call `supabase.from("notes")` directly.

### Option B — Proxy through Next.js Route Handlers

Add `app/api/notes/` route handlers that sit between the browser and Supabase. The client fetches from `/api/notes`, the handler validates the session, queries Supabase, and returns JSON.

### Option C — Server-only data access (no client-side Supabase)

All reads and mutations flow through Server Actions or Route Handlers. The browser never holds a Supabase client or session token.

## Chosen approach: Option A

Direct queries via `@supabase/ssr` with the browser client on the client side and the server client on the server side.

### Why

1. **Matches the recommended Supabase + Next.js App Router pattern.** The `@supabase/ssr` package is designed specifically for this setup and provides the right cookie-forwarding plumbing out of the box.

2. **Row-Level Security replaces the API layer.** RLS policies (`(select auth.uid()) = user_id`) enforce user isolation at the database level. A proxy API layer would add latency and code without adding security that RLS doesn't already provide.

3. **Less code, less surface area.** Option B would require writing, testing, and maintaining a parallel REST-ish API layer. For a single-user notes app with straightforward CRUD, that overhead is not justified.

4. **Autosave is simpler.** The debounced save in `WorkspaceClient.tsx` calls the browser Supabase client directly with a 500 ms delay. Routing that through a Route Handler would add a round-trip fetch, error handling for network failures, and response parsing — all for no benefit.

### Trade-offs acknowledged

- The browser holds a Supabase session token (in a cookie managed by `@supabase/ssr`). This is the intended design; the token is scoped to the authenticated user and RLS prevents cross-user access even if the token were somehow misused.
- Option C (server-only) would be a stronger security posture for sensitive data, but for a personal notes app it adds complexity without meaningful benefit.

## Implementation notes

- `utils/supabase/client.ts` — browser client (used in `WorkspaceClient.tsx`)
- `utils/supabase/server.ts` — server client (used in page Server Components and the sign-in Server Action)
- `utils/supabase/middleware.ts` — session-refresh helper called by `proxy.ts`
- `proxy.ts` — Next.js 16 proxy entry point (replaces `middleware.ts`)
- `getClaims()` used everywhere instead of `getSession()` to validate the JWT server-side per project rules
- RLS policies use `TO authenticated` and `(select auth.uid())` (evaluated once per query) following Supabase best-practice guidance from the installed agent skill

## 6. Understanding the Data — the `notes` Table

*What each column in the Supabase `notes` table means, how it connects to the signed-in user, and how a new row is created when a note is added.*

### Schema

| Column | Type | Set by | Meaning |
|---|---|---|---|
| `id` | `uuid` | Supabase (`gen_random_uuid()`) | Uniquely identifies the note. Generated automatically when the row is inserted; used as the URL segment in `/docs/[id]`. |
| `user_id` | `uuid` | Application code (from the JWT) | The UUID of the Supabase Auth user who owns this note. Populated from `claims.sub` at insert time — the `sub` field of the signed-in user's JWT, which equals `auth.uid()` inside the database. |
| `title` | `text` | User | The note's title as typed in the title field. Starts as an empty string on creation and updates on every keystroke via the debounced save. |
| `body` | `text` | User | The note's body content. Also starts empty and updates the same way as `title`. |
| `created_at` | `timestamptz` | Supabase (default `now()`) | The moment the row was first inserted. Never updated after that. |
| `updated_at` | `timestamptz` | Application code | Stamped with the current ISO timestamp every time `title` or `body` is saved. The sidebar sorts by this column descending so recently edited notes appear at the top. |

### How `user_id` links to the signed-in user

Supabase Auth issues a JWT when a user signs in. That token contains a `sub` claim — the user's UUID, the same value that `auth.uid()` returns inside PostgreSQL. When the app reads the JWT it extracts `sub` via `getClaims()` (which validates the token server-side, per project rule 5) and stores it in `claims.sub`. That value is written into `user_id` at insert time.

Row-Level Security then enforces that every query filters by `(select auth.uid()) = user_id`, so even if a request arrived with a different session the database would return zero rows for notes belonging to another user.

### How a new row is created

When the user clicks **New Document**, `WorkspaceClient.tsx` calls:

```ts
const { data } = await supabase
  .from("notes")
  .insert({ title: "", body: "", user_id: claims.sub })
  .select()
  .single();
```

Supabase fills in `id` (a random UUID) and `created_at` (the current timestamp) automatically. The app receives the complete row back from `.select()`, adds it to local state, and immediately navigates to `/docs/<id>` so the user lands in the editor. From that point on, every change to the title or body triggers an `.update()` call that writes the new value and stamps `updated_at`.

### Verifying in the dashboard

- **Authentication → Users tab**: lists every account that has signed up, with the UUID that becomes `user_id` in the notes table.
- **Table Editor → `notes` table**: each row shows the `user_id` column; it matches the UUID of the account that created that note.
- **SQL Editor**: `SELECT id, user_id, title, created_at, updated_at FROM notes ORDER BY updated_at DESC;` returns the full picture in one query.
