import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function TrendsChart({ data }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
      <h3 className="mb-4 font-bold text-white">
        Emergency Incidents Over Time (Monthly Summary)
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#f8fafc' }}
            />
            <Bar dataKey="incidents" fill="#EF4444" radius={[6, 6, 0, 0]} name="Incidents" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
