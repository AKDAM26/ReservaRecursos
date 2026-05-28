import React, { useEffect, useState } from 'react';
import { useAuth } from '../../app/auth/useAuth';
import { incidentsService } from '../../lib/services/incidents.service';
import { reservationsService } from '../../lib/services/reservations.service';
import { ReservationDetailsModal } from '../reservations/ReservationDetailsModal';
import '../reservations/ReservationDetailsModal.css';

export function IncidentsDashboard() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

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
      await incidentsService.updateIncident(id, { status: newStatus });
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: newStatus } : inc));
    } catch (err) {
      alert('Error al actualizar el estado: ' + err.message);
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

  return (
    <section className="pageWrap">
      <div className="titleBar">
        <h1>Panel de Incidencias</h1>
        <p>Gestión y seguimiento de averías reportadas por los profesores</p>
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
              {incidents.map(inc => {
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
                    <td>
                      <select 
                        className="input" 
                        style={{ height: '30px', padding: '0 8px', fontSize: '13px' }}
                        value={inc.status}
                        onChange={(e) => handleStatusChange(e, inc.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="pending">Pendiente</option>
                        <option value="review">En Revisión</option>
                        <option value="resolved">Resuelta</option>
                      </select>
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
    </section>
  );
}
