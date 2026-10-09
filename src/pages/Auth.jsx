import { useState } from 'react'
import { Field, Icon, inputCls } from '../components/ui.jsx'
import { listUsers, signIn, signUp } from '../lib/auth.js'

const MARK = (
  <svg viewBox="0 0 16 16" className="w-[18px] h-[18px]" aria-hidden="true">
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
)

export default function AuthScreen({ onSignedIn }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const users = listUsers()

  const switchMode = (m) => {
    setMode(m)
    setError(null)
    setConfirm('')
  }

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setError(null)

    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setBusy(true)
    try {
      const res = mode === 'signup' ? await signUp(username, password) : await signIn(username, password)
      if (res.error) setError(res.error)
      else onSignedIn(res.user)
    } catch {
      setError('Could not reach browser storage — is it enabled?')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-[404px]">
        {/* brand */}
        <div className="flex items-center justify-center gap-2.5">
          <span className="grid place-items-center w-8 h-8 bg-brand text-white rounded-[5px]">
            {MARK}
          </span>
          <span className="text-[21px] font-bold tracking-[-0.015em] text-ink">Bilora</span>
          <span className="text-[12px] text-mute border-l border-line pl-2.5">GST invoicing</span>
        </div>

        <div className="mt-5 bg-white border border-line p-5 sm:p-6 shadow-[0_1px_2px_rgba(16,18,23,0.04)]">
          {/* mode switch */}
          <div className="inline-flex rounded-[4px] border border-line overflow-hidden mb-5">
            {[
              ['signin', 'Sign in'],
              ['signup', 'Create account'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => switchMode(id)}
                aria-pressed={mode === id}
                className={`h-8 px-3.5 text-[12.5px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 ${
                  mode === id ? 'bg-ink text-white' : 'bg-white text-mute hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <h1 className="text-[16.5px] font-bold tracking-[-0.01em] text-ink">
            {mode === 'signin' ? 'Sign in to continue' : 'Create your account'}
          </h1>
          <p className="mt-1 text-[12.5px] leading-relaxed text-mute">
            {mode === 'signin'
              ? 'Your business details, invoices and customers stay in this browser.'
              : 'You will set up your own business details next, then start invoicing.'}
          </p>

          <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
            <Field
              label="Username"
              required
              hint={mode === 'signup' ? '3–20 chars · a–z 0–9 . – _' : undefined}
            >
              <input
                autoFocus
                className={inputCls(Boolean(error))}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                spellCheck={false}
                placeholder="Your username"
              />
            </Field>

            <Field
              label="Password"
              required
              hint={mode === 'signup' ? 'min 4 chars' : undefined}
            >
              <input
                type="password"
                className={inputCls(Boolean(error))}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder="••••••••"
              />
            </Field>

            {mode === 'signup' ? (
              <Field label="Confirm password" required>
                <input
                  type="password"
                  className={inputCls(Boolean(error))}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </Field>
            ) : null}

            {error ? (
              <p className="flex items-start gap-1.5 text-[12.5px] leading-snug text-brand">
                <Icon name="alert" className="w-4 h-4 mt-[1px] shrink-0" />
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="w-full h-10 inline-flex items-center justify-center gap-1.5 rounded-[4px] bg-brand text-white border border-brand text-[13.5px] font-semibold hover:bg-brand-dark hover:border-brand-dark disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="mt-4 text-center text-[12.5px] text-mute">
            {mode === 'signin' ? (
              <>
                No account yet?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-semibold text-brand hover:underline"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="font-semibold text-brand hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        {users.length ? (
          <p className="mt-3 text-center text-[11.5px] text-mute">
            Accounts in this browser: {users.join(' · ')}
          </p>
        ) : null}
        <p className="mt-1.5 text-center text-[11.5px] text-mute/80">
          No server — everything is saved in this browser only.
        </p>
      </div>
    </div>
  )
}
