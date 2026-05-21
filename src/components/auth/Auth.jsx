import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, AlertTriangle, User, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const DEMO_USER = { email: 'demo-user@roadsos.demo', password: 'DemoUser123!' }
const DEMO_ADMIN = { email: 'demo-admin@roadsos.demo', password: 'DemoAdmin123!' }

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { signIn, signUp, isSupabaseConfigured } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    if (!email.includes('@')) return 'Enter a valid email address.'
    if (password.length < 6) return 'Password must be at least 6 characters.'
    if (mode === 'signup' && !fullName.trim()) return 'Full name is required.'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'login') {
        const { profile: prof } = await signIn(email, password)
        navigate(prof?.role === 'admin' ? '/admin' : '/app')
      } else {
        await signUp(email, password, fullName)
        setSuccess('Account created! Check email to confirm, or sign in if auto-confirmed.')
        setMode('login')
      }
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  const quickLogin = async (creds, destination) => {
    setError('')
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured.')
      return
    }
    setSubmitting(true)
    try {
      const { profile: prof } = await signIn(creds.email, creds.password)
      navigate(prof?.role === 'admin' ? '/admin' : destination)
    } catch (err) {
      setError(err.message || 'Quick login failed. Create demo users in Supabase Auth.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-traffic-red/20 via-slate-950 to-slate-950" />
      <div className="pointer-events-none absolute -right-32 top-20 h-64 w-64 rounded-full bg-warning-amber/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-traffic-red/20 ring-2 ring-traffic-red/50">
            <Shield className="h-8 w-8 text-traffic-red" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">RoadSoS</h1>
          <p className="mt-1 text-sm text-slate-400">Life-saving emergency response</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur">
          {!isSupabaseConfigured && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning-amber/40 bg-warning-amber/10 px-3 py-2 text-sm text-warning-amber">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Connect Supabase via .env to enable auth and live logging.</span>
            </div>
          )}

          <div className="mb-6 flex rounded-lg bg-slate-800 p-1">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m)
                  setError('')
                  setSuccess('')
                }}
                className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-traffic-red text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none ring-traffic-red focus:ring-2"
                  placeholder="Jane Doe"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none ring-traffic-red focus:ring-2"
                placeholder="you@email.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none ring-traffic-red focus:ring-2"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-traffic-red/15 px-3 py-2 text-sm text-traffic-red" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-400">{success}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-traffic-red py-3 font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {submitting ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-6">
            <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
              Quick Login for Judges
            </p>
            <div className="grid gap-2">
              <button
                type="button"
                disabled={submitting || !isSupabaseConfigured}
                onClick={() => quickLogin(DEMO_USER, '/app')}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-sm font-medium text-white transition hover:border-emerald-500/50 hover:bg-slate-700 disabled:opacity-40"
              >
                <User className="h-4 w-4 text-emerald-400" />
                Test User → Emergency Hub
              </button>
              <button
                type="button"
                disabled={submitting || !isSupabaseConfigured}
                onClick={() => quickLogin(DEMO_ADMIN, '/admin')}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-sm font-medium text-white transition hover:border-warning-amber/50 hover:bg-slate-700 disabled:opacity-40"
              >
                <ShieldCheck className="h-4 w-4 text-warning-amber" />
                Test Admin → Control Panel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
