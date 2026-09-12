import { useCallback, useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID } from '../googleConfig'

const SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const EVENTS_URL =
  'https://www.googleapis.com/calendar/v3/calendars/primary/events'

const CLIENT_ID = GOOGLE_CLIENT_ID

function isPlaceholderClientId(id) {
  return !id || id.includes('YOUR_GOOGLE_CLIENT_ID')
}

function tokenKeys(userId) {
  const suffix = userId ? `:${userId}` : ''
  return {
    token: `google_cal_access_token${suffix}`,
    expiry: `google_cal_token_expiry${suffix}`,
  }
}

function readStoredToken(userId) {
  if (!userId) return { token: null, expiry: 0 }
  const keys = tokenKeys(userId)
  const token = sessionStorage.getItem(keys.token)
  const expiry = Number(sessionStorage.getItem(keys.expiry) || 0)
  if (!token || !expiry || expiry <= Date.now()) {
    sessionStorage.removeItem(keys.token)
    sessionStorage.removeItem(keys.expiry)
    return { token: null, expiry: 0 }
  }
  return { token, expiry }
}

function saveToken(userId, token, expiresInSeconds) {
  if (!userId) return
  const keys = tokenKeys(userId)
  const expiry = Date.now() + Math.max(0, Number(expiresInSeconds) - 60) * 1000
  sessionStorage.setItem(keys.token, token)
  sessionStorage.setItem(keys.expiry, String(expiry))
}

function clearToken(userId) {
  if (!userId) return
  const keys = tokenKeys(userId)
  sessionStorage.removeItem(keys.token)
  sessionStorage.removeItem(keys.expiry)
}

/**
 * Frontend-only Google Calendar authorization via GIS oauth2 token client.
 * Separate from Sign in with Google (google.accounts.id).
 */
export function useGoogleCalendar(userId, onConnectResult) {
  const clientIdMissing = isPlaceholderClientId(CLIENT_ID)
  const [accessToken, setAccessToken] = useState(
    () => readStoredToken(userId).token,
  )
  const [connecting, setConnecting] = useState(false)
  const [gisReady, setGisReady] = useState(false)
  const tokenClientRef = useRef(null)
  const onConnectResultRef = useRef(onConnectResult)
  const finishedRef = useRef(false)
  const userIdRef = useRef(userId)
  onConnectResultRef.current = onConnectResult
  userIdRef.current = userId

  const connected = Boolean(accessToken)

  useEffect(() => {
    setAccessToken(readStoredToken(userId).token)
    setConnecting(false)
    finishedRef.current = false
  }, [userId])

  useEffect(() => {
    if (clientIdMissing || !userId) return undefined

    let intervalId = 0
    tokenClientRef.current = null
    setGisReady(false)

    const start = () => {
      const oauth2 = window.google?.accounts?.oauth2
      if (!oauth2 || tokenClientRef.current) {
        return Boolean(tokenClientRef.current)
      }

      tokenClientRef.current = oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (response) => {
          finishedRef.current = true
          setConnecting(false)
          if (response.error) {
            const cancelled =
              response.error === 'access_denied' ||
              response.error === 'popup_closed_by_user'
            onConnectResultRef.current?.({
              ok: false,
              error: cancelled
                ? 'Google Calendar connect was cancelled.'
                : `Could not connect Google Calendar: ${response.error}`,
            })
            return
          }
          if (!response.access_token) {
            onConnectResultRef.current?.({
              ok: false,
              error: 'Google did not return an access token.',
            })
            return
          }
          const uid = userIdRef.current
          saveToken(uid, response.access_token, Number(response.expires_in || 3600))
          setAccessToken(response.access_token)
          onConnectResultRef.current?.({ ok: true })
        },
        error_callback: (error) => {
          if (error?.type === 'popup_closed') {
            if (!finishedRef.current) setConnecting(false)
            return
          }
          if (finishedRef.current) return
          setConnecting(false)
          onConnectResultRef.current?.({
            ok: false,
            error:
              'Google Calendar could not open. Allow pop-ups for this site and try again.',
          })
        },
      })
      setGisReady(true)
      return true
    }

    if (!start()) {
      intervalId = window.setInterval(() => {
        if (start()) window.clearInterval(intervalId)
      }, 50)
    }

    return () => {
      window.clearInterval(intervalId)
      tokenClientRef.current = null
    }
  }, [clientIdMissing, userId])

  const connect = useCallback(() => {
    if (!tokenClientRef.current) {
      onConnectResultRef.current?.({
        ok: false,
        error:
          'Google Calendar is still loading. Wait a second and try Connect Calendar again.',
      })
      return
    }
    finishedRef.current = false
    tokenClientRef.current.requestAccessToken()
    setConnecting(true)
  }, [])

  const disconnect = useCallback(() => {
    clearToken(userId)
    setAccessToken(null)
  }, [userId])

  const createReminderEvent = useCallback(
    async (customer) => {
      const token = accessToken || readStoredToken(userId).token
      if (!token) {
        return {
          ok: false,
          error: 'Google Calendar is not connected yet. Connect it first.',
        }
      }

      const timeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
      const start = `${customer.reminderDate}T09:00:00`
      const end = `${customer.reminderDate}T09:30:00`

      const notesBlock = customer.notes
        ? `\nNotes: ${customer.notes}`
        : ''
      const phoneBlock = customer.phone
        ? `\nPhone: ${customer.phone}`
        : ''

      const body = {
        summary: `${customer.name} is now eligible`,
        description: `Reason: ${customer.reason}${phoneBlock}${notesBlock}\n\nThis reminder was created from Customer Eligibility Register.`,
        start: { dateTime: start, timeZone },
        end: { dateTime: end, timeZone },
        reminders: {
          useDefault: false,
          overrides: [{ method: 'popup', minutes: 0 }],
        },
      }

      try {
        const res = await fetch(EVENTS_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })

        if (res.status === 401 || res.status === 403) {
          clearToken(userId)
          setAccessToken(null)
          return {
            ok: false,
            error:
              'Google Calendar session expired. Please click “Connect Calendar” again.',
          }
        }

        if (!res.ok) {
          let detail = `HTTP ${res.status}`
          try {
            const errJson = await res.json()
            detail = errJson.error?.message || detail
          } catch {
            /* ignore parse errors */
          }
          return {
            ok: false,
            error: `Could not add the Calendar reminder: ${detail}`,
          }
        }

        return { ok: true }
      } catch {
        return {
          ok: false,
          error:
            'Network problem — could not add the Calendar reminder. Try again later.',
        }
      }
    },
    [accessToken, userId],
  )

  return {
    connected,
    connecting,
    gisReady,
    clientIdMissing,
    connect,
    disconnect,
    createReminderEvent,
  }
}
