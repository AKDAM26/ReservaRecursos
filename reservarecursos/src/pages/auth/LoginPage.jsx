import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/auth/useAuth.js'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ email, password })
      navigate('/app/inicio', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="authScreen">
      <header className="site__topbar">
        <div className="topbar__brand">ReservaAula</div>
        <div className="authScreen__actions">
          <Link className="btn btn--ghost" to="/login">
            Iniciar Sesión
          </Link>
          <Link className="btn btn--primary" to="/register">
            Registrarse
          </Link>
        </div>
      </header>

      <main className="authScreen__main">
        <form className="authCard" onSubmit={onSubmit}>
          <div className="authCard__icon">↪</div>
          <h1>Bienvenido de nuevo</h1>
          <p>Accede con tu Nombre para gestionar reservas</p>

          <label className="field">
            <span>Correo</span>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@educa.madrid.org"
              inputMode="email"
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>Contraseña</span>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <div className="alert alert--error">{error}</div> : null}

          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>

          <div className="authCard__switch">
            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
          </div>
        </form>
      </main>

      <footer className="site__footer">© 2026 ReservaAula. Todos los derechos reservados.</footer>
    </div>
  )
}

