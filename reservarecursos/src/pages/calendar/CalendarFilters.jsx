import React from 'react';

export function CalendarFilters({
  viewMode,
  setViewMode,
  resourceTypes,
  selectedResourceType,
  setSelectedResourceType,
  onPrev,
  onNext,
  dateLabel
}) {
  return (
    <div className="calendar-filters">
      <div className="filter-group">
        <label htmlFor="viewMode" className="filter-label">Vista:</label>
        <div className="custom-select-wrapper">
          <select 
            id="viewMode"
            className="filter-select" 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="detailed">Vista Diaria (Detallada)</option>
            <option value="basic">Vista Semanal (Básica)</option>
          </select>
        </div>
      </div>

      {viewMode === 'basic' && (
        <div className="filter-group date-nav-group">
          <button className="nav-btn" onClick={onPrev}>‹</button>
          <span className="date-label">{dateLabel}</span>
          <button className="nav-btn" onClick={onNext}>›</button>
        </div>
      )}

      <div className="filter-group">
        <label htmlFor="resourceType" className="filter-label">Mostrar:</label>
        <div className="custom-select-wrapper">
          <select 
            id="resourceType"
            className="filter-select" 
            value={selectedResourceType} 
            onChange={(e) => setSelectedResourceType(e.target.value)}
          >
            <option value="all">Todos los recursos</option>
            {resourceTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
