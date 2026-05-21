import { formatDistanceToNow } from 'date-fns'
import { Activity } from 'lucide-react'
import { formatActivityMessage } from '../../lib/mockActivity'

export default function ActivityFeed({ logs }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
        <Activity className="h-5 w-5 text-traffic-red" />
        <h3 className="font-bold text-white">Live Activity Feed</h3>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Real-time
        </span>
      </div>
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-900 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Event</th>
              <th className="px-5 py-3">When</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={2} className="px-5 py-8 text-center text-slate-500">
                  No activity yet. Trigger SOS or crash sim from the user app.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr
                key={log.id}
                className="border-t border-slate-800/80 transition hover:bg-slate-800/40"
              >
                <td className="px-5 py-3 text-slate-200">{formatActivityMessage(log)}</td>
                <td className="px-5 py-3 whitespace-nowrap font-mono text-xs text-slate-500">
                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
