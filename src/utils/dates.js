/**
 * Date helpers for the eligibility register.
 * All calendar dates are local YYYY-MM-DD strings so timezone shifts
 * never move a reminder to the previous/next day.
 */

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function pad2(n) {
  return String(n).padStart(2, '0')
}

function toIso(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

/** Parse YYYY-MM-DD as a local calendar date (not UTC midnight). */
export function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Today's date as YYYY-MM-DD in the user's local timezone. */
export function todayStr() {
  const now = new Date()
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

/**
 * Add `months` to a YYYY-MM-DD date.
 * Clamps the day so month-end dates do not overflow:
 * Jan 31 + 1 month → Feb 28/29, not Mar 2/3.
 */
export function addMonths(dateStr, months) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const target = new Date(year, month - 1 + months, 1)
  const lastDayOfTarget = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate()
  const clampedDay = Math.min(day, lastDayOfTarget)
  return toIso(target.getFullYear(), target.getMonth() + 1, clampedDay)
}

/** Whole calendar days from `fromStr` to `toStr` (can be negative). */
export function daysBetween(fromStr, toStr) {
  const from = parseLocalDate(fromStr)
  const to = parseLocalDate(toStr)
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY)
}

/** e.g. "15 Mar 2026" */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = parseLocalDate(dateStr)
  const month = MONTHS[d.getMonth()]
  return `${d.getDate()} ${month} ${d.getFullYear()}`
}

/** Next calendar day — used if an all-day Calendar event is ever needed. */
export function nextDay(dateStr) {
  const d = parseLocalDate(dateStr)
  d.setDate(d.getDate() + 1)
  return toIso(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

/** Normalize input time to HH:MM (24-hour). Defaults to 09:00. */
export function normalizeTime(timeStr) {
  const match = String(timeStr || '').match(/^(\d{1,2}):(\d{2})/)
  if (!match) return '09:00'
  const hours = Math.min(23, Math.max(0, Number(match[1])))
  const minutes = Math.min(59, Math.max(0, Number(match[2])))
  return `${pad2(hours)}:${pad2(minutes)}`
}

/** e.g. "9:00 AM" */
export function formatTime(timeStr) {
  const [hours, minutes] = normalizeTime(timeStr).split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${pad2(minutes)} ${period}`
}

/** Add minutes to HH:MM, staying on the same calendar day. */
export function addMinutesToTime(timeStr, minutesToAdd) {
  const [hours, minutes] = normalizeTime(timeStr).split(':').map(Number)
  const total = Math.min(23 * 60 + 59, hours * 60 + minutes + minutesToAdd)
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`
}
