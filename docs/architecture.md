# Architecture

## Request Flow

```
Browser → Next.js App Router → Route Handler (app/api/) → Database / File Storage
                                      ↓
                               Session / Auth check
                                      ↓
                               AuditLog write
```

## Folder Responsibilities

| Folder | Purpose |
|---|---|
| `app/` | All pages and API routes |
| `app/api/` | Server-side logic, no UI |
| `app/dashboard/` | Authenticated landing area |
| `app/documents/` | Browse, view, edit documents |
| `app/search/` | Full-text and filtered search |
| `app/settings/` | User and workspace config |
| `app/auth/` | Login, registration, password reset |
| `public/` | Static assets (icons, images) |
| `docs/` | Reference assets for the project |

## Auth Strategy (TBD)
Decision pending. Do not implement until library is approved. See CLAUDE.md Rule 1.

## Database Strategy (TBD)
Decision pending. Do not implement until library is approved. See CLAUDE.md Rule 1.

## File Storage Strategy (TBD)
Decision pending. Do not implement until library is approved. See CLAUDE.md Rule 1.
