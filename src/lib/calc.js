/* ------------------------------------------------------------------
   Calculation + formatting helpers for the GST invoice.
   ------------------------------------------------------------------ */

/** Round to the nearest whole rupee. */
export const round0 = (n) => {
  const v = Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.round(v)
}

/** Round to 2 decimals (paise), guarding float noise: 12.345 -> 12.35 */
export const round2 = (n) => {
  const v = Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.round((v + Number.EPSILON) * 100) / 100
}

/** Parse anything typed into a numeric field into a safe number. */
export const num = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

/** 81986 -> "81,986" (Indian digit grouping) */
export const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(round0(n))

/** 867.58 -> "867.58" with Indian grouping when needed */
export const fmtDec = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(num(n))

/** Money with paise only when they exist: 81986 -> "81,986", 1952.5 -> "1,952.50" */
export const fmtAmt = (n) => {
  const v = num(n)
  if (Number.isInteger(v)) return fmt(v)
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)
}

/** Quantity keeps decimals: 867.58 */
export const fmtQty = (n) => {
  const v = num(n)
  return Number.isInteger(v) ? String(v) : new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(v)
}

/* ---------------- Indian number to words ---------------- */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
]
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

const two = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`)

const three = (n) => {
  const h = Math.floor(n / 100)
  const rest = n % 100
  const parts = []
  if (h) parts.push(`${ONES[h]} Hundred`)
  if (rest) parts.push(two(rest))
  return parts.join(' ')
}

/** 81986 -> "Eighty One Thousand Nine Hundred Eighty Six" */
export const inWords = (amount) => {
  let n = round0(Math.abs(num(amount)))
  if (n === 0) return 'Zero'
  const parts = []
  const crore = Math.floor(n / 10000000)
  n %= 10000000
  const lakh = Math.floor(n / 100000)
  n %= 100000
  const thousand = Math.floor(n / 1000)
  n %= 1000
  if (crore) parts.push(`${crore} Crore`)
  if (lakh) parts.push(two(lakh) + ' Lakh')
  if (thousand) parts.push(two(thousand) + ' Thousand')
  if (n) parts.push(three(n))
  return parts.join(' ')
}

/** Grand total in words, Indian format — "... Rupees Only", and paise when
    there are any: "... Rupees and Fifty Paise Only". */
export const amountInWords = (amount) => {
  const v = round2(Math.abs(num(amount)))
  const rupees = Math.floor(v)
  const paise = Math.round((v - rupees) * 100)
  let out = `${inWords(rupees)} ${rupees === 1 ? 'Rupee' : 'Rupees'}`
  if (paise > 0) out += ` and ${inWords(paise)} Paise`
  return `${out} Only`
}

/* ---------------- invoice maths ---------------- */

/** Amount column = Pics x Rate, rounded to the nearest rupee. */
export const lineAmount = (pics, rate) => round0(num(pics) * num(rate))

/**
 * Full invoice calculation.
 * discount is a PERCENTAGE (5 -> 5% of the gross is cut off).
 * Gross = sum(line amounts)
 * Total = Gross - (discount % x Gross)
 * SGST + CGST are charged on Total (IGST is not used in this app) and are
 * kept to 2 decimals, so any paise is printed on the bill.
 * Grand Total = Total + SGST + CGST.
 */
export function computeTotals({
  items = [],
  discount = 0,
  sgstRate = 2.5,
  cgstRate = 2.5,
}) {
  const gross = items.reduce((sum, it) => sum + lineAmount(it.pics, it.rate), 0)
  const discountPct = Math.min(Math.max(num(discount), 0), 100)
  const disc = Math.min(round0((gross * discountPct) / 100), gross)
  const total = gross - disc

  const sgst = round2((total * num(sgstRate)) / 100)
  const cgst = round2((total * num(cgstRate)) / 100)

  const grand = round2(total + sgst + cgst)

  return {
    gross,
    discountPct,
    discount: disc,
    total,
    sgst,
    cgst,
    grand,
    sgstRate: num(sgstRate),
    cgstRate: num(cgstRate),
  }
}

/* ---------------- dates ---------------- */

/** today -> 07/10/26 */
export const todayDDMMYY = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`
}

export const isValidDDMMYY = (s) => /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{2}$/.test(String(s ?? '').trim())

/** keep typing shaped as DD/MM/YY */
export const maskDate = (v) => {
  const d = String(v ?? '').replace(/\D/g, '').slice(0, 6)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}
