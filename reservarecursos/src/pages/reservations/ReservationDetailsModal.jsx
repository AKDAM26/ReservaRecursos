import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/auth/useAuth';
import { Modal } from '../../components/ui/Modal';
import { reservationsService } from '../../lib/services/reservations.service';
import { incidentsService } from '../../lib/services/incidents.service';
import { resourcesService } from '../../lib/services/resources.service';
import { isoDate, parseLocal } from '../../lib/date';
import './ReservationDetailsModal.css';

const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export function ReservationDetailsModal({ isOpen, onClose, reservation, onReportIncident, onSuccess }) {
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [incident, setIncident] = useState(null);
  const [loadingIncident, setLoadingIncident] = useState(true);

  // Edit form state
  const [resources, setResources] = useState([]);
  const [editData, setEditData] = useState(null);
  const [existingReservations, setExistingReservations] = useState([]);
  const [errorObj, setErrorObj] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!reservation) return;
    let active = true;
    
    // Check for incident
    const fetchIncident = async () => {
      try {
        const data = await incidentsService.getIncidentByReservation(reservation.id);
        if (active && data) setIncident(data);
      } catch (err) {
        console.error("Error fetching incident", err);
      } finally {
        if (active) setLoadingIncident(false);
      }
    };
    
    fetchIncident();
    return () => { active = false; };
  }, [reservation]);

  // Load resources if editing
  useEffect(() => {
    if (isEditing && resources.length === 0) {
      resourcesService.getResources({ status: 'available' }).then(setResources);
    }
  }, [isEditing, resources.length]);

  // Load existing reservations for the selected date/resource to block periods
  useEffect(() => {
    if (isEditing && editData?.resource_id && editData?.date) {
      reservationsService.getReservations({
        resource_id: editData.resource_id,
        reservation_date: editData.date,
        status: 'active'
      }).then(res => setExistingReservations(res));
    }
  }, [isEditing, editData?.resource_id, editData?.date]);

  if (!reservation) return null;

  const isOwner = user?.id === reservation.created_by;
  const teacherName = isOwner ? 'Tu reserva' : (reservation.profiles?.display_name || 'Sin nombre registrado');
  const resourceName = reservation.resources?.name || 'Recurso desconocido';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const resDate = parseLocal(reservation.reservation_date);
  
  const isPast = resDate < today;
  const isFuture = resDate > today;
  const isCancelled = reservation.status === 'cancelled';
  
  // Incident logic: max 48h after the reservation
  const maxIncidentDate = new Date(resDate);
  maxIncidentDate.setDate(resDate.getDate() + 2);
  const canReportIncident = !isFuture && today <= maxIncidentDate && !isCancelled;
  
  const isRecurring = !!reservation.recurrence_id;

  const handleEditClick = () => {
    setEditData({
      resource_id: reservation.resource_id,
      date: reservation.reservation_date,
      period_start: reservation.period_start,
      period_end: reservation.period_end,
      notes: reservation.notes
    });
    setIsEditing(true);
  };

  const handleCancelReservation = async () => {
    const msg = isRecurring 
      ? 'Esta reserva forma parte de una serie recurrente. ¿Deseas cancelar TODAS las reservas de esta serie?'
      : '¿Estás seguro de que quieres cancelar esta reserva?';
      
    if (!confirm(msg)) return;
    try {
      if (isRecurring) {
        // Cancel all recurring reservations with the same recurrence_id
        await reservationsService.cancelRecurring(reservation.recurrence_id, user.id);
      } else {
        await reservationsService.cancelReservation(reservation.id, user.id);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      alert('Error cancelando reserva: ' + err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorObj(null);

    if (editData.period_start > editData.period_end) {
      return setErrorObj('El periodo de inicio no puede ser mayor al de fin.');
    }

    // Validation: Check for overlaps excluding self
    const occupied = new Set();
    existingReservations.forEach(r => {
      if (r.id !== reservation.id) {
        for (let i = r.period_start; i <= r.period_end; i++) occupied.add(i);
      }
    });

    for (let i = editData.period_start; i <= editData.period_end; i++) {
      if (occupied.has(i)) return setErrorObj('Uno o más periodos seleccionados ya están ocupados.');
    }

    try {
      setSubmitting(true);
      await reservationsService.updateReservation(reservation.id, {
        resource_id: editData.resource_id,
        reservation_date: editData.date,
        period_start: editData.period_start,
        period_end: editData.period_end,
        notes: editData.notes
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorObj('Error actualizando la reserva.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderEditForm = () => {
    const occupied = new Set();
    existingReservations.forEach(r => {
      if (r.id !== reservation.id) {
        for (let i = r.period_start; i <= r.period_end; i++) occupied.add(i);
      }
    });

    return (
      <form onSubmit={handleUpdate} className="reservation-details">
        {errorObj && <div className="alert alert--error">{errorObj}</div>}
        
        <div className="field">
          <label>Recurso</label>
          <select 
            className="input" 
            value={editData.resource_id} 
            onChange={e => setEditData({...editData, resource_id: e.target.value})}
            required
          >
            {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Fecha</label>
          <input 
            type="date" 
            className="input" 
            value={editData.date} 
            min={isoDate(today)}
            onChange={e => setEditData({...editData, date: e.target.value})}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field">
            <label>Periodo Inicio</label>
            <select 
              className="input" 
              value={editData.period_start} 
              onChange={e => setEditData({...editData, period_start: Number(e.target.value)})}
            >
              {PERIODS.map(p => (
                <option key={p} value={p} disabled={occupied.has(p)}>Periodo {p} {occupied.has(p) && '(Ocupado)'}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Periodo Fin</label>
            <select 
              className="input" 
              value={editData.period_end} 
              onChange={e => setEditData({...editData, period_end: Number(e.target.value)})}
            >
              {PERIODS.map(p => (
                <option key={p} value={p} disabled={occupied.has(p) || p < editData.period_start}>Periodo {p} {occupied.has(p) && '(Ocupado)'}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Notas</label>
          <textarea 
            className="input" 
            style={{ height: '80px', resize: 'vertical' }}
            value={editData.notes}
            onChange={e => setEditData({...editData, notes: e.target.value})}
            required
          />
        </div>

        <div className="details-actions">
          <button type="button" className="btn btn--outline" onClick={() => setIsEditing(false)}>Cancelar</button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>Guardar Cambios</button>
        </div>
      </form>
    );
  };

  const formattedDate = new Intl.DateTimeFormat('es-ES', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  }).format(parseLocal(reservation.reservation_date));

  // incident text
  let incidentStatusText = '';
  if (incident) {
    if (incident.status === 'pending') incidentStatusText = 'Pendiente';
    else if (incident.status === 'review') incidentStatusText = 'En Revisión';
    else if (incident.status === 'resolved') incidentStatusText = 'Resuelta';
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Editar Reserva" : "Detalles de la Reserva"}>
      {isEditing ? renderEditForm() : (
        <div className="reservation-details">
          
          <div className="detail-item">
            <span className="detail-label">Recurso</span>
            <span className="detail-value highlight">{resourceName}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Profesor</span>
            <span className="detail-value">{teacherName}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Fecha</span>
            <span className="detail-value" style={{ textTransform: 'capitalize' }}>{formattedDate}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Periodos</span>
            <span className="detail-value">
              {reservation.period_start === reservation.period_end 
                ? `Periodo ${reservation.period_start}`
                : `Del periodo ${reservation.period_start} al ${reservation.period_end}`}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Motivo / Notas</span>
            <div className="detail-notes-box">
              {reservation.notes || 'Sin motivo especificado.'}
            </div>
          </div>

          {/* Incident section */}
          {!loadingIncident && (
            <div className="detail-item" style={{ marginTop: '10px' }}>
              <span className="detail-label">Estado de Incidencias</span>
              {incident ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`status-badge status-${incident.status}`}>{incidentStatusText}</span>
                  {isOwner && incident.status === 'pending' && (
                    <button type="button" className="btn btn--outline" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => onReportIncident(reservation, incident)}>
                      Editar Incidencia
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Ninguna incidencia reportada.</span>
                </div>
              )}
            </div>
          )}

          <div className="details-actions" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {isOwner && !incident && canReportIncident && (
                <button 
                  type="button" 
                  className="btn btn--outline btn--danger"
                  onClick={() => onReportIncident(reservation, null)}
                >
                  Reportar Incidencia
                </button>
              )}
              {isOwner && !isPast && !isCancelled && (
                <button type="button" className="btn btn--danger" onClick={handleCancelReservation}>
                  {isRecurring ? 'Cancelar Serie Recurrente' : 'Cancelar Reserva'}
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {isOwner && !isPast && !isRecurring && !isCancelled && (
                <button type="button" className="btn btn--outline" onClick={handleEditClick}>
                  Editar
                </button>
              )}
              <button type="button" className="btn btn--primary" onClick={onClose}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
