# Shop360 — Next.js 15 port

Next.js 15 (App Router) port of `Shop360_Latest 5.html`.

## Run

```bash
npm install
npm run dev      # development, http://localhost:3000
npm run build && npm start   # production
```

## What is where

- `app/globals.css` — all 21 original `<style>` blocks, concatenated verbatim in their original order. No style rule was changed.
- `legacy/body.html` — the original `<body>` markup with all `<style>` and `<script>` tags removed.
- `legacy/scripts/*.js` — the legacy inline scripts, run in the order listed in `legacy/meta.json` (`05-rbac.js` applies role-based visibility).
- `app/layout.tsx` — `<html data-app-version="68">`, `<body data-version="V89" data-stage="3.1">`, page title.
- `app/page.tsx` — reads the legacy files on the server, renders the load → auth → dashboard flow.
- `components/Shop360App.tsx` — client component that injects the markup and runs the scripts once after mount.

The app is connected to a Neon PostgreSQL database. State is persisted server-side via `/api/state`, not `localStorage`.

## Accounts and access control

Public sign-up is disabled. The first owner is bootstrapped once with `SETUP_KEY` set on the server:

```bash
curl -X POST http://localhost:3000/api/setup \
  -H 'Content-Type: application/json' \
  -d '{"setupKey":"<SETUP_KEY>","name":"Owner","email":"owner@shop.com","password":"..."}'
```

After that, only the owner creates and manages accounts under **Team & access** (`/api/admin/users`). Roles are stored in `users.role`; `finance` is the canonical name for finance/accounts staff. Apply `db/migrations/0002_rbac_roles.sql` to normalise existing `employee` accounts to `cashier`.

### Account-created email (Resend)

When the owner creates an account, `lib/email.ts` sends the new user their email, password and role through Resend. Email is optional and non-blocking: account creation still succeeds if it is not configured or Resend fails.

```bash
RESEND_API_KEY=re_...                          # when omitted, sending is skipped and logged
RESEND_FROM_EMAIL="Shop360 <no-reply@your-domain>"  # verified sender; defaults to Resend's onboarding address
APP_URL=https://your-shop360-domain            # optional, used for the sign-in link
```

The create response includes `email: { sent, status }`, and the Team & access toast tells the owner whether to share credentials manually.

### Module access matrix

| Module | Owner / Admin | Manager | Cashier | Finance |
| --- | :---: | :---: | :---: | :---: |
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Point of Sale | ✓ | ✓ | ✓ | — |
| Inventory (products, stock, stocktake, import) | ✓ | ✓ | — | — |
| Sales & orders (payments, refunds, exchanges) | ✓ | ✓ | ✓ | — |
| Daily sales | ✓ | ✓ | — | ✓ |
| Stock log | ✓ | ✓ | — | — |
| Stock orders & suppliers | ✓ | ✓ | — | — |
| Customers & Lay-by | ✓ | ✓ | ✓ | — |
| Finance (cashbook, expenses, reconciliation, transfers) | ✓ | — | — | ✓ |
| Reports | ✓ | ✓ | — | ✓ |
| Team & access (create accounts, change roles) | ✓ | — | — | — |
| Settings (configuration, backup, erase data) | ✓ | — | — | — |
| My Account (own profile and password) | ✓ | ✓ | ✓ | ✓ |

Role checks are enforced on the API (`/api/state`, `/api/admin/users`, `/api/setup`) and reflected in the UI by `legacy/scripts/05-rbac.js`. Business writes carry an intent that the server validates against the role. Because all business data is stored in one JSON blob, per-record authorisation would require splitting `/api/state` into resource-specific endpoints.
