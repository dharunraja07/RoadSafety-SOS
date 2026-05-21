export default function SkeletonLoader({ lines = 3, className = '', pulsing = false }) {
  return (
    <div
      className={`animate-pulse space-y-3 ${pulsing ? 'rounded-lg ring-2 ring-warning-amber/20 ring-offset-2 ring-offset-slate-950' : ''} ${className}`}
      aria-hidden="true"
      aria-busy={pulsing ? 'true' : undefined}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="shimmer-bar h-4"
          style={{ width: `${85 - i * 12}%` }}
        />
      ))}
    </div>
  )
}
