import { useState } from 'react'
import Studio from './pages/Studio.jsx'
import History from './pages/History.jsx'
import Customers from './pages/Customers.jsx'
import Settings from './pages/Settings.jsx'
import { Btn, Icon } from './components/ui.jsx'

const NAV = [
  { id: 'invoice', label: 'New invoice' },
  { id: 'history', label: 'Invoice history' },
  { id: 'customers', label: 'Customers' },
  { id: 'settings', label: 'Business settings' },
]

export default function App() {
  const [route, setRoute] = useState({ page: 'invoice', editId: null, nonce: 0 })

  const go = (page) => setRoute((r) => ({ page, editId: null, nonce: r.nonce }))
  const editInvoice = (id) => setRoute({ page: 'invoice', editId: id, nonce: 0 })
  const newInvoice = () =>
    setRoute((r) => ({ page: 'invoice', editId: null, nonce: r.nonce + 1 }))

  return (
    <div className="app-shell min-h-screen flex flex-col bg-surface">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-line">
        <div className="mx-auto w-full max-w-[1680px] px-3 sm:px-5">
          <div className="h-14 flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={() => go('invoice')}
              className="flex items-center gap-2.5 shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 rounded-[4px]"
            >
              <span className="grid place-items-center w-7 h-7 bg-brand text-white rounded-[4px]">
                <svg viewBox="0 0 16 16" className="w-4 h-4" aria-hidden="true">
                  <path
                    d="M3.5 2.5h6L12.5 5.5v8h-9v-11Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.5 6.5h5M5.5 8.5h5M5.5 10.5h3"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="flex items-baseline gap-2">
                <span className="text-[15.5px] font-bold tracking-[-0.01em] text-ink">Bilora</span>
                <span className="hidden sm:inline text-[11.5px] text-mute border-l border-line pl-2">
                  GST invoicing
                </span>
              </span>
            </button>

            <nav className="flex-1 min-w-0 flex items-center gap-0.5 overflow-x-auto">
              {NAV.map((n) => {
                const active = route.page === n.id
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => go(n.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`relative h-14 px-2.5 sm:px-3 text-[13px] whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 ${
                      active ? 'text-brand font-semibold' : 'text-mute hover:text-ink'
                    }`}
                  >
                    {n.label}
                    {active ? (
                      <span className="absolute left-2 right-2 bottom-0 h-[2px] bg-brand" />
                    ) : null}
                  </button>
                )
              })}
            </nav>

            <Btn variant="solid" icon="plus" onClick={newInvoice} className="shrink-0">
              <span className="hidden sm:inline">New invoice</span>
              <span className="sm:hidden">New</span>
            </Btn>
          </div>
        </div>
      </header>

      <main className="flex-1 min-w-0">
        {route.page === 'invoice' ? (
          <Studio
            key={`${route.editId ?? 'new'}:${route.nonce}`}
            editId={route.editId}
            onOpenHistory={() => go('history')}
          />
        ) : null}
        {route.page === 'history' ? <History onEdit={editInvoice} onNew={newInvoice} /> : null}
        {route.page === 'customers' ? <Customers /> : null}
        {route.page === 'settings' ? <Settings /> : null}
      </main>
    </div>
  )
}
