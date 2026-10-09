/* PDF export: html2canvas at high scale -> jsPDF A4, colour, one canvas per page.

   The pages live in an off-screen stage laid out at true A4 size (no CSS
   transform), so the raster is pixel-identical to the preview. The app UI is
   excluded from the clone via `ignoreElements`, so nothing else can bleed in. */

export async function renderToCanvas(node, scale = 3) {  if (document.fonts && document.fonts.ready) {
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
    // would capture a region larger than the A4 sheet.
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
 * @param {HTMLElement[]} nodes  one A4-sized DOM node per page
 * @param {string} fileName      e.g. Invoice-7-PurvirCreation.pdf
 */
export async function exportPDF(nodes, fileName, { scale = 3, onProgress } = {}) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })

  for (let i = 0; i < nodes.length; i += 1) {
    onProgress?.(i + 1, nodes.length)
    const canvas = await renderToCanvas(nodes[i], scale)
    const data = canvas.toDataURL('image/png')
    if (i > 0) pdf.addPage()
    pdf.addImage(data, 'PNG', 0, 0, 210, 297, undefined, 'FAST')
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
