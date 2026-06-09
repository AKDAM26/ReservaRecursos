import React, { useEffect, useState } from 'react';
import { useAuth } from '../../app/auth/useAuth';
import { incidentsService } from '../../lib/services/incidents.service';
import { reservationsService } from '../../lib/services/reservations.service';
import { ReservationDetailsModal } from '../reservations/ReservationDetailsModal';
import { GeneralIncidentModal } from './GeneralIncidentModal';
import '../reservations/ReservationDetailsModal.css';

export function IncidentsDashboard() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);
  const [selectedIncidentToEdit, setSelectedIncidentToEdit] = useState(null);

  const isAdmin = user?.role === 'admin';

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await incidentsService.getIncidents();
      setIncidents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleStatusChange = async (e, id, newStatus) => {
    e.stopPropagation(); // prevent row click
    try {
      const updates = { status: newStatus };
      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      } else {
        updates.resolved_at = null;
      }
      
      await incidentsService.updateIncident(id, updates);
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, ...updates } : inc));
    } catch (err) {
      alert('Error al actualizar el estado: ' + err.message);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de eliminar esta incidencia? Esta acción no se puede deshacer.')) return;
    try {
      await incidentsService.deleteIncident(id);
      setIncidents(prev => prev.filter(inc => inc.id !== id));
    } catch (err) {
      alert('Error al eliminar la incidencia.');
    }
  };

  const handleRowClick = async (reservationId) => {
    if (!reservationId) return;
    try {
      const reservation = await reservationsService.getReservationById(reservationId);
      setSelectedReservation(reservation);
      setIsDetailsModalOpen(true);
    } catch (err) {
      alert('Error cargando los detalles de la reserva.');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'pending') return <span className="status-badge status-pending">Pendiente</span>;
    if (status === 'review') return <span className="status-badge status-review">En Revisión</span>;
    if (status === 'resolved') return <span className="status-badge status-resolved">Resuelta</span>;
    return <span className="status-badge">{status}</span>;
  };

  const visibleIncidents = incidents.filter(inc => {
    if (isAdmin) return true;
    if (inc.status === 'resolved') {
      if (!inc.resolved_at) return false;
      const resolvedDate = new Date(inc.resolved_at);
      const now = new Date();
      const hours = (now - resolvedDate) / (1000 * 60 * 60);
      return hours < 24;
    }
    return true;
  });

  return (
    <section className="pageWrap">
      <div className="titleBar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Panel de Incidencias</h1>
          <p>Gestión y seguimiento de averías reportadas en los recursos</p>
        </div>
        <button className="btn btn--primary" onClick={() => { setSelectedIncidentToEdit(null); setIsGeneralModalOpen(true); }}>
          Reportar Nueva Incidencia
        </button>
      </div>

      {loading ? (
        <article className="emptyPanel">
          <p className="emptyPanel__text">Cargando incidencias...</p>
        </article>
      ) : incidents.length === 0 ? (
        <article className="emptyPanel">
          <p className="emptyPanel__title">Todo está en orden</p>
          <p className="emptyPanel__text">No hay ninguna incidencia reportada en el sistema.</p>
        </article>
      ) : (
        <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <table className="dataTable">
            <thead>
              <tr>
                <th>Fecha Reporte</th>
                <th>Recurso</th>
                <th>Profesor</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibleIncidents.map(inc => {
                const date = new Date(inc.created_at).toLocaleDateString('es-ES');
                return (
                  <tr 
                    key={inc.id} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(inc.reservation_id)}
                    className="interactive-row"
                  >
                    <td style={{ whiteSpace: 'nowrap' }}>{date}</td>
                    <td><strong>{inc.resources?.name}</strong></td>
                    <td>{inc.profiles?.display_name || inc.profiles?.email || 'Desconocido'}</td>
                    <td style={{ maxWidth: '300px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={inc.description}>
                        {inc.description}
                      </div>
                    </td>
                    <td>{getStatusBadge(inc.status)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {isAdmin ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select 
                            className="input" 
                            style={{ height: '30px', padding: '0 8px', fontSize: '13px' }}
                            value={inc.status}
                            onChange={(e) => handleStatusChange(e, inc.id, e.target.value)}
                          >
                            <option value="pending">Pendiente</option>
                            <option value="review">En Revisión</option>
                            <option value="resolved">Resuelta</option>
                          </select>
                          <button className="btn btn--danger" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={(e) => handleDelete(e, inc.id)}>
                            Eliminar
                          </button>
                        </div>
                      ) : (
                        inc.reported_by === user.id && inc.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button className="btn btn--outline" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => { setSelectedIncidentToEdit(inc); setIsGeneralModalOpen(true); }}>
                              Editar
                            </button>
                            <button className="btn btn--danger" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={(e) => handleDelete(e, inc.id)}>
                              Eliminar
                            </button>
                          </div>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isDetailsModalOpen && selectedReservation && (
        <ReservationDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          reservation={selectedReservation}
          onReportIncident={() => {}} // admin doesn't report from here
          onSuccess={fetchIncidents} // fetch incidents again in case status changed
        />
      )}

      {isGeneralModalOpen && (
        <GeneralIncidentModal
          isOpen={isGeneralModalOpen}
          onClose={() => setIsGeneralModalOpen(false)}
          incident={selectedIncidentToEdit}
          onSuccess={fetchIncidents}
        />
      )}
    </section>
  );
}
