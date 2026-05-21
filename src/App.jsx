import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Auth from './components/auth/Auth'
import UserDashboard from './components/user/UserDashboard'
import AdminDashboard from './components/admin/AdminDashboard'

function ProtectedRoute({ children, requireAdmin = false }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-traffic-red border-t-transparent" />
      </div>
    )
  }

  if (!session) return <Navigate to="/" replace />

  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/app" replace />
  }

  if (!requireAdmin && profile?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return children
}

function PublicRoute({ children }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-traffic-red border-t-transparent" />
      </div>
    )
  }

  if (session && profile) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/app'} replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        }
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
