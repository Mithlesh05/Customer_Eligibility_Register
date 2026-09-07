import { useState } from 'react'
import { CalendarDays, Phone, RotateCcw, Trash2, Send } from 'lucide-react'
import { daysBetween, formatDate, todayStr } from '../utils/dates'

function toneFor(entry) {
  if (entry.status === 'done') {
    return {
      wrap: 'border-emerald-100 from-ok-bg to-white',
      date: 'text-ok',
      badge: 'Eligible',
      badgeClass: 'bg-ok text-white',
    }
  }
  const days = daysBetween(todayStr(), entry.reminderDate)
  if (days <= 0) {
    return {
      wrap: 'border-rose-100 from-due-bg to-white',
      date: 'text-due',
      badge: days < 0 ? 'Overdue' : 'Due today',
      badgeClass: 'bg-due text-white',
    }
  }
  if (days <= 14) {
    return {
      wrap: 'border-amber-100 from-soon-bg to-white',
      date: 'text-soon',
      badge: 'Soon',
      badgeClass: 'bg-soon text-white',
    }
  }
  return {
    wrap: 'border-line from-white to-white',
    date: 'text-muted',
    badge: 'Scheduled',
    badgeClass: 'bg-ink/80 text-white',
  }
}

function dueLabel(entry) {
  if (entry.status === 'done') {
    return formatDate(entry.reminderDate)
  }
  const days = daysBetween(todayStr(), entry.reminderDate)
  if (days < 0) {
    const n = Math.abs(days)
    const unit = n === 1 ? 'day' : 'days'
    return `${n} ${unit} ago · ${formatDate(entry.reminderDate)}`
  }
  if (days === 0) {
    return `Today · ${formatDate(entry.reminderDate)}`
  }
  const unit = days === 1 ? 'day' : 'days'
  return `${days} ${unit} left · ${formatDate(entry.reminderDate)}`
}

export default function EntryCard({
  entry,
  onMarkDone,
  onReopen,
  onRemove,
  onSyncCalendar,
  calendarConnected,
}) {
  const [confirming, setConfirming] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const tone = toneFor(entry)

  async function handleSync() {
    if (!onSyncCalendar) return
    setSyncing(true)
    await onSyncCalendar(entry)
    setSyncing(false)
  }

  return (
    <article
      className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tone.wrap}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold leading-snug tracking-tight text-ink">
            {entry.name}
          </h3>
          <p className={`mt-1 flex items-center gap-1.5 text-sm font-medium ${tone.date}`}>
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {dueLabel(entry)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone.badgeClass}`}
          >
            {tone.badge}
          </span>
          {entry.calendarSynced ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-cal-bg px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              Synced
            </span>
          ) : null}
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-700">{entry.reason}</p>

      {entry.notes ? (
        <p className="mt-1 text-sm leading-relaxed text-muted">{entry.notes}</p>
      ) : null}

      {entry.phone ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <Phone className="h-3.5 w-3.5" />
          <a href={`tel:${entry.phone}`} className="font-semibold text-primary hover:underline">
            {entry.phone}
          </a>
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {entry.status === 'pending' ? (
          <button
            type="button"
            onClick={() => onMarkDone(entry.id)}
            className="inline-flex items-center rounded-full bg-ok px-3.5 py-1.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Now eligible
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onReopen(entry.id)}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-ink ring-1 ring-line transition hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reopen
          </button>
        )}

        {entry.status === 'pending' &&
          calendarConnected &&
          !entry.calendarSynced &&
          onSyncCalendar && (
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-primary ring-1 ring-violet-200 transition hover:bg-cal-bg disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {syncing ? 'Sending…' : 'Sync'}
            </button>
          )}

        {confirming ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-due">
            Delete?
            <button
              type="button"
              onClick={() => {
                onRemove(entry.id)
                setConfirming(false)
              }}
              className="rounded-full bg-due px-2.5 py-1 text-xs font-semibold text-white"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink ring-1 ring-line"
            >
              No
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted transition hover:bg-rose-50 hover:text-due"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        )}
      </div>
    </article>
  )
}
