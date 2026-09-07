import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

export default function Toast({ message, tone = 'error', onClose }) {
  useEffect(() => {
    if (!message) return undefined
    const id = window.setTimeout(onClose, 6000)
    return () => window.clearTimeout(id)
  }, [message, onClose])

  if (!message) return null

  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle
  const iconClass = tone === 'success' ? 'text-ok' : 'text-due'

  return (
    <div
      role="status"
      className="fixed bottom-5 left-4 right-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-white/20 bg-[#0b0614] px-4 py-3 text-white shadow-2xl"
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} />
      <p className="flex-1 text-sm leading-relaxed text-white/90">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-full p-0.5 text-white/50 hover:bg-white/10 hover:text-white"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
