import { useEffect, useState, useMemo } from 'react';
import { resourcesService } from '../../lib/services/resources.service';
import { ReservationModal } from '../reservations/ReservationModal';

export function HomePage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bookingResource, setBookingResource] = useState(null);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await resourcesService.getResources({ status: 'available' });
      setResources(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const filteredResources = useMemo(() => {
    if (!search.trim()) return resources;
    const lower = search.toLowerCase();
    return resources.filter(
      (r) =>
        r.name.toLowerCase().includes(lower) ||
        r.resource_types?.name?.toLowerCase().includes(lower)
    );
  }, [resources, search]);

  return (
    <section className="pageWrap">
      <div className="heroCard">
        <h1>Reserva de Recursos</h1>
        <p>Gestiona y reserva aulas, laboratorios y equipos de forma sencilla.</p>
        <input 
          className="input heroCard__search" 
          placeholder="Buscar por nombre o tipo..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="sectionHead">
        <h2>Disponibles ahora</h2>
      </div>

      {loading ? (
        <article className="emptyPanel">
          <p className="emptyPanel__text">Cargando recursos...</p>
        </article>
      ) : filteredResources.length === 0 ? (
        <article className="emptyPanel">
          <p className="emptyPanel__title">No se encontraron recursos</p>
          <p className="emptyPanel__text">
            No hay recursos disponibles en este momento que coincidan con la búsqueda.
          </p>
        </article>
      ) : (
        <div className="resourceGrid">
          {filteredResources.map((res) => (
            <div key={res.id} className="resourceCard">
              <div className="resourceCard__top">
                <div className="resourceCard__icon">
                  {/* Just a placeholder icon */}
                  <span style={{ fontSize: '18px' }}>📦</span>
                </div>
                <span className="pill">{res.resource_types?.name || 'Recurso'}</span>
              </div>
              <h3>{res.name}</h3>
              <p>Estado: {res.status}</p>
              <button 
                className="btn btn--primary" 
                style={{ marginTop: 'auto' }}
                onClick={() => setBookingResource(res.id)}
              >
                Reservar
              </button>
            </div>
          ))}
        </div>
      )}

      {bookingResource && (
        <ReservationModal 
          initialResourceId={bookingResource}
          onClose={() => setBookingResource(null)}
          onSuccess={() => {
            setBookingResource(null);
            // We could redirect to /mis-reservas or calendar, or just let them be.
            alert('¡Reserva creada con éxito!');
          }}
        />
      )}
    </section>
  );
}
