import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { departmentsService } from '../../lib/services/departments.service'
import { profilesService } from '../../lib/services/profiles.service'

export function AppShell() {
  const { user, logout, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [openProfile, setOpenProfile] = useState(false)
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDepartmentId, setEditDepartmentId] = useState('')
  const [departments, setDepartments] = useState([])
  const [loadingProfile, setLoadingProfile] = useState(false)

  // Fetch departments when profile opens
  useEffect(() => {
    if (openProfile && departments.length === 0) {
      departmentsService.getDepartments().then(setDepartments).catch(console.error)
    }
    if (openProfile && user) {
      setEditName(user.displayName || '')
      setEditDepartmentId(user.departmentId || '')
      setIsEditingProfile(false)
    }
  }, [openProfile, user, departments.length])

  const handleSaveProfile = async () => {
    if (!editName.trim()) return alert('El nombre no puede estar vacío.')
    
    const confirm = window.confirm('¿Estás seguro de que deseas guardar estos cambios en tu perfil?')
    if (!confirm) return

    try {
      setLoadingProfile(true)
      await profilesService.updateProfile(user.id, {
        display_name: editName.trim(),
        department_id: editDepartmentId || null
      })
      await refreshProfile()
      setIsEditingProfile(false)
      alert('Perfil actualizado con éxito.')
    } catch (err) {
      console.error(err)
      alert('Error al actualizar el perfil.')
    } finally {
      setLoadingProfile(false)
    }
  }

  const items = [
    { to: '/app/inicio', label: 'Inicio', roles: ['teacher', 'admin'] },
    { to: '/app/calendario', label: 'Calendario', roles: ['teacher', 'admin'] },
    { to: '/app/mis-reservas', label: 'Mis Reservas', roles: ['teacher', 'admin'] },
    { to: '/app/recursos', label: 'Recursos', roles: ['admin'] },
    { to: '/app/tipos', label: 'Tipos', roles: ['admin'] },
    { to: '/app/incidencias', label: 'Incidencias', roles: ['admin'] },
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
              {isEditingProfile ? (
                <>
                  <div className="profileModal__row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    <span style={{ fontSize: '0.8rem' }}>Nombre</span>
                    <input 
                      type="text" 
                      className="input" 
                      style={{ width: '100%' }}
                      value={editName} 
                      onChange={e => setEditName(e.target.value)} 
                    />
                  </div>
                  <div className="profileModal__row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    <span style={{ fontSize: '0.8rem' }}>Departamento</span>
                    <select 
                      className="input" 
                      style={{ width: '100%' }}
                      value={editDepartmentId} 
                      onChange={e => setEditDepartmentId(e.target.value)}
                    >
                      <option value="">(Sin departamento)</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="profileModal__row">
                    <span>Email</span>
                    <strong>{user?.email}</strong>
                  </div>
                  <div className="profileModal__row">
                    <span>Departamento</span>
                    <strong>{departments.find(d => d.id === user?.departmentId)?.name || '—'}</strong>
                  </div>
                  <div className="profileModal__row">
                    <span>ID de usuario</span>
                    <strong style={{ fontSize: '0.85em', color: '#666' }}>{user?.id?.slice(0, 12)}...</strong>
                  </div>
                </>
              )}
            </div>
            <div className="profileModal__actions" style={{ justifyContent: isEditingProfile ? 'space-between' : 'flex-end', display: 'flex', width: '100%', marginTop: '1rem' }}>
              {isEditingProfile ? (
                <>
                  <button type="button" className="btn btn--outline" onClick={() => setIsEditingProfile(false)} disabled={loadingProfile}>
                    Cancelar
                  </button>
                  <button type="button" className="btn btn--primary" onClick={handleSaveProfile} disabled={loadingProfile}>
                    {loadingProfile ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn btn--outline" onClick={() => setIsEditingProfile(true)} style={{ marginRight: 'auto' }}>
                    Editar Perfil
                  </button>
                  <button type="button" className="btn btn--primary" onClick={() => setOpenProfile(false)}>
                    Cerrar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

