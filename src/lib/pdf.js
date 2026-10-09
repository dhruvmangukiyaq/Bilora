/* PDF export: html2canvas at high scale -> jsPDF A5, colour, one canvas per page.

   The pages live in an off-screen stage laid out at true A4 geometry (794 x 1123
   px, no CSS transform) so the raster is pixel-identical to the preview; the
   sheet is then placed into an A5 page (148 x 210 mm), which is the same paper
   ratio, so the whole design simply prints smaller. The app UI is excluded from
   the clone via `ignoreElements`, so nothing else can bleed in. */

/** Paper the invoice prints on. A5 = 148 x 210 mm (A4 halved). */
export const PAPER = { name: 'A5', wMm: 148, hMm: 210 }

export async function renderToCanvas(node, scale = 3) {
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready
    } catch {
      /* fonts are whatever we have */
    }
  }
  const html2canvas = (await import('html2canvas')).default
  return html2canvas(node, {
    scale,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    // Size the clone window so stacked (multi-page) sheets all fit inside it.
    // Do NOT pass width/height here — those override the element bounds and
    // would capture a region larger than the sheet.
    windowWidth: 1400,
    windowHeight: 3600,
    scrollX: 0,
    scrollY: 0,
    ignoreElements: (el) => {
      if (!el || el.nodeType !== 1) return false
      if (el.id === 'root' || el.classList.contains('app-shell')) return true
      return false
    },
  })
}

/**
 * @param {HTMLElement[]} nodes  one sheet-sized DOM node per page
 * @param {string} fileName      e.g. Invoice-7-PurvirCreation.pdf
 */
export async function exportPDF(nodes, fileName, { scale = 3, onProgress } = {}) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: PAPER.name.toLowerCase(),
    compress: true,
  })

  for (let i = 0; i < nodes.length; i += 1) {
    onProgress?.(i + 1, nodes.length)
    const canvas = await renderToCanvas(nodes[i], scale)
    const data = canvas.toDataURL('image/png')
    if (i > 0) pdf.addPage()
    /* fit the sheet to the page width — same paper ratio, so nothing distorts
       and the leftover sliver (A5 is 0.7 mm taller) stays white at the bottom */
    const h = (PAPER.wMm * canvas.height) / canvas.width
    pdf.addImage(data, 'PNG', 0, 0, PAPER.wMm, h, undefined, 'FAST')
  }

  pdf.save(fileName)
  return fileName
}

export function invoiceFileName(no, buyerName) {
  const n = String(no ?? '').trim() || 'Draft'
  const who =
    String(buyerName ?? '')
      .trim()
      .replace(/[^A-Za-z0-9]+/g, '')
      .slice(0, 40) || 'Customer'
  return `Invoice-${n}-${who}.pdf`
}
