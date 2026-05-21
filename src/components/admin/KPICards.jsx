import { Users, Radio, MapPinned } from 'lucide-react'

export default function KPICards({ totalUsers, activeSos, vulnerableZone }) {
  const cards = [
    {
      label: 'Total Registered Users',
      value: totalUsers,
      Icon: Users,
      accent: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    {
      label: 'Active Live SOS Alerts',
      value: activeSos,
      Icon: Radio,
      accent: 'text-traffic-red',
      bg: 'bg-traffic-red/10',
    },
    {
      label: 'Most Vulnerable Driving Zone',
      value: vulnerableZone,
      Icon: MapPinned,
      accent: 'text-warning-amber',
      bg: 'bg-warning-amber/10',
      isText: true,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map(({ label, value, Icon, accent, bg, isText }) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg transition hover:border-slate-700"
        >
          <div className={`mb-4 inline-flex rounded-xl p-3 ${bg}`}>
            <Icon className={`h-6 w-6 ${accent}`} />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <p
            className={`mt-2 font-bold text-white ${isText ? 'text-lg leading-snug' : 'text-4xl tabular-nums'}`}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  )
}
