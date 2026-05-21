import { supabase, isSupabaseConfigured } from './supabaseClient'

export const ACTION_TYPES = {
  SOS_TRIGGERED: 'SOS_TRIGGERED',
  CRASH_SIMULATED: 'CRASH_SIMULATED',
  CRASH_DISPATCHED: 'CRASH_DISPATCHED',
  FIRST_AID_VIEW: 'FIRST_AID_VIEW',
  REPORT_DOWNLOADED: 'REPORT_DOWNLOADED',
}

export async function logAction({ action_type, latitude = null, longitude = null }) {
  if (!isSupabaseConfigured) {
    console.info('[RoadSoS Demo]', action_type, { latitude, longitude })
    return { ok: true, demo: true }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    console.warn('[RoadSoS] logAction skipped — no authenticated user')
    return { ok: false }
  }

  const { error } = await supabase.from('usage_logs').insert({
    user_id: user.id,
    action_type,
    latitude,
    longitude,
  })

  if (error) {
    console.error('[RoadSoS] logAction failed:', error.message)
    return { ok: false, error }
  }

  return { ok: true }
}
