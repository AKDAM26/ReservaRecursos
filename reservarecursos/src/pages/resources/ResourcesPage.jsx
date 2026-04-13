import { useEffect, useState } from 'react';
import { useAuth } from '../../app/auth/useAuth';
import { resourcesService } from '../../lib/services/resources.service';
import { typesService } from '../../lib/services/types.service';

export function ResourcesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [resources, setResources] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newName, setNewName] = useState('');
  const [newTypeId, setNewTypeId] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editTypeId, setEditTypeId] = useState('');
  const [editStatus, setEditStatus] = useState('available');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resData, typesData] = await Promise.all([
        resourcesService.getResources(),
        typesService.getTypes()
      ]);
      setResources(resData);
      setTypes(typesData);
      
      if (typesData.length > 0 && !newTypeId) {
        setNewTypeId(typesData[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim() || !newTypeId) return;
    try {
      await resourcesService.createResource({ 
        name: newName, 
        type_id: newTypeId,
        status: 'available' 
      });
      setNewName('');
      fetchData();
    } catch (err) {
      alert('Error creando recurso: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este recurso?')) return;
    try {
      await resourcesService.deleteResource(id);
      fetchData();
    } catch (err) {
      alert('Error al borrar: ' + err.message);
    }
  };

  const startEditing = (r) => {
    setEditingId(r.id);
    setEditName(r.name);
    setEditTypeId(r.type_id || (types.length > 0 ? types[0].id : ''));
    setEditStatus(r.status || 'available');
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = async () => {
    if (!editName.trim() || !editTypeId) return;
    try {
      await resourcesService.updateResource(editingId, {
        name: editName,
        type_id: editTypeId,
        status: editStatus
      });
      setEditingId(null);
      fetchData();
    } catch (err) {
      alert('Error al actualizar: ' + err.message);
    }
  };

  return (
    <section className="pageWrap narrow">
      <div className="titleBar">
        <h1>Gestión de Recursos</h1>
        <p>Directorio de recursos ({resources.length})</p>
      </div>

      {isAdmin && (
        <div className="inlineForm">
          <input 
            className="input" 
            placeholder="Nombre del recurso..." 
            value={newName} 
            onChange={e => setNewName(e.target.value)} 
          />
          <select 
            className="input" 
            value={newTypeId} 
            onChange={e => setNewTypeId(e.target.value)}
            disabled={types.length === 0}
          >
            {types.length === 0 && <option value="">No hay tipos (Crea uno)</option>}
            {types.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button 
            className="btn btn--primary" 
            type="button" 
            onClick={handleAdd}
            disabled={loading || types.length === 0 || !newName.trim()}
          >
            Añadir Recurso
          </button>
        </div>
      )}

      <table className="dataTable">
        <thead>
          <tr>
            <th>NOMBRE DEL RECURSO</th>
            <th>TIPO / CATEGORÍA</th>
            <th>ESTADO</th>
            {isAdmin && <th>ACCIONES</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={isAdmin ? 4 : 3} className="dataTable__empty">Cargando recursos...</td></tr>
          ) : resources.length === 0 ? (
            <tr><td colSpan={isAdmin ? 4 : 3} className="dataTable__empty">No hay recursos registrados todavía.</td></tr>
          ) : (
            resources.map(r => {
              const isEditing = editingId === r.id;

              return (
                <tr key={r.id}>
                  <td>
                    {isEditing ? (
                      <input 
                        className="input" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)} 
                      />
                    ) : (
                      r.name
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <select 
                        className="input" 
                        value={editTypeId} 
                        onChange={(e) => setEditTypeId(e.target.value)}
                      >
                        {types.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    ) : (
                      r.resource_types?.name || 'Desconocido'
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <select 
                        className="input" 
                        value={editStatus} 
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        <option value="available">Disponible</option>
                        <option value="maintenance">Mantenimiento</option>
                        <option value="unavailable">No disponible</option>
                      </select>
                    ) : (
                      r.status
                    )}
                  </td>
                  {isAdmin && (
                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn--primary" onClick={saveEditing}>
                            Guardar
                          </button>
                          <button className="btn" onClick={cancelEditing}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn" onClick={() => startEditing(r)}>
                            Editar
                          </button>
                          <button className="btn" onClick={() => handleDelete(r.id)}>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </section>
  );
}
