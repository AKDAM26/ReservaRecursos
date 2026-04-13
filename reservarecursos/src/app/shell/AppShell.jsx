import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'

export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [openProfile, setOpenProfile] = useState(false)

  const items = [
    { to: '/app/inicio', label: 'Inicio', roles: ['teacher', 'admin'] },
    { to: '/app/calendario', label: 'Calendario', roles: ['teacher', 'admin'] },
    { to: '/app/mis-reservas', label: 'Mis Reservas', roles: ['teacher', 'admin'] },
    { to: '/app/recursos', label: 'Recursos', roles: ['admin'] },
    { to: '/app/tipos', label: 'Tipos', roles: ['admin'] },
  ]
  const visible = items.filter((item) => item.roles.includes(user?.role ?? 'teacher'))

  return (
    <div className="site">
      <header className="site__topbar">
        <div className="topbar__brand">ReservaAula</div>

        <nav className="topbar__nav">
          {visible.map((item) => (
            <NavLink key={item.to} to={item.to} className="topbar__link">
              {item.label}
            </NavLink>
          ))}
          <button type="button" className="topbar__iconBtn" onClick={() => setOpenProfile(true)}>
            Perfil
          </button>
          <button
            type="button"
            className="topbar__iconBtn"
            onClick={() => {
              const ok = window.confirm('¿Cerrar sesión? Se cerrará tu sesión en este dispositivo.')
              if (!ok) return
              logout()
              navigate('/login', { replace: true })
            }}
          >
            Salir
          </button>
        </nav>
      </header>

      <main className="site__content">
        <Outlet />
      </main>

      <footer className="site__footer">© 2026 ReservaAula. Todos los derechos reservados.</footer>

      {openProfile ? (
        <div className="modalOverlay" role="presentation" onClick={() => setOpenProfile(false)}>
          <div className="profileModal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="profileModal__header">
              <button
                type="button"
                className="profileModal__close"
                onClick={() => setOpenProfile(false)}
              >
                ×
              </button>
              <div className="profileModal__avatar">👤</div>
              <div className="profileModal__name">{user?.displayName}</div>
              <div className="profileModal__role">
                {user?.role === 'admin' ? 'Administrador' : 'Profesor'}
              </div>
            </div>
            <div className="profileModal__body">
              <div className="profileModal__row">
                <span>Email</span>
                <strong>{user?.email}</strong>
              </div>
              <div className="profileModal__row">
                <span>Departamento</span>
                <strong>—</strong>
              </div>
              <div className="profileModal__row">
                <span>ID de usuario</span>
                <strong>{user?.id?.slice(0, 8)}</strong>
              </div>
            </div>
            <div className="profileModal__actions">
              <button type="button" className="btn btn--primary" onClick={() => setOpenProfile(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

