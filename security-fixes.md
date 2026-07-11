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

**Files:** `utils/supabase/middleware.ts` (line 30), `app/docs/page.tsx` (line 7), `app/docs/[id]/page.tsx` (line 11), `app/auth/sign-in/page.tsx` (line 11), `app/auth/sign-up/page.tsx` (line 11)  
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
