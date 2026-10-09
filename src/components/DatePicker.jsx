import { useEffect, useRef, useState } from 'react'
import { Icon, inputCls } from './ui.jsx'
import { maskDate } from '../lib/calc.js'

const MON = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const pad = (n) => String(n).padStart(2, '0')

/** "09/10/26" -> a real Date, or null when it is not a valid date. */
function parse(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(String(s ?? '').trim())
  if (!m) return null
  const day = Number(m[1])
  const mon = Number(m[2])
  const year = 2000 + Number(m[3])
  if (mon < 1 || mon > 12 || day < 1) return null
  const d = new Date(year, mon - 1, day)
  return d.getFullYear() === year && d.getMonth() === mon - 1 && d.getDate() === day
    ? d
    : null
}

/** Date -> "09/10/26" (the format the invoice prints). */
const fmt = (d) =>
  `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`

const sameDay = (a, b) =>
  a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/**
 * Invoice date field — type as DD/MM/YY, or pick from the calendar.
 *
 * The calendar is a plain popover (no native widget) so it matches the app
 * theme, keeps the DD/MM/YY value the invoice needs, and works the same on
 * every browser. Closes on outside click / Escape.
 */
export default function DatePicker({ value, onChange, invalid = false }) {
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(() => parse(value) ?? new Date())
  const box = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const selected = parse(value)
  const today = new Date()
  const y = cursor.getFullYear()
  const m = cursor.getMonth()

  const lead = new Date(y, m, 1).getDay()
  const total = new Date(y, m + 1, 0).getDate()
  const cells = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)

  const step = (n) => setCursor(new Date(y, m + n, 1))
  const pick = (day) => {
    onChange(fmt(new Date(y, m, day)))
    setOpen(false)
  }

  return (
    <div ref={box} className="relative">
      <input
        className={inputCls(invalid)}
        style={{ paddingRight: '32px' }}
        value={value}
        onChange={(e) => onChange(maskDate(e.target.value))}
        inputMode="numeric"
        aria-label="Invoice date, DD/MM/YY"
      />
      <button
        type="button"
        onClick={() => {
          setCursor(selected ?? new Date())
          setOpen((o) => !o)
        }}
        aria-label={open ? 'Close the calendar' : 'Open the calendar'}
        aria-expanded={open}
        className="absolute right-0 top-0 h-full px-2.5 text-mute hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 rounded-[4px]"
      >
        <Icon name="calendar" className="w-[15px] h-[15px]" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full mt-1 z-40 w-[250px] bg-white border border-line shadow-lg rounded-[4px]">
          <div className="flex items-center justify-between px-1.5 h-9 border-b border-line">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => step(-1)}
              className="grid place-items-center w-7 h-7 rounded-[4px] text-mute hover:text-ink hover:bg-ink/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35"
            >
              <Icon name="chevron" className="w-4 h-4 rotate-180" />
            </button>
            <span className="text-[13px] font-semibold text-ink">
              {MON[m]} {y}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => step(1)}
              className="grid place-items-center w-7 h-7 rounded-[4px] text-mute hover:text-ink hover:bg-ink/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35"
            >
              <Icon name="chevron" className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 px-2 pt-1.5">
            {DOW.map((d, i) => (
              <span
                key={`${d}${i}`}
                className="text-center text-[10.5px] font-semibold text-mute"
              >
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5 px-2 pb-2 pt-1">
            {cells.map((d, i) => {
              if (!d) return <span key={`e${i}`} className="h-7" />
              const isSel = sameDay(selected, new Date(y, m, d))
              const isToday = sameDay(today, new Date(y, m, d))
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => pick(d)}
                  className={`h-7 rounded-[4px] text-[12.5px] tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                    isSel
                      ? 'bg-brand text-white font-semibold'
                      : isToday
                        ? 'text-brand font-semibold ring-1 ring-brand/35 hover:bg-blush'
                        : 'text-ink hover:bg-blush'
                  }`}
                >
                  {d}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between px-2 h-8 border-t border-line bg-[#FCFCFC]">
            <button
              type="button"
              onClick={() => {
                onChange(fmt(new Date()))
                setOpen(false)
              }}
              className="text-[11.5px] font-semibold text-brand hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded-[3px]"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[11.5px] font-semibold text-mute hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded-[3px]"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
