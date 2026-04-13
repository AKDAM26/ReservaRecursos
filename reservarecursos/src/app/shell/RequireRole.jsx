import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'

export function RequireRole({ allow, children }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (!allow.includes(user.role)) return <Navigate to="/app/inicio" replace />

  return children
}

