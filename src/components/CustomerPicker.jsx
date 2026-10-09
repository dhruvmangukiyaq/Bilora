import { useEffect, useRef, useState } from 'react'
import { Icon } from './ui.jsx'

/** Searchable customer dropdown — pick a saved buyer, no retyping. */
export default function CustomerPicker({ customers, onPick, onClear, value }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const term = q.trim().toLowerCase()
  const list = term
    ? customers.filter((c) =>
        `${c.name} ${c.gstin} ${c.state} ${c.address}`.toLowerCase().includes(term)
      )
    : customers

  return (
    <div ref={box} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <Icon
            name="search"
            className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-mute pointer-events-none"
          />
          <input
            value={open ? q : ''}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQ(e.target.value)
              setOpen(true)
            }}
            placeholder={
              open ? 'Search by name, GSTIN or state…' : value || 'Search saved customers…'
            }
            aria-label="Search saved customers"
            className="w-full h-9 pl-8 pr-2.5 rounded-[4px] border border-line bg-white text-[13px] text-ink placeholder:text-mute/70 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
        </div>
        {value ? (
          <button
            type="button"
            onClick={() => {
              onClear?.()
              setQ('')
            }}
            className="h-9 px-2.5 rounded-[4px] border border-line bg-white text-[12.5px] font-semibold text-mute hover:text-ink hover:border-ink/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35"
          >
            Clear
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-line shadow-lg">
          {list.length === 0 ? (
            <p className="px-3 py-3 text-[12.5px] leading-snug text-mute">
              {customers.length === 0
                ? 'No customers yet — fill in the buyer below and save it to the master.'
                : `Nothing matches “${q}”. Fill the buyer fields below to add a new one.`}
            </p>
          ) : (
            list.map((c) => (
              <button
                key={c.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(c)
                  setOpen(false)
                  setQ('')
                }}
                className="w-full text-left px-3 py-2 border-b border-line/70 last:border-b-0 hover:bg-blush focus:bg-blush focus:outline-none"
              >
                <span className="block text-[13px] font-semibold text-ink truncate">{c.name}</span>
                <span className="block text-[11.5px] text-mute truncate">
                  {c.gstin || 'No GSTIN'} · {c.state || '—'}
                  {c.code ? ` (${c.code})` : ''}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
