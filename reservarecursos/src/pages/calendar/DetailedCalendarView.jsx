import React from 'react';

export function DetailedCalendarView({ resources, reservations, currentUserId, onCellClick, onReservationClick }) {
  const periods = [1, 2, 3, 4, 5, 6, 7];

  // Helper to find reservation for a specific resource and period
  const getReservationForPeriod = (resourceId, periodNumber) => {
    return reservations.find(res => 
      res.resource_id === resourceId &&
      res.status === 'active' &&
      res.period_start <= periodNumber && 
      res.period_end >= periodNumber
    );
  };

  if (!resources || resources.length === 0) {
    return <div className="calendar-empty">No hay recursos disponibles.</div>;
  }

  return (
    <div className="matrix-container detailed-matrix">
      <table className="calendar-matrix">
        <thead>
          <tr>
            <th className="matrix-header-sticky">Periodo</th>
            {resources.map(resource => (
              <th key={resource.id} className="matrix-header-resource">
                {resource.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map(period => (
            <tr key={`period-${period}`}>
              <td className="matrix-cell-period">
                <strong>Periodo {period}</strong>
              </td>
              
              {resources.map(resource => {
                const isMaintenance = resource.status === 'maintenance';
                const reservation = getReservationForPeriod(resource.id, period);
                
                let statusClass = 'status-available';
                let cellText = 'Libre';

                if (isMaintenance) {
                  statusClass = 'status-maintenance';
                  cellText = 'En mantenimiento';
                } else if (reservation) {
                  statusClass = 'status-full'; // Red for occupied single period
                  const isOwn = reservation.created_by === currentUserId;
                  const teacherName = isOwn ? 'Tu reserva' : (reservation.profiles?.display_name || 'Sin nombre registrado');
                  cellText = teacherName;
                }

                return (
                  <td 
                    key={`${period}-${resource.id}`} 
                    className={`matrix-cell ${statusClass} ${!isMaintenance ? 'interactive' : ''}`}
                    onClick={() => {
                      if (isMaintenance) return;
                      if (reservation) {
                        onReservationClick?.(reservation);
                      } else {
                        onCellClick?.(resource.id, period);
                      }
                    }}
                    style={{ cursor: !isMaintenance ? 'pointer' : 'not-allowed' }}
                  >
                    <div className="cell-content">
                      {cellText}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
