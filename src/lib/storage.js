/* localStorage persistence + first-run seed data (no backend). */

export const STORAGE_KEY = 'bilora.gst.v1'

export const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

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
    business,
    customers: [purvir],
    invoices: [invoice],
    nextNo: 8,
  }
}

/** The first-run demo data (Silken Saga + invoice #7). */
export const sampleState = () => seed()

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !parsed.business) return seed()
    return {
      ...seed(),
      ...parsed,
      business: { ...defaultBusiness(), ...parsed.business },
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
      nextNo: Number(parsed.nextNo) || 1,
    }
  } catch {
    return seed()
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
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
