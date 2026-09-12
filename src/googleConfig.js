/**
 * Google OAuth Web Client ID (public — ends up in the browser anyway).
 * Kept in source so Vercel builds work without Environment Variables / Pro.
 */
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '334250469440-8bqeg3q54ksvtbjlpsknr8geoap37a8k.apps.googleusercontent.com'
