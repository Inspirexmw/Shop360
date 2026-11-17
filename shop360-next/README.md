# Shop360 (Next.js 15)

Stock, inventory and POS workspace: a Next.js 15 / React 19 port of `Shop360_Latest 5.html`.
The UI is pixel-identical to the original (checked page by page at desktop and mobile widths, light and dark).

## Run
```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```
Deploys to Vercel as-is (no environment variables needed).

## How it's organised
| Path | What it is |
|---|---|
| `app/globals.css` | All 21 original `<style>` blocks, concatenated in original order (same cascade, same look) |
| `app/layout.tsx`, `app/page.tsx` | Root layout (title, `data-app-version`, early theme script) and the single route |
| `components/Sidebar.tsx`, `Topbar.tsx`, `FooterNote.tsx`, `ModalBackdrop.tsx` | Shell pieces, same DOM as the original |
| `components/pages/*Page.tsx` | One component per screen: Dashboard, POS, Inventory, Sales, Daily, Receiving, Reports, Customers, Layaway, Orders, Suppliers, Finance, Team, Settings |
| `components/AppShell.tsx` | Assembles the original element tree |
| `components/LegacyRuntime.tsx` | Loads the app engine once the markup is in the page |
| `public/legacy/shop360-core.js` | The original application logic, unchanged (state, POS, inventory, finance, reports, receipts, backup/restore, import/export) |
| `public/legacy/shop360-theme-controls.js`, `shop360-mobile-nav.js` | Original theme switch, sidebar collapse, mobile drawer and bottom nav |
| `reference/Shop360_Latest-5.original.html` | The source HTML, for diffing |

## Notes
- **Data is still browser-only** (`localStorage`, key `shop360-blank-test-state-v1`), exactly like the original. There is no backend yet.
- Excel import/export loads SheetJS from cdnjs at runtime, as in the original.
- Screens are static markup driven by the original engine, which is why behaviour and look are unchanged. To move a screen to native React later, replace its `components/pages/<X>Page.tsx` and migrate its logic out of `shop360-core.js` one function group at a time.
- Receipt and report branding (shop name, address, VAT, etc.) is the `SHOP` object at the top of `public/legacy/shop360-core.js`.
