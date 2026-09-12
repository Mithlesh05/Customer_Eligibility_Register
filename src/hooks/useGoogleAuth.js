import { useCallback, useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID } from '../googleConfig'
import { userFromCredential } from '../utils/googleIdToken'

const SESSION_KEY = 'eligibility_google_user'

function isPlaceholderClientId(id) {
  return !id || id.includes('YOUR_GOOGLE_CLIENT_ID')
}

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.id) return null
    return parsed
  } catch {
    return null
  }
}

function writeSession(user) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    }),
  )
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

/**
 * Sign in with Google (Identity Services ID token).
 * Separate from Calendar OAuth (initTokenClient) — login identifies the
 * person; Connect Calendar separately authorizes Calendar API access.
 */
export function useGoogleAuth() {
  const clientIdMissing = isPlaceholderClientId(GOOGLE_CLIENT_ID)
  const [user, setUser] = useState(() => readSession())
  const [gisReady, setGisReady] = useState(false)
  const [error, setError] = useState('')
  const buttonHostRef = useRef(null)

  const applyCredential = useCallback((credential) => {
    const next = userFromCredential(credential)
    if (!next) {
      setError('Google sign-in did not return a valid account. Try again.')
      return
    }
    writeSession(next)
    setUser(next)
    setError('')
  }, [])

  useEffect(() => {
    if (clientIdMissing || user) return undefined

    let intervalId = 0
    let cancelled = false

    const mountButton = () => {
      const id = window.google?.accounts?.id
      const host = buttonHostRef.current
      if (!id || !host) return Boolean(id && host)

      host.innerHTML = ''
      id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (!response?.credential) {
            setError('Google sign-in was cancelled or failed. Try again.')
            return
          }
          applyCredential(response.credential)
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
      })
      id.renderButton(host, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: 320,
      })
      setGisReady(true)
      return true
    }

    if (!mountButton()) {
      intervalId = window.setInterval(() => {
        if (cancelled) return
        if (mountButton()) window.clearInterval(intervalId)
      }, 50)
    }

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      if (buttonHostRef.current) buttonHostRef.current.innerHTML = ''
    }
  }, [applyCredential, clientIdMissing, user])

  const signOut = useCallback(() => {
    try {
      window.google?.accounts?.id?.disableAutoSelect?.()
    } catch {
      /* ignore */
    }
    clearSession()
    setUser(null)
    setGisReady(false)
    setError('')
  }, [])

  return {
    user,
    gisReady,
    clientIdMissing,
    error,
    buttonHostRef,
    signOut,
  }
}
