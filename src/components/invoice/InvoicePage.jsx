import './invoice.css'
import { amountInWords, fmt, fmtAmt, fmtDec, fmtQty, lineAmount, num } from '../../lib/calc'

/* A4 at 96dpi */
export const A4 = { w: 794, h: 1123 }
export const ROW_H = 33
export const ROWS_PER_PAGE = 17

const WA_ICON = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/></svg>`
)}`

/* column geometry — px, sums to the 774px document width */
const COLS = [
  { key: 'no', left: 0, w: 54, head: 'No.', align: 'mid' },
  { key: 'desc', left: 54, w: 274, head: 'Description', align: 'desc' },
  { key: 'hsn', left: 328, w: 96, head: 'HSN', align: 'mid' },
  { key: 'pics', left: 424, w: 96, head: 'Pics', align: 'num' },
  { key: 'rate', left: 520, w: 110, head: 'Rate', align: 'num' },
  { key: 'amt', left: 630, w: 144, head: 'Amount', align: 'num' },
]

/* ---------- theme helpers ---------- */
const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)))
const toRgb = (hex) => {
  const h = String(hex || '#D32F2F').replace('#', '')
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [
    parseInt(f.slice(0, 2), 16) || 0,
    parseInt(f.slice(2, 4), 16) || 0,
    parseInt(f.slice(4, 6), 16) || 0,
  ]
}
const toHex = ([r, g, b]) =>
  `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`
const darken = (hex, amt) => toHex(toRgb(hex).map((v) => v * (1 - amt)))
const lighten = (hex, amt) => toHex(toRgb(hex).map((v) => v + (255 - v) * amt))

export const themeVars = (red, pink) => {
  const base = red || '#D32F2F'
  const [r, g, b] = toRgb(base)
  return {
    '--red': base,
    '--pink': pink || '#F4C7C3',
    '--red-label': darken(base, 0.12),
    '--red-deep': darken(base, 0.36),
    '--hair': `rgba(${r}, ${g}, ${b}, 0.55)`,
  }
}
export { lighten }

export default function InvoicePage({ business, invoice, totals, pageIndex = 0 }) {
  const b = business
  const inv = invoice
  const t = totals
  const items = inv.items || []
  const start = pageIndex * ROWS_PER_PAGE
  const slice = items.slice(start, start + ROWS_PER_PAGE)
  const rows = Array.from({ length: ROWS_PER_PAGE }, (_, i) => slice[i] ?? null)

  const infoCells = [
    { l: 'GSTIN :', v: b.gstin, r: 0, c: 0, hi: true },
    { l: 'State :', v: b.state, r: 0, c: 1, hi: true },
    { l: 'Invoice No. :', v: inv.no, r: 0, c: 2 },
    { l: 'PAN :', v: b.pan, r: 1, c: 0, hi: true },
    { l: 'Code :', v: b.stateCode, r: 1, c: 1, hi: true },
    { l: 'Invoice Date :', v: inv.date, r: 1, c: 2 },
    { l: '', v: '', r: 2, c: 0 },
    { l: '', v: '', r: 2, c: 1 },
    { l: 'P. Ch. No. :', v: inv.challanNo, r: 2, c: 2 },
  ]

  const pos = (cell) => ({
    left: cell.c * 258,
    top: cell.r * 18,
    width: 258,
  })
  const cls = (cell) =>
    [cell.c === 2 ? 'c3' : '', `r${cell.r + 1}`, cell.hi ? 'hi' : ''].filter(Boolean).join(' ')

  const totRow = (label, value, i) => (
    <div className="tot-row" style={{ top: i * 27.5 }} key={label}>
      <span className="lbl">{label}</span>
      <span className="val">{value}</span>
    </div>
  )

  return (
    <div
      className={`inv-page${business.valueFont === 'hand' ? ' hand' : ''}`}
      style={themeVars(b.themeRed, b.themePink)}
    >
      <div className="inv-doc">
        {/* 1 — invocation + WhatsApp */}
        <div className="b b-greeting">
          <span className="g-side g-left guj">{b.headerLeft}</span>
          <span className="g-center guj">{b.headerCenter}</span>
          <span className="g-side g-right">
            <img className="g-wa" src={WA_ICON} alt="" />
            <span className="g-phone">{b.phone}</span>
          </span>
        </div>

        {/* 2 — business name */}
        <div className="b b-brand">
          <div className="brand-name">{b.name}</div>
        </div>

        {/* 3 — address strip */}
        <div className="b b-address">{b.address}</div>

        {/* 4 — business info grid */}
        <div className="b b-info">
          {infoCells.map((c, i) => (
            <div className={`ic ${cls(c)}`} style={pos(c)} key={i}>
              {c.l ? (
                <>
                  <span className="lbl">{c.l}</span> <span className="val">{c.v}</span>
                </>
              ) : null}
            </div>
          ))}
        </div>

        {/* 5 — TAX INVOICE bar */}
        <div className="b b-taxbar">
          <div className="tc pink" style={{ left: 0, width: 774 }}>
            <div className="tax-invoice">TAX INVOICE</div>
          </div>
        </div>

        {/* 6 — buyer */}
        <div className="b b-buyer">
          <div className="buyer-left">
            <div className="buyer-line">
              <span className="lbl">M/s.</span>
              <span className="buyer-name val">{inv.buyer.name}</span>
            </div>
            <div className="buyer-line">
              <span className="lbl">Add :</span>
              <span className="buyer-addr val">{inv.buyer.address}</span>
            </div>
          </div>
          <div className="buyer-right">
            <div className="bc" style={{ top: 0 }}>
              <span className="lbl">GST No. :</span> <span className="val">{inv.buyer.gstin}</span>
            </div>
            <div className="bc" style={{ top: 28 }}>
              <span className="lbl">State :</span> <span className="val">{inv.buyer.state}</span>
            </div>
            <div className="bc" style={{ top: 56 }}>
              <span className="lbl">Code :</span> <span className="val">{inv.buyer.code}</span>
            </div>
          </div>
        </div>

        {/* 7 — items table */}
        <div className="b b-thead">
          {COLS.map((c) => (
            <div
              className={`th ${c.key === 'amt' ? 'c6' : ''}`}
              style={{ left: c.left, width: c.w }}
              key={c.key}
            >
              {c.head}
            </div>
          ))}
        </div>

        <div className="b b-tbody">
          {rows.map((it, i) => (
            <div className="it-row" style={{ top: i * ROW_H }} key={i}>
              <div className="it-cell mid" style={{ left: 0, width: 54 }}>
                {it ? start + i + 1 : ''}
              </div>
              <div className="it-cell desc" style={{ left: 54, width: 274 }}>
                {it?.desc ?? ''}
              </div>
              <div className="it-cell mid" style={{ left: 328, width: 96 }}>
                {it?.hsn ?? ''}
              </div>
              <div className="it-cell num val" style={{ left: 424, width: 96 }}>
                {it && String(it.pics).trim() !== '' ? fmtQty(it.pics) : ''}
              </div>
              <div className="it-cell num val" style={{ left: 520, width: 110 }}>
                {it && String(it.rate) !== '' ? fmtDec(it.rate) : ''}
              </div>
              <div className="it-cell num val" style={{ left: 630, width: 144 }}>
                {it && String(it.pics) !== '' && String(it.rate) !== ''
                  ? fmt(lineAmount(it.pics, it.rate))
                  : ''}
              </div>
            </div>
          ))}
          {[54, 328, 424, 520, 630].map((x) => (
            <div className="col-line" style={{ left: x }} key={x} />
          ))}
        </div>

        {/* 8 — footer: bank + totals */}
        <div className="b b-footer">
          <div className="f-left">
            <div className="f-pinkbar">BANK DETAILS</div>
            <div className="bank-row hi" style={{ top: 24 }}>
              <span className="lbl">Bank Name</span>
              <span className="val">{b.bankName}</span>
            </div>
            <div className="bank-row hi" style={{ top: 47 }}>
              <span className="lbl">A/c. No.</span>
              <span className="val">{b.acNo}</span>
            </div>
            <div className="bank-row hi" style={{ top: 70 }}>
              <span className="lbl">IFSC Code</span>
              <span className="val">{b.ifsc}</span>
            </div>
            <div className="words">
              <span className="lbl">Amount in words :</span>
              <span className="wtext">{amountInWords(t.grand)}</span>
            </div>
          </div>

          <div className="f-right">
            {totRow(
              t.discountPct > 0 ? `Discount @ ${fmtDec(t.discountPct)} %` : 'Discount',
              t.discount > 0 ? fmt(t.discount) : '',
              0
            )}
            {totRow('Total', fmt(t.total), 1)}
            {totRow(`SGST @ ${fmtDec(t.sgstRate)} %`, fmtAmt(t.sgst), 2)}
            {totRow(`CGST @ ${fmtDec(t.cgstRate)} %`, fmtAmt(t.cgst), 3)}
            <div className="tot-grand">
              <span className="lbl">Grand Total</span>
              <span className="val">{fmtAmt(t.grand)}</span>
            </div>
          </div>
        </div>

        {/* 9 — signature */}
        <div className="b b-bottom">
          <div className="bot-left" />
          <div className="bot-right">
            {b.signature ? <img className="sig-img" src={b.signature} alt="" /> : null}
            <div className="for-line">For, {String(b.name || '').toUpperCase()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
