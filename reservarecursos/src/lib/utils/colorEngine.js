export function getResourceColorStatus(resource, reservationsForDay = []) {
  // Purple: Maintenance
  if (resource.status === 'maintenance') {
    return 'status-maintenance'; // CSS class name mapping
  }

  // Calculate occupied periods
  let occupiedPeriods = new Set();
  
  reservationsForDay.forEach(res => {
    // res.period_start and res.period_end are inclusive
    const start = res.period_start;
    const end = res.period_end;
    
    if (start && end) {
      for (let i = start; i <= end; i++) {
        occupiedPeriods.add(i);
      }
    }
  });

  const count = occupiedPeriods.size;

  // Green: 0 periods occupied
  if (count === 0) {
    return 'status-available';
  }

  // Red: All 7 periods occupied
  if (count === 7) {
    return 'status-full';
  }

  // Orange: Partially occupied (1-6 periods)
  return 'status-partial';
}

export function getStatusText(statusClass, occupiedCount = 0) {
  switch (statusClass) {
    case 'status-maintenance':
      return 'En mantenimiento';
    case 'status-available':
      return '7 periodos libres';
    case 'status-full':
      return 'Totalmente reservada';
    case 'status-partial':
      return `${7 - occupiedCount} periodos libres`;
    default:
      return '';
  }
}
