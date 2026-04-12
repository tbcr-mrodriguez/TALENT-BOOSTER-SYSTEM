import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FichaCandidato from '../components/FichaCandidato';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const AdminEmpleos = () => {
  const [loading, setLoading] = useState(false);
  const [puestos, setPuestos] = useState([]);
  const [postulaciones, setPostulaciones] = useState([]);
  const [tabActiva, setTabActiva] = useState('puestos');
  const [modalPuestoAbierto, setModalPuestoAbierto] = useState(false);
  const [modalPostulacionAbierto, setModalPostulacionAbierto] = useState(false);
  const [modalFichaAbierto, setModalFichaAbierto] = useState(false);
  const [fichaData, setFichaData] = useState(null);
  const [postulacionSeleccionada, setPostulacionSeleccionada] = useState(null);
  const [editandoPuesto, setEditandoPuesto] = useState(null);
  const [responsabilidadesTemp, setResponsabilidadesTemp] = useState([]);
  const [beneficiosTemp, setBeneficiosTemp] = useState([]);
  const [preguntasTemp, setPreguntasTemp] = useState([]);
  
  const [filtrosPuestos, setFiltrosPuestos] = useState({
    titulo: '',
    cliente: '',
    seniority: '',
    estado: ''
  });
  const [clientesUnicos, setClientesUnicos] = useState([]);
  
  const [filtrosPostulaciones, setFiltrosPostulaciones] = useState({
    candidato: '',
    cliente: '',
    estado: '',
    scoreMin: '',
    fechaDesde: ''
  });

  useEffect(() => {
    if (tabActiva === 'puestos') {
      cargarPuestos();
    } else {
      cargarPostulaciones();
    }
  }, [tabActiva]);

  const cargarPuestos = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/puestos`);
      if (res.data.success) {
        setPuestos(res.data.puestos);
        const clientes = [...new Set(res.data.puestos.map(p => p.cliente).filter(c => c))];
        setClientesUnicos(clientes);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const cargarPostulaciones = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/postulaciones`);
      if (res.data.success) {
        setPostulaciones(res.data.postulaciones);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const puestosFiltrados = puestos.filter(p => {
    if (filtrosPuestos.titulo && !p.titulo.toLowerCase().includes(filtrosPuestos.titulo.toLowerCase()) && !p.cliente.toLowerCase().includes(filtrosPuestos.titulo.toLowerCase())) return false;
    if (filtrosPuestos.cliente && p.cliente !== filtrosPuestos.cliente) return false;
    if (filtrosPuestos.seniority && p.seniority !== filtrosPuestos.seniority) return false;
    if (filtrosPuestos.estado === 'activo' && !p.activo) return false;
    if (filtrosPuestos.estado === 'inactivo' && p.activo) return false;
    return true;
  });

  const postulacionesFiltradas = postulaciones.filter(p => {
    if (filtrosPostulaciones.candidato && !p.candidato_nombre?.toLowerCase().includes(filtrosPostulaciones.candidato.toLowerCase()) && !p.candidato_email?.toLowerCase().includes(filtrosPostulaciones.candidato.toLowerCase())) return false;
    if (filtrosPostulaciones.cliente && p.puesto_cliente !== filtrosPostulaciones.cliente) return false;
    if (filtrosPostulaciones.estado && p.estado !== filtrosPostulaciones.estado) return false;
    if (filtrosPostulaciones.scoreMin && (p.match_score || 0) < parseInt(filtrosPostulaciones.scoreMin)) return false;
    if (filtrosPostulaciones.fechaDesde && new Date(p.fecha_postulacion) < new Date(filtrosPostulaciones.fechaDesde)) return false;
    return true;
  });

  const eliminarPuesto = async (id) => {
    if (!window.confirm('Eliminar este puesto? Se eliminaran tambien las postulaciones asociadas.')) return;
    try {
      await axios.delete(`${API_URL}/admin/puesto/${id}`);
      cargarPuestos();
    } catch (error) {
      alert('Error eliminando puesto');
    }
  };

  const editarPuesto = async (puesto) => {
    setEditandoPuesto(puesto);
    setResponsabilidadesTemp(puesto.responsabilidades || []);
    setBeneficiosTemp(puesto.beneficios || []);
    try {
      const res = await axios.get(`${API_URL}/admin/puesto/${puesto.id}/preguntas`);
      if (res.data.success) {
        const preguntas = res.data.preguntas || [];
        setPreguntasTemp(preguntas.map(p => ({
          pregunta: p.pregunta,
          tipo: p.tipo || 'texto',
          opciones: p.opciones || [],
          requerido: p.requerido !== false
        })));
      } else {
        setPreguntasTemp([]);
      }
    } catch (error) {
      console.error('Error cargando preguntas:', error);
      setPreguntasTemp([]);
    }
    setModalPuestoAbierto(true);
  };

  const verDetallePostulacion = async (postulacion) => {
    setPostulacionSeleccionada(postulacion);
    setModalPostulacionAbierto(true);
  };

  const actualizarEstado = async (id, estado) => {
    try {
      await axios.post(`${API_URL}/admin/postulacion/estado`, { postulacion_id: id, estado });
      cargarPostulaciones();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const verFichaCandidato = async (candidatoId) => {
    if (!candidatoId) return;
    try {
      const res = await axios.get(`${API_URL}/candidate/${candidatoId}`);
      if (!res.data.success) return;
      setFichaData(res.data.candidato);
      setModalFichaAbierto(true);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const escapeHtml = (text) => {
    if (!text) return '';
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div className="card-flat" style={{ padding: '1.5rem' }}>
        
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <button
            onClick={() => setTabActiva('puestos')}
            className={tabActiva === 'puestos' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
          >
            Puestos
          </button>
          <button
            onClick={() => setTabActiva('postulaciones')}
            className={tabActiva === 'postulaciones' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
          >
            Postulaciones
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
            {tabActiva === 'puestos' ? 'Administracion de Puestos' : 'Postulaciones Recibidas'}
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={tabActiva === 'puestos' ? cargarPuestos : cargarPostulaciones} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
              Actualizar
            </button>
            {tabActiva === 'puestos' && (
              <button onClick={() => { setEditandoPuesto(null); setResponsabilidadesTemp([]); setBeneficiosTemp([]); setPreguntasTemp([]); setModalPuestoAbierto(true); }} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                Nuevo Puesto
              </button>
            )}
          </div>
        </div>

        {tabActiva === 'puestos' && (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
            <input type="text" placeholder="Buscar titulo o cliente..." value={filtrosPuestos.titulo} onChange={(e) => setFiltrosPuestos({...filtrosPuestos, titulo: e.target.value})} className="input-focus" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', width: '180px', fontSize: '0.75rem' }} />
            <select value={filtrosPuestos.cliente} onChange={(e) => setFiltrosPuestos({...filtrosPuestos, cliente: e.target.value})} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem', background: 'white' }}>
              <option value="">Todos los clientes</option>
              {clientesUnicos.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filtrosPuestos.seniority} onChange={(e) => setFiltrosPuestos({...filtrosPuestos, seniority: e.target.value})} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem', background: 'white' }}>
              <option value="">Todos los seniority</option>
              <option value="Trainee">Trainee</option>
              <option value="Junior">Junior</option>
              <option value="Semi-Senior">Semi-Senior</option>
              <option value="Senior">Senior</option>
              <option value="Lead">Lead</option>
            </select>
            <select value={filtrosPuestos.estado} onChange={(e) => setFiltrosPuestos({...filtrosPuestos, estado: e.target.value})} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem', background: 'white' }}>
              <option value="">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
            <button onClick={() => setFiltrosPuestos({ titulo: '', cliente: '', seniority: '', estado: '' })} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.7rem' }}>Limpiar</button>
          </div>
        )}

        {tabActiva === 'postulaciones' && (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
            <input type="text" placeholder="Buscar candidato..." value={filtrosPostulaciones.candidato} onChange={(e) => setFiltrosPostulaciones({...filtrosPostulaciones, candidato: e.target.value})} className="input-focus" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', width: '160px', fontSize: '0.75rem' }} />
            <select value={filtrosPostulaciones.cliente} onChange={(e) => setFiltrosPostulaciones({...filtrosPostulaciones, cliente: e.target.value})} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem', background: 'white' }}>
              <option value="">Todos los clientes</option>
              {clientesUnicos.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filtrosPostulaciones.estado} onChange={(e) => setFiltrosPostulaciones({...filtrosPostulaciones, estado: e.target.value})} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem', background: 'white' }}>
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="revisado">Revisado</option>
              <option value="contacto">Contacto</option>
              <option value="entrevista">Entrevista</option>
              <option value="rechazado">Rechazado</option>
              <option value="contratado">Contratado</option>
            </select>
            <input type="number" placeholder="Score minimo" value={filtrosPostulaciones.scoreMin} onChange={(e) => setFiltrosPostulaciones({...filtrosPostulaciones, scoreMin: e.target.value})} className="input-focus" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', width: '100px', fontSize: '0.75rem' }} />
            <input type="date" value={filtrosPostulaciones.fechaDesde} onChange={(e) => setFiltrosPostulaciones({...filtrosPostulaciones, fechaDesde: e.target.value})} className="input-focus" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', width: '120px', fontSize: '0.75rem' }} />
            <button onClick={() => setFiltrosPostulaciones({ candidato: '', cliente: '', estado: '', scoreMin: '', fechaDesde: '' })} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.7rem' }}>Limpiar</button>
          </div>
        )}

        {tabActiva === 'puestos' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', gridColumn: '1/-1' }}>Cargando puestos...</div>
            ) : puestosFiltrados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', gridColumn: '1/-1', color: '#94a3b8' }}>No hay puestos creados</div>
            ) : (
              puestosFiltrados.map(p => (
                <div key={p.id} className="card-flat" style={{ padding: '1rem', borderLeft: `4px solid ${p.activo ? '#10b981' : '#94a3b8'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div>
                      <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{escapeHtml(p.cliente)}</span>
                      <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '0.5rem', color: '#1e293b' }}>{escapeHtml(p.titulo)}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => editarPuesto(p)} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}>Editar</button>
                      <button onClick={() => eliminarPuesto(p.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}>Eliminar</button>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>{escapeHtml(p.descripcion?.substring(0, 80))}...</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.75rem' }}>
                    {(p.habilidades_requeridas || []).slice(0, 3).map(h => <span key={h} className="badge" style={{ background: '#e0e7ff', color: '#1e40af', fontSize: '0.6rem' }}>{escapeHtml(h)}</span>)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#64748b' }}>
                    <span> {escapeHtml(p.ubicacion || 'No especificada')}</span>
                    <span> {escapeHtml(p.seniority || 'N/A')}</span>
                  </div>
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: p.activo ? '#10b981' : '#94a3b8' }}>{p.activo ? 'Activo' : 'Inactivo'}</span>
                    <button onClick={() => { setTabActiva('postulaciones'); setFiltrosPostulaciones({...filtrosPostulaciones, cliente: p.cliente}); }} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.65rem' }}>Postulaciones</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tabActiva === 'postulaciones' && (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '600', color: '#475569' }}>Candidato</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '600', color: '#475569' }}>Puesto / Cliente</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '600', color: '#475569' }}>Estado</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '600', color: '#475569' }}>Match</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '600', color: '#475569' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Cargando postulaciones...</td>
                  </tr>
                ) : postulacionesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No hay postulaciones</td>
                  </tr>
                ) : (
                  postulacionesFiltradas.map(p => {
                    const score = p.match_score || 0;
                    const scoreColor = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px 8px', fontSize: '0.8rem', fontWeight: '500' }}>
                          {escapeHtml(p.candidato_nombre)}<br/>
                          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{escapeHtml(p.candidato_email)}</span>
                        </td>
                        <td style={{ padding: '10px 8px', fontSize: '0.75rem' }}>
                          <div><strong>{escapeHtml(p.puesto_titulo)}</strong></div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{escapeHtml(p.puesto_cliente)}</div>
                          <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{new Date(p.fecha_postulacion).toLocaleDateString()}</div>
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <select value={p.estado} onChange={(e) => actualizarEstado(p.id, e.target.value)} style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', border: '1px solid #e2e8f0' }}>
                            <option value="pendiente">Pendiente</option>
                            <option value="revisado">Revisado</option>
                            <option value="contacto">Contacto</option>
                            <option value="entrevista">Entrevista</option>
                            <option value="rechazado">Rechazado</option>
                            <option value="contratado">Contratado</option>
                          </select>
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          {p.match_analisis ? (
                            <span style={{ background: scoreColor, color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>{score}%</span>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Analizando...</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button onClick={() => verDetallePostulacion(p)} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.65rem' }}>Ver</button>
                            <button onClick={() => verFichaCandidato(p.candidato_id)} className="btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.65rem' }}>Ficha</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalFichaAbierto && fichaData && (
        <div className="modal-overlay" onClick={() => setModalFichaAbierto(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <FichaCandidato 
              candidato={{
                ...fichaData,
                _parsed: (() => {
                  try {
                    return fichaData.raw_data ? (typeof fichaData.raw_data === 'string' ? JSON.parse(fichaData.raw_data) : fichaData.raw_data) : {};
                  } catch(e) {
                    return {};
                  }
                })(),
                id: fichaData.id,
                archivo: fichaData.archivo
              }}
              onClose={() => setModalFichaAbierto(false)}
              API_URL={API_URL}
            />
          </div>
        </div>
      )}

      {modalPostulacionAbierto && postulacionSeleccionada && (
        <div className="modal-overlay" onClick={() => setModalPostulacionAbierto(false)}>
          <div className="modal-glass" style={{ maxWidth: '700px', width: '90%', maxHeight: '85vh', overflow: 'auto', padding: '1.5rem', background: 'white' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>Detalle de Postulacion</h3>
              <button onClick={() => setModalPostulacionAbierto(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <button onClick={() => verFichaCandidato(postulacionSeleccionada.candidato_id)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>Ver ficha completa</button>
            </div>
            
            {postulacionSeleccionada.match_analisis && Object.keys(postulacionSeleccionada.match_analisis).length > 0 ? (
              <div className="card-flat" style={{ padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontWeight: 'bold', color: '#1e293b' }}>Evaluacion IA</h4>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: (postulacionSeleccionada.match_score || 0) >= 70 ? '#10b981' : (postulacionSeleccionada.match_score || 0) >= 50 ? '#f59e0b' : '#ef4444' }}>{postulacionSeleccionada.match_score || 0}%</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.75rem' }}>{escapeHtml(postulacionSeleccionada.match_analisis.resumen || 'No disponible')}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '8px' }}>
                    <h5 style={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#065f46', marginBottom: '0.25rem' }}>Fortalezas</h5>
                    <ul style={{ fontSize: '0.7rem', color: '#475569', paddingLeft: '1rem' }}>
                      {(postulacionSeleccionada.match_analisis.fortalezas || []).slice(0, 3).map(f => <li key={f}>{escapeHtml(f)}</li>)}
                    </ul>
                  </div>
                  <div style={{ background: '#fffbeb', padding: '0.75rem', borderRadius: '8px' }}>
                    <h5 style={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#92400e', marginBottom: '0.25rem' }}>Areas de mejora</h5>
                    <ul style={{ fontSize: '0.7rem', color: '#475569', paddingLeft: '1rem' }}>
                      {(postulacionSeleccionada.match_analisis.debilidades || []).slice(0, 3).map(d => <li key={d}>{escapeHtml(d)}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.8rem' }}>
                Analizando postulacion en segundo plano... El analisis estara disponible pronto.
              </div>
            )}
            
            <div className="card-flat" style={{ padding: '1rem', marginBottom: '1rem' }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{escapeHtml(postulacionSeleccionada.candidato_nombre)}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                <div><strong>Email:</strong> {escapeHtml(postulacionSeleccionada.candidato_email)}</div>
                <div><strong>Telefono:</strong> {escapeHtml(postulacionSeleccionada.candidato_telefono)}</div>
                <div><strong>Puesto:</strong> {escapeHtml(postulacionSeleccionada.puesto_titulo)}</div>
                <div><strong>Cliente:</strong> {escapeHtml(postulacionSeleccionada.puesto_cliente)}</div>
              </div>
            </div>
            
            <button onClick={() => setModalPostulacionAbierto(false)} className="btn-primary" style={{ width: '100%', padding: '0.5rem' }}>Cerrar</button>
          </div>
        </div>
      )}

      {modalPuestoAbierto && (
        <div className="modal-overlay" onClick={() => setModalPuestoAbierto(false)}>
          <div className="modal-glass" style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', overflow: 'auto', padding: '1.5rem', background: 'white' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>{editandoPuesto ? 'Editar Puesto' : 'Nuevo Puesto'}</h3>
              <button onClick={() => setModalPuestoAbierto(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const habilidades = formData.get('habilidades') ? formData.get('habilidades').split(',').map(s => s.trim()).filter(s => s) : [];
              const puestoData = {
                id: editandoPuesto?.id || null,
                cliente: formData.get('cliente'),
                titulo: formData.get('titulo'),
                descripcion: formData.get('descripcion'),
                requisitos: formData.get('requisitos'),
                habilidades_requeridas: habilidades,
                seniority: formData.get('seniority'),
                ubicacion: formData.get('ubicacion'),
                salario_oferta: formData.get('salario_oferta'),
                activo: formData.get('activo') === 'on',
                responsabilidades: responsabilidadesTemp,
                beneficios: beneficiosTemp,
                sobre_empresa: formData.get('sobre_empresa'),
                horario: formData.get('horario'),
                tipo_contrato: formData.get('tipo_contrato'),
                modalidad: formData.get('modalidad'),
                vacantes: parseInt(formData.get('vacantes')) || 1,
                fecha_limite: formData.get('fecha_limite') || null
              };
              try {
                const res = await axios.post(`${API_URL}/admin/puesto`, puestoData);
                if (res.data.success) {
                  const puestoId = res.data.id || editandoPuesto?.id;
                  if (preguntasTemp.length > 0) {
                    await axios.post(`${API_URL}/admin/puesto/preguntas`, { 
                      puesto_id: puestoId, 
                      preguntas: preguntasTemp.map((p, idx) => ({ ...p, orden: idx })) 
                    });
                  }
                  setModalPuestoAbierto(false);
                  cargarPuestos();
                  alert('Puesto guardado exitosamente');
                }
              } catch (error) {
                console.error('Error:', error);
                alert('Error guardando puesto: ' + (error.response?.data?.error || error.message));
              }
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>Cliente *</label>
                  <input type="text" name="cliente" required defaultValue={editandoPuesto?.cliente || ''} className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>Titulo *</label>
                  <input type="text" name="titulo" required defaultValue={editandoPuesto?.titulo || ''} className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem' }} />
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>Descripcion</label>
                <textarea name="descripcion" rows="3" defaultValue={editandoPuesto?.descripcion || ''} className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem' }}></textarea>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>Requisitos</label>
                <textarea name="requisitos" rows="3" defaultValue={editandoPuesto?.requisitos || ''} className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem' }}></textarea>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>Habilidades requeridas</label>
                  <input type="text" name="habilidades" placeholder="Python, SQL, React" defaultValue={editandoPuesto?.habilidades_requeridas?.join(', ') || ''} className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem' }} />
                  <p style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '0.25rem' }}>Separadas por coma</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>Seniority</label>
                  <select name="seniority" defaultValue={editandoPuesto?.seniority || ''} className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem', background: 'white' }}>
                    <option value="">Seleccione...</option>
                    <option value="Trainee">Trainee</option>
                    <option value="Junior">Junior</option>
                    <option value="Semi-Senior">Semi-Senior</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>Ubicacion</label>
                  <input type="text" name="ubicacion" placeholder="Remoto, Hibrido, San Jose..." defaultValue={editandoPuesto?.ubicacion || ''} className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>Salario oferta</label>
                  <input type="text" name="salario_oferta" placeholder="$2,000 - $3,500" defaultValue={editandoPuesto?.salario_oferta || ''} className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem' }} />
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>Responsabilidades</label>
                <div style={{ marginBottom: '0.5rem' }}>
                  {responsabilidadesTemp.length === 0 ? (
                    <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>No hay responsabilidades agregadas.</p>
                  ) : (
                    responsabilidadesTemp.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input type="text" value={item} onChange={(e) => { const newList = [...responsabilidadesTemp]; newList[idx] = e.target.value; setResponsabilidadesTemp(newList); }} className="input-focus" style={{ flex: 1, padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem' }} />
                        <button type="button" onClick={() => { const newList = responsabilidadesTemp.filter((_, i) => i !== idx); setResponsabilidadesTemp(newList); }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
                      </div>
                    ))
                  )}
                </div>
                <button type="button" onClick={() => setResponsabilidadesTemp([...responsabilidadesTemp, ''])} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.7rem' }}>Agregar responsabilidad</button>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>Beneficios</label>
                <div style={{ marginBottom: '0.5rem' }}>
                  {beneficiosTemp.length === 0 ? (
                    <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>No hay beneficios agregados.</p>
                  ) : (
                    beneficiosTemp.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input type="text" value={item} onChange={(e) => { const newList = [...beneficiosTemp]; newList[idx] = e.target.value; setBeneficiosTemp(newList); }} className="input-focus" style={{ flex: 1, padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem' }} />
                        <button type="button" onClick={() => { const newList = beneficiosTemp.filter((_, i) => i !== idx); setBeneficiosTemp(newList); }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
                      </div>
                    ))
                  )}
                </div>
                <button type="button" onClick={() => setBeneficiosTemp([...beneficiosTemp, ''])} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.7rem' }}>Agregar beneficio</button>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>Sobre la empresa</label>
                <textarea name="sobre_empresa" rows="2" defaultValue={editandoPuesto?.sobre_empresa || ''} className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem' }}></textarea>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>Horario</label>
                  <input type="text" name="horario" placeholder="Lunes a Viernes, 8am-5pm" defaultValue={editandoPuesto?.horario || ''} className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>Tipo de contrato</label>
                  <select name="tipo_contrato" defaultValue={editandoPuesto?.tipo_contrato || ''} className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem', background: 'white' }}>
                    <option value="">Seleccione...</option>
                    <option value="Indefinido">Indefinido</option>
                    <option value="Temporal">Temporal</option>
                    <option value="Consultoria">Consultoria</option>
                    <option value="Pasantia">Pasantia</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>Modalidad</label>
                  <select name="modalidad" defaultValue={editandoPuesto?.modalidad || ''} className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem', background: 'white' }}>
                    <option value="">Seleccione...</option>
                    <option value="Remoto">Remoto</option>
                    <option value="Hibrido">Hibrido</option>
                    <option value="Presencial">Presencial</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>Vacantes</label>
                  <input type="number" name="vacantes" defaultValue={editandoPuesto?.vacantes || 1} min="1" className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>Fecha limite</label>
                  <input type="date" name="fecha_limite" defaultValue={editandoPuesto?.fecha_limite || ''} className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem' }} />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" name="activo" defaultChecked={editandoPuesto?.activo !== false} /> Activo
                  </label>
                </div>
              </div>
              
              <hr style={{ margin: '1rem 0', borderColor: '#e2e8f0' }} />
              <h4 style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Preguntas adicionales para candidatos</h4>
              <div style={{ marginBottom: '0.75rem' }}>
                {preguntasTemp.length === 0 ? (
                  <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>No hay preguntas adicionales configuradas.</p>
                ) : (
                  preguntasTemp.map((p, idx) => (
                    <div key={idx} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input type="text" placeholder="Pregunta" value={p.pregunta} onChange={(e) => { const newList = [...preguntasTemp]; newList[idx].pregunta = e.target.value; setPreguntasTemp(newList); }} className="input-focus" style={{ flex: 1, padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem' }} />
                        <button type="button" onClick={() => { const newList = preguntasTemp.filter((_, i) => i !== idx); setPreguntasTemp(newList); }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select value={p.tipo} onChange={(e) => { const newList = [...preguntasTemp]; newList[idx].tipo = e.target.value; setPreguntasTemp(newList); }} style={{ padding: '0.25rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.7rem' }}>
                          <option value="texto">Texto</option>
                          <option value="number">Numero</option>
                          <option value="select">Select</option>
                        </select>
                        <input type="text" placeholder="Opciones (separadas por coma)" value={p.opciones?.join(', ') || ''} onChange={(e) => { const newList = [...preguntasTemp]; newList[idx].opciones = e.target.value.split(',').map(s => s.trim()); setPreguntasTemp(newList); }} className="input-focus" style={{ flex: 1, padding: '0.25rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.7rem' }} />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
                          <input type="checkbox" checked={p.requerido} onChange={(e) => { const newList = [...preguntasTemp]; newList[idx].requerido = e.target.checked; setPreguntasTemp(newList); }} /> Requerido
                        </label>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button type="button" onClick={() => setPreguntasTemp([...preguntasTemp, { pregunta: '', tipo: 'texto', opciones: [], requerido: true }])} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.7rem' }}>Agregar pregunta</button>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.5rem' }}>Guardar puesto</button>
                <button type="button" onClick={() => setModalPuestoAbierto(false)} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmpleos;