import { useEffect, useState } from 'react';
import { useAuth } from '../../app/auth/useAuth';
import { resourcesService } from '../../lib/services/resources.service';
import { reservationsService } from '../../lib/services/reservations.service';

export function ReservationModal({ onClose, onSuccess, initialResourceId = '', initialDate = '' }) {
  const { user } = useAuth();
  
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  
  const [resourceId, setResourceId] = useState(initialResourceId);
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  
  const [errorObj, setErrorObj] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchRes = async () => {
      try {
        const data = await resourcesService.getResources({ status: 'available' });
        if (active) {
          setResources(data);
          if (!resourceId && data.length > 0) {
            setResourceId(data[0].id);
          }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorObj(null);
    
    if (!resourceId) {
      setErrorObj('Por favor selecciona un recurso.');
      return;
    }
    
    if (!notes.trim()) {
      setErrorObj('El motivo de la reserva es obligatorio.');
      return;
    }
    
    const startMins = parseInt(startTime.split(':')[1], 10);
    const endMins = parseInt(endTime.split(':')[1], 10);
    
    if (startMins % 5 !== 0 || endMins % 5 !== 0) {
      setErrorObj('Los horarios deben ser múltiplos de 5 minutos (ej: 08:00, 08:05, 08:15).');
      return;
    }

    const startAt = new Date(`${date}T${startTime}:00`).toISOString();
    const endAt = new Date(`${date}T${endTime}:00`).toISOString();
    
    if (new Date(startAt) >= new Date(endAt)) {
      setErrorObj('La hora de fin debe ser posterior a la de inicio.');
      return;
    }

    try {
      setSubmitting(true);
      await reservationsService.createReservation({
        resource_id: resourceId,
        created_by: user.id,
        start_at: startAt,
        end_at: endAt,
        notes,
        status: 'active'
      });
      
      onSuccess?.();
    } catch (err) {
      console.error(err);
      if (err.message?.includes('reservations_no_overlap_active')) {
        setErrorObj('Ya existe otra reserva activa que se solapa con tu horario. Por favor, elige otro.');
      } else {
        setErrorObj(err.message || 'Error desconocido al crear la reserva.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="profileModal" onClick={(e) => e.stopPropagation()}>
        <div className="profileModal__header">
          <button className="profileModal__close" type="button" onClick={onClose}>
            &times;
          </button>
          Nueva Reserva
        </div>
        
        <form onSubmit={handleSubmit} className="profileModal__body" style={{ padding: '20px' }}>
          {errorObj && (
            <div className="alert alert--error" style={{ marginBottom: '10px' }}>
              {errorObj}
            </div>
          )}
          
          <div className="field">
            <span>Recurso</span>
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
          
          <div className="field" style={{ marginTop: '10px' }}>
            <span>Fecha</span>
            <input 
              type="date" 
              className="input" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <div className="field">
              <span>Hora de inicio</span>
              <input 
                type="time" 
                className="input" 
                step="300"
                value={startTime} 
                onChange={e => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <span>Hora de fin</span>
              <input 
                type="time" 
                className="input" 
                step="300"
                value={endTime} 
                onChange={e => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="field" style={{ marginTop: '10px' }}>
            <span>Motivo / Notas</span>
            <textarea 
              className="input" 
              style={{ height: '60px', padding: '8px 12px', resize: 'vertical' }}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej: Clase de repaso..."
              required
            />
          </div>
          
          <div className="profileModal__actions" style={{ padding: '0', marginTop: '20px' }}>
            <button 
              className="btn btn--primary" 
              type="submit" 
              style={{ width: '100%' }}
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : 'Confirmar Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
