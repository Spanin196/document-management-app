# Security Fixes — Supabase Audit

Audit date: 2026-07-09

---

## Warnings

### W1 — Remove unused service-role key from `.env.local`

**File:** `.env.local` line 3  
**Risk:** `SUPABASE_SECRET_KEYS` holds an `sb_secret_*` key (bypasses RLS entirely) but is referenced nowhere in the codebase. An accidental commit or leak of `.env.local` exposes a superuser credential with no benefit.  
**Fix:** Delete the `SUPABASE_SECRET_KEYS` line from `.env.local`. If the key is ever needed for a server-only script, add it back at that time with a clear comment explaining its purpose, and ensure it never appears in a `NEXT_PUBLIC_` variable.

---

### W2 — Version-control the schema and RLS policies

**Location:** Entire repo (no `supabase/migrations/` directory exists)  
**Risk:** RLS is the sole data-isolation mechanism; if it is accidentally disabled in the dashboard, every authenticated user can read, edit, and delete every other user's notes. No code review or CI check can catch this.  
**Fix:**
1. Run `supabase db dump --schema public > supabase/schema.sql` and commit the output.
2. Going forward, express all schema changes as migration files in `supabase/migrations/` so changes are reviewable in PRs.

---

### W3 — Replace `getClaims()` with `getUser()` in all server code

**Files:** `utils/supabase/middleware.ts` (line 30), `app/docs/page.tsx` (line 7), `app/docs/[id]/page.tsx` (line 11), `app/auth/sign-in/page.tsx` (line 11), `app/auth/sign-up/page.tsx` (line 11), `app/docs/WorkspaceClient.tsx` (line 99)  
**Risk:** `getClaims()` validates the JWT signature locally. It does not call Supabase's auth server, so a server-side revoked token (forced sign-out, password reset) will pass the check until the JWT's natural expiry window closes.  
**Fix:** Replace every `getClaims()` call in server/middleware code with `getUser()`, which makes a network call to Supabase and rejects revoked tokens immediately. This is also required by CLAUDE.md rule 5.

```ts
// Before
const { data: claims } = await supabase.auth.getClaims()
const user = claims?.claims

// After
const { data: { user }, error } = await supabase.auth.getUser()
```

---

### W4 — Do not pass `user_id` from the client in INSERT

**File:** `app/docs/WorkspaceClient.tsx` line 104  
**Risk:** The client reads `user_id` from the browser-side JWT (`claims.sub`) and includes it in the INSERT payload. If the RLS `WITH CHECK` policy is absent or too permissive, a crafted request could attribute a note to another user's ID.  
**Fix:** Remove `user_id` from the client INSERT payload and set it as a column default in the database:

```sql
ALTER TABLE notes ALTER COLUMN user_id SET DEFAULT auth.uid();
```

The column should also carry `NOT NULL` and a check constraint:

```sql
ALTER TABLE notes ADD CONSTRAINT notes_user_id_check CHECK (user_id = auth.uid());
```

Then in `WorkspaceClient.tsx`, drop `user_id` from the insert object entirely.

---

## Suggestions

### S1 — Add explicit `user_id` filters to SELECT, UPDATE, and DELETE

**File:** `app/docs/WorkspaceClient.tsx` lines 72–74, 115, 134–136  
**Fix:** Add `.eq("user_id", userId)` to every data-mutating query so that a future RLS misconfiguration does not silently expose data.

```ts
// SELECT
.from("notes").select("id, title, body, updated_at").eq("user_id", userId)

// DELETE
.from("notes").delete().eq("id", id).eq("user_id", userId)

// UPDATE
.from("notes").update({ ... }).eq("id", id).eq("user_id", userId)
```

---

### S2 — Move `updated_at` assignment to the database layer

**File:** `app/docs/WorkspaceClient.tsx`  
**Risk:** `updated_at: new Date().toISOString()` is set from the browser clock, allowing a user to write arbitrary timestamps to their own rows.  
**Fix:** Add a `BEFORE UPDATE` trigger (or a generated column) to set `updated_at = now()` server-side, and remove the field from the client UPDATE payload.

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER notes_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

### S3 — Replace `select("*")` with an explicit column list

**File:** `app/docs/WorkspaceClient.tsx` line 73  
**Fix:**
```ts
.select("id, title, body, updated_at")
```
This prevents future columns (internal flags, soft-delete markers, foreign keys) from being sent to the browser without a deliberate code change.

---

### S4 — Map Supabase Auth errors to a generic message

**File:** `app/auth/sign-in/page.tsx` lines 22–24, 33–36  
**Risk:** Raw Supabase error messages (e.g. "Email not confirmed" vs. "Invalid login credentials") let an attacker enumerate whether an email address is registered.  
**Fix:** Replace the raw error message with a single generic string before rendering:

```ts
// Instead of passing error.message directly:
const message = "Invalid email or password. Please try again."
```

---

# Post-Deploy Security Sweep

Sweep date: 2026-07-12  
Agents: `security-auditor`, `nextjs-security-scanner`, `vercel-security-scanner`  
Findings below are distinct from W1–W4 and S1–S4 above.

---

## Supabase

### PS1 — Sign-up page exposes raw Supabase error message (email enumeration — extends S4)

**File:** `app/auth/sign-up/page.tsx` line 31  
**Severity:** High  
**Risk:** The prior S4 finding only covered `sign-in`. The sign-up Server Action uses the same pattern:

```ts
redirect(`/auth/sign-up?error=${encodeURIComponent(error.message)}`);
```

Supabase returns `"User already registered"` when the submitted email is already in use. This string is placed verbatim in the redirect URL — visible in browser history, Vercel function logs, and rendered to the page. An automated script can enumerate whether any email address is registered by submitting it to the sign-up form and reading the response.

**Fix:** Replace `error.message` with a fixed generic string at the Server Action level, before the redirect:

```ts
redirect(`/auth/sign-up?error=${encodeURIComponent("Unable to create account. Check your details and try again.")}`);
```

Apply the same fix to `sign-in/page.tsx` line 23 as specified in S4, using the same pattern so neither page ever puts a raw Supabase message into a URL or log.

---

### PS2 — Auth callback open redirect via `request.url`

**File:** `app/auth/callback/route.ts` lines 12, 17  
**Severity:** Medium  
**Risk:** Both the success and error redirect paths build their target URL from `request.url`:

```ts
return NextResponse.redirect(new URL("/docs", request.url));
return NextResponse.redirect(new URL("/auth/sign-in?error=...", request.url));
```

The origin of the constructed URL inherits from the incoming request. If the deployment sits behind a misconfigured proxy that forwards an attacker-controlled `Host` or `X-Forwarded-Host` header, the redirect destination resolves to an attacker-controlled domain. This is a well-known attack surface for Supabase PKCE callback routes.

**Fix:** Construct redirects from a trusted base origin, not from `request.url`:

```ts
const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

return NextResponse.redirect(new URL("/docs", origin));
return NextResponse.redirect(new URL("/auth/sign-in?error=...", origin));
```

Add `NEXT_PUBLIC_SITE_URL=https://document-management-4hu81hju9-bready.vercel.app` to `.env.local` and `.env.example`.

---

## Next.js

### PN1 — Per-user `/docs` pages lack an explicit `dynamic = 'force-dynamic'` guard

**Files:** `app/docs/page.tsx`, `app/docs/[id]/page.tsx`  
**Severity:** Medium  
**Risk:** Both pages serve per-user note data protected by an auth check. They are currently treated as dynamic because `createClient()` calls `await cookies()` internally, which Next.js detects at build time. However this is an implicit heuristic, not an explicit declaration. Two failure modes:

1. If the Supabase client is ever refactored to defer the `cookies()` call (e.g. passing a pre-built cookie store from a layout), Next.js's dynamic-detection heuristic would no longer fire and the page could silently become a statically cached shell served to all visitors.
2. If Partial Prerendering is enabled in future, the static outer shell of these pages (including the workspace frame) could be cached and streamed to unauthenticated users before the dynamic portion loads.

**Fix:** Add a single line to both files:

```ts
export const dynamic = 'force-dynamic';
```

---

### PN2 — `[id]` route param not validated before use

**File:** `app/docs/[id]/page.tsx` line 14  
**Severity:** Low  
**Risk:** The `id` param is passed directly to `WorkspaceClient` as `initialId` without any UUID format check. Currently the ID is used only for client-side state lookup, so there is no immediate server-side injection risk. If data-access is ever moved server-side (e.g. to address the DAL gap in S-class findings), an unvalidated param would immediately become an injection surface.

**Fix:** Validate the param before forwarding it:

```ts
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidPattern.test(id)) notFound();
```

---

### PN3 — `utils/supabase/server.ts` has no `server-only` guard

**File:** `utils/supabase/server.ts`  
**Severity:** Low  
**Risk:** The server Supabase client factory imports `cookies` from `next/headers`. If this module is ever accidentally imported in a Client Component, Next.js will throw a cryptic build error rather than a clear message. The `server-only` package converts this into an explicit, early, readable error.

**Fix:** Add to the top of the file:

```ts
import 'server-only';
```

---

## Vercel

### PV1 — Next.js middleware never runs in production (`proxy.ts` naming error)

**File:** `proxy.ts` (project root)  
**Severity:** High  
**Risk:** Next.js only executes middleware from a file named exactly `middleware.ts` at the project root, with a `default` export. This file is named `proxy.ts` and exports a named function (`proxy`). Neither condition is met — Next.js has never registered it as middleware in any deployment.

Consequences in production:
- `updateSession` never runs, so the Supabase session cookie is never refreshed. Users with JWTs approaching expiry are silently denied rather than having their session renewed.
- The middleware-level redirect guard for `/docs` routes never fires. Route protection falls back entirely to page-level `getClaims()` checks (which are themselves flagged by W3).
- This is a pre-existing issue present in all deployed versions; it is not introduced by any recent change.

**Fix:**

1. Rename `proxy.ts` → `middleware.ts`.
2. Change the export to a default export:

```ts
// middleware.ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export default async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

3. Address W3 in the same pass — replace `getClaims()` with `getUser()` inside `updateSession` so the middleware performs server-side token validation.

---

### PV2 — Security headers entirely absent

**Files:** `next.config.ts`, `vercel.json`  
**Severity:** High (CSP) / Medium (X-Frame-Options, X-Content-Type-Options, HSTS) / Low (Referrer-Policy, Permissions-Policy)  
**Risk:** Neither `next.config.ts` nor `vercel.json` defines any HTTP security headers. Vercel does not set these automatically. The table below lists each missing header, its risk, and its minimum value:

| Header | Severity | Risk if absent | Minimum value |
|---|---|---|---|
| `Content-Security-Policy` | High | XSS in note body (ReactMarkdown renders HTML) can execute arbitrary scripts | `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'` |
| `X-Frame-Options` | Medium | Sign-in page can be embedded in an attacker iframe (clickjacking) | `DENY` |
| `X-Content-Type-Options` | Medium | MIME-type sniffing on downloaded Markdown files | `nosniff` |
| `Strict-Transport-Security` | Medium | No browser-level HTTPS enforcement between visits | `max-age=63072000; includeSubDomains` |
| `Referrer-Policy` | Low | Auth tokens in query strings leak to third-party `Referer` headers | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Low | Browser features (camera, mic, geolocation) are unrestricted | `camera=(), microphone=(), geolocation=()` |

**Fix:** Add a `headers()` block to `next.config.ts`:

```ts
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ];
},
```

Add CSP separately after testing — start in `Content-Security-Policy-Report-Only` mode with the ReactMarkdown source set explicitly, then promote to enforced once no violations are seen.

---

### PV3 — Preview deployments are publicly accessible

**Location:** Vercel dashboard — Project → Settings → Deployment Protection  
**Severity:** High  
**Risk:** No `"protection"` key exists in `vercel.json` and Deployment Protection is not enabled in the dashboard. Five preview deployments are publicly accessible at `*.bready.vercel.app`. The app stores authenticated user notes. Anyone with a preview URL can probe auth flows, observe staging behavior, and attempt to exploit any issue present in the preview build before it reaches production.

Note: `"git": { "deploymentEnabled": false }` in `vercel.json` prevents new auto-deploys on push, but does not restrict access to URLs that already exist.

**Fix:** Enable Vercel Authentication (Standard Protection) for Preview environments:
- Dashboard → Project → Settings → Deployment Protection → Standard Protection → Enable.
- This restricts all preview URLs to Vercel team members only. Available on Pro plan.

---

### PV4 — `productionBrowserSourceMaps` not explicitly disabled; Protected Source Maps unverified

**File:** `next.config.ts`; Vercel dashboard — Project → Settings → General  
**Severity:** Low  
**Risk:** `next.config.ts` is empty — `productionBrowserSourceMaps` is not set. Next.js defaults this to `false` in production, so no source maps are currently shipped to browsers. However the intent is undocumented; a future webpack customization (e.g. a Sentry integration) could enable source maps without the developer realising this exposes server-side module paths and logic to browser DevTools.

Separately, Vercel's "Protected Source Maps" feature restricts access to any generated source maps to authenticated team members only. Its status cannot be confirmed without dashboard access.

**Fix:**

1. Add to `next.config.ts`:
```ts
productionBrowserSourceMaps: false,
```

2. Verify manually: Dashboard → Project → Settings → General → Source Maps → enable "Protected Source Maps".

---

### PV5 — No `images.remotePatterns` config

**File:** `next.config.ts`  
**Severity:** Low  
**Risk:** No `images` block is configured. The app loads no external images today, so there is no active vulnerability. If a future feature adds a `next/image` pointing to an external host, a developer might add a wildcard `hostname: '*'` to unblock the build without understanding the risk (arbitrary image proxying through the Next.js image optimization endpoint, which can be used as an SSRF vector).

**Fix:** Add an explicit empty allow-list to document the intent:

```ts
images: {
  remotePatterns: [], // no external image sources permitted
},
```

---

### PV6 — `SUPABASE_SECRET_KEYS` confirmed live in Vercel dashboard (extends W1)

**Location:** Vercel dashboard — Project → Settings → Environment Variables; `.env.local` line 3  
**Severity:** High  
**Confirmed by:** `vercel env ls` (2026-07-12) — output: `SUPABASE_SECRET_KEYS  Encrypted  Production, Preview`

W1 identified the key in `.env.local` and the manual check below asked to confirm it had not been added to the Vercel dashboard. It has been. `SUPABASE_SECRET_KEYS` holds an `sb_secret_*` value (Supabase service-role equivalent — bypasses RLS entirely) and is scoped to both Production and Preview environments. No source file in the project reads or references this variable.

The Preview scoping is an unnecessary extra exposure surface: preview deployments currently lack Deployment Protection (see PV3), making the Preview environment a higher-risk location to hold a superuser database credential.

**Fix:**
1. Remove `SUPABASE_SECRET_KEYS` from the Vercel dashboard (both Production and Preview scopes).
2. Rotate the key immediately in the Supabase dashboard — it has been present in both `.env.local` and a cloud-hosted environment. Rotation is required even though the Vercel value is stored as Encrypted (Sensitive); the key may have been seen by any process with filesystem access on the development machine.
3. Delete the `SUPABASE_SECRET_KEYS` line from `.env.local` (see W1).
4. If a server-only admin script ever needs elevated access in future, re-introduce a new key at that time scoped to Production only with a clear comment explaining its purpose.

---

### PV7 — Production domain unprotected — Hobby plan limitation

**Location:** Vercel dashboard — Project → Settings → Deployment Protection  
**Severity:** Low  
**Risk:** Standard Protection (Vercel Authentication) covers only Preview deployments on the Hobby plan. The production domain (`*.vercel.app` and any custom domain) remains publicly accessible. This is a platform constraint, not a misconfiguration, but is worth documenting: if the app's data sensitivity increases, "All Deployments" protection (which covers production) is available on the Pro plan.

**Fix:** No immediate action required on Hobby. If the project upgrades to Pro, enable "All Deployments" protection under Project → Settings → Deployment Protection to extend coverage to the production URL. Until then, ensure the production deployment is hardened at the application layer (auth, RLS, security headers per PV2).

---

### Manual dashboard checks — cannot be automated

The following require manual verification in the Vercel dashboard:

1. **Project → Settings → Environment Variables** — Remove `SUPABASE_SECRET_KEYS` from Production and Preview scopes (see PV6); rotate the key in Supabase. Confirm all remaining secret-class variables are tagged Sensitive and none are prefixed `NEXT_PUBLIC_`.
2. **Project → Settings → Deployment Protection** — Confirm Standard Protection is enabled for Preview environments (see PV3).
3. **Project → Settings → General → Source Maps** — Confirm Protected Source Maps is enabled (see PV4).
4. **Team → Settings → Security → Environment Variable Policies** — Confirm "Enforce Sensitive Environment Variables" is on so future secrets cannot be stored as plain text.
