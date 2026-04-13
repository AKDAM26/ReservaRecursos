import { useState, useEffect } from 'react';
import { typesService } from '../../lib/services/types.service';

export function TypesPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState(null);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const data = await typesService.getTypes();
      setTypes(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching types:', err);
      setError('Error al cargar tipos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      // Omit description if it's not strictly required in your use case or add it if you want
      await typesService.createType({ name: newName });
      setNewName('');
      fetchTypes();
    } catch (err) {
      alert('Error creando tipo: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este tipo? Puede fallar si hay recursos asignados a él.')) return;
    try {
      await typesService.deleteType(id);
      fetchTypes();
    } catch (err) {
      alert('Error al borrar: ' + err.message);
    }
  };

  return (
    <section className="pageWrap narrow">
      <div className="titleBar">
        <h1>Gestión de Tipos</h1>
        <p>Añade o elimina categorías de recursos</p>
      </div>

      {error && <p className="error" style={{ color: 'var(--color-danger, red)' }}>{error}</p>}

      <div className="inlineForm oneLine">
        <input 
          className="input" 
          placeholder="Nombre del nuevo tipo..." 
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="btn btn--primary" type="button" onClick={handleCreate} disabled={loading}>
          Añadir Tipo
        </button>
      </div>

      <table className="dataTable">
        <thead>
          <tr>
            <th>ID</th>
            <th>NOMBRE</th>
            <th>ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="dataTable__empty" colSpan={3}>
                Cargando tipos...
              </td>
            </tr>
          ) : types.length === 0 ? (
            <tr>
              <td className="dataTable__empty" colSpan={3}>
                No hay tipos definidos todavía.
              </td>
            </tr>
          ) : (
            types.map((type) => (
              <tr key={type.id}>
                <td>{type.id}</td>
                <td>{type.name}</td>
                <td>
                  <button className="btn" onClick={() => handleDelete(type.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
