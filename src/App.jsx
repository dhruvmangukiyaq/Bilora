import { useState } from 'react'
import Studio from './pages/Studio.jsx'
import History from './pages/History.jsx'
import Customers from './pages/Customers.jsx'
import Settings from './pages/Settings.jsx'
import AuthScreen from './pages/Auth.jsx'
import { StoreProvider, useStore } from './store/StoreContext.jsx'
import { endSession, getSession } from './lib/auth.js'
import { Btn, Icon } from './components/ui.jsx'

const NAV = [
  { id: 'invoice', label: 'New invoice' },
  { id: 'history', label: 'Invoice history' },
  { id: 'customers', label: 'Customers' },
  { id: 'settings', label: 'Business settings' },
]

export default function App() {
  const [session, setSession] = useState(() => getSession())

  /* not signed in → nothing but the login screen */
  if (!session) return <AuthScreen onSignedIn={(user) => setSession({ user })} />

  /* keyed by user so switching accounts reloads only that user's data */
  return (
    <StoreProvider key={session.user} user={session.user}>
      <Shell username={session.user} onLogout={() => { endSession(); setSession(null) }} />
    </StoreProvider>
  )
}

function Shell({ username, onLogout }) {
  const store = useStore()

  /* business setup not confirmed yet → the setup screen owns the app.
     (gated on the explicit onboarded flag, not on the name field, so the user
     can fill in the whole form before the invoice studio opens) */
  const setupOpen = !store.onboarded

  const [route, setRoute] = useState({ page: 'invoice', editId: null, nonce: 0 })
  const page = setupOpen ? 'settings' : route.page

  const go = (next) => setRoute((r) => ({ page: next, editId: null, nonce: r.nonce }))
  const editInvoice = (id) => setRoute({ page: 'invoice', editId: id, nonce: 0 })
  const newInvoice = () =>
    setRoute((r) => ({ page: 'invoice', editId: null, nonce: r.nonce + 1 }))

  /* "Save & start invoicing" on the setup screen → unlock + open the studio */
  const finishSetup = () => {
    store.completeOnboarding()
    setRoute((r) => ({ page: 'invoice', editId: null, nonce: r.nonce + 1 }))
  }

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
                const active = page === n.id
                const locked = setupOpen && n.id !== 'settings'
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => go(n.id)}
                    disabled={locked}
                    title={locked ? 'Set up your business details first' : undefined}
                    aria-current={active ? 'page' : undefined}
                    className={`relative h-14 px-2.5 sm:px-3 text-[13px] whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 ${
                      active ? 'text-brand font-semibold' : 'text-mute hover:text-ink'
                    } ${locked ? 'opacity-40 cursor-not-allowed hover:text-mute' : ''}`}
                  >
                    {n.label}
                    {active ? (
                      <span className="absolute left-2 right-2 bottom-0 h-[2px] bg-brand" />
                    ) : null}
                  </button>
                )
              })}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden md:flex items-center gap-1.5 text-[12px] text-mute pl-3 border-l border-line max-w-[160px]">
                <Icon name="users" className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{username}</span>
              </span>
              <Btn
                variant="quiet"
                icon="logout"
                onClick={onLogout}
                title="Log out"
                aria-label="Log out"
              >
                <span className="hidden sm:inline">Logout</span>
              </Btn>
              <Btn
                variant="solid"
                icon="plus"
                onClick={newInvoice}
                disabled={setupOpen}
                title={setupOpen ? 'Set up your business details first' : 'Start a new invoice'}
              >
                <span className="hidden sm:inline">New invoice</span>
                <span className="sm:hidden">New</span>
              </Btn>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 min-w-0">
        {page === 'invoice' ? (
          <Studio
            key={`${route.editId ?? 'new'}:${route.nonce}`}
            editId={route.editId}
            onOpenHistory={() => go('history')}
          />
        ) : null}
        {page === 'history' ? <History onEdit={editInvoice} onNew={newInvoice} /> : null}
        {page === 'customers' ? <Customers /> : null}
        {page === 'settings' ? (
          <Settings setupMode={setupOpen} onSetupDone={finishSetup} />
        ) : null}
      </main>
    </div>
  )
}
