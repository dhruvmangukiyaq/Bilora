import { createPortal } from 'react-dom'
import { useLayoutEffect, useRef, useState } from 'react'
import InvoicePage, { A4, ROWS_PER_PAGE } from './InvoicePage.jsx'

/** How many A4 sheets this invoice needs. */
export const pageCount = (itemCount) => Math.max(1, Math.ceil((itemCount || 0) / ROWS_PER_PAGE))

/**
 * On-screen A4 preview — the same document component, scaled with a CSS
 * transform to fit the available width. Nothing here is used for export.
 */
export function ScaledPreview({ business, invoice, totals, pages = 1 }) {
  const boxRef = useRef(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return undefined
    const update = () => setScale(Math.max(0.18, Math.min(1, (el.clientWidth - 8) / A4.w)))
    update()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    ro?.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  const gap = 26
  const height = (A4.h * pages + gap * (pages - 1)) * scale

  return (
    <div ref={boxRef} className="w-full flex justify-center">
      <div style={{ width: A4.w * scale, height, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {Array.from({ length: pages }, (_, i) => (
            <div key={i} style={{ marginBottom: i < pages - 1 ? gap : 0 }}>
              {pages > 1 ? (
                <div
                  className="text-[11px] font-semibold text-mute/80 uppercase tracking-wider"
                  style={{ height: 18, lineHeight: '18px' }}
                >
                  Page {i + 1} of {pages}
                </div>
              ) : null}
              <div style={{ boxShadow: '0 1px 3px rgba(16,18,23,.10), 0 14px 34px rgba(16,18,23,.10)' }}>
                <InvoicePage
                  business={business}
                  invoice={invoice}
                  totals={totals}
                  pageIndex={i}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * The real export/print source: full-size A4 pages parked behind the app shell
 * at viewport 0,0. html2canvas rasterises these; the browser prints them.
 */
export function ExportStage({ business, invoice, totals, pages = 1, stageRef }) {
  return createPortal(
    <div className="inv-stage" ref={stageRef} aria-hidden="true">
      {Array.from({ length: pages }, (_, i) => (
        <InvoicePage key={i} business={business} invoice={invoice} totals={totals} pageIndex={i} />
      ))}
    </div>,
    document.body
  )
}
