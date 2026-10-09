import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  blankInvoice,
  cutImageBackground,
  emptyBusiness,
  emptyState,
  loadState,
  sampleState,
  saveState,
  uid,
} from '../lib/storage'
import { userKey } from '../lib/auth'
import { todayDDMMYY } from '../lib/calc'

const StoreCtx = createContext(null)

/** Remount with `key={user}` so switching accounts reloads that user's data. */
export function StoreProvider({ user, children }) {
  const key = userKey(user)
  const [state, setState] = useState(() => loadState(key))

  useEffect(() => {
    saveState(state, key)
  }, [state, key])

  /* A signature uploaded before the paper-cut existed still carries its grey
     background — cut it away once, on load. Idempotent: an image that is
     already a cut-out is detected and left exactly as it is, so this settles
     after one pass. */
  const signature = state.business?.signature
  useEffect(() => {
    if (typeof signature !== 'string' || !signature.startsWith('data:image')) return undefined
    let alive = true
    cutImageBackground(signature)
      .then(({ url, cut }) => {
        if (alive && cut) setState((s) => ({ ...s, business: { ...s.business, signature: url } }))
      })
      .catch(() => {
        /* unreadable image — keep it as it is */
      })
    return () => {
      alive = false
    }
  }, [signature])

  const patch = useCallback((fn) => setState((s) => ({ ...s, ...fn(s) })), [])

  const api = useMemo(() => {
    return {
      state,
      business: state.business,
      customers: state.customers,
      invoices: state.invoices,
      onboarded: state.onboarded === true,

      /* ---- business settings ---- */
      updateBusiness: (p) =>
        setState((s) => ({ ...s, business: { ...s.business, ...p } })),
      resetBusiness: () =>
        setState((s) => ({ ...s, business: emptyBusiness(), onboarded: false })),
      /* the user pressed "Save & start invoicing" on the setup screen */
      completeOnboarding: () => setState((s) => ({ ...s, onboarded: true })),

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
          onboarded:
            next.onboarded === true || Boolean(String(next.business?.name ?? '').trim()),
          business: { ...emptyBusiness(), ...(next.business || {}) },
        })),
      restoreSample: () => setState(() => sampleState()),
      wipe: () => setState(() => emptyState()),
    }
  }, [state])

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
