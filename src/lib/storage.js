/* localStorage persistence (no backend). Each user has their own data key
   (see lib/auth.js), so nothing is shared between accounts. */

export const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

/** Blank business — what a brand-new account starts with (no sample data).
    Nothing is pre-filled: the user types their own header lines, GSTIN, bank… */
export const emptyBusiness = () => ({
  headerLeft: '',
  headerCenter: '',
  phone: '',
  name: '',
  address: '',
  gstin: '',
  pan: '',
  state: '',
  stateCode: '',
  bankName: '',
  acNo: '',
  ifsc: '',
  signature: '',
  themeRed: '#D32F2F',
  themePink: '#F4C7C3',
  valueFont: 'clean', // 'clean' | 'hand'
  sgstRate: 2.5,
  cgstRate: 2.5,
})

/** The sample (Silken Saga) business — only ever loaded by "Restore sample". */
export const defaultBusiness = () => ({
  headerLeft: '॥ જય શ્રી સ્વામિનારાયણ ॥',
  headerCenter: '॥ શ્રી ગણેશાય નમઃ ॥',
  phone: '98254 06884',
  name: 'Silken Saga',
  address:
    'PL-16TO18 ANJANI IND EST, V-4-C3 BHARTHANA KOSAD, Surat, (M Corp+OG) (Part) Surat.',
  gstin: '24ANWPM9595R1ZF',
  pan: 'ANWPM9595R',
  state: 'Gujarat',
  stateCode: '24',
  bankName: 'Punjab National Bank',
  acNo: '3749002100103811',
  ifsc: 'PUNB0374900',
  signature: '',
  themeRed: '#D32F2F',
  themePink: '#F4C7C3',
  valueFont: 'clean', // 'clean' | 'hand'
  sgstRate: 2.5,
  cgstRate: 2.5,
})

export const blankItem = () => ({ id: uid(), desc: '', hsn: '', pics: '', rate: '' })

export const blankInvoice = (no = 1, date = '') => ({
  id: uid(),
  no: String(no),
  date,
  challanNo: '',
  buyer: { name: '', address: '', gstin: '', state: '', code: '', phone: '' },
  items: [blankItem()],
  discount: '',
  sgstRate: 2.5,
  cgstRate: 2.5,
  savedAt: null,
})

/* ---------------- seed: the sample invoice from the brief ---------------- */

function seed() {
  const business = defaultBusiness()

  const purvir = {
    id: uid(),
    name: 'Purvir Creation',
    address: 'Surat, Gujarat',
    gstin: '',
    state: 'Gujarat',
    code: '24',
    phone: '',
  }

  const invoice = {
    ...blankInvoice(7, '01/09/25'),
    challanNo: '',
    buyer: {
      name: purvir.name,
      address: purvir.address,
      gstin: purvir.gstin,
      state: purvir.state,
      code: purvir.code,
      phone: purvir.phone,
    },
    items: [{ id: uid(), desc: 'JOBWORK', hsn: '', pics: '867.58', rate: '90' }],
    discount: '',
    savedAt: Date.now(),
  }

  return {
    v: 1,
    onboarded: true, // sample business is already filled in
    business,
    customers: [purvir],
    invoices: [invoice],
    nextNo: 8,
  }
}

/** The first-run demo data (Silken Saga + invoice #7). */
export const sampleState = () => seed()

/** Empty store for a brand-new account: no invoices, no customers, no sample. */
export function emptyState() {
  return {
    v: 1,
    onboarded: false, // forces Business Settings until "Save & start invoicing"
    business: emptyBusiness(),
    customers: [],
    invoices: [],
    nextNo: 1,
  }
}

/** Load one user's data. `key` comes from auth.userKey(username). */
export function loadState(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !parsed.business) return emptyState()
    return {
      ...emptyState(),
      ...parsed,
      onboarded: parsed.onboarded === true,
      business: { ...emptyBusiness(), ...parsed.business },
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
      nextNo: Number(parsed.nextNo) || 1,
    }
  } catch {
    return emptyState()
  }
}

export function saveState(state, key) {
  try {
    localStorage.setItem(key, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

/* ---------------- export / import JSON ---------------- */

export function downloadJSON(state, filename = 'bilora-invoices.json') {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function readJSONFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)))
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

/* ---------------- signature image: downscale + store as dataURL ---------------- */

/** Perceived luminance of one RGBA pixel (0–255). */
const lumaOf = (d, i) => (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000

/** Separable max/min over a rectangular window — traces how the paper tone
    moves across a photo (shadows, vignette, uneven light) without ever being
    dragged down by the thin ink strokes sitting on it. */
function extremumField(src, w, h, r, takeMax) {
  const tmp = new Float32Array(w * h)
  const out = new Float32Array(w * h)
  const pick = takeMax ? Math.max : Math.min
  for (let y = 0; y < h; y += 1) {
    const row = y * w
    for (let x = 0; x < w; x += 1) {
      const x0 = x - r < 0 ? 0 : x - r
      const x1 = x + r > w - 1 ? w - 1 : x + r
      let v = src[row + x0]
      for (let k = x0 + 1; k <= x1; k += 1) v = pick(v, src[row + k])
      tmp[row + x] = v
    }
  }
  for (let x = 0; x < w; x += 1) {
    for (let y = 0; y < h; y += 1) {
      const y0 = y - r < 0 ? 0 : y - r
      const y1 = y + r > h - 1 ? h - 1 : y + r
      let v = tmp[y0 * w + x]
      for (let k = y0 + 1; k <= y1; k += 1) v = pick(v, tmp[k * w + x])
      out[y * w + x] = v
    }
  }
  return out
}

/**
 * Cut the paper out of a photographed / scanned signature: the ink stays,
 * everything that reads as paper (including the shadows on it) becomes
 * transparent, so only the writing prints on the bill — on any page, in the
 * PDF and in the print-out alike.
 *
 * Returns true when the background was actually removed; false when the image
 * was left alone (already a cut-out PNG, or not light paper with dark ink).
 */
export function stripPaperBackground(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  const n = w * h

  const lumaBuf = new Float32Array(n)
  const hist = new Uint32Array(256)
  let alreadyCut = false
  for (let i = 0, p = 0; p < n; p += 1, i += 4) {
    if (d[i + 3] < 250) alreadyCut = true
    const l = lumaOf(d, i)
    lumaBuf[p] = l
    hist[Math.min(255, Math.round(l))] += 1
  }
  if (alreadyCut) return false // already a transparent cut-out — don't touch it

  const pct = (q) => {
    const target = n * q
    let acc = 0
    for (let v = 0; v < 256; v += 1) {
      acc += hist[v]
      if (acc >= target) return v
    }
    return 255
  }
  const bg = pct(0.9) // the paper tone
  const ink = pct(0.03) // the darkest ink
  if (bg < 145) return false // dark photo — cutting would destroy it
  const range = bg - ink
  if (range < 30) return false // no ink on paper to separate

  const radius = Math.max(8, Math.round(Math.min(w, h) / 14))
  const bgMax = extremumField(lumaBuf, w, h, radius, true)
  const tol = Math.min(26, Math.max(8, range * 0.1)) // paper texture + noise band
  const cap = bg + 8 // ignore glare brighter than the paper

  for (let p = 0, i = 0; p < n; p += 1, i += 4) {
    if (d[i + 3] === 0) continue
    const local = bgMax[p] < cap ? bgMax[p] : cap
    const denom = local - tol - ink
    let a = denom > 8 ? (local - tol - lumaBuf[p]) / denom : 0
    /* lift the ramp: everything that only reads as paper texture / noise falls
       away completely, ink keeps its full strength and the strokes get a clean,
       continuous edge instead of a grey fringe */
    a = (a - 0.24) / 0.76
    if (a <= 0) a = 0
    else if (a > 1) a = 1
    d[i + 3] = Math.round(d[i + 3] * a)
  }
  ctx.putImageData(img, 0, 0)
  return true
}

/**
 * Cut the paper out of an image that is already in memory (a stored dataURL).
 * Returns `{ url, cut }` — `cut` tells whether the background was removed.
 *
 * Safe to re-run: an image that has already been cut is detected and left
 * exactly as it is.
 */
export async function cutImageBackground(dataUrl, maxW = 520) {
  const { canvas, ctx, w, h } = await paintScaled(dataUrl, maxW)
  const cut = stripPaperBackground(ctx, w, h)
  return { url: canvas.toDataURL('image/png'), cut }
}

/**
 * Read an uploaded image, scale it down and (by default) cut the paper
 * background out of it. Resolves `{ url, cut }`.
 */
export async function readImageScaled(file, maxW = 520, { cutout = true } = {}) {
  const dataUrl = await readAsDataURL(file)
  if (!cutout) {
    const { canvas } = await paintScaled(dataUrl, maxW)
    return { url: canvas.toDataURL('image/png'), cut: false }
  }
  return cutImageBackground(dataUrl, maxW)
}

/** Decode + draw an image source onto a canvas at (at most) `maxW` wide. */
function paintScaled(src, maxW) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onerror = () => reject(new Error('Could not read that image'))
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width)
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      resolve({ canvas, ctx, w, h })
    }
    img.src = src
  })
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(file)
  })
}
