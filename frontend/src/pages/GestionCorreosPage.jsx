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
    nombre: '',
    asunto: '',
    cuerpo: '',
    tipo: 'manual',
    variables: []
  });

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

  const crearPlantilla = async () => {
    if (!nuevaPlantilla.nombre || !nuevaPlantilla.asunto || !nuevaPlantilla.cuerpo) {
      alert('Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/correos/plantilla`, nuevaPlantilla);
      if (res.data.success) {
        alert('✅ Plantilla creada');
        setNuevaPlantilla({ nombre: '', asunto: '', cuerpo: '', tipo: 'manual', variables: [] });
        cargarPlantillas();
        setActiveTab('enviar');
      }
    } catch (error) { alert('❌ Error al crear plantilla'); }
    setLoading(false);
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

  const getCandidatoNombre = (id) => {
    const c = candidatos.find(c => c.id === id);
    if (!c) return 'Cargando...';
    try {
      const datos = typeof c.raw_data === 'string' ? JSON.parse(c.raw_data) : (c.raw_data || c);
      return datos.datos_crudos?.nombre || c.nombre || 'Sin nombre';
    } catch { return c.nombre || 'Sin nombre'; }
  };

  // Estilos modernos inline (idénticos al original)
  const styles = {
    container: {
      background: 'white',
      borderRadius: '24px',
      boxShadow: '0 20px 35px -8px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      border: '1px solid #f0f0f0'
    },
    tabContainer: {
      display: 'flex',
      gap: '8px',
      padding: '20px 24px 0 24px',
      background: 'white',
      borderBottom: '1px solid #eef2f6'
    },
    tab: (isActive) => ({
      padding: '12px 24px',
      fontSize: '0.9rem',
      fontWeight: 600,
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: isActive ? '#2563eb' : '#64748b',
      borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
      transition: 'all 0.2s',
      marginBottom: '-1px'
    }),
    panel: {
      padding: '32px'
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: '#0f172a',
      marginBottom: '24px',
      letterSpacing: '-0.02em'
    },
    grid2: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '24px',
      marginBottom: '28px'
    },
    label: {
      display: 'block',
      fontSize: '0.7rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: '#64748b',
      marginBottom: '8px'
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      border: '1.5px solid #e2e8f0',
      borderRadius: '12px',
      fontSize: '0.9rem',
      background: 'white',
      transition: 'all 0.2s'
    },
    card: {
      border: '1px solid #eef2f6',
      borderRadius: '20px',
      padding: '20px',
      marginBottom: '16px',
      transition: 'all 0.2s',
      cursor: 'pointer'
    },
    cardHover: {
      boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
      borderColor: '#2563eb'
    },
    badge: (type) => ({
      padding: '4px 12px',
      borderRadius: '100px',
      fontSize: '0.7rem',
      fontWeight: 600,
      background: type === 'automatico' ? '#dcfce7' : '#dbeafe',
      color: type === 'automatico' ? '#166534' : '#1e40af'
    }),
    buttonPrimary: {
      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      color: 'white',
      border: 'none',
      padding: '10px 24px',
      borderRadius: '12px',
      fontWeight: 600,
      fontSize: '0.85rem',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 2px 8px rgba(37,99,235,0.2)'
    },
    buttonSecondary: {
      background: '#f1f5f9',
      color: '#475569',
      border: 'none',
      padding: '10px 24px',
      borderRadius: '12px',
      fontWeight: 600,
      fontSize: '0.85rem',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      textAlign: 'left',
      padding: '16px 12px',
      fontSize: '0.7rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      color: '#64748b',
      borderBottom: '1px solid #eef2f6'
    },
    td: {
      padding: '16px 12px',
      fontSize: '0.85rem',
      color: '#1e293b',
      borderBottom: '1px solid #f1f5f9'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '1.5px solid #e2e8f0',
      borderRadius: '12px',
      fontSize: '0.9rem',
      transition: 'all 0.2s'
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      border: '1.5px solid #e2e8f0',
      borderRadius: '12px',
      fontSize: '0.85rem',
      fontFamily: 'monospace',
      lineHeight: '1.5',
      resize: 'vertical'
    }
  };

  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div style={styles.container}>
      {/* Tabs modernos */}
      <div style={styles.tabContainer}>
        <button style={styles.tab(activeTab === 'enviar')} onClick={() => setActiveTab('enviar')}>📧 Enviar Correo</button>
        <button style={styles.tab(activeTab === 'plantillas')} onClick={() => setActiveTab('plantillas')}>📋 Plantillas</button>
        <button style={styles.tab(activeTab === 'historial')} onClick={() => setActiveTab('historial')}>📜 Historial</button>
        <button style={styles.tab(activeTab === 'crear')} onClick={() => setActiveTab('crear')}>✨ Nueva Plantilla</button>
      </div>

      {/* Panel Enviar Correo */}
      {activeTab === 'enviar' && (
        <div style={styles.panel}>
          <h2 style={styles.title}>📧 Enviar Correo</h2>
          
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>📋 Plantilla</label>
              <select
                value={nuevoCorreo.plantilla_id}
                onChange={(e) => setNuevoCorreo({...nuevoCorreo, plantilla_id: e.target.value, variables: {}})}
                style={styles.select}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              >
                <option value="">Seleccionar plantilla...</option>
                {plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>👤 Candidato</label>
              <select
                value={nuevoCorreo.candidato_id}
                onChange={(e) => setNuevoCorreo({...nuevoCorreo, candidato_id: e.target.value})}
                style={styles.select}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              >
                <option value="">Seleccionar candidato...</option>
                {candidatos.map(c => <option key={c.id} value={c.id}>{getCandidatoNombre(c.id)}</option>)}
              </select>
            </div>
          </div>

          {nuevoCorreo.plantilla_id && (
            <div style={{ marginBottom: '28px' }}>
              <label style={styles.label}>🔧 Variables personalizables</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {Object.keys(variablesDisponibles).map(varName => (
                  <button
                    key={varName}
                    onClick={() => agregarVariable(varName)}
                    style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '20px', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    + {varName}
                  </button>
                ))}
              </div>
              {Object.keys(nuevoCorreo.variables).length > 0 && (
                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', border: '1px solid #eef2f6' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '16px' }}>VALORES PERSONALIZADOS</p>
                  {Object.entries(nuevoCorreo.variables).map(([key, value]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 500, width: '120px' }}>{`{{${key}}}`}</label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => actualizarVariable(key, e.target.value)}
                        placeholder={`Valor para ${key}`}
                        style={{ flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem' }}
                        onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
            <button onClick={obtenerVistaPrevia} disabled={!nuevoCorreo.plantilla_id || !nuevoCorreo.candidato_id} style={{ ...styles.buttonSecondary, opacity: (!nuevoCorreo.plantilla_id || !nuevoCorreo.candidato_id) ? 0.5 : 1 }}>👁️ Vista Previa</button>
            <button onClick={enviarCorreo} disabled={!nuevoCorreo.plantilla_id || !nuevoCorreo.candidato_id || loading} style={{ ...styles.buttonPrimary, opacity: (!nuevoCorreo.plantilla_id || !nuevoCorreo.candidato_id || loading) ? 0.5 : 1 }}>{loading ? '⏳ Enviando...' : '📤 Enviar Correo'}</button>
          </div>

          {vistaPrevia && (
            <div style={{ border: '1px solid #eef2f6', borderRadius: '20px', overflow: 'hidden' }}>
              <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #eef2f6' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b' }}>Vista Previa</span>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #eef2f6' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Para:</span>
                  <span style={{ fontSize: '0.85rem', marginLeft: '8px' }}>{vistaPrevia.to}</span>
                </div>
                <div style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #eef2f6' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Asunto:</span>
                  <span style={{ fontSize: '0.85rem', marginLeft: '8px', fontWeight: 600 }}>{vistaPrevia.subject}</span>
                </div>
                <div dangerouslySetInnerHTML={{ __html: vistaPrevia.body }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Panel Plantillas */}
      {activeTab === 'plantillas' && (
        <div style={styles.panel}>
          <h2 style={styles.title}>📋 Plantillas de Correo</h2>
          <div>
            {plantillas.map(p => (
              <div
                key={p.id}
                style={{ ...styles.card, ...(hoveredCard === p.id ? styles.cardHover : {}) }}
                onMouseEnter={() => setHoveredCard(p.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{p.nombre}</h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Asunto: {p.asunto}</p>
                  </div>
                  <span style={styles.badge(p.tipo)}>{p.tipo === 'automatico' ? '🤖 Automático' : '✏️ Manual'}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: p.cuerpo.substring(0, 120) + '...' }} />
                {p.variables?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                    {p.variables.map(v => <span key={v} style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem' }}>{'{{' + v + '}}'}</span>)}
                  </div>
                )}
              </div>
            ))}
            {plantillas.length === 0 && <p style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>No hay plantillas. Crea una nueva.</p>}
          </div>
        </div>
      )}

      {/* Panel Historial */}
      {activeTab === 'historial' && (
        <div style={styles.panel}>
          <h2 style={styles.title}>📜 Historial de Correos</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr><th style={styles.th}>Fecha</th><th style={styles.th}>Destinatario</th><th style={styles.th}>Asunto</th><th style={styles.th}>Estado</th></tr>
              </thead>
              <tbody>
                {historial.map(h => (
                  <tr key={h.id}>
                    <td style={styles.td}>{new Date(h.fecha_envio).toLocaleString()}</td>
                    <td style={styles.td}>{h.destinatario}</td>
                    <td style={styles.td}>{h.asunto}</td>
                    <td style={styles.td}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, background: h.estado === 'enviado' ? '#dcfce7' : '#fef3c7', color: h.estado === 'enviado' ? '#166534' : '#92400e' }}>
                        {h.estado === 'enviado' ? '✅ Enviado' : '⏳ Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
                {historial.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>No hay correos enviados</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Panel Crear Plantilla */}
      {activeTab === 'crear' && (
        <div style={styles.panel}>
          <h2 style={styles.title}>✨ Crear Nueva Plantilla</h2>
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>Nombre de la plantilla</label>
            <input type="text" value={nuevaPlantilla.nombre} onChange={(e) => setNuevaPlantilla({...nuevaPlantilla, nombre: e.target.value})} style={styles.input} placeholder="Ej: Oferta de empleo" />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>Asunto</label>
            <input type="text" value={nuevaPlantilla.asunto} onChange={(e) => setNuevaPlantilla({...nuevaPlantilla, asunto: e.target.value})} style={styles.input} placeholder="Ej: Oferta de empleo - {{puesto}}" />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>Cuerpo del correo (HTML)</label>
            <textarea rows="10" value={nuevaPlantilla.cuerpo} onChange={(e) => setNuevaPlantilla({...nuevaPlantilla, cuerpo: e.target.value})} style={styles.textarea} placeholder='<div><h1>Hola {{nombre}}</h1><p>Tu score es {{score}}%</p></div>' />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={styles.label}>📌 Variables disponibles</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {Object.keys(variablesDisponibles).map(varName => (
                <button key={varName} onClick={() => { const ta = document.querySelector('textarea'); if (ta) { ta.value += ` ${varName} `; setNuevaPlantilla({...nuevaPlantilla, cuerpo: ta.value}); } }} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '20px', fontSize: '0.7rem', cursor: 'pointer' }}>{varName}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setActiveTab('plantillas')} style={styles.buttonSecondary}>Cancelar</button>
            <button onClick={crearPlantilla} disabled={loading} style={{ ...styles.buttonPrimary, opacity: loading ? 0.5 : 1 }}>{loading ? 'Creando...' : '✨ Crear Plantilla'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionCorreosPage;
