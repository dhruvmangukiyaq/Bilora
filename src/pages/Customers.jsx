import { useMemo, useState } from 'react'
import { useStore } from '../store/StoreContext.jsx'
import { Btn, Field, Icon, Section, Toast, inputCls } from '../components/ui.jsx'
import { GSTIN_MSG, isValidGstin } from '../lib/validation.js'
import { codeForState } from '../lib/states.js'

const blank = () => ({
  id: '',
  name: '',
  address: '',
  gstin: '',
  state: 'Gujarat',
  code: '24',
  phone: '',
})

export default function Customers() {
  const store = useStore()
  const { customers, upsertCustomer, deleteCustomer } = store
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState(null)
  const [tried, setTried] = useState(false)
  const [toast, setToast] = useState(null)

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    const sorted = [...customers].sort((a, b) => a.name.localeCompare(b.name))
    if (!term) return sorted
    return sorted.filter((c) =>
      `${c.name} ${c.gstin} ${c.state} ${c.address} ${c.phone}`.toLowerCase().includes(term)
    )
  }, [customers, q])

  const nameError = draft && !draft.name.trim() ? 'Name is required' : null
  const gstinError =
    draft && draft.gstin && !isValidGstin(draft.gstin) ? GSTIN_MSG : null

  const save = () => {
    setTried(true)
    if (!draft || nameError || gstinError) return
    store.upsertCustomer(draft)
    setToast({ msg: draft.id ? 'Customer updated' : 'Customer added' })
    setDraft(null)
    setTried(false)
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-3 sm:px-5 py-5 sm:py-7">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
        <div>
          <h1 className="text-[19px] font-bold tracking-[-0.01em] text-ink">Customer master</h1>
          <p className="text-[13px] text-mute">
            {customers.length} saved buyer{customers.length === 1 ? '' : 's'} — pick one while
            invoicing and the GSTIN, state and code fill themselves in.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Icon
              name="search"
              className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-mute pointer-events-none"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search customers…"
              className="w-[200px] sm:w-[250px] h-9 pl-8 pr-2.5 rounded-[4px] border border-line bg-white text-[13px] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </div>
          <Btn variant="solid" icon="plus" onClick={() => setDraft(blank())}>
            Add
          </Btn>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-4 items-start">
        {/* list */}
        <div className="bg-white border border-line">
          {list.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto mb-3 grid place-items-center w-10 h-10 rounded-full bg-brand/10 text-brand">
                <Icon name="users" className="w-5 h-5" />
              </div>
              <p className="text-[14px] font-semibold text-ink">
                {customers.length ? 'No matches' : 'No customers yet'}
              </p>
              <p className="mt-1 text-[13px] text-mute">
                {customers.length ? `Nothing matches “${q}”.` : 'Add your regular buyers once, then never retype their GSTIN.'}
              </p>
            </div>
          ) : (
            list.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-b-0 hover:bg-surface/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-ink truncate">{c.name}</p>
                  <p className="text-[12px] text-mute truncate">
                    {c.gstin || 'No GSTIN'} · {c.state || '—'}
                    {c.code ? ` (${c.code})` : ''} · {c.address || 'No address'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDraft({ ...c })
                    setTried(false)
                  }}
                  className="h-8 px-2.5 rounded-[4px] border border-line text-[12.5px] font-semibold text-mute hover:text-ink hover:border-ink/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35"
                >
                  Edit
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${c.name}`}
                  onClick={() => {
                    if (window.confirm(`Remove ${c.name} from the customer master?`)) {
                      deleteCustomer(c.id)
                      if (draft?.id === c.id) setDraft(null)
                      setToast({ msg: 'Customer removed' })
                    }
                  }}
                  className="w-8 h-8 grid place-items-center rounded-[4px] text-mute hover:text-brand hover:bg-brand/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35"
                >
                  <Icon name="trash" className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* editor */}
        <Section
          title={draft ? (draft.id ? 'Edit customer' : 'New customer') : 'Customer details'}
          className="lg:sticky lg:top-[72px]"
        >
          {!draft ? (
            <p className="text-[13px] leading-relaxed text-mute">
              Pick <b className="text-ink">Edit</b> on the left, or press{' '}
              <b className="text-ink">Add</b> to create a buyer you bill often.
            </p>
          ) : (
            <div className="space-y-3">
              <Field label="Name" required error={tried && nameError}>
                <input
                  className={inputCls(tried && nameError)}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Field>
              <Field label="Address">
                <textarea
                  rows={2}
                  className="w-full px-2.5 py-2 rounded-[4px] border border-line bg-white text-[13px] text-ink placeholder:text-mute/60 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 resize-y"
                  value={draft.address}
                  onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                />
              </Field>
              <Field
                label="GST No."
                error={(tried || gstinError) && gstinError}
                hint={draft.gstin && isValidGstin(draft.gstin) ? 'valid' : 'optional'}
              >
                <input
                  className={`${inputCls((tried || gstinError) && gstinError)} uppercase`}
                  value={draft.gstin}
                  maxLength={15}
                  onChange={(e) => setDraft({ ...draft, gstin: e.target.value.toUpperCase() })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="State">
                  <input
                    className={inputCls(false)}
                    list="indian-states-cust"
                    value={draft.state}
                    onChange={(e) => {
                      const state = e.target.value
                      setDraft({ ...draft, state, code: codeForState(state) || draft.code })
                    }}
                  />
                </Field>
                <Field label="Code">
                  <input
                    className={inputCls(false)}
                    value={draft.code}
                    inputMode="numeric"
                    onChange={(e) => setDraft({ ...draft, code: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                  />
                </Field>
              </div>
              <datalist id="indian-states-cust">
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
              <Field label="WhatsApp number" hint="optional">
                <input
                  className={inputCls(false)}
                  value={draft.phone}
                  inputMode="tel"
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                />
              </Field>

              <div className="flex gap-2 pt-1">
                <Btn variant="solid" icon="save" onClick={save} className="flex-1">
                  Save customer
                </Btn>
                <Btn variant="outline" onClick={() => { setDraft(null); setTried(false) }}>
                  Cancel
                </Btn>
              </div>
            </div>
          )}
        </Section>
      </div>

      {toast ? <Toast>{toast.msg}</Toast> : null}
    </div>
  )
}
