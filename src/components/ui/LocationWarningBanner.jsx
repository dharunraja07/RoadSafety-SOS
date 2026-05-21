import { AlertTriangle } from 'lucide-react'

export default function LocationWarningBanner({ message }) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-3 rounded-xl border border-warning-amber/40 bg-warning-amber/10 px-4 py-3"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-amber" />
      <p className="text-sm leading-relaxed text-warning-amber">{message}</p>
    </div>
  )
}
