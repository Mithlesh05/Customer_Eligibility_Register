import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { todayStr } from '../utils/dates'

const EMPTY_FORM = {
  name: '',
  phone: '',
  reason: '',
  waitMode: '2m',
  customDate: '',
  notes: '',
}

const WAIT_OPTIONS = [
  { value: '2m', label: '2 months' },
  { value: '3m', label: '3 months' },
  { value: 'custom', label: 'Custom date' },
]

export default function EntryForm({ onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    const name = form.name.trim()
    const reason = form.reason.trim()

    if (!name) {
      setError('Customer name is required.')
      return
    }
    if (!reason) {
      setError('Please say why they are not eligible today.')
      return
    }
    if (form.waitMode === 'custom') {
      if (!form.customDate) {
        setError('Choose a specific date.')
        return
      }
      if (form.customDate < todayStr()) {
        setError('The date must be today or later.')
        return
      }
    }

    onSubmit({
      name,
      phone: form.phone,
      reason,
      notes: form.notes,
      waitMode: form.waitMode,
      reminderDate: form.waitMode === 'custom' ? form.customDate : '',
    })
    setForm(EMPTY_FORM)
    setError('')
  }

  const fieldClass =
    'mt-1.5 w-full rounded-xl border border-line bg-[#faf9fc] px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10'
  const labelClass = 'text-[13px] font-semibold text-ink'

  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_20px_50px_-24px_rgba(88,28,135,0.35)]">
      <header className="px-5 pb-1 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          New entry
        </p>
        <h2 className="mt-1 text-lg font-bold tracking-tight text-ink">
          Add a customer
        </h2>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-4 px-5 py-5">
        <div>
          <label htmlFor="cust-name" className={labelClass}>
            Customer name
          </label>
          <input
            id="cust-name"
            type="text"
            autoComplete="name"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="cust-phone" className={labelClass}>
            Phone <span className="font-medium text-muted">optional</span>
          </label>
          <input
            id="cust-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Mobile number"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="cust-reason" className={labelClass}>
            Why not eligible today
          </label>
          <input
            id="cust-reason"
            type="text"
            placeholder="Short reason"
            value={form.reason}
            onChange={(e) => update('reason', e.target.value)}
            className={fieldClass}
          />
        </div>

        <fieldset>
          <legend className={labelClass}>Wait period</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {WAIT_OPTIONS.map((opt) => {
              const selected = form.waitMode === opt.value
              return (
                <label
                  key={opt.value}
                  className={`cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                    selected
                      ? 'bg-ink text-white shadow-sm'
                      : 'bg-[#f3f1f8] text-muted hover:bg-violet-100 hover:text-ink'
                  }`}
                >
                  <input
                    type="radio"
                    name="waitMode"
                    value={opt.value}
                    checked={selected}
                    onChange={() => update('waitMode', opt.value)}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              )
            })}
          </div>
          {form.waitMode === 'custom' && (
            <input
              type="date"
              min={todayStr()}
              value={form.customDate}
              onChange={(e) => update('customDate', e.target.value)}
              className={`${fieldClass} mt-3 max-w-full`}
              aria-label="Specific date"
            />
          )}
        </fieldset>

        <div>
          <label htmlFor="cust-notes" className={labelClass}>
            Notes <span className="font-medium text-muted">optional</span>
          </label>
          <textarea
            id="cust-notes"
            rows={3}
            placeholder="Anything else to remember"
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            className={`${fieldClass} resize-y`}
          />
        </div>

        {error ? (
          <p className="text-sm font-medium text-due" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:bg-primary-hover"
        >
          Add to register
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </form>
    </section>
  )
}
