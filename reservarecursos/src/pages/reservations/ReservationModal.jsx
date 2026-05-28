import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../app/auth/useAuth';
import { isoDate, parseLocal } from '../../lib/date';
import { resourcesService } from '../../lib/services/resources.service';
import { reservationsService } from '../../lib/services/reservations.service';
import { Modal } from '../../components/ui/Modal';
import './ReservationModal.css';

const DAYS_OF_WEEK = [
  { value: 0, label: 'L' },
  { value: 1, label: 'M' },
  { value: 2, label: 'X' },
  { value: 3, label: 'J' },
  { value: 4, label: 'V' }
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export function ReservationModal({ onClose, onSuccess, initialResourceId = '', initialDate = '', initialPeriod = null }) {
  const { user } = useAuth();
  
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  
  const [resourceId, setResourceId] = useState(initialResourceId);
  const [isRecurring, setIsRecurring] = useState(false);
  
  const todayStr = isoDate(new Date());
  const [date, setDate] = useState(initialDate || todayStr);
  const [endDate, setEndDate] = useState('');
  
  const initDow = new Date(initialDate || new Date()).getDay();
  const initIsoDow = initDow === 0 ? 6 : initDow - 1;
  const [daysOfWeek, setDaysOfWeek] = useState(initIsoDow <= 4 ? [initIsoDow] : [0]);
  
  // Single mode period
  const [periodStart, setPeriodStart] = useState(initialPeriod || 1);
  const [periodEnd, setPeriodEnd] = useState(initialPeriod || 1);
  
  // Recurring mode periods (per day)
  const [recurringPeriods, setRecurringPeriods] = useState({});

  const [notes, setNotes] = useState('');
  const [errorObj, setErrorObj] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Existing reservations for the single date to block periods
  const [existingReservations, setExistingReservations] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchRes = async () => {
      try {
        const data = await resourcesService.getResources({ status: 'available' });
        if (active) {
          setResources(data);
          if (!resourceId && data.length > 0) setResourceId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching resources:', err);
      } finally {
        if (active) setLoadingResources(false);
      }
    };
    fetchRes();
    return () => { active = false; };
  }, [resourceId]);

  // Fetch reservations for the selected date(s) and resource
  useEffect(() => {
    let active = true;
    if (resourceId && date) {
      const fetchExisting = async () => {
        try {
          const filters = {
            resource_id: resourceId,
            status: 'active'
          };
          
          if (isRecurring && endDate) {
            filters.startDate = date;
            filters.endDate = endDate;
          } else if (!isRecurring) {
            filters.reservation_date = date;
          } else {
            return; // Wait for endDate if recurring
          }

          const res = await reservationsService.getReservations(filters);
          if (active) setExistingReservations(res);
        } catch (err) {
          console.error(err);
        }
      };
      fetchExisting();
    }
    return () => { active = false; };
  }, [resourceId, date, endDate, isRecurring]);

  // Determine occupied periods for the single reservation dropdowns
  const occupiedPeriods = useMemo(() => {
    const occupied = new Set();
    if (!isRecurring) {
      existingReservations.forEach(res => {
        for (let i = res.period_start; i <= res.period_end; i++) {
          occupied.add(i);
        }
      });
    }
    return occupied;
  }, [existingReservations, isRecurring]);

  // Determine occupied periods for recurring dropdowns (per day of week)
  const occupiedRecurringPeriods = useMemo(() => {
    const occupiedPerDay = { 0: new Set(), 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };
    if (isRecurring) {
      existingReservations.forEach(res => {
        const resDate = new Date(res.reservation_date);
        const day = resDate.getUTCDay();
        const isoDow = day === 0 ? 6 : day - 1; // 0=Lunes, 1=Martes...
        
        if (isoDow <= 4) { // Only Mon-Fri
          for (let i = res.period_start; i <= res.period_end; i++) {
            occupiedPerDay[isoDow].add(i);
          }
        }
      });
    }
    return occupiedPerDay;
  }, [existingReservations, isRecurring]);

  useEffect(() => {
    if (!isRecurring) {
      if (occupiedPeriods.has(periodStart)) {
        const firstFree = PERIODS.find(p => !occupiedPeriods.has(p));
        if (firstFree) {
          setPeriodStart(firstFree);
          setPeriodEnd(firstFree);
        }
      }
    }
  }, [occupiedPeriods, isRecurring]);

  const toggleDay = (val) => {
    setDaysOfWeek(prev => {
      if (prev.includes(val)) return prev.filter(d => d !== val);
      return [...prev, val].sort();
    });
  };

  const updateRecurringPeriod = (day, field, value) => {
    setRecurringPeriods(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  // Initialize recurring periods if a new day is selected
  useEffect(() => {
    setRecurringPeriods(prev => {
      const updated = { ...prev };
      daysOfWeek.forEach(day => {
        if (!updated[day]) updated[day] = { start: 1, end: 1 };
      });
      return updated;
    });
  }, [daysOfWeek]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorObj(null);
    
    if (!resourceId) return setErrorObj('Por favor selecciona un recurso.');
    if (!notes.trim()) return setErrorObj('El motivo de la reserva es obligatorio.');

    try {
      setSubmitting(true);
      
      if (isRecurring) {
        if (!endDate) throw new Error('La fecha de fin es obligatoria para reservas recurrentes.');
        if (parseLocal(date) > parseLocal(endDate)) throw new Error('La fecha de fin no puede ser anterior a la de inicio.');
        if (daysOfWeek.length === 0) throw new Error('Debes seleccionar al menos un día de la semana.');
        
        // Validate each day's periods
        for (const day of daysOfWeek) {
          const p = recurringPeriods[day];
          if (p.start > p.end) {
            throw new Error(`Los periodos configurados para el ${DAYS_OF_WEEK.find(d => d.value === day).label} son inválidos.`);
          }
        }

        // Send parallel RPC requests for each selected day
        const promises = daysOfWeek.map(day => {
          const p = recurringPeriods[day];
          return reservationsService.createRecurringReservations({
            resource_id: resourceId,
            created_by: user.id,
            start_date: date,
            end_date: endDate,
            days_of_week: [day], // Only this day
            period_start: parseInt(p.start),
            period_end: parseInt(p.end),
            notes
          });
        });

        await Promise.all(promises);

      } else {
        // Single reservation
        const localDate = parseLocal(date);
        if (localDate < parseLocal(todayStr)) throw new Error('No puedes crear reservas en fechas pasadas.');
        if (localDate.getDay() === 0 || localDate.getDay() === 6) throw new Error('No se pueden realizar reservas en fines de semana.');
        if (periodStart > periodEnd) throw new Error('El periodo de inicio no puede ser mayor al periodo de fin.');
        
        // Final sanity check before submission
        for (let i = periodStart; i <= periodEnd; i++) {
          if (occupiedPeriods.has(i)) throw new Error('Uno o más periodos seleccionados ya están ocupados.');
        }

        await reservationsService.createReservation({
          resource_id: resourceId,
          created_by: user.id,
          reservation_date: date,
          period_start: parseInt(periodStart),
          period_end: parseInt(periodEnd),
          notes,
          status: 'active'
        });
      }
      
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      if (err.message?.includes('reservations_no_overlap_active') || err.message?.includes('Conflicto detectado')) {
        setErrorObj('Solapamiento detectado. Ya existe otra reserva en ese horario.');
      } else {
        setErrorObj(err.message || 'Error desconocido al crear la reserva.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Nueva Reserva">
      <form onSubmit={handleSubmit} className="reservation-form">
        {errorObj && (
          <div className="alert alert--error">
            {errorObj}
          </div>
        )}

        <div className="reservation-type-toggle">
          <button 
            type="button" 
            className={`toggle-btn ${!isRecurring ? 'active' : ''}`}
            onClick={() => setIsRecurring(false)}
          >
            Reserva Única
          </button>
          <button 
            type="button" 
            className={`toggle-btn ${isRecurring ? 'active' : ''}`}
            onClick={() => setIsRecurring(true)}
          >
            Reserva Recurrente
          </button>
        </div>
        
        <div className="field">
          <label>Recurso</label>
          <select 
            className="input"
            value={resourceId}
            onChange={e => setResourceId(e.target.value)}
            disabled={loadingResources}
            required
          >
            {!resourceId && <option value="">Selecciona un recurso...</option>}
            {resources.map(r => (
              <option key={r.id} value={r.id}>{r.name} ({r.resource_types?.name})</option>
            ))}
          </select>
        </div>
        
        <div className="form-row">
          <div className="field">
            <label>{isRecurring ? 'Fecha Inicio' : 'Fecha'}</label>
            <input 
              type="date" 
              className="input" 
              value={date} 
              min={!isRecurring ? todayStr : undefined}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
          {isRecurring && (
            <div className="field">
              <label>Fecha Fin</label>
              <input 
                type="date" 
                className="input" 
                value={endDate} 
                min={todayStr}
                onChange={e => setEndDate(e.target.value)}
                required={isRecurring}
              />
            </div>
          )}
        </div>

        {isRecurring && (
          <div className="field">
            <label>Días de la semana</label>
            <div className="days-toggle-group">
              {DAYS_OF_WEEK.map(d => (
                <button
                  key={d.value}
                  type="button"
                  className={`day-chip ${daysOfWeek.includes(d.value) ? 'selected' : ''}`}
                  onClick={() => toggleDay(d.value)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {!isRecurring ? (
          <div className="form-row">
            <div className="field">
              <label>Periodo Inicio</label>
              <select 
                className="input"
                value={periodStart}
                onChange={e => setPeriodStart(Number(e.target.value))}
              >
                {PERIODS.map(p => (
                  <option key={p} value={p} disabled={occupiedPeriods.has(p)}>
                    Periodo {p} {occupiedPeriods.has(p) && '(Ocupado)'}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Periodo Fin</label>
              <select 
                className="input"
                value={periodEnd}
                onChange={e => setPeriodEnd(Number(e.target.value))}
              >
                {PERIODS.map(p => (
                  <option key={p} value={p} disabled={occupiedPeriods.has(p) || p < periodStart}>
                    Periodo {p} {occupiedPeriods.has(p) && '(Ocupado)'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="recurring-periods-container" style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
              Selecciona periodos del día:
            </label>
            {daysOfWeek.map(day => {
              const dayLabel = DAYS_OF_WEEK.find(d => d.value === day).label;
              const p = recurringPeriods[day] || { start: 1, end: 1 };
              return (
                <div key={day} className="form-row recurring-period-row" style={{ alignItems: 'center', background: '#f9fafb', padding: '10px 12px', borderRadius: '8px', marginBottom: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: 600, width: '30px', textAlign: 'center', color: '#111827' }}>{dayLabel}</div>
                  <div className="field" style={{ flex: 1 }}>
                    <select 
                      className="input"
                      value={p.start}
                      onChange={e => updateRecurringPeriod(day, 'start', Number(e.target.value))}
                      style={{ fontSize: '0.875rem', padding: '0.375rem 0.5rem' }}
                    >
                      {PERIODS.map(val => (
                        <option key={val} value={val} disabled={occupiedRecurringPeriods[day].has(val)}>
                          Inicio: Periodo {val} {occupiedRecurringPeriods[day].has(val) && '(Ocupado)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <select 
                      className="input"
                      value={p.end}
                      onChange={e => updateRecurringPeriod(day, 'end', Number(e.target.value))}
                      style={{ fontSize: '0.875rem', padding: '0.375rem 0.5rem' }}
                    >
                      {PERIODS.map(val => (
                        <option key={val} value={val} disabled={val < p.start || occupiedRecurringPeriods[day].has(val)}>
                          Fin: Periodo {val} {occupiedRecurringPeriods[day].has(val) && '(Ocupado)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="field">
          <label>Motivo / Notas</label>
          <textarea 
            className="input" 
            style={{ height: '80px', resize: 'vertical' }}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ej: Clase de repaso..."
            required
          />
        </div>
        
        <div className="modal-actions">
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Confirmar Reserva'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
