/* localStorage persistence (no backend). Each user has their own data key
   (see lib/auth.js), so nothing is shared between accounts. */

export const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

/** Blank business — what a brand-new account starts with (no sample data). */
export const emptyBusiness = () => ({
  headerLeft: '॥ જય શ્રી સ્વામિનારાયણ ॥',
  headerCenter: '॥ શ્રી ગણેશાય નમઃ ॥',
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

export function readImageScaled(file, maxW = 520) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not read that image'))
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/png'))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
