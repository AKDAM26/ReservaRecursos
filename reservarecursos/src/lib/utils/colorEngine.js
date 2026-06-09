export function getResourceColorStatus(resource, reservationsForDay = []) {
  if (resource.status === 'maintenance') {
    return 'status-maintenance';
  }

  let occupiedPeriods = new Set();
  
  reservationsForDay.forEach(res => {
    const start = res.period_start;
    const end = res.period_end;
    
    if (start && end) {
      for (let i = start; i <= end; i++) {
        occupiedPeriods.add(i);
      }
    }
  });

  const count = occupiedPeriods.size;

  if (count === 0) {
    return 'status-available';
  }

  if (count === 7) {
    return 'status-full';
  }

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
