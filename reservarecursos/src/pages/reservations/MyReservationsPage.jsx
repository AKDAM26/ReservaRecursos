import { useEffect, useState } from 'react'
import { useAuth } from '../../app/auth/useAuth'
import { reservationsService } from '../../lib/services/reservations.service'

export function MyReservationsPage() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchReservations = async () => {
    setLoading(true)
    try {
      const data = await reservationsService.getReservations({ created_by: user.id })
      setReservations(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) fetchReservations()
  }, [user?.id])

  const handleCancel = async (id) => {
    if (!confirm('¿Seguro que deseas cancelar esta reserva?')) return
    try {
      await reservationsService.cancelReservation(id, user.id)
      fetchReservations()
    } catch (err) {
      alert('Error cambiando estado: ' + err.message)
    }
  }

  return (
    <section className="pageWrap">
      <div className="titleBar">
        <h1>Mis Reservas</h1>
        <p>Gestiona tus horarios y recursos reservados</p>
      </div>

      {loading ? (
        <article className="emptyPanel">
          <p className="emptyPanel__text">Cargando tus reservas...</p>
        </article>
      ) : reservations.length === 0 ? (
        <article className="emptyPanel">
          <p className="emptyPanel__title">No tienes reservas todavía</p>
          <p className="emptyPanel__text">
            Cuando crees reservas desde el calendario o los recursos, aparecerán aquí.
          </p>
        </article>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {reservations.map(res => {
            const isActive = res.status === 'active'
            const start = new Date(res.start_at)
            const end = new Date(res.end_at)
            return (
              <div key={res.id} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px', opacity: isActive ? 1 : 0.6 }}>
                <h3>{start.toLocaleDateString()} de {start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} a {end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</h3>
                <p>Motivo: {res.notes}</p>
                <p>Estado: {res.status}</p>
                {isActive && (
                  <button className="btn btn--danger" style={{marginTop: '0.5rem'}} onClick={() => handleCancel(res.id)}>Cancelar Reserva</button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
