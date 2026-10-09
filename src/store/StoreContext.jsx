import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  STORAGE_KEY,
  blankInvoice,
  defaultBusiness,
  loadState,
  sampleState,
  saveState,
  uid,
} from '../lib/storage'
import { todayDDMMYY } from '../lib/calc'

const StoreCtx = createContext(null)

export function StoreProvider({ children }) {
  const [state, setState] = useState(() => loadState())
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
    }
    saveState(state)
  }, [state])

  const patch = useCallback((fn) => setState((s) => ({ ...s, ...fn(s) })), [])

  const api = useMemo(() => {
    return {
      state,
      business: state.business,
      customers: state.customers,
      invoices: state.invoices,

      /* ---- business settings ---- */
      updateBusiness: (p) =>
        setState((s) => ({ ...s, business: { ...s.business, ...p } })),
      resetBusiness: () =>
        setState((s) => ({ ...s, business: defaultBusiness() })),

      /* ---- customers ---- */
      upsertCustomer: (c) =>
        setState((s) => {
          const exists = c.id && s.customers.some((x) => x.id === c.id)
          const item = { ...c, id: c.id || uid() }
          return {
            ...s,
            customers: exists
              ? s.customers.map((x) => (x.id === item.id ? item : x))
              : [item, ...s.customers],
          }
        }),
      deleteCustomer: (id) =>
        setState((s) => ({ ...s, customers: s.customers.filter((x) => x.id !== id) })),

      /* ---- invoices ---- */
      newInvoice: () => ({
        ...blankInvoice(state.nextNo, todayDDMMYY()),
        sgstRate: state.business.sgstRate ?? 2.5,
        cgstRate: state.business.cgstRate ?? 2.5,
      }),
      saveInvoice: (inv) => {
        const stamped = { ...inv, id: inv.id || uid(), savedAt: Date.now() }
        setState((s) => {
          const exists = s.invoices.some((x) => x.id === stamped.id)
          const invoices = exists
            ? s.invoices.map((x) => (x.id === stamped.id ? stamped : x))
            : [stamped, ...s.invoices]
          const no = parseInt(String(stamped.no).replace(/\D/g, ''), 10)
          const nextNo = Number.isFinite(no) ? Math.max(s.nextNo, no + 1) : s.nextNo
          return { ...s, invoices, nextNo }
        })
        return stamped
      },
      deleteInvoice: (id) =>
        setState((s) => ({ ...s, invoices: s.invoices.filter((x) => x.id !== id) })),
      duplicateInvoice: (id) =>
        setState((s) => {
          const src = s.invoices.find((x) => x.id === id)
          if (!src) return s
          const copy = {
            ...structuredClone(src),
            id: uid(),
            no: String(s.nextNo),
            date: todayDDMMYY(),
            savedAt: Date.now(),
          }
          return { ...s, invoices: [copy, ...s.invoices], nextNo: s.nextNo + 1 }
        }),

      /* ---- data ---- */
      replaceAll: (next) =>
        setState((s) => ({
          ...s,
          ...next,
          business: { ...defaultBusiness(), ...(next.business || {}) },
        })),
      restoreSample: () => setState(() => sampleState()),
      wipe: () =>
        setState(() => ({
          v: 1,
          business: defaultBusiness(),
          customers: [],
          invoices: [],
          nextNo: 1,
        })),
    }
  }, [state])

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

export { STORAGE_KEY }
