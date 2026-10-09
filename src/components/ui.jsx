import { forwardRef } from 'react'

/* ---------------- icons (16px, stroke = currentColor) ---------------- */

const PATHS = {
  plus: 'M8 3.5v9M3.5 8h9',
  trash: 'M3.5 4.5h9M6.5 4.5V3h3v1.5M5 4.5l.6 8h4.8l.6-8',
  download: 'M8 3v7m0 0 3-3m-3 3L5 7M3.5 12.5h9',
  printer: 'M4.5 6V3.5h7V6M4.5 11.5h7v2h-7v-2Zm-1-5.5h9a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1h-1',
  search: 'M7.2 12.4a5.2 5.2 0 1 0 0-10.4 5.2 5.2 0 0 0 0 10.4ZM11 11l3 3',
  copy: 'M5.5 5.5h7v7h-7v-7Zm-2 7v-7a1.5 1.5 0 0 1 1.5-1.5h6',
  edit: 'm10.5 3.5 2 2-6.5 6.5-2.6.6.6-2.6 6.5-6.5ZM3.5 13.5h9',
  save: 'M4 3.5h6.5L12.5 5.5v7h-9v-9Zm2 0v3h4v-3M5.5 12.5v-3h5v3',
  x: 'm4 4 8 8M12 4l-8 8',
  check: 'm3.5 8.5 3 3 6-7',
  upload: 'M8 12.5v-7m0 0 3 3m-3-3L5 8.5M3.5 12.5v.5h9v-.5',
  chevron: 'm6 4 4 4-4 4',
  alert: 'M8 5.5v3.5M8 11h.01M7 2.8 1.8 12h10.4L9 2.8a1.1 1.1 0 0 0-2 0Z',
  file: 'M4 2.5h5L12.5 6v7.5h-8.5v-11Zm5 0V6h3.5',
  users: 'M6 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm-4 5c0-2 1.8-3.2 4-3.2s4 1.2 4 3.2M11 3.4a2.4 2.4 0 0 1 0 4.6M12 12.6c0-1.4-.5-2.3-1.4-2.9',
  settings:
    'M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm5.2-1.4.9.5-.9 1.6-1-.3a5 5 0 0 1-1.4.8l-.2 1H8.3l-.2-1a5 5 0 0 1-1.4-.8l-1 .3-.9-1.6.9-.5a5 5 0 0 1 0-1.6l-.9-.5.9-1.6 1 .3a5 5 0 0 1 1.4-.8l.2-1h1.9l.2 1c.5.2 1 .5 1.4.8l1-.3.9 1.6-.9.5c.1.5.1 1.1 0 1.6Z',
  clock: 'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12Zm0-9v4l2.5 1.5',
  whatsapp:
    'M12.9 9.4c-.2-.1-1.1-.5-1.3-.6-.2-.1-.3-.1-.5.1l-.7.8c-.1.2-.3.2-.5.1a5 5 0 0 1-2.5-2.2c-.2-.3 0-.4.1-.5l.4-.5.2-.4c.1-.2 0-.3 0-.4l-.6-1.4c-.2-.4-.4-.4-.5-.4h-.4c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.2.7 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.3M8 14.4A6.4 6.4 0 0 1 4.9 13L3 13.5l.5-1.9A6.4 6.4 0 1 1 8 14.4Z',
}

export function Icon({ name, className = 'w-4 h-4', ...rest }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d={PATHS[name] ?? ''} />
    </svg>
  )
}

/* ---------------- buttons ---------------- */

const BTN = {
  solid:
    'bg-brand text-white border border-brand hover:bg-brand-dark hover:border-brand-dark disabled:opacity-50',
  outline: 'bg-white text-ink border border-line hover:border-ink/35 hover:bg-white',
  quiet: 'bg-transparent text-mute border border-transparent hover:text-ink hover:bg-ink/5',
  danger: 'bg-white text-brand border border-brand/40 hover:bg-brand hover:text-white',
}

export function Btn({
  variant = 'outline',
  icon,
  children,
  className = '',
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-[4px] text-[13px] font-semibold tracking-[0.005em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 disabled:cursor-not-allowed ${BTN[variant]} ${className}`}
      {...rest}
    >
      {icon ? <Icon name={icon} className="w-[15px] h-[15px] shrink-0" /> : null}
      {children}
    </button>
  )
}

/* ---------------- form building blocks ---------------- */

export const inputCls = (error) =>
  `w-full h-9 px-2.5 rounded-[4px] border bg-white text-[13px] text-ink placeholder:text-mute/60 transition-shadow focus:outline-none focus:ring-2 focus:ring-brand/15 ${
    error ? 'border-brand bg-brand/[0.04]' : 'border-line focus:border-brand'
  }`

export const inputNum =
  'w-full h-9 px-2.5 rounded-[4px] border border-line bg-white text-[13px] text-ink text-right [font-variant-numeric:tabular-nums] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15'

export function Field({ label, error, hint, required, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-[12px] font-semibold text-ink/75">
          {label}
          {required ? <span className="text-brand"> *</span> : null}
        </span>
        {hint ? <span className="text-[11px] text-mute">{hint}</span> : null}
      </span>
      {children}
      {error ? (
        <span className="mt-1 flex items-start gap-1 text-[11.5px] leading-snug text-brand">
          <Icon name="alert" className="w-3.5 h-3.5 mt-[1px] shrink-0" />
          {error}
        </span>
      ) : null}
    </label>
  )
}

export function Section({ title, children, action, className = '' }) {
  return (
    <section className={`bg-white border border-line ${className}`}>
      <header className="flex items-center justify-between gap-3 px-4 h-11 border-b border-line bg-[#FCFCFC]">
        <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

export function EmptyState({ title, body, action, icon = 'file' }) {
  return (
    <div className="border border-dashed border-line bg-white/60 px-6 py-12 text-center">
      <div className="mx-auto mb-3 grid place-items-center w-10 h-10 rounded-full bg-brand/10 text-brand">
        <Icon name={icon} className="w-5 h-5" />
      </div>
      <p className="text-[14px] font-semibold text-ink">{title}</p>
      {body ? <p className="mt-1 text-[13px] text-mute max-w-sm mx-auto">{body}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function Toast({ tone = 'ok', children }) {
  return (
    <div
      className={`pointer-events-none fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 h-10 rounded-[4px] text-[13px] font-semibold shadow-lg ${
        tone === 'ok' ? 'bg-ink text-white' : 'bg-brand text-white'
      }`}
      role="status"
    >
      <Icon name={tone === 'ok' ? 'check' : 'alert'} className="w-4 h-4" />
      {children}
    </div>
  )
}
