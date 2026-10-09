import { useRef, useState } from 'react'
import { useStore } from '../store/StoreContext.jsx'
import { Btn, Field, Icon, Section, Toast, inputCls } from '../components/ui.jsx'
import { GSTIN_MSG, PAN_MSG, isValidGstin, isValidPan } from '../lib/validation.js'
import { codeForState } from '../lib/states.js'
import { downloadJSON, readImageScaled, readJSONFile } from '../lib/storage.js'
import { lighten } from '../components/invoice/InvoicePage.jsx'

const numIn = (extra = '') =>
  `${inputCls(false)} text-right tnum ${extra}`

export default function Settings() {
  const store = useStore()
  const { business, state } = store
  const set = (p) => store.updateBusiness(p)
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  const flash = (msg, tone) => {
    setToast({ msg, tone })
    setTimeout(() => setToast(null), 2600)
  }

  const onSignature = async (file) => {
    if (!file) return
    try {
      const dataUrl = await readImageScaled(file, 520)
      set({ signature: dataUrl })
      flash('Signature / stamp added')
    } catch {
      flash('Could not read that image', 'err')
    }
  }

  const onImport = async (file) => {
    if (!file) return
    setBusy(true)
    try {
      const data = await readJSONFile(file)
      if (!data || !data.business) throw new Error('bad file')
      store.replaceAll(data)
      flash('Data imported')
    } catch {
      flash('That file is not a Bilora export', 'err')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="mx-auto w-full max-w-[980px] px-3 sm:px-5 py-5 sm:py-7 space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[19px] font-bold tracking-[-0.01em] text-ink">Business settings</h1>
          <p className="text-[13px] text-mute">
            Set once — every new invoice starts from these defaults. Changes save automatically.
          </p>
        </div>
        <span className="text-[12px] text-mute inline-flex items-center gap-1.5">
          <Icon name="check" className="w-4 h-4 text-emerald-600" />
          Stored in this browser
        </span>
      </div>

      <Section title="Business identity">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Business name" className="sm:col-span-2">
            <input className={inputCls(false)} value={business.name} onChange={(e) => set({ name: e.target.value })} placeholder="Silken Saga" />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <textarea
              rows={2}
              className="w-full px-2.5 py-2 rounded-[4px] border border-line bg-white text-[13px] text-ink focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 resize-y"
              value={business.address}
              onChange={(e) => set({ address: e.target.value })}
              placeholder="Plot, street, area, city"
            />
          </Field>
          <Field
            label="GSTIN"
            error={business.gstin && !isValidGstin(business.gstin) ? GSTIN_MSG : null}
            hint={business.gstin && isValidGstin(business.gstin) ? 'valid' : '15 characters'}
          >
            <input
              className={`${inputCls(business.gstin && !isValidGstin(business.gstin))} uppercase`}
              value={business.gstin}
              maxLength={15}
              onChange={(e) => set({ gstin: e.target.value.toUpperCase() })}
              placeholder="24ANWPM9595R1ZF"
            />
          </Field>
          <Field
            label="PAN"
            error={business.pan && !isValidPan(business.pan) ? PAN_MSG : null}
            hint={business.pan && isValidPan(business.pan) ? 'valid' : '10 characters'}
          >
            <input
              className={`${inputCls(business.pan && !isValidPan(business.pan))} uppercase`}
              value={business.pan}
              maxLength={10}
              onChange={(e) => set({ pan: e.target.value.toUpperCase() })}
              placeholder="ANWPM9595R"
            />
          </Field>
          <Field label="State">
            <input
              className={inputCls(false)}
              list="settings-states"
              value={business.state}
              onChange={(e) => {
                const s = e.target.value
                set({ state: s, stateCode: codeForState(s) || business.stateCode })
              }}
              placeholder="Gujarat"
            />
          </Field>
          <Field label="State code">
            <input
              className={inputCls(false)}
              value={business.stateCode}
              inputMode="numeric"
              onChange={(e) => set({ stateCode: e.target.value.replace(/\D/g, '').slice(0, 2) })}
              placeholder="24"
            />
          </Field>
          <datalist id="settings-states">
            <option value="Gujarat" />
            <option value="Maharashtra" />
            <option value="Rajasthan" />
            <option value="Delhi" />
            <option value="Karnataka" />
            <option value="Tamil Nadu" />
            <option value="Madhya Pradesh" />
            <option value="Uttar Pradesh" />
            <option value="West Bengal" />
            <option value="Telangana" />
            <option value="Andhra Pradesh" />
          </datalist>
        </div>
      </Section>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Section title="Invoice header">
          <div className="space-y-3">
            <Field label="Top-left line" hint="Gujarati">
              <input className={inputCls(false)} value={business.headerLeft} onChange={(e) => set({ headerLeft: e.target.value })} />
            </Field>
            <Field label="Top-centre line" hint="Gujarati">
              <input className={inputCls(false)} value={business.headerCenter} onChange={(e) => set({ headerCenter: e.target.value })} />
            </Field>
            <Field label="WhatsApp / phone" hint="top-right">
              <input className={inputCls(false)} value={business.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="98254 06884" />
            </Field>
          </div>
        </Section>

        <Section title="Bank details">
          <div className="space-y-3">
            <Field label="Bank name">
              <input className={inputCls(false)} value={business.bankName} onChange={(e) => set({ bankName: e.target.value })} placeholder="Punjab National Bank" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="A/c. No.">
                <input className={inputCls(false)} value={business.acNo} onChange={(e) => set({ acNo: e.target.value })} placeholder="3749002100103811" />
              </Field>
              <Field label="IFSC code">
                <input className={`${inputCls(false)} uppercase`} value={business.ifsc} onChange={(e) => set({ ifsc: e.target.value.toUpperCase() })} placeholder="PUNB0374900" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="SGST %">
                <input className={numIn()} value={business.sgstRate} inputMode="decimal" onChange={(e) => set({ sgstRate: e.target.value.replace(/[^0-9.]/g, '') })} />
              </Field>
              <Field label="CGST %">
                <input className={numIn()} value={business.cgstRate} inputMode="decimal" onChange={(e) => set({ cgstRate: e.target.value.replace(/[^0-9.]/g, '') })} />
              </Field>
            </div>
            <p className="text-[12px] text-mute">Default tax rates for new invoices. IGST is not used — SGST + CGST always apply.</p>
          </div>
        </Section>
      </div>

      <Section title="Signature, theme & data">
        <div className="grid md:grid-cols-2 gap-5">
          {/* signature */}
          <div>
            <span className="block text-[12px] font-semibold text-ink/75 mb-1.5">
              Signature / stamp
            </span>
            <div className="border border-dashed border-line bg-[#FCFCFC] h-28 grid place-items-center p-2 relative overflow-hidden">
              {business.signature ? (
                <img src={business.signature} alt="Signature" className="max-h-24 max-w-full object-contain" />
              ) : (
                <span className="text-[12.5px] text-mute text-center px-4">
                  Blank space above “For, {business.name || '—'}” on the invoice.
                </span>
              )}
            </div>
            <div className="mt-2 flex gap-2">
              <label className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-[4px] bg-white border border-line text-[13px] font-semibold text-ink hover:border-ink/35 cursor-pointer focus-within:ring-2 focus-within:ring-brand/35">
                <Icon name="upload" className="w-[15px] h-[15px]" />
                {business.signature ? 'Replace' : 'Upload'}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => onSignature(e.target.files?.[0])}
                />
              </label>
              {business.signature ? (
                <Btn variant="outline" onClick={() => set({ signature: '' })}>
                  Remove
                </Btn>
              ) : null}
            </div>
          </div>

          {/* theme */}
          <div>
            <span className="block text-[12px] font-semibold text-ink/75 mb-1.5">Theme colour</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={business.themeRed}
                onChange={(e) =>
                  set({ themeRed: e.target.value, themePink: lighten(e.target.value, 0.72) })
                }
                className="w-12 h-9 p-1 bg-white border border-line rounded-[4px] cursor-pointer"
                aria-label="Invoice theme colour"
              />
              <code className="text-[12.5px] font-semibold text-mute uppercase tnum">
                {business.themeRed}
              </code>
              <Btn variant="outline" onClick={() => set({ themeRed: '#D32F2F', themePink: '#F4C7C3' })}>
                Reset
              </Btn>
            </div>
            <div className="mt-2 flex h-7 overflow-hidden border border-line">
              <span className="flex-1" style={{ background: business.themeRed }} />
              <span className="flex-1" style={{ background: business.themePink }} />
              <span className="flex-1 bg-white" />
            </div>

            <span className="block text-[12px] font-semibold text-ink/75 mt-4 mb-1.5">
              Filled-in values
            </span>
            <div className="inline-flex rounded-[4px] border border-line overflow-hidden">
              {[
                ['clean', 'Clean'],
                ['hand', 'Handwriting'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => set({ valueFont: id })}
                  className={`h-9 px-3 text-[13px] font-semibold transition-colors ${
                    business.valueFont === id ? 'bg-ink text-white' : 'bg-white text-mute hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <hr className="my-5 border-line" />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12.5px] font-semibold text-ink mr-1">Data</span>
          <Btn variant="outline" icon="download" onClick={() => downloadJSON(state, 'bilora-backup.json')}>
            Export JSON
          </Btn>
          <label className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-[4px] bg-white border border-line text-[13px] font-semibold text-ink hover:border-ink/35 cursor-pointer focus-within:ring-2 focus-within:ring-brand/35">
            <Icon name="upload" className="w-[15px] h-[15px]" />
            {busy ? 'Reading…' : 'Import JSON'}
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => onImport(e.target.files?.[0])}
            />
          </label>
          <Btn
            variant="outline"
            icon="file"
            onClick={() => {
              if (window.confirm('Replace everything with the sample data (Silken Saga, invoice #7)?')) {
                store.restoreSample()
                flash('Sample data restored')
              }
            }}
          >
            Restore sample
          </Btn>
          <Btn
            variant="danger"
            icon="trash"
            onClick={() => {
              if (window.confirm('Erase all invoices, customers and settings from this browser?')) {
                store.wipe()
                flash('Everything erased')
              }
            }}
          >
            Erase all data
          </Btn>
        </div>
      </Section>

      {toast ? <Toast tone={toast.tone === 'err' ? 'err' : 'ok'}>{toast.msg}</Toast> : null}
    </div>
  )
}
