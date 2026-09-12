/**
 * Decode a Google ID token payload in the browser.
 * Frontend-only apps cannot cryptographically verify the JWT without a
 * backend; we use `sub` only to namespace localStorage per Google account.
 */
export function decodeJwtPayload(credential) {
  try {
    const part = credential.split('.')[1]
    if (!part) return null
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    )
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function userFromCredential(credential) {
  const payload = decodeJwtPayload(credential)
  if (!payload?.sub) return null
  return {
    id: String(payload.sub),
    email: payload.email || '',
    name: payload.name || payload.email || 'Google user',
    picture: payload.picture || '',
    credential,
  }
}
