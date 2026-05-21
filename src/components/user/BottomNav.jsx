import { LayoutDashboard, HeartPulse, AlertOctagon } from 'lucide-react'

const TABS = [
  { id: 'hub', label: 'Hub', Icon: LayoutDashboard },
  { id: 'firstaid', label: 'First Aid', Icon: HeartPulse },
  { id: 'sos', label: 'SOS', Icon: AlertOctagon },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-lg justify-around px-2 py-2">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition-all ${
                isActive ? 'text-traffic-red' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
