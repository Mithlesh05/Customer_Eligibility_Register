import { Inbox } from 'lucide-react'
import EntryCard from './EntryCard'

export default function ReminderSection({
  title,
  entries,
  emptyMessage,
  alwaysShow = false,
  onMarkDone,
  onReopen,
  onRemove,
  onSyncCalendar,
  calendarConnected,
}) {
  if (!alwaysShow && entries.length === 0) {
    return null
  }

  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-xl font-bold tracking-tight text-ink">{title}</h2>
        <span className="text-sm font-semibold tabular-nums text-muted">
          {entries.length}
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line bg-white/70 px-4 py-7 text-sm leading-relaxed text-muted">
          <Inbox className="h-5 w-5 shrink-0 text-violet-300" />
          {emptyMessage}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onMarkDone={onMarkDone}
              onReopen={onReopen}
              onRemove={onRemove}
              onSyncCalendar={onSyncCalendar}
              calendarConnected={calendarConnected}
            />
          ))}
        </div>
      )}
    </section>
  )
}
