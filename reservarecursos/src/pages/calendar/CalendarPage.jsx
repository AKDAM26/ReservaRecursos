import { useEffect, useMemo, useState, useCallback } from 'react'
import { getMonthGrid, isSameDay, monthLabel, startOfDay } from '../../lib/date.js'
import { reservationsService } from '../../lib/services/reservations.service.js'
import { ReservationModal } from '../reservations/ReservationModal.jsx'

const WEEKDAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

export function CalendarPage() {
  const today = useMemo(() => startOfDay(new Date()), [])
  const [cursorMonth, setCursorMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedDay, setSelectedDay] = useState(today)
  const grid = useMemo(() => getMonthGrid(cursorMonth), [cursorMonth])

  const [monthReservations, setMonthReservations] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    const startAfter = new Date(cursorMonth.getFullYear(), cursorMonth.getMonth(), 1).toISOString()
    const endBefore = new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() + 1, 0, 23, 59, 59).toISOString()
    try {
      const data = await reservationsService.getReservations({ startAfter, endBefore, status: 'active' })
      setMonthReservations(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [cursorMonth])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const dayReservations = useMemo(() => {
    return monthReservations.filter(res => {
      const resDate = startOfDay(new Date(res.start_at))
      return isSameDay(resDate, selectedDay)
    })
  }, [monthReservations, selectedDay])

  const handleReservationSuccess = () => {
    setIsModalOpen(false)
    fetchReservations()
  }

  // Format the selected day for the modal (YYYY-MM-DD)
  const selectedDayIso = selectedDay.toISOString().split('T')[0]

  return (
    <section className="pageWrap">
      <div className="titleBar titleBar--row">
        <div>
          <h1>Calendario de Reservas</h1>
          <p>Visualiza todas las ocupaciones de recursos</p>
        </div>
        <button className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
          Nueva Reserva
        </button>
      </div>

      <div className="calendarLayout">
        <section className="calendarBox">
          <div className="calendarBox__head">
            <button
              type="button"
              onClick={() =>
                setCursorMonth(new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() - 1, 1))
              }
            >
              ‹
            </button>
            <strong>{monthLabel(cursorMonth)}</strong>
            <button
              type="button"
              onClick={() =>
                setCursorMonth(new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() + 1, 1))
              }
            >
              ›
            </button>
          </div>

          <div className="calendarBox__weekdays">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendarBox__grid">
            {grid.map(({ date, inMonth }) => {
              const classes = ['calendarDay']
              if (!inMonth) classes.push('is-out')
              if (isSameDay(date, today)) classes.push('is-today')
              if (isSameDay(date, selectedDay)) classes.push('is-active')
              
              // Indicate if date has reservations
              const hasRes = monthReservations.some(r => isSameDay(startOfDay(new Date(r.start_at)), date))

              return (
                <button
                  key={date.toISOString()}
                  className={classes.join(' ')}
                  type="button"
                  onClick={() => setSelectedDay(date)}
                >
                  {date.getDate()}
                  {hasRes && <span style={{display:'block', width: '4px', height: '4px', background: 'blue', borderRadius: '50%', margin: '2px auto 0'}} />}
                </button>
              )
            })}
          </div>
          {loading && <p className="calendarHint">Cargando datos de mes...</p>}
        </section>

        <section>
          <div className="titleBar titleBar--row" style={{ marginBottom: '10px' }}>
            <h3 className="dayList__title" style={{ margin: 0 }}>
              Reservas para este día
              <span className="dayList__date">
                {new Intl.DateTimeFormat('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(selectedDay)}
              </span>
            </h3>
          </div>
          
          {dayReservations.length === 0 ? (
            <article className="dayEmpty" role="status">
              No hay reservas programadas para esta fecha.
            </article>
          ) : (
            <div style={{ display: 'grid', gap: '1rem', marginTop: '1px' }}>
              {dayReservations.map(res => (
                <div key={res.id} className="reservationCard" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="reservationCard__body">
                    <div className="reservationCard__header">
                      <h3>{res.resources?.name || `Recurso ID: ${res.resource_id}`}</h3>
                      <span>{new Date(res.start_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(res.end_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="reservationCard__reason">
                      <strong>Motivo:</strong> {res.notes}
                    </div>
                    <small>Reservado por: {res.profiles?.display_name || res.profiles?.email}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {isModalOpen && (
        <ReservationModal 
          initialDate={selectedDayIso}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleReservationSuccess}
        />
      )}
    </section>
  )
}
