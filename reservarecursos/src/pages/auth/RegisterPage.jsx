import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/auth/useAuth.js'
import { departmentsService } from '../../lib/services/departments.service.js'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    departmentsService.getDepartments()
      .then(setDepartments)
      .catch(err => console.error("Error obteniendo departamentos:", err))
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    if (!departmentId) {
      setError('Por favor define a qué departamento perteneces.')
      return
    }

    setLoading(true)
    try {
      await register({ email, password, department_id: departmentId, display_name: displayName })
      navigate('/app/inicio', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta.')
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
          <div className="authCard__icon">👤</div>
          <h1>Crea tu cuenta</h1>
          <p>Únete para reservar aulas fácilmente</p>

          <label className="field">
            <span>Nombre Completo</span>
            <input 
              className="input" 
              placeholder="Ej: Juan Pérez" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Departamento</span>
            <select 
              className="input" 
              value={departmentId} 
              onChange={(e) => setDepartmentId(e.target.value)}
              required
            >
              <option value="" disabled>-- Selecciona un departamento --</option>
              {departments.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.name}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Correo Electrónico</span>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@educa.madrid.org"
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
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              required
            />
          </label>

          {error ? <div className="alert alert--error">{error}</div> : null}

          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>

          <div className="authCard__switch">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
          </div>
        </form>
      </main>

      <footer className="site__footer">© 2026 ReservaAula. Todos los derechos reservados.</footer>
    </div>
  )
}
