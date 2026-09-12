import { useCallback, useMemo, useState } from 'react'
import { CalendarCheck, Loader2, LogOut, Sparkles } from 'lucide-react'
import EntryForm from './components/EntryForm'
import LoginScreen from './components/LoginScreen'
import ReminderSection from './components/ReminderSection'
import Toast from './components/Toast'
import { useCustomers } from './hooks/useCustomers'
import { useGoogleAuth } from './hooks/useGoogleAuth'
import { useGoogleCalendar } from './hooks/useGoogleCalendar'
import { daysBetween, todayStr } from './utils/dates'

function groupCustomers(customers) {
  const today = todayStr()
  const pending = customers.filter((c) => c.status === 'pending')
  const done = customers
    .filter((c) => c.status === 'done')
    .sort((a, b) => {
      if (a.reminderDate === b.reminderDate) {
        return b.addedDate.localeCompare(a.addedDate)
      }
      return b.reminderDate.localeCompare(a.reminderDate)
    })

  const due = pending
    .filter((c) => c.reminderDate <= today)
    .sort((a, b) => a.reminderDate.localeCompare(b.reminderDate))

  const upcoming = pending
    .filter((c) => {
      const d = daysBetween(today, c.reminderDate)
      return d > 0 && d <= 14
    })
    .sort((a, b) => a.reminderDate.localeCompare(b.reminderDate))

  const later = pending
    .filter((c) => daysBetween(today, c.reminderDate) > 14)
    .sort((a, b) => a.reminderDate.localeCompare(b.reminderDate))

  return { due, upcoming, later, done }
}

export default function App() {
  const {
    user,
    gisReady: authReady,
    clientIdMissing,
    error: authError,
    buttonHostRef,
    signOut,
  } = useGoogleAuth()

  if (!user) {
    return (
      <LoginScreen
        buttonHostRef={buttonHostRef}
        gisReady={authReady}
        clientIdMissing={clientIdMissing}
        error={authError}
      />
    )
  }

  return <RegisterApp user={user} onSignOut={signOut} />
}

function RegisterApp({ user, onSignOut }) {
  const {
    customers,
    addCustomer,
    markDone,
    reopen,
    removeCustomer,
    markCalendarSynced,
  } = useCustomers(user.id)

  const [toast, setToast] = useState(null)
  const groups = useMemo(() => groupCustomers(customers), [customers])

  const showToast = useCallback((message, tone = 'error') => {
    setToast({ message, tone })
  }, [])

  const onConnectResult = useCallback(
    (result) => {
      if (result.ok) {
        showToast(
          'Google Calendar is connected. New reminders will notify you on your phone.',
          'success',
        )
        return
      }
      showToast(result.error)
    },
    [showToast],
  )

  const {
    connected,
    connecting,
    gisReady,
    clientIdMissing,
    connect,
    disconnect,
    createReminderEvent,
  } = useGoogleCalendar(user.id, onConnectResult)

  const handleSignOut = useCallback(() => {
    disconnect()
    onSignOut()
  }, [disconnect, onSignOut])

  const syncToCalendar = useCallback(
    async (entry) => {
      const result = await createReminderEvent(entry)
      if (result.ok) {
        markCalendarSynced(entry.id, true)
        showToast('Reminder added to Calendar.', 'success')
        return true
      }
      showToast(result.error)
      return false
    },
    [createReminderEvent, markCalendarSynced, showToast],
  )

  const handleSubmit = useCallback(
    async (input) => {
      const entry = addCustomer(input)
      showToast(`"${entry.name}" has been added.`, 'success')

      if (connected) {
        const result = await createReminderEvent(entry)
        if (result.ok) {
          markCalendarSynced(entry.id, true)
        } else {
          showToast(result.error)
        }
      }
    },
    [addCustomer, connected, createReminderEvent, markCalendarSynced, showToast],
  )

  const listProps = {
    onMarkDone: markDone,
    onReopen: reopen,
    onRemove: removeCustomer,
    onSyncCalendar: syncToCalendar,
    calendarConnected: connected,
  }

  return (
    <div className="min-h-svh bg-canvas">
      <header className="relative isolate overflow-hidden bg-[#0b0614] text-white">
        <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-violet-500/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-6 sm:pb-12 sm:pt-6">
          <div className="mb-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Sparkles className="h-4 w-4 text-violet-200" />
              </div>
              <span className="text-sm font-semibold tracking-wide">
                Eligibility
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {connected ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-medium text-emerald-200 ring-1 ring-emerald-400/20">
                  <CalendarCheck className="h-3.5 w-3.5" />
                  Calendar on
                </span>
              ) : (
                <button
                  type="button"
                  onClick={connect}
                  disabled={!gisReady || clientIdMissing}
                  title={
                    clientIdMissing
                      ? 'Add VITE_GOOGLE_CLIENT_ID in .env, then restart the app.'
                      : !gisReady
                        ? 'Google Calendar is still loading…'
                        : undefined
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-ink transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {connecting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  Connect Calendar
                </button>
              )}

              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-2 ring-1 ring-white/15">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt=""
                    className="h-7 w-7 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/40 text-[10px] font-semibold">
                    {(user.name || '?').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="hidden max-w-[9rem] truncate text-xs text-white/80 sm:inline">
                  {user.name || user.email}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="sm:inline">Out</span>
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200/80">
            Customer register
          </p>
          <h1 className="mt-3 max-w-xl text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
            Follow up when they
            <span className="bg-gradient-to-r from-violet-200 to-fuchsia-300 bg-clip-text text-transparent">
              {' '}
              become eligible
            </span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/65 sm:text-base">
            Park customers who are not ready today. When the wait is over, they
            surface here so you can act on time.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Due today" value={groups.due.length} hot={groups.due.length > 0} />
            <Stat label="Coming soon" value={groups.upcoming.length} />
            <Stat label="Later" value={groups.later.length} />
            <Stat label="Eligible" value={groups.done.length} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div className="lg:sticky lg:top-6">
            <EntryForm onSubmit={handleSubmit} />
          </div>

          <div className="space-y-8">
            <ReminderSection
              title="Due today"
              entries={groups.due}
              alwaysShow
              emptyMessage="No customers are due today. You are all caught up."
              {...listProps}
            />
            <ReminderSection
              title="Coming soon"
              entries={groups.upcoming}
              emptyMessage="No reminders in the next 14 days."
              {...listProps}
            />
            <ReminderSection
              title="Later"
              entries={groups.later}
              emptyMessage="No later pending customers."
              {...listProps}
            />
            <ReminderSection
              title="Now eligible"
              entries={groups.done}
              emptyMessage="No customers have been marked eligible yet."
              {...listProps}
            />
          </div>
        </div>
      </main>

      <Toast
        message={toast?.message}
        tone={toast?.tone}
        onClose={() => setToast(null)}
      />
    </div>
  )
}

function Stat({ label, value, hot = false }) {
  return (
    <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/12 backdrop-blur-md">
      <p className="text-[11px] font-medium uppercase tracking-wider text-white/50">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums sm:text-3xl ${
          hot ? 'text-rose-300' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
