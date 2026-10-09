/* Validation helpers — GSTIN (15 chars), PAN, required fields. */

export const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
export const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/

export const cleanGstin = (v) => String(v ?? '').trim().toUpperCase()
export const cleanPan = (v) => String(v ?? '').trim().toUpperCase()

export const isValidGstin = (v) => GSTIN_RE.test(cleanGstin(v))
export const isValidPan = (v) => PAN_RE.test(cleanPan(v))

export const GSTIN_MSG = 'GSTIN must be 15 characters, e.g. 24ANWPM9595R1ZF'
export const PAN_MSG = 'PAN must be 10 characters, e.g. ANWPM9595R'

/** Fields a finished invoice needs before it can be saved/exported. */
export function validateInvoice(inv, business) {
  const errors = {}
  if (!String(inv.buyer?.name ?? '').trim()) errors.buyerName = 'Buyer name is required'
  if (inv.buyer?.gstin && !isValidGstin(inv.buyer.gstin)) errors.buyerGstin = GSTIN_MSG
  if (!String(inv.no ?? '').trim()) errors.no = 'Invoice number is required'
  if (!inv.items?.length) errors.items = 'Add at least one item'
  else if (!inv.items.some((i) => String(i.desc ?? '').trim())) errors.items = 'Every item needs a description'
  if (business?.gstin && !isValidGstin(business.gstin)) errors.businessGstin = GSTIN_MSG
  return errors
}
