# Bilora — GST Invoice Builder

A GST tax-invoice / billing web app that reproduces a printed Indian red-themed A4 tax
invoice, pixel for pixel. Fill a form on the left, watch the live A4 preview on the right,
then download a **colour PDF** that matches the preview exactly.

Built with **React 19 + Vite 6 + Tailwind CSS 4**, exporting via **html2canvas + jsPDF**.
All data lives in `localStorage` — no backend, no login.

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:5173/>.

Production build:

```bash
npm run build      # outputs ./dist
npm run preview    # serve the production build
```

## Features

### Invoice studio
- **Live A4 preview** that matches the PDF (scaled to fit, "1 page · preview matches the PDF").
- **Printed layout** (top → bottom): red border with thin rules, Gujarati invocation lines and
  WhatsApp number, business name, pink address strip, a **3-row info grid** —
  `GSTIN · State · Invoice No.` / `PAN · Code · Invoice Date` / with **`P. Ch. No.` directly
  below Invoice Date** — then the full-width pink **TAX INVOICE** bar, buyer block, items
  table, footer (BANK DETAILS + amount in words | totals) and the signature line.
  `BANK DETAILS`, `GSTIN`, `PAN`, `State`, `Code` and their **details render bold in the
  theme red**; `Invoice No.` / `Invoice Date` keep the regular navy values. There is **no
  terms block** — the bottom-left cell is left blank.
- **Form ⇄ preview toggle** on mobile; side-by-side on desktop.
- **Auto-incrementing invoice number**, date defaults to today (`DD/MM/YY`).
- **Customer picker** — searchable dropdown over the saved customer master; picking one
  fills GSTIN, state and code automatically.
- **Line items** with `Amount = round(Pics × Rate)`; `Pics` accepts decimals (e.g. `867.58`).
  "Add row" appends lines; the table body has a fixed height and **auto-flows to page 2**
  when items overflow page 1.
- **Totals panel** — the calculation chain runs in this order:
  1. `Gross = Σ Amount`
  2. `Discount` is a **percentage** (e.g. `5` → 5 % cut from the gross, clamped to 0–100 %),
     shown as `Discount @ 5 %` on the invoice
  3. `Total = Gross − (Discount % × Gross)`
  4. `SGST` + `CGST` (defaults 2.5 % each) are charged **on that discounted Total**, each
     rounded to the rupee
  5. `Grand Total = Total + SGST + CGST`

  **IGST is not used** — SGST + CGST always apply, whatever the buyer state.
- **Amount in words** in Indian numbering — *Eighty One Thousand Nine Hundred Eighty Six
  Rupees Only*.
- **Validation** with inline errors — required fields, and GSTIN format
  (`^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$`) with a red border, `invalid` tag and a
  warning showing a valid example.

### Export
- **Download PDF** → `Invoice-7-PurvirCreation.pdf` — colour, A4 (595 × 842 pt),
  rendered at 288 DPI (2382 × 3369 px), one PDF page per invoice page.
- **Print** — uses the browser print dialog with A4 page rules (`@page { size: A4; margin: 0 }`).
- **WhatsApp share** — opens `wa.me/<number>` with a pre-filled message containing the
  invoice no., buyer, date, grand total and amount in words.

### Data
- **Invoice history** — search by number / buyer / item, plus **edit**, **duplicate**
  (assigns the next invoice number) and **delete** (with confirmation).
- **Customer master** — add / edit / delete buyers, with confirmations.
- **Business settings** — one-time setup applied to every invoice:
  - identity: name, address, GSTIN, PAN, state, state code
  - invoice header: Gujarati invocation lines (editable), WhatsApp / phone
  - bank details: bank name, a/c no., IFSC
  - default tax rates (SGST / CGST)
  - **signature / stamp upload** (blank signing space above “For, {BUSINESS}”)
  - **theme colour** picker — live-updates the whole invoice (border, labels, strips,
    with auto-derived tints), plus **Reset**
  - **Handwriting** toggle — renders values in a hand-written (Caveat) font, or **Clean**
  - **Export JSON / Import JSON** backup, **Restore sample**, **Erase all data**
- Everything persists to `localStorage` under `bilora.gst.v1`.

## Sample data

Seeded on first load (or via *Restore sample*):

| Field | Value |
|---|---|
| Business | Silken Saga |
| Address | PL-16TO18 ANJANI IND EST, V-4-C3 BHARTHANA KOSAD, Surat, (M Corp+OG) (Part) Surat. |
| GSTIN / PAN | 24ANWPM9595R1ZF / ANWPM9595R |
| State / Code | Gujarat / 24 |
| Phone | 98254 06884 |
| Bank | Punjab National Bank · A/c 3749002100103811 · IFSC PUNB0374900 |
| Invoice | #7 · 01/09/25 |
| Buyer | M/s Purvir Creation · Surat, Gujarat · Gujarat (24) |
| Item | JOBWORK · 867.58 × 90 |
| Totals | Amount 78,082 · SGST 1,952 · CGST 1,952 · **Grand Total 81,986** |
| Words | Eighty One Thousand Nine Hundred Eighty Six Rupees Only |

## Project layout

```
src/
  lib/
    calc.js        formatting, Indian number-to-words, computeTotals, date masking
    validation.js  required-field + GSTIN checks
    storage.js     localStorage API, seed data, JSON import/export, signature downscale
    states.js      state name → GST code map
    pdf.js         html2canvas → jsPDF export (colour, A4, multipage)
  store/StoreContext.jsx   app state + persistence
  components/
    invoice/InvoicePage.jsx   A4 document (absolute layout, theme vars)
    invoice/invoice.css       all invoice styling — absolute positioning only
    invoice/preview.jsx       ScaledPreview + ExportStage (offscreen export source)
    ui.jsx                    buttons, fields, sections, toasts
    CustomerPicker.jsx        searchable saved-customer dropdown
  pages/
    Studio.jsx      form rail + live preview + toolbar (Save / Print / WhatsApp / PDF)
    History.jsx     search, edit, duplicate, delete
    Customers.jsx   customer master CRUD
    Settings.jsx    business defaults, theme, signature, data tools
  App.jsx           state-based routing (Studio / History / Customers / Settings)
```

## Implementation notes

- **A4 is 794 × 1123 px.** `ROWS_PER_PAGE = 17`, row height 33 px; each page renders the
  full invoice with its slice of rows, so totals and footer repeat on every page.
- Invoice CSS uses **only absolute positioning and block flow** — no CSS grid and no flex
  `gap` — because html2canvas 1.4.1 does not support them.
- The PDF source is an off-screen `.inv-stage` portal-rendered at the viewport origin
  behind the opaque app shell; `ignoreElements` prunes the app shell from the clone.
- Pass `windowWidth` / `windowHeight` but **not** `width` / `height` to html2canvas —
  explicit `width`/`height` override element bounds and break the A4 fill.
- Works on mobile (stacked form/preview with a toggle) and desktop (side by side).
