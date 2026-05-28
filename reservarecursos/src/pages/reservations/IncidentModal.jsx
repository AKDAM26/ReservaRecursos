import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/auth/useAuth';
import { incidentsService } from '../../lib/services/incidents.service';
import { Modal } from '../../components/ui/Modal';

export function IncidentModal({ isOpen, onClose, reservation, incident = null, onSuccess }) {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [errorObj, setErrorObj] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (incident) {
      setDescription(incident.description);
    } else {
      setDescription('');
    }
  }, [incident]);

  if (!reservation) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorObj(null);

    if (!description.trim()) {
      setErrorObj('Debes describir la incidencia.');
      return;
    }

    try {
      setSubmitting(true);
      
      if (incident) {
        await incidentsService.updateIncident(incident.id, {
          description: description
        });
      } else {
        await incidentsService.reportIncident({
          resource_id: reservation.resource_id,
          reservation_id: reservation.id,
          reported_by: user.id,
          description: description,
          status: 'pending'
        });
      }
      
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorObj('Error al guardar la incidencia. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={incident ? "Editar Incidencia" : "Reportar Incidencia"}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {errorObj && (
          <div className="alert alert--error">
            {errorObj}
          </div>
        )}

        <div style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>
          Estás {incident ? 'editando' : 'reportando'} una incidencia para el recurso <strong>{reservation.resources?.name}</strong>.
        </div>

        <div className="field">
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
            Descripción de la incidencia
          </label>
          <textarea 
            className="input" 
            style={{ height: '120px', resize: 'vertical' }}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe qué problema has encontrado..."
            required
          />
        </div>

        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className={incident ? "btn btn--primary" : "btn btn--danger"} disabled={submitting}>
            {submitting ? 'Guardando...' : (incident ? 'Guardar Cambios' : 'Enviar Reporte')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
