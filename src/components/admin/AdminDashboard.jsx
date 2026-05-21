import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { logAction, ACTION_TYPES } from '../../lib/usageLogger'
import { MOCK_ACTIVITY } from '../../lib/mockActivity'
import { groupLogsByMonth } from '../../data/mockChartData'
import KPICards from './KPICards'
import ActivityFeed from './ActivityFeed'
import TrendsChart from './TrendsChart'

const VULNERABLE_FALLBACK = 'I-95 Corridor, Sector 7'

function bucketZone(lat, lng) {
  if (lat == null || lng == null) return null
  const latB = Math.round(lat * 10) / 10
  const lngB = Math.round(lng * 10) / 10
  return `${latB}°N, ${Math.abs(lngB)}°W`
}

export default function AdminDashboard() {
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()
  const [logs, setLogs] = useState(MOCK_ACTIVITY)
  const [totalUsers, setTotalUsers] = useState(24)
  const [activeSos, setActiveSos] = useState(3)
  const [vulnerableZone, setVulnerableZone] = useState(VULNERABLE_FALLBACK)
  const [chartData, setChartData] = useState(groupLogsByMonth(MOCK_ACTIVITY))
  const [downloading, setDownloading] = useState(false)

  const enrichLogs = useCallback(async () => {
    if (!isSupabaseConfigured) return

    const { data, error } = await supabase
      .from('usage_logs')
      .select('*, profiles(full_name, email)')
      .order('timestamp', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[RoadSoS] logs fetch:', error.message)
      return
    }

    if (data?.length) {
      setLogs(data)
      setChartData(groupLogsByMonth(data))

      const sosCount = data.filter((l) => {
        const t = new Date(l.timestamp).getTime()
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000
        return (
          t > dayAgo &&
          ['SOS_TRIGGERED', 'CRASH_DISPATCHED'].includes(l.action_type)
        )
      }).length
      setActiveSos(sosCount || 3)

      const buckets = {}
      data.forEach((l) => {
        const z = bucketZone(l.latitude, l.longitude)
        if (z) buckets[z] = (buckets[z] || 0) + 1
      })
      const top = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0]
      if (top) setVulnerableZone(`Zone ${top[0]} (${top[1]} incidents)`)
    }

    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    if (count != null) setTotalUsers(count)
  }, [])

  useEffect(() => {
    enrichLogs()

    if (!isSupabaseConfigured) return

    const channel = supabase
      .channel('usage_logs_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'usage_logs' },
        async (payload) => {
          const row = payload.new
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', row.user_id)
            .single()

          const enriched = { ...row, profiles: prof || { full_name: 'User' } }
          setLogs((prev) => {
            const next = [enriched, ...prev].slice(0, 50)
            setChartData(groupLogsByMonth(next))
            return next
          })
          if (['SOS_TRIGGERED', 'CRASH_DISPATCHED'].includes(row.action_type)) {
            setActiveSos((n) => n + 1)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enrichLogs])

  const downloadCsv = async () => {
    setDownloading(true)
    let exportLogs = logs

    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('usage_logs')
        .select('*, profiles(email)')
        .order('timestamp', { ascending: false })
      if (data?.length) exportLogs = data
    }

    await logAction({ action_type: ACTION_TYPES.REPORT_DOWNLOADED })

    const headers = ['id', 'user_email', 'action_type', 'latitude', 'longitude', 'timestamp']
    const rows = exportLogs.map((l) => [
      l.id,
      l.profiles?.email || '',
      l.action_type,
      l.latitude ?? '',
      l.longitude ?? '',
      l.timestamp,
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join(
      '\n',
    )
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'RoadSOS_Global_Usage_Report_May_2026.csv'
    a.click()
    URL.revokeObjectURL(url)
    setDownloading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-amber/20">
              <Shield className="h-5 w-5 text-warning-amber" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Control Panel</h1>
              <p className="text-sm text-slate-400">
                {profile?.full_name || 'Administrator'} · RoadSoS Analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={downloadCsv}
              disabled={downloading}
              className="flex items-center gap-2 rounded-xl bg-traffic-red px-5 py-2.5 font-bold text-white shadow-lg transition hover:bg-red-500 disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              Download Monthly Report (CSV)
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <KPICards
          totalUsers={totalUsers}
          activeSos={activeSos}
          vulnerableZone={vulnerableZone}
        />
        <div className="grid gap-8 lg:grid-cols-2">
          <ActivityFeed logs={logs} />
          <TrendsChart data={chartData} />
        </div>
      </main>
    </div>
  )
}
