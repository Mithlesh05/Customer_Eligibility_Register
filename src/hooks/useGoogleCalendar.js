import { useCallback, useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID } from '../googleConfig'

const SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const EVENTS_URL =
  'https://www.googleapis.com/calendar/v3/calendars/primary/events'
const TOKEN_KEY = 'google_cal_access_token'
const EXPIRY_KEY = 'google_cal_token_expiry'

const CLIENT_ID = GOOGLE_CLIENT_ID

function isPlaceholderClientId(id) {
  return !id || id.includes('YOUR_GOOGLE_CLIENT_ID')
}

function readStoredToken() {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const expiry = Number(sessionStorage.getItem(EXPIRY_KEY) || 0)
  if (!token || !expiry || expiry <= Date.now()) {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(EXPIRY_KEY)
    return { token: null, expiry: 0 }
  }
  return { token, expiry }
}

function saveToken(token, expiresInSeconds) {
  const expiry = Date.now() + Math.max(0, Number(expiresInSeconds) - 60) * 1000
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(EXPIRY_KEY, String(expiry))
}

function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(EXPIRY_KEY)
}

/**
 * Frontend-only Google Calendar authorization via GIS oauth2 token client.
 * This is Calendar API authorization (initTokenClient), not Sign in with
 * Google (google.accounts.id). No authorization-code, no client secret,
 * no backend, no popup.closed polling in our code.
 */
export function useGoogleCalendar(onConnectResult) {
  const clientIdMissing = isPlaceholderClientId(CLIENT_ID)
  const [accessToken, setAccessToken] = useState(
    () => readStoredToken().token,
  )
  const [connecting, setConnecting] = useState(false)
  const [gisReady, setGisReady] = useState(false)
  const tokenClientRef = useRef(null)
  const onConnectResultRef = useRef(onConnectResult)
  const finishedRef = useRef(false)
  onConnectResultRef.current = onConnectResult

  const connected = Boolean(accessToken)

  useEffect(() => {
    if (clientIdMissing) return undefined

    let intervalId = 0

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
          saveToken(
            response.access_token,
            Number(response.expires_in || 3600),
          )
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
              'Google sign-in could not open. Allow pop-ups for this site and try again.',
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
  }, [clientIdMissing])

  const connect = useCallback(() => {
    if (!tokenClientRef.current) {
      onConnectResultRef.current?.({
        ok: false,
        error:
          'Google sign-in is still loading. Wait a second and try Connect Calendar again.',
      })
      return
    }
    finishedRef.current = false
    tokenClientRef.current.requestAccessToken()
    setConnecting(true)
  }, [])

  const createReminderEvent = useCallback(
    async (customer) => {
      const token = accessToken || readStoredToken().token
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
          clearToken()
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
    [accessToken],
  )

  return {
    connected,
    connecting,
    gisReady,
    clientIdMissing,
    connect,
    createReminderEvent,
  }
}
