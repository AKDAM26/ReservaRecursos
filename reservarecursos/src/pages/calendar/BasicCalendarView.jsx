import React from 'react';
import { getResourceColorStatus, getStatusText } from '../../lib/utils/colorEngine';
import { isSameDay, startOfDay } from '../../lib/date';

export function BasicCalendarView({ resources, reservations, weekDays, onCellClick }) {
  
  // Helper to format date header
  const formatDateHeader = (date) => {
    return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
  };

  // Helper to get reservations for a specific resource and day
  const getReservationsForCell = (resourceId, dayDate) => {
    return reservations.filter(res => 
      res.resource_id === resourceId && 
      res.status === 'active' &&
      isSameDay(startOfDay(new Date(res.reservation_date)), startOfDay(dayDate))
    );
  };

  if (!resources || resources.length === 0) {
    return <div className="calendar-empty">No hay recursos disponibles.</div>;
  }

  return (
    <div className="matrix-container basic-matrix">
      <table className="calendar-matrix">
        <thead>
          <tr>
            <th className="matrix-header-sticky">Recurso</th>
            {weekDays.map((day, idx) => (
              <th key={idx} className="matrix-header-day">
                {formatDateHeader(day)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resources.map(resource => (
            <tr key={resource.id}>
              <td className="matrix-cell-resource">
                <strong>{resource.name}</strong>
                {resource.status === 'maintenance' && <span className="maintenance-badge">Mantenimiento</span>}
              </td>
              
              {weekDays.map((day, idx) => {
                const dayReservations = getReservationsForCell(resource.id, day);
                const statusClass = getResourceColorStatus(resource, dayReservations);
                
                // Calculate exactly which periods are occupied to show specific text if needed
                let occupiedPeriods = new Set();
                dayReservations.forEach(res => {
                  if (res.period_start && res.period_end) {
                    for (let i = res.period_start; i <= res.period_end; i++) occupiedPeriods.add(i);
                  }
                });
                
                const occupiedArray = Array.from(occupiedPeriods).sort((a,b)=>a-b);
                let cellText = getStatusText(statusClass, occupiedArray.length);
                
                // If partial, maybe be more specific "Ocupada en 1, 3 y 6" as user requested
                if (statusClass === 'status-partial' && occupiedArray.length > 0) {
                   cellText = `Ocupada en ${occupiedArray.join(', ')}`;
                }

                return (
                  <td 
                    key={idx} 
                    className={`matrix-cell ${statusClass} interactive`}
                    onClick={() => {
                      if (resource.status !== 'maintenance' && statusClass !== 'status-full') {
                        onCellClick?.(resource.id, day);
                      }
                    }}
                    style={{ cursor: (resource.status !== 'maintenance' && statusClass !== 'status-full') ? 'pointer' : 'not-allowed' }}
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
