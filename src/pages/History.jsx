import { useMemo, useState } from 'react'
import { useStore } from '../store/StoreContext.jsx'
import { Btn, EmptyState, Icon, Toast } from '../components/ui.jsx'
import { computeTotals, fmtAmt, parseDDMMYY, round2 } from '../lib/calc.js'

/** exactly `n` calendar months before `from`, clamped to the last real day
    (31 Mar − 6 months = 30 Sep, not 1 Oct). */
const monthsBack = (from, n) => {
  const d = new Date(from.getTime())
  const day = d.getDate()
  d.setMonth(d.getMonth() - n)
  if (d.getDate() < day) d.setDate(0)
  return d
}

/** The date an invoice is counted against: its printed date first, the moment
    it was saved as a fallback, or null when neither can be read. */
const invoiceTime = (inv) => {
  const printed = parseDDMMYY(inv.date)
  if (printed) return printed.getTime()
  const saved = Number(inv.savedAt)
  return Number.isFinite(saved) && saved > 0 ? saved : null
}

const shortDate = (d) =>
  d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })

export default function History({ onEdit, onNew }) {
  const store = useStore()
  const { invoices, duplicateInvoice, deleteInvoice } = store
  const [q, setQ] = useState('')
  const [toast, setToast] = useState(null)

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    const list = invoices
      .map((inv) => ({
        inv,
        total: computeTotals({
          items: inv.items,
          discount: inv.discount,
          sgstRate: inv.sgstRate,
          cgstRate: inv.cgstRate,
        }).grand,
      }))
      .sort((a, b) => Number(b.inv.savedAt || 0) - Number(a.inv.savedAt || 0))
    if (!term) return list
    return list.filter(({ inv }) =>
      `${inv.no} ${inv.date} ${inv.buyer.name} ${inv.items.map((i) => i.desc).join(' ')}`
        .toLowerCase()
        .includes(term)
    )
  }, [invoices, q])

  /* Totals shown under the list: everything, plus rolling 6-month and
     1-year windows counted back from today. Follows the current search. */
  const summary = useMemo(() => {
    const now = new Date()
    const since6 = monthsBack(now, 6)
    const since12 = monthsBack(now, 12)

    const out = {
      now,
      since6,
      since12,
      all: { amount: 0, count: rows.length },
      m6: { amount: 0, count: 0 },
      y1: { amount: 0, count: 0 },
    }

    for (const { inv, total } of rows) {
      out.all.amount += total
      const at = invoiceTime(inv)
      if (at === null) continue
      if (at >= since6.getTime()) {
        out.m6.amount += total
        out.m6.count += 1
      }
      if (at >= since12.getTime()) {
        out.y1.amount += total
        out.y1.count += 1
      }
    }
    out.all.amount = round2(out.all.amount)
    out.m6.amount = round2(out.m6.amount)
    out.y1.amount = round2(out.y1.amount)
    return out
  }, [rows])

  const remove = (inv) => {
    if (window.confirm(`Delete invoice #${inv.no} for M/s. ${inv.buyer.name || '—'}?`)) {
      deleteInvoice(inv.id)
      setToast({ msg: `Invoice ${inv.no} deleted` })
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-3 sm:px-5 py-5 sm:py-7">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
        <div>
          <h1 className="text-[19px] font-bold tracking-[-0.01em] text-ink">Invoice history</h1>
          <p className="text-[13px] text-mute">
            {invoices.length} invoice{invoices.length === 1 ? '' : 's'} saved in this browser
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Icon
              name="search"
              className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-mute pointer-events-none"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search number, buyer, item…"
              className="w-[210px] sm:w-[260px] h-9 pl-8 pr-2.5 rounded-[4px] border border-line bg-white text-[13px] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </div>
          <Btn variant="solid" icon="plus" onClick={onNew}>
            New
          </Btn>
        </div>
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon="file"
          title="No invoices yet"
          body="Create your first GST invoice — it will show up here with edit, duplicate and delete."
          action={
            <Btn variant="solid" icon="plus" onClick={onNew}>
              Create invoice
            </Btn>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState icon="search" title="No matches" body={`Nothing matches “${q}”.`} />
      ) : (
        <div className="bg-white border border-line">
          <div className="hidden md:grid grid-cols-[64px_86px_1fr_60px_118px_144px] gap-x-3 px-4 h-10 items-center border-b border-line bg-[#FCFCFC] text-[11px] font-semibold uppercase tracking-wider text-mute">
            <span>No.</span>
            <span>Date</span>
            <span>Buyer</span>
            <span>Rows</span>
            <span className="text-right">Grand total</span>
            <span className="text-right">Actions</span>
          </div>

          {rows.map(({ inv, total }) => (
            <div
              key={inv.id}
              className="border-b border-line last:border-b-0 px-4 py-3 md:py-0 md:min-h-[52px] md:grid md:grid-cols-[64px_86px_1fr_60px_118px_144px] md:items-center gap-x-3 hover:bg-surface/60 transition-colors"
            >
              <div className="flex items-baseline gap-2 md:contents">
                <span className="text-[14px] font-bold text-brand tnum">#{inv.no}</span>
                <span className="text-[12.5px] text-mute tnum">{inv.date}</span>
              </div>

              <div className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-ink truncate">
                  {inv.buyer.name || '—'}
                </span>
                <span className="md:hidden block text-[12px] text-mute truncate">
                  {inv.items.length} row{inv.items.length === 1 ? '' : 's'}
                </span>
              </div>

              <span className="hidden md:block text-[12.5px] text-mute tnum">{inv.items.length}</span>

              <div className="flex items-center justify-between gap-3 mt-2 md:mt-0 md:contents">
                <span className="text-[14.5px] font-bold text-ink tnum md:text-right">
                  Rs. {fmtAmt(total)}
                </span>
                <div className="flex items-center gap-1 md:justify-end">
                  <IconBtn label="Edit" icon="edit" onClick={() => onEdit(inv.id)} />
                  <IconBtn
                    label="Duplicate"
                    icon="copy"
                    onClick={() => {
                      duplicateInvoice(inv.id)
                      setToast({ msg: `Duplicated as invoice ${store.state.nextNo}` })
                    }}
                  />
                  <IconBtn label="Delete" icon="trash" danger onClick={() => remove(inv)} />
                </div>
              </div>
            </div>
          ))}

          {/* ------- grand totals: all bills, last 6 months, last 1 year ------- */}
          <div className="border-t-2 border-ink/10 bg-[#FCFCFC] px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-mute">
                Bill totals
                {q.trim() ? (
                  <span className="text-ink"> · {rows.length} of {invoices.length} shown</span>
                ) : null}
              </p>
              <p className="text-[11.5px] text-mute">
                6-month / 1-year windows count back from {shortDate(summary.now)} · amounts include GST
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <Stat
                label="Last 6 months"
                hint={`${shortDate(summary.since6)} – ${shortDate(summary.now)}`}
                amount={summary.m6.amount}
                count={summary.m6.count}
              />
              <Stat
                label="Last 1 year"
                hint={`${shortDate(summary.since12)} – ${shortDate(summary.now)}`}
                amount={summary.y1.amount}
                count={summary.y1.count}
              />
              <Stat
                label="Grand total"
                hint="Every bill in this list"
                amount={summary.all.amount}
                count={summary.all.count}
                accent
              />
            </div>
          </div>
        </div>
      )}

      {toast ? <Toast>{toast.msg}</Toast> : null}
    </div>
  )
}

function Stat({ label, hint, amount, count, accent }) {
  return (
    <div
      className={`rounded-[5px] border px-3.5 py-3 ${
        accent ? 'bg-brand border-brand' : 'bg-white border-line'
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={`text-[11px] font-bold uppercase tracking-[0.07em] ${
            accent ? 'text-white/85' : 'text-mute'
          }`}
        >
          {label}
        </span>
        <span
          className={`text-[11px] tnum ${accent ? 'text-white/80' : 'text-mute'}`}
        >
          {count} bill{count === 1 ? '' : 's'}
        </span>
      </div>
      <p
        className={`mt-1.5 text-[20px] font-extrabold leading-none tnum ${
          accent ? 'text-white' : 'text-ink'
        }`}
      >
        Rs. {fmtAmt(amount)}
      </p>
      <p className={`mt-1.5 text-[11px] tnum ${accent ? 'text-white/75' : 'text-mute'}`}>
        {hint}
      </p>
    </div>
  )
}

function IconBtn({ label, icon, onClick, danger }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`w-8 h-8 grid place-items-center rounded-[4px] border border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 ${
        danger ? 'text-mute hover:text-brand hover:bg-brand/10' : 'text-mute hover:text-ink hover:bg-surface'
      }`}
    >
      <Icon name={icon} className="w-[15px] h-[15px]" />
    </button>
  )
}
