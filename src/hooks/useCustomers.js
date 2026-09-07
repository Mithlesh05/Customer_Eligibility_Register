import { useCallback, useEffect, useState } from 'react'
import { addMonths, todayStr } from '../utils/dates'

const STORAGE_KEY = 'customers-data'

function loadCustomers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(customers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers))
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * CRUD + localStorage persistence for customer eligibility entries.
 */
export function useCustomers() {
  const [customers, setCustomers] = useState(loadCustomers)

  useEffect(() => {
    persist(customers)
  }, [customers])

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
