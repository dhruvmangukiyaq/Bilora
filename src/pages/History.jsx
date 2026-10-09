import { useMemo, useState } from 'react'
import { useStore } from '../store/StoreContext.jsx'
import { Btn, EmptyState, Icon, Toast } from '../components/ui.jsx'
import { computeTotals, fmt } from '../lib/calc.js'

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
                  Rs. {fmt(total)}
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
        </div>
      )}

      {toast ? <Toast>{toast.msg}</Toast> : null}
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
