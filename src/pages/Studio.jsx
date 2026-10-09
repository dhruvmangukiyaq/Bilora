import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store/StoreContext.jsx'
import { Btn, Field, Icon, Section, Toast, inputCls } from '../components/ui.jsx'
import CustomerPicker from '../components/CustomerPicker.jsx'
import { ExportStage, ScaledPreview, pageCount } from '../components/invoice/preview.jsx'
import {
  amountInWords,
  computeTotals,
  fmt,
  fmtDec,
  lineAmount,
  maskDate,
} from '../lib/calc.js'
import { blankItem } from '../lib/storage.js'
import { GSTIN_MSG, isValidGstin, validateInvoice } from '../lib/validation.js'
import { codeForState } from '../lib/states.js'
import { exportPDF, invoiceFileName } from '../lib/pdf.js'

const smInput = (error) =>
  `w-full h-8 px-2 rounded-[4px] border bg-white text-[13px] text-ink placeholder:text-mute/60 focus:outline-none focus:ring-2 focus:ring-brand/15 ${
    error ? 'border-brand bg-brand/[0.04]' : 'border-line focus:border-brand'
  }`
const smNum =
  'w-full h-8 px-2 rounded-[4px] border border-line bg-white text-[13px] text-ink text-right [font-variant-numeric:tabular-nums] placeholder:text-mute/60 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15'

const SubLabel = ({ children }) => (
  <span className="block text-[11px] font-semibold text-mute mb-1">{children}</span>
)

export default function Studio({ editId, onOpenHistory }) {
  const store = useStore()
  const { business, customers } = store

  const [inv, setInv] = useState(() => {
    const found = editId ? store.state.invoices.find((i) => i.id === editId) : null
    return found ? structuredClone(found) : store.newInvoice()
  })
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(null)
  const [toast, setToast] = useState(null)
  const [tab, setTab] = useState('form')

  const stageRef = useRef(null)

  const totals = useMemo(
    () =>
      computeTotals({
        items: inv.items,
        discount: inv.discount,
        sgstRate: inv.sgstRate,
        cgstRate: inv.cgstRate,
      }),
    [inv]
  )

  const pages = pageCount(inv.items.length)
  const errors = useMemo(() => validateInvoice(inv, business), [inv, business])
  const gstinBad = inv.buyer.gstin && !isValidGstin(inv.buyer.gstin)

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  /* ------------------------- edits ------------------------- */

  const patch = (p) => setInv((v) => ({ ...v, ...p }))
  const patchBuyer = (p) => setInv((v) => ({ ...v, buyer: { ...v.buyer, ...p } }))
  const setItem = (id, p) =>
    setInv((v) => ({
      ...v,
      items: v.items.map((it) => (it.id === id ? { ...it, ...p } : it)),
    }))
  const addItem = () => setInv((v) => ({ ...v, items: [...v.items, blankItem()] }))
  const removeItem = (id) =>
    setInv((v) => ({ ...v, items: v.items.filter((it) => it.id !== id) }))

  const pickCustomer = (c) =>
    patchBuyer({
      name: c.name,
      address: c.address,
      gstin: c.gstin,
      state: c.state,
      code: c.code,
      phone: c.phone,
    })

  const setBuyerState = (name) =>
    patchBuyer({ state: name, code: codeForState(name) || inv.buyer.code })

  const saveBuyerToMaster = () => {
    const existing = customers.find(
      (c) => c.name.trim().toLowerCase() === inv.buyer.name.trim().toLowerCase()
    )
    store.upsertCustomer({ id: existing?.id, ...inv.buyer })
    setToast({ msg: existing ? 'Customer updated' : 'Customer saved to master' })
  }

  /* ------------------------- actions ------------------------- */

  const check = () => {
    setSubmitted(true)
    if (Object.keys(errors).length) {
      setToast({ tone: 'err', msg: 'Fix the highlighted fields first' })
      return false
    }
    return true
  }

  const save = () => {
    if (!check()) return
    const stamped = store.saveInvoice(inv)
    setInv(stamped)
    setToast({ msg: `Invoice ${stamped.no} saved` })
  }

  const downloadPdf = async () => {
    if (!check()) return
    setBusy('pdf')
    try {
      const nodes = Array.from(stageRef.current?.querySelectorAll('.inv-page') ?? [])
      if (!nodes.length) throw new Error('No rendered pages')
      await exportPDF(nodes, invoiceFileName(inv.no, inv.buyer.name), { scale: 3 })
      setToast({ msg: 'Colour PDF downloaded' })
    } catch (err) {
      console.error(err)
      setToast({ tone: 'err', msg: 'PDF export failed — try Print instead' })
    } finally {
      setBusy(null)
    }
  }

  const print = () => window.print()

  const share = () => {
    const digits = String(inv.buyer.phone || business.phone || '').replace(/\D/g, '')
    const msg = [
      `*Invoice ${inv.no}* — ${business.name}`,
      `M/s. ${inv.buyer.name || '—'}`,
      `Date: ${inv.date}`,
      `Grand Total: Rs. ${fmt(totals.grand)}`,
      amountInWords(totals.grand),
    ].join('\n')
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  /* ------------------------- render ------------------------- */

  return (
    <>
      <div className="h-[calc(100dvh-56px)] flex flex-col">
        {/* toolbar */}
        <div className="shrink-0 border-b border-line bg-white">
          <div className="px-3 sm:px-5 py-2.5 flex items-center gap-3 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-[14px] font-semibold text-ink leading-tight">
                Invoice #{inv.no || '—'}
                {inv.savedAt ? (
                  <span className="ml-2 align-middle text-[10.5px] font-bold uppercase tracking-wide text-mute border border-line px-1.5 py-[1px] rounded-[3px]">
                    Saved
                  </span>
                ) : (
                  <span className="ml-2 align-middle text-[10.5px] font-bold uppercase tracking-wide text-brand border border-brand/30 bg-brand/5 px-1.5 py-[1px] rounded-[3px]">
                    Draft
                  </span>
                )}
              </h1>
              <p className="text-[12px] text-mute truncate">
                {inv.buyer.name || 'No buyer yet'} · Rs. {fmt(totals.grand)} ·{' '}
                <span className="whitespace-nowrap">
                  {pages} page{pages > 1 ? 's' : ''}
                </span>
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="lg:hidden flex rounded-[4px] border border-line overflow-hidden">
                {['form', 'preview'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`h-9 px-3 text-[12.5px] font-semibold capitalize transition-colors ${
                      tab === t ? 'bg-ink text-white' : 'bg-white text-mute'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <Btn variant="quiet" icon="clock" onClick={onOpenHistory} className="hidden md:inline-flex">
                History
              </Btn>
              <Btn variant="outline" icon="save" onClick={save}>
                <span className="hidden sm:inline">Save</span>
              </Btn>
              <Btn variant="outline" icon="printer" onClick={print}>
                <span className="hidden sm:inline">Print</span>
              </Btn>
              <Btn variant="outline" icon="whatsapp" onClick={share} className="hidden sm:inline-flex">
                WhatsApp
              </Btn>
              <Btn variant="solid" icon="download" onClick={downloadPdf} disabled={busy === 'pdf'}>
                {busy === 'pdf' ? 'Building…' : 'Download PDF'}
              </Btn>
            </div>
          </div>
        </div>

        {/* split view */}
        <div className="flex-1 min-h-0 flex">
          {/* -------- form rail -------- */}
          <aside
            className={`rail w-full lg:w-[432px] shrink-0 overflow-y-auto border-r border-line bg-surface p-3 sm:p-4 space-y-3 ${
              tab === 'preview' ? 'hidden lg:block' : ''
            }`}
          >
            <Section title="Invoice details">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Invoice No." required error={submitted && errors.no}>
                  <input
                    className={inputCls(submitted && errors.no)}
                    value={inv.no}
                    inputMode="numeric"
                    onChange={(e) => patch({ no: e.target.value })}
                    placeholder="7"
                  />
                </Field>
                <Field label="Invoice date" hint="DD/MM/YY" error={submitted && errors.date}>
                  <input
                    className={inputCls(submitted && errors.date)}
                    value={inv.date}
                    onChange={(e) => patch({ date: maskDate(e.target.value) })}
                    placeholder="01/09/25"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="P. Ch. No." hint="purchase challan" className="col-span-2">
                  <input
                    className={inputCls(false)}
                    value={inv.challanNo}
                    onChange={(e) => patch({ challanNo: e.target.value })}
                    placeholder="Optional"
                  />
                </Field>
              </div>
            </Section>

            <Section
              title="Buyer"
              action={
                inv.buyer.name ? (
                  <button
                    type="button"
                    onClick={saveBuyerToMaster}
                    className="text-[12px] font-semibold text-brand hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35"
                  >
                    Save to master
                  </button>
                ) : null
              }
            >
              <div className="space-y-3">
                <div>
                  <SubLabel>Pick a saved customer</SubLabel>
                  <CustomerPicker
                    customers={customers}
                    value={inv.buyer.name}
                    onPick={pickCustomer}
                    onClear={() =>
                      patchBuyer({ name: '', address: '', gstin: '', state: '', code: '', phone: '' })
                    }
                  />
                </div>

                <Field label="M/s." required error={submitted && errors.buyerName}>
                  <input
                    className={inputCls(submitted && errors.buyerName)}
                    value={inv.buyer.name}
                    onChange={(e) => patchBuyer({ name: e.target.value })}
                    placeholder="Buyer name"
                  />
                </Field>

                <Field label="Add :">
                  <textarea
                    rows={2}
                    className="w-full px-2.5 py-2 rounded-[4px] border border-line bg-white text-[13px] text-ink placeholder:text-mute/60 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 resize-y"
                    value={inv.buyer.address}
                    onChange={(e) => patchBuyer({ address: e.target.value })}
                    placeholder="Buyer address"
                  />
                </Field>

                <Field
                  label="GST No."
                  error={(submitted || gstinBad) && errors.buyerGstin}
                  hint={
                    inv.buyer.gstin
                      ? isValidGstin(inv.buyer.gstin)
                        ? 'valid GSTIN'
                        : 'invalid'
                      : GSTIN_MSG.split(',')[0]
                  }
                >
                  <div className="relative">
                    <input
                      className={`${inputCls((submitted || gstinBad) && errors.buyerGstin)} pr-8 uppercase`}
                      value={inv.buyer.gstin}
                      onChange={(e) => patchBuyer({ gstin: e.target.value.toUpperCase() })}
                      placeholder="24AAAAA0000A1Z5"
                      maxLength={15}
                    />
                    {inv.buyer.gstin ? (
                      <span
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${
                          isValidGstin(inv.buyer.gstin) ? 'text-emerald-600' : 'text-brand'
                        }`}
                      >
                        <Icon name={isValidGstin(inv.buyer.gstin) ? 'check' : 'x'} className="w-4 h-4" />
                      </span>
                    ) : null}
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="State">
                    <input
                      className={inputCls(false)}
                      list="indian-states"
                      value={inv.buyer.state}
                      onChange={(e) => setBuyerState(e.target.value)}
                      placeholder="Gujarat"
                    />
                  </Field>
                  <Field label="Code">
                    <input
                      className={inputCls(false)}
                      value={inv.buyer.code}
                      onChange={(e) => patchBuyer({ code: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                      placeholder="24"
                      inputMode="numeric"
                    />
                  </Field>
                </div>
                <datalist id="indian-states">
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

                <Field label="WhatsApp number" hint="for the share button">
                  <input
                    className={inputCls(false)}
                    value={inv.buyer.phone}
                    onChange={(e) => patchBuyer({ phone: e.target.value })}
                    placeholder="98765 43210"
                    inputMode="tel"
                  />
                </Field>
              </div>
            </Section>

            <Section
              title="Items"
              action={
                <span className="text-[12px] text-mute tnum">
                  {inv.items.length} row{inv.items.length === 1 ? '' : 's'}
                </span>
              }
            >
              <div className="space-y-2.5">
                {inv.items.map((it, i) => {
                  const amount = lineAmount(it.pics, it.rate)
                  return (
                    <div
                      key={it.id}
                      className="border border-line bg-white p-2.5 focus-within:border-brand/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 shrink-0 grid place-items-center text-[11px] font-bold text-brand bg-blush rounded-[3px] tnum">
                          {i + 1}
                        </span>
                        <input
                          className="flex-1 min-w-0 h-8 px-2 rounded-[4px] border border-line bg-white text-[13px] font-medium text-ink placeholder:text-mute/60 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                          value={it.desc}
                          onChange={(e) => setItem(it.id, { desc: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addItem()
                            }
                          }}
                          placeholder="Description (press Enter to add a row)"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          aria-label={`Remove row ${i + 1}`}
                          className="w-7 h-7 shrink-0 grid place-items-center rounded-[4px] text-mute hover:text-brand hover:bg-brand/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35"
                        >
                          <Icon name="trash" className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <label className="block">
                          <SubLabel>HSN</SubLabel>
                          <input
                            className={smInput(false)}
                            value={it.hsn}
                            onChange={(e) => setItem(it.id, { hsn: e.target.value })}
                            placeholder="—"
                          />
                        </label>
                        <label className="block">
                          <SubLabel>Pics</SubLabel>
                          <input
                            className={smNum}
                            value={it.pics}
                            inputMode="decimal"
                            onChange={(e) => setItem(it.id, { pics: e.target.value.replace(/[^0-9.]/g, '') })}
                            placeholder="0"
                          />
                        </label>
                        <label className="block">
                          <SubLabel>Rate</SubLabel>
                          <input
                            className={smNum}
                            value={it.rate}
                            inputMode="decimal"
                            onChange={(e) => setItem(it.id, { rate: e.target.value.replace(/[^0-9.]/g, '') })}
                            placeholder="0"
                          />
                        </label>
                      </div>

                      <div className="mt-2 flex items-baseline justify-between border-t border-dashed border-line pt-2">
                        <span className="text-[11.5px] text-mute">Amount = Pics × Rate</span>
                        <span className="text-[13.5px] font-bold text-ink tnum">Rs. {fmt(amount)}</span>
                      </div>
                    </div>
                  )
                })}

                {inv.items.length === 0 ? (
                  <p className="text-[12.5px] text-mute border border-dashed border-line px-3 py-4 text-center">
                    No rows yet. Every invoice needs at least one item.
                  </p>
                ) : null}

                {submitted && errors.items ? (
                  <p className="flex items-start gap-1 text-[11.5px] text-brand">
                    <Icon name="alert" className="w-3.5 h-3.5 mt-[1px] shrink-0" />
                    {errors.items}
                  </p>
                ) : null}

                <Btn variant="outline" icon="plus" onClick={addItem} className="w-full">
                  Add row
                </Btn>
              </div>
            </Section>

            <Section title="Discount & tax">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Discount" hint="%">
                    <input
                      className={`${inputCls(false)} text-right tnum`}
                      value={inv.discount}
                      inputMode="decimal"
                      onChange={(e) => patch({ discount: e.target.value.replace(/[^0-9.]/g, '') })}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="SGST" hint="%">
                    <input
                      className={`${inputCls(false)} text-right tnum`}
                      value={inv.sgstRate}
                      inputMode="decimal"
                      onChange={(e) => patch({ sgstRate: e.target.value.replace(/[^0-9.]/g, '') })}
                    />
                  </Field>
                  <Field label="CGST" hint="%">
                    <input
                      className={`${inputCls(false)} text-right tnum`}
                      value={inv.cgstRate}
                      inputMode="decimal"
                      onChange={(e) => patch({ cgstRate: e.target.value.replace(/[^0-9.]/g, '') })}
                    />
                  </Field>
                </div>

                <p className="text-[12px] leading-snug text-mute bg-surface border border-line px-3 py-2">
                  Discount comes off the items total first, then{' '}
                  <b className="text-brand">SGST + CGST</b> are charged on the discounted total
                  (IGST is not used).
                </p>
              </div>
            </Section>

            <Section title="Totals">
              <dl className="text-[13px]">
                <Row label="Gross" value={`Rs. ${fmt(totals.gross)}`} />
                <Row
                  label={totals.discountPct > 0 ? `Discount (${fmtDec(totals.discountPct)}%)` : 'Discount'}
                  value={totals.discount ? `− Rs. ${fmt(totals.discount)}` : '—'}
                />
                <Row label="Total" value={`Rs. ${fmt(totals.total)}`} strong />
                <Row
                  label={`SGST @ ${fmtDec(totals.sgstRate)}%`}
                  value={`Rs. ${fmt(totals.sgst)}`}
                />
                <Row
                  label={`CGST @ ${fmtDec(totals.cgstRate)}%`}
                  value={`Rs. ${fmt(totals.cgst)}`}
                />
                <div className="mt-2 flex items-baseline justify-between gap-3 bg-blush border border-brand/25 px-3 py-2.5">
                  <dt className="text-[13px] font-bold text-brand">Grand Total</dt>
                  <dd className="text-[17px] font-extrabold text-ink tnum">Rs. {fmt(totals.grand)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[12px] leading-snug text-mute">
                <span className="font-semibold text-ink/70">Amount in words · </span>
                {amountInWords(totals.grand)}
              </p>
            </Section>
          </aside>

          {/* -------- live preview -------- */}
          <section
            className={`flex-1 min-w-0 overflow-y-auto scrolly bg-[#e9e9ec] p-4 sm:p-6 ${
              tab === 'preview' ? '' : 'hidden lg:block'
            }`}
          >
            <div className="mx-auto max-w-[900px] mb-3 flex items-center justify-between text-[11.5px] text-mute">
              <span className="font-semibold uppercase tracking-wider">
                A4 · 210 × 297 mm · colour
              </span>
              <span className="tnum">
                {pages} page{pages > 1 ? 's' : ''} · preview matches the PDF
              </span>
            </div>
            <ScaledPreview business={business} invoice={inv} totals={totals} pages={pages} />
          </section>
        </div>
      </div>

      <ExportStage
        business={business}
        invoice={inv}
        totals={totals}
        pages={pages}
        stageRef={stageRef}
      />

      {toast ? <Toast tone={toast.tone === 'err' ? 'err' : 'ok'}>{toast.msg}</Toast> : null}
    </>
  )
}

function Row({ label, value, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-dashed border-line">
      <dt className={strong ? 'font-semibold text-ink' : 'text-mute'}>{label}</dt>
      <dd className={`tnum ${strong ? 'font-bold text-ink' : 'text-ink'}`}>{value}</dd>
    </div>
  )
}
