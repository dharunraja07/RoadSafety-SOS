export const MOCK_ACTIVITY = [
  {
    id: 9001,
    action_type: 'CRASH_SIMULATED',
    latitude: 40.7128,
    longitude: -74.006,
    timestamp: new Date(Date.now() - 12 * 1000).toISOString(),
    profiles: { full_name: 'Mark S.', email: 'mark@demo.com' },
  },
  {
    id: 9002,
    action_type: 'FIRST_AID_VIEW',
    latitude: 40.758,
    longitude: -73.9855,
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    profiles: { full_name: 'David K.', email: 'david@demo.com' },
  },
  {
    id: 9003,
    action_type: 'SOS_TRIGGERED',
    latitude: 40.7306,
    longitude: -73.9352,
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    profiles: { full_name: 'Sarah L.', email: 'sarah@demo.com' },
  },
  {
    id: 9004,
    action_type: 'CRASH_DISPATCHED',
    latitude: 40.6892,
    longitude: -74.0445,
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    profiles: { full_name: 'James R.', email: 'james@demo.com' },
  },
  {
    id: 9005,
    action_type: 'REPORT_DOWNLOADED',
    latitude: null,
    longitude: null,
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    profiles: { full_name: 'Test Admin', email: 'demo-admin@roadsos.demo' },
  },
  {
    id: 9006,
    action_type: 'SOS_TRIGGERED',
    latitude: 34.0522,
    longitude: -118.2437,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    profiles: { full_name: 'Elena M.', email: 'elena@demo.com' },
  },
]

export function formatActivityMessage(log) {
  const name =
    log.profiles?.full_name ||
    log.profiles?.email?.split('@')[0] ||
    'Unknown User'

  const templates = {
    SOS_TRIGGERED: `${name} triggered SOS Alert`,
    CRASH_SIMULATED: `${name} triggered Crash Simulator`,
    CRASH_DISPATCHED: `${name} — Emergency Team Dispatched`,
    FIRST_AID_VIEW: `${name} viewed First Aid Manual`,
    REPORT_DOWNLOADED: `${name} downloaded Monthly Report`,
  }

  return templates[log.action_type] || `${name} — ${log.action_type}`
}
