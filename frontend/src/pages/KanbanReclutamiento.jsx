import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const KanbanReclutamiento = () => {
  const [puestos, setPuestos] = useState([]);
  const [puestoSeleccionado, setPuestoSeleccionado] = useState('');
  const [etapas, setEtapas] = useState([]);
  const [candidatos, setCandidatos] = useState([]);
  const [vistaActual, setVistaActual] = useState('kanban');
  const [loading, setLoading] = useState(false);
  const [filtrosLista, setFiltrosLista] = useState({
    nombre: '',
    etapa: '',
    score: '',
    habilidad: ''
  });
  const [modalFichaAbierto, setModalFichaAbierto] = useState(false);
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState(null);
  const [notasTemp, setNotasTemp] = useState('');
  const [etapaTemp, setEtapaTemp] = useState('');
  const [modalConfigAbierto, setModalConfigAbierto] = useState(false);
  const [etapasConfig, setEtapasConfig] = useState([]);

  useEffect(() => {
    cargarPuestos();
  }, []);

  const cargarPuestos = async () => {
    try {
      const res = await axios.get(`${API_URL}/puestos`);
      if (res.data.success && res.data.puestos) {
        setPuestos(res.data.puestos);
      }
    } catch (error) {
      console.error('Error cargando puestos:', error);
    }
  };

  const cargarDatos = async () => {
    if (!puestoSeleccionado) {
      alert('Selecciona un puesto primero');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/kanban/candidatos/${puestoSeleccionado}`);
      if (res.data.success) {
        setEtapas(res.data.etapas || []);
        setCandidatos(res.data.candidatos || []);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
    setLoading(false);
  };

  const moverCandidato = async (candidatoProcesoId, nuevaEtapaId, comentario) => {
    try {
      await axios.post(`${API_URL}/kanban/mover`, {
        candidato_proceso_id: candidatoProcesoId,
        nueva_etapa_id: nuevaEtapaId,
        comentario: comentario,
        usuario: 'reclutador'
      });
      await cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al mover candidato');
    }
  };

  const handleDragStart = (e, candidatoId) => {
    e.dataTransfer.setData('candidatoId', candidatoId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, etapaId) => {
    e.preventDefault();
    const candidatoId = parseInt(e.dataTransfer.getData('candidatoId'));
    const candidato = candidatos.find(c => c.id === candidatoId);
    if (candidato && candidato.etapa_id !== etapaId) {
      const comentario = prompt('Agrega un comentario para este movimiento:');
      await moverCandidato(candidatoId, etapaId, comentario || '');
    }
  };

  const verFicha = async (candidato) => {
    try {
      const res = await axios.get(`${API_URL}/candidates`);
      const fullCandidato = res.data.data.find(c => c.id === candidato.candidato_id);
      setCandidatoSeleccionado({ ...candidato, fullData: fullCandidato });
      setNotasTemp(candidato.notas || '');
      setEtapaTemp(candidato.etapa_id.toString());
      setModalFichaAbierto(true);
    } catch (error) {
      setCandidatoSeleccionado(candidato);
      setModalFichaAbierto(true);
    }
  };

  const guardarNotas = async () => {
    if (!candidatoSeleccionado) return;
    try {
      await axios.post(`${API_URL}/kanban/actualizar-notas`, {
        candidato_proceso_id: candidatoSeleccionado.id,
        notas: notasTemp
      });
      alert('Notas guardadas');
      await cargarDatos();
    } catch (error) {
      alert('Error al guardar notas');
    }
  };

  const cambiarEtapaDesdeFicha = async () => {
    if (!candidatoSeleccionado) return;
    const nuevaEtapaId = parseInt(etapaTemp);
    if (candidatoSeleccionado.etapa_id !== nuevaEtapaId) {
      await moverCandidato(candidatoSeleccionado.id, nuevaEtapaId, 'Cambio desde ficha');
      setModalFichaAbierto(false);
    }
  };

  const verCV = () => {
    if (candidatoSeleccionado?.fullData?.archivo) {
      window.open(`${API_URL}/view-cv/${encodeURIComponent(candidatoSeleccionado.fullData.archivo)}`, '_blank');
    } else {
      alert('No hay CV disponible');
    }
  };

  const abrirConfiguracion = async () => {
    try {
      const res = await axios.get(`${API_URL}/kanban/etapas`);
      setEtapasConfig(res.data.etapas || []);
      setModalConfigAbierto(true);
    } catch (error) {
      alert('Error cargando etapas');
    }
  };

  const getScoreStyle = (score) => {
    if (score >= 70) {
      return { background: '#d1fae5', color: '#065f46' };
    }
    if (score >= 50) {
      return { background: '#fef3c7', color: '#92400e' };
    }
    return { background: '#fee2e2', color: '#991b1b' };
  };

  const candidatosFiltrados = candidatos.filter(c => {
    if (filtrosLista.nombre && !c.nombre?.toLowerCase().includes(filtrosLista.nombre.toLowerCase()) && !c.profesion?.toLowerCase().includes(filtrosLista.nombre.toLowerCase())) return false;
    if (filtrosLista.etapa && c.etapa_id !== parseInt(filtrosLista.etapa)) return false;
    if (filtrosLista.score && (c.score || 0) < parseInt(filtrosLista.score)) return false;
    if (filtrosLista.habilidad && !(c.habilidades || []).some(h => h.toLowerCase().includes(filtrosLista.habilidad.toLowerCase()))) return false;
    return true;
  });

  return (
    <div>
      
      {/* HEADER FIJO - Siempre visible */}
      <div style={{ 
        background: 'white', 
        padding: '1rem 1.5rem', 
        borderRadius: '16px', 
        marginBottom: '1rem',
        display: 'flex', 
        justifyContent: 'flex-start',
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1rem',
        border: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: 'white'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>Pipeline de Reclutamiento</h2>
        
        <select 
          value={puestoSeleccionado} 
          onChange={(e) => setPuestoSeleccionado(e.target.value)}
          style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', background: 'white' }}
        >
          <option value="">-- Seleccionar puesto --</option>
          {puestos.map(p => (
            <option key={p.id} value={p.id}>{p.cliente} - {p.titulo}</option>
          ))}
        </select>
        
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '12px' }}>
          <button 
            onClick={() => setVistaActual('kanban')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: vistaActual === 'kanban' ? 'white' : 'transparent',
              color: vistaActual === 'kanban' ? '#2563eb' : '#64748b',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: vistaActual === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Kanban
          </button>
          <button 
            onClick={() => setVistaActual('lista')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: vistaActual === 'lista' ? 'white' : 'transparent',
              color: vistaActual === 'lista' ? '#2563eb' : '#64748b',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: vistaActual === 'lista' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Lista
          </button>
        </div>
        
        <button onClick={cargarDatos} style={{ padding: '0.5rem 1rem', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Cargar
        </button>
        
        <button onClick={abrirConfiguracion} style={{ padding: '0.5rem 1rem', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Configurar
        </button>
      </div>

      {/* KANBAN - Solo aquí hay scroll */}
      {vistaActual === 'kanban' && (
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', minWidth: 'min-content' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', minWidth: '300px' }}>Cargando...</div>
            ) : etapas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', minWidth: '300px', color: '#94a3b8' }}>Selecciona un puesto para ver los candidatos</div>
            ) : (
              etapas.map(etapa => {
                const cards = candidatos.filter(c => c.etapa_id === etapa.id);
                return (
                  <div 
                    key={etapa.id} 
                    style={{ 
                      background: '#f8fafc', 
                      borderRadius: '16px', 
                      minWidth: '320px', 
                      width: '320px', 
                      padding: '0.75rem',
                      flexShrink: 0
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '0.5rem 0.25rem 0.75rem', 
                      borderBottom: '2px solid #e2e8f0', 
                      marginBottom: '0.75rem' 
                    }}>
                      <span style={{ fontWeight: '600', color: '#1e293b' }}>{etapa.nombre}</span>
                      <span style={{ background: '#e2e8f0', padding: '0.25rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', color: '#475569' }}>{cards.length}</span>
                    </div>
                    <div 
                      style={{ minHeight: '200px' }}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, etapa.id)}
                    >
                      {cards.map(c => (
                        <div 
                          key={c.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, c.id)}
                          onClick={() => verFicha(c)}
                          style={{ 
                            background: 'white', 
                            borderRadius: '12px', 
                            padding: '0.75rem', 
                            marginBottom: '0.75rem', 
                            cursor: 'pointer',
                            border: '1px solid #e2e8f0',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>{c.nombre || 'Candidato'}</strong>
                            <span style={{ ...getScoreStyle(c.score), padding: '0.2rem 0.5rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 600 }}>
                              {c.score || 0}%
                            </span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', margin: '0.5rem 0' }}>{c.profesion || ''}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {(c.habilidades || []).slice(0, 3).map(h => (
                              <span key={h} style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.6rem', color: '#475569' }}>{h}</span>
                            ))}
                          </div>
                          {c.notas && (
                            <div style={{ fontSize: '0.6rem', color: '#f59e0b', marginTop: '0.5rem' }}>
                              Nota: {c.notas.substring(0, 40)}{c.notas.length > 40 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VISTA LISTA */}
      {vistaActual === 'lista' && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Buscar</label>
              <input type="text" placeholder="Nombre o profesion" value={filtrosLista.nombre} onChange={(e) => setFiltrosLista({...filtrosLista, nombre: e.target.value})} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem', minWidth: '150px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Etapa</label>
              <select value={filtrosLista.etapa} onChange={(e) => setFiltrosLista({...filtrosLista, etapa: e.target.value})} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem', minWidth: '130px', background: 'white' }}>
                <option value="">Todas</option>
                {etapas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Score minimo</label>
              <input type="number" placeholder="50" value={filtrosLista.score} onChange={(e) => setFiltrosLista({...filtrosLista, score: e.target.value})} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem', width: '100px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Habilidad</label>
              <input type="text" placeholder="Python, Java..." value={filtrosLista.habilidad} onChange={(e) => setFiltrosLista({...filtrosLista, habilidad: e.target.value})} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem', minWidth: '130px' }} />
            </div>
            <button onClick={() => setFiltrosLista({ nombre: '', etapa: '', score: '', habilidad: '' })} style={{ background: '#e2e8f0', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>Limpiar</button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Candidato</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Profesion</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Etapa</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Score</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Habilidades</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Notas</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</td>
                  </tr>
                ) : candidatosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No hay candidatos</td>
                  </tr>
                ) : (
                  candidatosFiltrados.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => verFicha(c)}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{c.nombre || 'Candidato'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{c.profesion || ''}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <select 
                          value={c.etapa_id} 
                          onChange={async (e) => {
                            e.stopPropagation();
                            const nuevaEtapa = parseInt(e.target.value);
                            if (c.etapa_id !== nuevaEtapa) {
                              const comentario = prompt(`Cambiar etapa de "${c.nombre}"?`);
                              await moverCandidato(c.id, nuevaEtapa, comentario || '');
                            }
                          }} 
                          style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', border: '1px solid #e2e8f0', background: 'white' }}
                        >
                          {etapas.map(e => <option key={e.id} value={e.id} selected={e.id === c.etapa_id}>{e.nombre}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ ...getScoreStyle(c.score), padding: '0.2rem 0.5rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 600 }}>
                          {c.score || 0}%
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>{(c.habilidades || []).slice(0, 2).join(', ')}{(c.habilidades || []).length > 2 ? '...' : ''}</td>
                      <td style={{ padding: '0.75rem 1rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.notas ? `Nota: ${c.notas.substring(0, 30)}` : '-'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <button onClick={(e) => { e.stopPropagation(); verFicha(c); }} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem' }}>Ver</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL FICHA */}
      {modalFichaAbierto && candidatoSeleccionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModalFichaAbierto(false)}>
          <div style={{ background: 'white', borderRadius: '20px', maxWidth: '600px', width: '90%', maxHeight: '85vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{candidatoSeleccionado.nombre || 'Candidato'}</h3>
                <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.8rem' }}>{candidatoSeleccionado.profesion || ''}</p>
              </div>
              <button onClick={() => setModalFichaAbierto(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Cambiar etapa</label>
                <select value={etapaTemp} onChange={(e) => setEtapaTemp(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '0.25rem' }}>
                  {etapas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
                <button onClick={cambiarEtapaDesdeFicha} style={{ marginTop: '0.5rem', background: '#2563eb', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>Actualizar etapa</button>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Notas del reclutador</label>
                <textarea value={notasTemp} onChange={(e) => setNotasTemp(e.target.value)} rows="3" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '0.25rem' }}></textarea>
                <button onClick={guardarNotas} style={{ marginTop: '0.5rem', background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>Guardar notas</button>
              </div>
              {candidatoSeleccionado.fullData?.archivo && (
                <button onClick={verCV} style={{ background: '#e2e8f0', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>Ver CV</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACION */}
      {modalConfigAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModalConfigAbierto(false)}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', maxWidth: '500px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Configuracion de Etapas</h3>
            <div>
              {etapasConfig.map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: e.color || '#3b82f6' }}></span>
                  <span>{e.nombre}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#64748b' }}>Orden: {e.orden}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setModalConfigAbierto(false)} style={{ marginTop: '1rem', background: '#e2e8f0', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanReclutamiento;