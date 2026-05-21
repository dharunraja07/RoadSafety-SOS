import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as LucideIcons from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { FIRST_AID_CATEGORIES } from '../../data/firstAidContent'
import { logAction, ACTION_TYPES } from '../../lib/usageLogger'

function renderStep(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-bold text-white">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

export default function FirstAid() {
  const [expanded, setExpanded] = useState(null)

  const toggle = async (id) => {
    const next = expanded === id ? null : id
    setExpanded(next)
    if (next) {
      await logAction({ action_type: ACTION_TYPES.FIRST_AID_VIEW })
    }
  }

  return (
    <div className="px-4 pb-28 pt-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">First Aid Guide</h1>
        <p className="text-sm text-slate-400">Works offline — no signal required</p>
      </header>

      <div className="space-y-4">
        {FIRST_AID_CATEGORIES.map((cat) => {
          const Icon = LucideIcons[cat.icon] || LucideIcons.Heart
          const isOpen = expanded === cat.id

          return (
            <div
              key={cat.id}
              className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80"
            >
              <button
                type="button"
                onClick={() => toggle(cat.id)}
                className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-slate-800/50"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    cat.color === 'traffic-red'
                      ? 'bg-traffic-red/20'
                      : cat.color === 'warning-amber'
                        ? 'bg-warning-amber/20'
                        : 'bg-emerald-500/20'
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${
                      cat.color === 'traffic-red'
                        ? 'text-traffic-red'
                        : cat.color === 'warning-amber'
                          ? 'text-warning-amber'
                          : 'text-emerald-400'
                    }`}
                  />
                </div>
                <span className="flex-1 font-bold text-white">{cat.title}</span>
                <ChevronDown
                  className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-800 px-4 pb-5 pt-2">
                      {cat.hasMetronome && (
                        <div className="mb-6 flex flex-col items-center py-4">
                          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-400">
                            100 BPM — compress on beat
                          </p>
                          <div
                            className="h-28 w-28 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/40 animate-cpr-beat"
                            aria-label="CPR compression metronome at 100 beats per minute"
                          />
                        </div>
                      )}
                      <ul className="space-y-3">
                        {cat.steps.map((step, i) => (
                          <li
                            key={i}
                            className="flex gap-3 text-sm leading-relaxed text-slate-300"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-warning-amber">
                              {i + 1}
                            </span>
                            <span>{renderStep(step)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
