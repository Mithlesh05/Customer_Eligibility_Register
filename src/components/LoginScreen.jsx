import { Loader2, Sparkles } from 'lucide-react'

export default function LoginScreen({
  buttonHostRef,
  gisReady,
  clientIdMissing,
  error,
}) {
  return (
    <div className="relative isolate flex min-h-svh flex-col overflow-hidden bg-[#0b0614] text-white">
      <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-violet-500/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/3 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mb-10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <Sparkles className="h-4 w-4 text-violet-200" />
          </div>
          <span className="text-sm font-semibold tracking-wide">Eligibility</span>
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200/80">
          Sign in
        </p>
        <h1 className="mt-3 text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
          Your register,
          <span className="bg-gradient-to-r from-violet-200 to-fuchsia-300 bg-clip-text text-transparent">
            {' '}
            your data
          </span>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65 sm:text-base">
          Sign in with Google to open your own customer list. Each account stays
          separate on this device.
        </p>

        <div className="mt-10 flex min-h-12 flex-col items-start gap-3">
          {clientIdMissing ? (
            <p className="text-sm text-rose-300">
              Google Client ID is missing. Add it and redeploy the app.
            </p>
          ) : (
            <>
              {!gisReady ? (
                <p className="inline-flex items-center gap-2 text-sm text-white/55">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading Google sign-in…
                </p>
              ) : null}
              <div ref={buttonHostRef} className="min-h-10" />
            </>
          )}
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </div>
      </div>
    </div>
  )
}
