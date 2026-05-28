import { useEffect, useState } from 'react'
import { useAuth } from '../../app/auth/useAuth'
import { reservationsService } from '../../lib/services/reservations.service'
import { ReservationDetailsModal } from './ReservationDetailsModal'
import { IncidentModal } from './IncidentModal'

export function MyReservationsPage() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState(null)

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

  const handleCardClick = (res) => {
    setSelectedReservation(res)
    setIsDetailsModalOpen(true)
  }

  const handleReportIncident = (res, incident = null) => {
    setSelectedReservation(res)
    setSelectedIncident(incident)
    setIsDetailsModalOpen(false)
    setIsIncidentModalOpen(true)
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
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {reservations.map(res => {
            const isActive = res.status === 'active'
            const resDate = new Date(res.reservation_date)
            const isPast = resDate < new Date(new Date().setHours(0,0,0,0))
            const statusLabel = !isActive ? 'Cancelada' : isPast ? 'Pasada' : 'Activa'
            const opacityVal = isActive && !isPast ? 1 : 0.6
            
            const creationDate = new Date(res.created_at).toLocaleDateString('es-ES')
            const formattedResDate = resDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

            return (
              <div 
                key={res.id} 
                onClick={() => handleCardClick(res)}
                style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: '1.25rem', 
                  borderRadius: '8px', 
                  opacity: opacityVal,
                  background: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'transform 0.1s, box-shadow 0.1s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>{res.resources?.name || 'Recurso'}</h3>
                  <span className={`status-badge ${!isActive ? 'status-full' : (isPast ? 'status-partial' : 'status-available')}`} style={{ fontSize: '10px' }}>
                    {statusLabel}
                  </span>
                </div>
                
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '12px' }}>
                  Creada el {creationDate}
                </div>

                <div style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '4px', textTransform: 'capitalize' }}>
                  <strong>Día:</strong> {formattedResDate}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '8px' }}>
                  <strong>Periodos:</strong> {res.period_start} {res.period_start !== res.period_end ? `al ${res.period_end}` : ''}
                </div>
                
                <div style={{ fontSize: '0.9rem', color: '#4b5563', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {res.notes}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isDetailsModalOpen && selectedReservation && (
        <ReservationDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          reservation={selectedReservation}
          onReportIncident={handleReportIncident}
          onSuccess={fetchReservations}
        />
      )}

      {isIncidentModalOpen && selectedReservation && (
        <IncidentModal
          isOpen={isIncidentModalOpen}
          onClose={() => setIsIncidentModalOpen(false)}
          reservation={selectedReservation}
          incident={selectedIncident}
          onSuccess={fetchReservations}
        />
      )}
    </section>
  )
}
