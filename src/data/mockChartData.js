export const MOCK_CHART_DATA = [
  { month: 'Dec', incidents: 12 },
  { month: 'Jan', incidents: 18 },
  { month: 'Feb', incidents: 15 },
  { month: 'Mar', incidents: 22 },
  { month: 'Apr', incidents: 28 },
  { month: 'May', incidents: 34 },
]

export function groupLogsByMonth(logs) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const counts = {}

  logs.forEach((log) => {
    const emergencyTypes = ['SOS_TRIGGERED', 'CRASH_SIMULATED', 'CRASH_DISPATCHED']
    if (!emergencyTypes.includes(log.action_type)) return
    const d = new Date(log.timestamp)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    counts[key] = (counts[key] || 0) + 1
  })

  const entries = Object.entries(counts)
    .map(([key, incidents]) => {
      const [, monthIdx] = key.split('-').map(Number)
      return { month: monthNames[monthIdx], incidents, sortKey: key }
    })
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(-6)

  return entries.length > 0 ? entries.map(({ month, incidents }) => ({ month, incidents })) : MOCK_CHART_DATA
}
