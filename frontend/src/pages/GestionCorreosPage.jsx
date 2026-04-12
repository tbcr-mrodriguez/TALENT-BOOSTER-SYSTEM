import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const GestionCorreosPage = () => {
  const [plantillas, setPlantillas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [candidatos, setCandidatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('enviar');
  
  const [nuevoCorreo, setNuevoCorreo] = useState({
    plantilla_id: '',
    candidato_id: '',
    postulacion_id: '',
    variables: {}
  });
  const [variablesDisponibles, setVariablesDisponibles] = useState({});
  const [vistaPrevia, setVistaPrevia] = useState(null);
  
  const [nuevaPlantilla, setNuevaPlantilla] = useState({
    id: null,
    nombre: '',
    asunto: '',
    cuerpo: '',
    tipo: 'manual',
    variables: []
  });
  const [editandoPlantilla, setEditandoPlantilla] = useState(false);
  const [modalPlantillaAbierto, setModalPlantillaAbierto] = useState(false);

  useEffect(() => {
    cargarPlantillas();
    cargarHistorial();
    cargarCandidatos();
    cargarVariables();
  }, []);

  const cargarPlantillas = async () => {
    try {
      const res = await axios.get(`${API_URL}/correos/plantillas`);
      if (res.data.success) setPlantillas(res.data.plantillas);
    } catch (error) { console.error(error); }
  };

  const cargarHistorial = async () => {
    try {
      const res = await axios.get(`${API_URL}/correos/historial`);
      if (res.data.success) setHistorial(res.data.historial);
    } catch (error) { console.error(error); }
  };

  const cargarCandidatos = async () => {
    try {
      const res = await axios.get(`${API_URL}/candidates`);
      if (res.data.success) setCandidatos(res.data.data);
    } catch (error) { console.error(error); }
  };

  const cargarVariables = async () => {
    try {
      const res = await axios.get(`${API_URL}/correos/variables`);
      if (res.data.success) setVariablesDisponibles(res.data.variables);
    } catch (error) { console.error(error); }
  };

  const obtenerVistaPrevia = async () => {
    if (!nuevoCorreo.plantilla_id || !nuevoCorreo.candidato_id) {
      alert('Selecciona una plantilla y un candidato');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/correos/procesar`, {
        plantilla_id: nuevoCorreo.plantilla_id,
        candidato_id: nuevoCorreo.candidato_id,
        postulacion_id: nuevoCorreo.postulacion_id || null,
        variables: nuevoCorreo.variables
      });
      if (res.data.success) setVistaPrevia(res.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const enviarCorreo = async () => {
    if (!nuevoCorreo.plantilla_id || !nuevoCorreo.candidato_id) {
      alert('Selecciona una plantilla y un candidato');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/correos/enviar`, {
        plantilla_id: nuevoCorreo.plantilla_id,
        candidato_id: nuevoCorreo.candidato_id,
        postulacion_id: nuevoCorreo.postulacion_id || null,
        variables: nuevoCorreo.variables
      });
      if (res.data.success) {
        alert('✅ Correo enviado exitosamente');
        cargarHistorial();
        setVistaPrevia(null);
        setNuevoCorreo({ plantilla_id: '', candidato_id: '', postulacion_id: '', variables: {} });
      } else {
        alert('❌ Error: ' + (res.data.error || 'Error desconocido'));
      }
    } catch (error) { alert('❌ Error al enviar'); }
    setLoading(false);
  };

  const abrirModalCrearPlantilla = () => {
    setEditandoPlantilla(false);
    setNuevaPlantilla({
      id: null,
      nombre: '',
      asunto: '',
      cuerpo: '',
      tipo: 'manual',
      variables: []
    });
    setModalPlantillaAbierto(true);
  };

  const abrirModalEditarPlantilla = (plantilla) => {
    setEditandoPlantilla(true);
    setNuevaPlantilla({
      id: plantilla.id,
      nombre: plantilla.nombre,
      asunto: plantilla.asunto,
      cuerpo: plantilla.cuerpo,
      tipo: plantilla.tipo || 'manual',
      variables: plantilla.variables || []
    });
    setModalPlantillaAbierto(true);
  };

  const guardarPlantilla = async () => {
    if (!nuevaPlantilla.nombre || !nuevaPlantilla.asunto || !nuevaPlantilla.cuerpo) {
      alert('Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/correos/plantilla`, nuevaPlantilla);
      if (res.data.success) {
        alert(editandoPlantilla ? '✅ Plantilla actualizada' : '✅ Plantilla creada');
        setModalPlantillaAbierto(false);
        cargarPlantillas();
      }
    } catch (error) { alert('❌ Error al guardar plantilla'); }
    setLoading(false);
  };

  const eliminarPlantilla = async (id) => {
    if (!window.confirm('¿Eliminar esta plantilla?')) return;
    try {
      await axios.delete(`${API_URL}/correos/plantilla/${id}`);
      alert('✅ Plantilla eliminada');
      cargarPlantillas();
    } catch (error) { alert('❌ Error al eliminar'); }
  };

  const agregarVariable = (varName) => {
    const key = varName.replace(/{{|}}/g, '');
    setNuevoCorreo({
      ...nuevoCorreo,
      variables: { ...nuevoCorreo.variables, [key]: '' }
    });
  };

  const actualizarVariable = (key, value) => {
    setNuevoCorreo({
      ...nuevoCorreo,
      variables: { ...nuevoCorreo.variables, [key]: value }
    });
  };

  const agregarVariablePlantilla = (varName) => {
    setNuevaPlantilla({
      ...nuevaPlantilla,
      cuerpo: nuevaPlantilla.cuerpo + ` ${varName} `
    });
  };

  const getCandidatoNombre = (id) => {
    const c = candidatos.find(c => c.id === id);
    if (!c) return 'Cargando...';
    try {
      const datos = typeof c.raw_data === 'string' ? JSON.parse(c.raw_data) : (c.raw_data || c);
      return datos.datos_crudos?.nombre || c.nombre || 'Sin nombre';
    } catch { return c.nombre || 'Sin nombre'; }
  };

  const escapeHtml = (text) => {
    if (!text) return '';
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Tarjeta principal con gradiente en borde */}
      <div className="card-flat" style={{ padding: 0, overflow: 'hidden', borderTop: '4px solid #3b82f6' }}>
        
        {/* Tabs con diseño mejorado */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          padding: '1rem 1.5rem 0 1.5rem', 
          borderBottom: '1px solid #e2e8f0', 
          background: 'white' 
        }}>
          <button
            onClick={() => setActiveTab('enviar')}
            style={{
              padding: '0.6rem 1.5rem',
              borderRadius: '12px 12px 0 0',
              border: 'none',
              background: activeTab === 'enviar' ? '#3b82f6' : 'transparent',
              color: activeTab === 'enviar' ? 'white' : '#64748b',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'enviar' ? '0 -2px 8px rgba(59,130,246,0.2)' : 'none'
            }}
          >
            📧 Enviar Correo
          </button>
          <button
            onClick={() => setActiveTab('plantillas')}
            style={{
              padding: '0.6rem 1.5rem',
              borderRadius: '12px 12px 0 0',
              border: 'none',
              background: activeTab === 'plantillas' ? '#3b82f6' : 'transparent',
              color: activeTab === 'plantillas' ? 'white' : '#64748b',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📋 Plantillas
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            style={{
              padding: '0.6rem 1.5rem',
              borderRadius: '12px 12px 0 0',
              border: 'none',
              background: activeTab === 'historial' ? '#3b82f6' : 'transparent',
              color: activeTab === 'historial' ? 'white' : '#64748b',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            📜 Historial
          </button>
        </div>

        {/* Panel Enviar Correo */}
        {activeTab === 'enviar' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)', 
              borderRadius: '16px', 
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.25rem' }}>Enviar Correo</h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Selecciona una plantilla y un candidato para enviar un correo personalizado</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>📋 Plantilla</label>
                <select
                  value={nuevoCorreo.plantilla_id}
                  onChange={(e) => setNuevoCorreo({...nuevoCorreo, plantilla_id: e.target.value, variables: {}})}
                  className="input-focus"
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.875rem', background: 'white' }}
                >
                  <option value="">Seleccionar plantilla...</option>
                  {plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>👤 Candidato</label>
                <select
                  value={nuevoCorreo.candidato_id}
                  onChange={(e) => setNuevoCorreo({...nuevoCorreo, candidato_id: e.target.value})}
                  className="input-focus"
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.875rem', background: 'white' }}
                >
                  <option value="">Seleccionar candidato...</option>
                  {candidatos.map(c => <option key={c.id} value={c.id}>{getCandidatoNombre(c.id)}</option>)}
                </select>
              </div>
            </div>

            {nuevoCorreo.plantilla_id && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>🔧 Variables personalizables</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {Object.keys(variablesDisponibles).map(varName => (
                    <button
                      key={varName}
                      onClick={() => agregarVariable(varName)}
                      style={{ background: '#f1f5f9', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    >
                      + {varName}
                    </button>
                  ))}
                </div>
                {Object.keys(nuevoCorreo.variables).length > 0 && (
                  <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', marginBottom: '0.75rem' }}>📝 VALORES PERSONALIZADOS</p>
                    {Object.entries(nuevoCorreo.variables).map(([key, value]) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, width: '120px', color: '#2563eb' }}>{`{{${key}}}`}</label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => actualizarVariable(key, e.target.value)}
                          placeholder={`Valor para ${key}`}
                          className="input-focus"
                          style={{ flex: 1, padding: '0.6rem 0.8rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.8rem' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button 
                onClick={obtenerVistaPrevia} 
                disabled={!nuevoCorreo.plantilla_id || !nuevoCorreo.candidato_id} 
                style={{ 
                  padding: '0.6rem 1.5rem', 
                  background: '#f1f5f9', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: 600, 
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: '#475569',
                  opacity: (!nuevoCorreo.plantilla_id || !nuevoCorreo.candidato_id) ? 0.5 : 1
                }}
              >
                👁️ Vista Previa
              </button>
              <button 
                onClick={enviarCorreo} 
                disabled={!nuevoCorreo.plantilla_id || !nuevoCorreo.candidato_id || loading} 
                style={{ 
                  padding: '0.6rem 1.5rem', 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: 600, 
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: 'white',
                  opacity: (!nuevoCorreo.plantilla_id || !nuevoCorreo.candidato_id || loading) ? 0.5 : 1,
                  boxShadow: '0 2px 8px rgba(59,130,246,0.3)'
                }}
              >
                {loading ? '⏳ Enviando...' : '📤 Enviar Correo'}
              </button>
            </div>

            {vistaPrevia && (
              <div className="card-flat" style={{ overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>🔍 Vista Previa</span>
                </div>
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>📨 Para:</span>
                    <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem', fontWeight: 500 }}>{vistaPrevia.to}</span>
                  </div>
                  <div style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>📌 Asunto:</span>
                    <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem', fontWeight: 600, color: '#1e293b' }}>{vistaPrevia.subject}</span>
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: vistaPrevia.body }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Panel Plantillas */}
        {activeTab === 'plantillas' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.25rem' }}>📋 Plantillas de Correo</h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Gestiona tus plantillas para enviar correos personalizados</p>
              </div>
              <button 
                onClick={abrirModalCrearPlantilla}
                style={{ 
                  padding: '0.6rem 1.25rem', 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: 600, 
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 6px rgba(59,130,246,0.3)'
                }}
              >
                ✨ Nueva Plantilla
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1rem' }}>
              {plantillas.map(p => (
                <div key={p.id} className="card-flat" style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '16px', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>{p.nombre}</h3>
                      <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Asunto: {p.asunto}</p>
                    </div>
                    <span className="badge" style={{ background: p.tipo === 'automatico' ? '#d1fae5' : '#dbeafe', color: p.tipo === 'automatico' ? '#065f46' : '#1e40af', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 600 }}>
                      {p.tipo === 'automatico' ? '🤖 Automático' : '✏️ Manual'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.5, marginBottom: '0.75rem' }} dangerouslySetInnerHTML={{ __html: p.cuerpo.substring(0, 100) + (p.cuerpo.length > 100 ? '...' : '') }} />
                  {p.variables?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.75rem' }}>
                      {p.variables.map(v => <span key={v} className="badge" style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.6rem', color: '#64748b' }}>{`{{${v}}}`}</span>)}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                    <button 
                      onClick={() => abrirModalEditarPlantilla(p)}
                      style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 500 }}
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      onClick={() => eliminarPlantilla(p.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 500 }}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {plantillas.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', gridColumn: '1/-1' }}>
                  <p>📭 No hay plantillas</p>
                  <button onClick={abrirModalCrearPlantilla} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    Crear primera plantilla
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Panel Historial */}
        {activeTab === 'historial' && (
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '1.25rem' }}>📜 Historial de Correos</h2>
            <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <table className="table-flat" style={{ width: '100%' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Fecha</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Destinatario</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Asunto</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{new Date(h.fecha_envio).toLocaleString()}</td>
                      <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{h.destinatario}</td>
                      <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{h.asunto}</td>
                      <td style={{ padding: '1rem' }}>
                        <span className="badge" style={{ background: h.estado === 'enviado' ? '#d1fae5' : '#fef3c7', color: h.estado === 'enviado' ? '#065f46' : '#92400e', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600 }}>
                          {h.estado === 'enviado' ? '✅ Enviado' : '⏳ Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {historial.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>📭 No hay correos enviados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PARA CREAR/EDITAR PLANTILLA */}
      {modalPlantillaAbierto && (
        <div className="modal-overlay" onClick={() => setModalPlantillaAbierto(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-glass" style={{ maxWidth: '700px', width: '90%', maxHeight: '85vh', overflow: 'auto', padding: '1.5rem', background: 'white' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>{editandoPlantilla ? '✏️ Editar Plantilla' : '✨ Nueva Plantilla'}</h3>
              <button onClick={() => setModalPlantillaAbierto(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Nombre de la plantilla</label>
              <input type="text" value={nuevaPlantilla.nombre} onChange={(e) => setNuevaPlantilla({...nuevaPlantilla, nombre: e.target.value})} className="input-focus" style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem' }} placeholder="Ej: Oferta de empleo" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Asunto</label>
              <input type="text" value={nuevaPlantilla.asunto} onChange={(e) => setNuevaPlantilla({...nuevaPlantilla, asunto: e.target.value})} className="input-focus" style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem' }} placeholder="Ej: Oferta de empleo - {{puesto}}" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Cuerpo del correo (HTML)</label>
              <textarea rows="8" value={nuevaPlantilla.cuerpo} onChange={(e) => setNuevaPlantilla({...nuevaPlantilla, cuerpo: e.target.value})} className="input-focus" style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.8rem', fontFamily: 'monospace' }} placeholder='<div><h1>Hola {{nombre}}</h1><p>Tu score es {{score}}%</p></div>' />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>📌 Variables disponibles</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {Object.keys(variablesDisponibles).map(varName => (
                  <button
                    key={varName}
                    onClick={() => agregarVariablePlantilla(varName)}
                    style={{ background: '#f1f5f9', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    {varName}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={() => setModalPlantillaAbierto(false)} style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={guardarPlantilla} disabled={loading} style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', border: 'none', borderRadius: '10px', cursor: 'pointer', color: 'white', fontWeight: 600 }}>{loading ? 'Guardando...' : (editandoPlantilla ? 'Actualizar' : 'Crear')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionCorreosPage;