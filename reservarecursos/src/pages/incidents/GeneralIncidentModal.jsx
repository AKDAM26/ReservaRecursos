import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/auth/useAuth';
import { incidentsService } from '../../lib/services/incidents.service';
import { resourcesService } from '../../lib/services/resources.service';
import { Modal } from '../../components/ui/Modal';

export function GeneralIncidentModal({ isOpen, onClose, onSuccess, incident = null }) {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [resources, setResources] = useState([]);
  const [errorObj, setErrorObj] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resourcesService.getResources()
        .then(data => setResources(data))
        .catch(err => console.error("Error fetching resources", err));
      
      if (incident) {
        setDescription(incident.description);
        setResourceId(incident.resource_id);
      } else {
        setDescription('');
        setResourceId('');
      }
    }
  }, [isOpen, incident]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorObj(null);

    if (!resourceId) {
      setErrorObj('Debes seleccionar un recurso.');
      return;
    }

    if (!description.trim()) {
      setErrorObj('Debes describir la incidencia.');
      return;
    }

    try {
      setSubmitting(true);
      if (incident) {
        await incidentsService.updateIncident(incident.id, {
          resource_id: resourceId,
          description: description
        });
      } else {
        await incidentsService.reportIncident({
          resource_id: resourceId,
          reservation_id: null,
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
    <Modal isOpen={isOpen} onClose={onClose} title={incident ? "Editar Incidencia" : "Reportar Nueva Incidencia"}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {errorObj && (
          <div className="alert alert--error">
            {errorObj}
          </div>
        )}

        <div style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>
          {incident 
            ? 'Edita los detalles de tu incidencia mientras se encuentre pendiente.' 
            : 'Reporta un daño o avería en un recurso para que el administrador pueda revisarlo.'}
        </div>

        <div className="field">
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
            Recurso Afectado
          </label>
          <select 
            className="input" 
            value={resourceId} 
            onChange={e => setResourceId(e.target.value)}
            required
          >
            <option value="" disabled>-- Selecciona el recurso --</option>
            {resources.map(res => (
              <option key={res.id} value={res.id}>
                {res.name} {res.resource_types?.name ? `(${res.resource_types.name})` : ''}
              </option>
            ))}
          </select>
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
