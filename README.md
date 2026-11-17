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
- `legacy/scripts/*.js` — the three original inline scripts, verbatim, run in original order.
- `app/layout.tsx` — `<html data-app-version="68">`, `<body data-version="V89" data-stage="3.1">`, page title.
- `app/page.tsx` — reads the legacy files on the server.
- `components/Shop360App.tsx` — client component that injects the markup and runs the scripts once after mount.

The app is client-side only (state is kept in `localStorage`, as in the original file).
