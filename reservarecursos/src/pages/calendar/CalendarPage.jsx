import { useEffect, useMemo, useState, useCallback } from 'react';
import { getMonthGrid, isSameDay, monthLabel, startOfDay, isoDate } from '../../lib/date.js';
import { reservationsService } from '../../lib/services/reservations.service.js';
import { resourcesService } from '../../lib/services/resources.service.js';
import { typesService } from '../../lib/services/types.service.js';
import { CalendarFilters } from './CalendarFilters.jsx';
import { BasicCalendarView } from './BasicCalendarView.jsx';
import { DetailedCalendarView } from './DetailedCalendarView.jsx';
import { ReservationModal } from '../reservations/ReservationModal.jsx';
import { ReservationDetailsModal } from '../reservations/ReservationDetailsModal.jsx';
import { IncidentModal } from '../reservations/IncidentModal.jsx';
import { useAuth } from '../../app/auth/useAuth.js';

const WEEKDAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

export function CalendarPage() {
  const { user } = useAuth();
  const today = useMemo(() => startOfDay(new Date()), []);
  const [cursorMonth, setCursorMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(today);
  const [cursorWeek, setCursorWeek] = useState(() => {
    const current = new Date(today);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(current.setDate(diff));
  });

  const grid = useMemo(() => getMonthGrid(cursorMonth), [cursorMonth]);

  const [viewMode, setViewMode] = useState('detailed');
  const [resourceTypes, setResourceTypes] = useState([]);
  const [selectedResourceType, setSelectedResourceType] = useState('all');
  
  const [resources, setResources] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);


  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  
  const [selectedCellData, setSelectedCellData] = useState({ resourceId: '', date: '', period: null });
  const [selectedReservation, setSelectedReservation] = useState(null);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(cursorWeek);
      d.setDate(cursorWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [cursorWeek]);


  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const [typesData, resData] = await Promise.all([
          typesService.getTypes(),
          resourcesService.getResources()
        ]);
        setResourceTypes(typesData);
        setResources(resData);
      } catch (err) {
        console.error('Error fetching base data:', err);
      }
    };
    fetchBaseData();
  }, []);


  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      let startDateStr, endDateStr;
      
      if (viewMode === 'detailed') {

        startDateStr = isoDate(selectedDay);
        endDateStr = startDateStr;
      } else {

        startDateStr = isoDate(weekDays[0]);
        endDateStr = isoDate(weekDays[4]);
      }

      const data = await reservationsService.getReservations({ 
        startDate: startDateStr, 
        endDate: endDateStr,
        status: 'active' 
      });
      setReservations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [viewMode, selectedDay, weekDays]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);


  const filteredResources = useMemo(() => {
    if (selectedResourceType === 'all') return resources;
    return resources.filter(r => r.type_id === selectedResourceType);
  }, [resources, selectedResourceType]);


  const handlePrevWeek = () => {
    const prev = new Date(cursorWeek);
    prev.setDate(prev.getDate() - 7);
    setCursorWeek(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(cursorWeek);
    next.setDate(next.getDate() + 7);
    setCursorWeek(next);
  };

  const handleCellClick = (resourceId, date, period = null) => {
    setSelectedCellData({
      resourceId,
      date: isoDate(date),
      period
    });
    setIsReservationModalOpen(true);
  };

  const [selectedIncident, setSelectedIncident] = useState(null);

  const handleReservationClick = (reservation) => {
    setSelectedReservation(reservation);
    setIsDetailsModalOpen(true);
  };

  const handleReportIncident = (reservation, incident = null) => {
    setSelectedReservation(reservation);
    setSelectedIncident(incident);
    setIsDetailsModalOpen(false);
    setIsIncidentModalOpen(true);
  };

  const weekLabel = `Semana del ${weekDays[0].getDate()} al ${weekDays[4].getDate()} de ${new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(weekDays[4])}`;

  return (
    <section className="pageWrap calendar-page-modern">
      <div className="titleBar titleBar--row">
        <div>
          <h1>Calendario de Reservas</h1>
          <p>Visualiza la disponibilidad de recursos por periodos</p>
        </div>
      </div>

      <CalendarFilters 
        viewMode={viewMode}
        setViewMode={setViewMode}
        resourceTypes={resourceTypes}
        selectedResourceType={selectedResourceType}
        setSelectedResourceType={setSelectedResourceType}
        onPrev={handlePrevWeek}
        onNext={handleNextWeek}
        dateLabel={weekLabel}
      />

      <div className={`calendarLayout ${viewMode === 'basic' ? 'layout-basic' : 'layout-detailed'}`}>
        
        {viewMode === 'detailed' && (
          <section className="calendarBox calendarBox-modern">
            <div className="calendarBox__head">
              <button
                type="button"
                onClick={() => setCursorMonth(new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() - 1, 1))}
              >
                ‹
              </button>
              <strong>{monthLabel(cursorMonth)}</strong>
              <button
                type="button"
                onClick={() => setCursorMonth(new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() + 1, 1))}
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
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const classes = ['calendarDay'];
                if (!inMonth) classes.push('is-out');
                if (isWeekend) classes.push('is-disabled');
                if (isSameDay(date, today)) classes.push('is-today');
                if (isSameDay(date, selectedDay)) classes.push('is-active');
                
                return (
                  <button
                    key={date.toISOString()}
                    className={classes.join(' ')}
                    type="button"
                    disabled={isWeekend}
                    title={isWeekend ? 'No se admiten reservas en fin de semana' : ''}
                    onClick={() => setSelectedDay(date)}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="matrix-section-wrapper">
          {loading && <div className="loading-overlay">Cargando datos...</div>}
          
          {viewMode === 'detailed' && (
            <>
              <h3 className="matrix-title">
                Horario para el día: {new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(selectedDay)}
              </h3>
              <DetailedCalendarView 
                resources={filteredResources} 
                reservations={reservations} 
                currentUserId={user?.id}
                onCellClick={(resourceId, period) => handleCellClick(resourceId, selectedDay, period)}
                onReservationClick={handleReservationClick}
              />
            </>
          )}

          {viewMode === 'basic' && (
            <BasicCalendarView 
              resources={filteredResources}
              reservations={reservations}
              weekDays={weekDays}
              onCellClick={(resourceId, date) => handleCellClick(resourceId, date)}
            />
          )}
        </section>
      </div>

      {isReservationModalOpen && (
        <ReservationModal
          onClose={() => setIsReservationModalOpen(false)}
          onSuccess={() => {
            fetchReservations();
          }}
          initialResourceId={selectedCellData.resourceId}
          initialDate={selectedCellData.date}
          initialPeriod={selectedCellData.period}
        />
      )}

      {isDetailsModalOpen && (
        <ReservationDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          reservation={selectedReservation}
          onReportIncident={handleReportIncident}
          onSuccess={fetchReservations}
        />
      )}

      {isIncidentModalOpen && (
        <IncidentModal
          isOpen={isIncidentModalOpen}
          onClose={() => setIsIncidentModalOpen(false)}
          reservation={selectedReservation}
          incident={selectedIncident}
          onSuccess={() => {
            console.log("Incidencia actualizada correctamente");
          }}
        />
      )}
    </section>
  );
}
