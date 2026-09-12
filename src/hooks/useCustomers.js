import { useCallback, useEffect, useState } from 'react'
import { addMonths, todayStr } from '../utils/dates'

const LEGACY_STORAGE_KEY = 'customers-data'

function storageKeyFor(userId) {
  return `customers-data:${userId}`
}

function loadCustomers(userId) {
  if (!userId) return []
  try {
    const key = storageKeyFor(userId)
    let raw = localStorage.getItem(key)
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
      if (legacy) {
        localStorage.setItem(key, legacy)
        localStorage.removeItem(LEGACY_STORAGE_KEY)
        raw = legacy
      }
    }
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(userId, customers) {
  if (!userId) return
  localStorage.setItem(storageKeyFor(userId), JSON.stringify(customers))
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * CRUD + per-user localStorage persistence for customer eligibility entries.
 */
export function useCustomers(userId) {
  const [customers, setCustomers] = useState(() => loadCustomers(userId))

  useEffect(() => {
    setCustomers(loadCustomers(userId))
  }, [userId])

  useEffect(() => {
    if (!userId) return
    persist(userId, customers)
  }, [customers, userId])

  const addCustomer = useCallback((input) => {
    const addedDate = todayStr()
    let reminderDate = input.reminderDate
    if (input.waitMode === '2m') {
      reminderDate = addMonths(addedDate, 2)
    } else if (input.waitMode === '3m') {
      reminderDate = addMonths(addedDate, 3)
    }

    const entry = {
      id: makeId(),
      name: input.name.trim(),
      phone: (input.phone || '').trim(),
      reason: input.reason.trim(),
      notes: (input.notes || '').trim(),
      addedDate,
      reminderDate,
      status: 'pending',
      calendarSynced: false,
    }

    setCustomers((prev) => [entry, ...prev])
    return entry
  }, [])

  const markDone = useCallback((id) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'done' } : c)),
    )
  }, [])

  const reopen = useCallback((id) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'pending' } : c)),
    )
  }, [])

  const removeCustomer = useCallback((id) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const markCalendarSynced = useCallback((id, synced = true) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, calendarSynced: synced } : c,
      ),
    )
  }, [])

  return {
    customers,
    addCustomer,
    markDone,
    reopen,
    removeCustomer,
    markCalendarSynced,
  }
}
