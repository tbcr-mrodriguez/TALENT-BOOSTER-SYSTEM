import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const AdminEntrevistas = () => {
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [cargandoPlantilla, setCargandoPlantilla] = useState(false);
  
  // Formulario completo de plantilla
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'star',
    descripcion: '',
    objetivo: '',
    perfil_puesto: {
      titulo: '',
      seniority: '',
      requisitos: [],
      responsabilidades: []
    },
    cultura_empresa: {
      valores: [],
      ambiente: ''
    },
    fases: []
  });
  
  // Estados temporales para listas dinámicas
  const [tempRequisitos, setTempRequisitos] = useState([]);
  const [tempResponsabilidades, setTempResponsabilidades] = useState([]);
  const [tempValores, setTempValores] = useState([]);
  const [nuevoRequisito, setNuevoRequisito] = useState('');
  const [nuevaResponsabilidad, setNuevaResponsabilidad] = useState('');
  const [nuevoValor, setNuevoValor] = useState('');
  
  // Estados para preguntas
  const [preguntaActual, setPreguntaActual] = useState({
    fase: '',
    pregunta: '',
    objetivo: '',
    criterio_star: '',
    competencia: '',
    peso: 1,
    tiempo_maximo: 120
  });
  const [editandoPreguntaIdx, setEditandoPreguntaIdx] = useState(null);
  const [faseActual, setFaseActual] = useState('');

  useEffect(() => {
    cargarPlantillas();
  }, []);

  const cargarPlantillas = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/plantillas-v2`);
      if (res.data.success) {
        setPlantillas(res.data.plantillas);
      }
    } catch (error) {
      console.error('Error cargando plantillas:', error);
    }
    setLoading(false);
  };

  const cargarPlantillaParaEditar = async (id) => {
    setCargandoPlantilla(true);
    try {
      const res = await axios.get(`${API_URL}/admin/plantilla-v2/${id}`);
      if (res.data.success) {
        const p = res.data.plantilla;
        setFormData({
          nombre: p.nombre || '',
          tipo: p.tipo || 'star',
          descripcion: p.descripcion || '',
          objetivo: p.objetivo || '',
          perfil_puesto: p.perfil_puesto || { titulo: '', seniority: '', requisitos: [], responsabilidades: [] },
          cultura_empresa: p.cultura_empresa || { valores: [], ambiente: '' },
          fases: p.fases || []
        });
        setTempRequisitos(p.perfil_puesto?.requisitos || []);
        setTempResponsabilidades(p.perfil_puesto?.responsabilidades || []);
        setTempValores(p.cultura_empresa?.valores || []);
        setEditandoId(id);
        setModalAbierto(true);
      }
    } catch (error) {
      console.error('Error cargando plantilla:', error);
      alert('Error al cargar la plantilla');
    }
    setCargandoPlantilla(false);
  };

  const guardarPlantilla = async () => {
    if (!formData.nombre) {
      alert('El nombre de la plantilla es requerido');
      return;
    }
    
    const dataToSend = {
      ...formData,
      perfil_puesto: {
        ...formData.perfil_puesto,
        requisitos: tempRequisitos,
        responsabilidades: tempResponsabilidades
      },
      cultura_empresa: {
        ...formData.cultura_empresa,
        valores: tempValores
      }
    };
    
    setLoading(true);
    try {
      const url = editandoId ? `${API_URL}/admin/plantilla-v2/${editandoId}` : `${API_URL}/admin/plantilla-v2`;
      const method = editandoId ? 'put' : 'post';
      const res = await axios[method](url, dataToSend);
      if (res.data.success) {
        alert(editandoId ? 'Plantilla actualizada' : 'Plantilla creada');
        cerrarModal();
        cargarPlantillas();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar plantilla');
    }
    setLoading(false);
  };

  const eliminarPlantilla = async (id) => {
    if (!window.confirm('¿Eliminar esta plantilla?')) return;
    try {
      await axios.delete(`${API_URL}/admin/plantilla-v2/${id}`);
      alert('Plantilla eliminada');
      cargarPlantillas();
    } catch (error) {
      alert('Error al eliminar');
    }
  };

  const agregarFase = () => {
    const nombreFase = prompt('Nombre de la fase:');
    if (!nombreFase) return;
    const descripcion = prompt('Descripción de la fase:');
    setFormData({
      ...formData,
      fases: [...formData.fases, { nombre: nombreFase, descripcion: descripcion || '', preguntas: [] }]
    });
    setFaseActual(nombreFase);
  };

  const eliminarFase = (idx) => {
    const nuevasFases = formData.fases.filter((_, i) => i !== idx);
    setFormData({ ...formData, fases: nuevasFases });
  };

  const agregarPreguntaAFase = (faseIdx) => {
    if (!preguntaActual.pregunta) {
      alert('Ingresa la pregunta');
      return;
    }
    const nuevasFases = [...formData.fases];
    if (editandoPreguntaIdx !== null) {
      nuevasFases[faseIdx].preguntas[editandoPreguntaIdx] = { ...preguntaActual };
      setEditandoPreguntaIdx(null);
    } else {
      nuevasFases[faseIdx].preguntas.push({ ...preguntaActual });
    }
    setFormData({ ...formData, fases: nuevasFases });
    setPreguntaActual({
      fase: '',
      pregunta: '',
      objetivo: '',
      criterio_star: '',
      competencia: '',
      peso: 1,
      tiempo_maximo: 120
    });
  };

  const editarPregunta = (faseIdx, preguntaIdx) => {
    setPreguntaActual(formData.fases[faseIdx].preguntas[preguntaIdx]);
    setEditandoPreguntaIdx(preguntaIdx);
    setFaseActual(formData.fases[faseIdx].nombre);
  };

  const eliminarPregunta = (faseIdx, preguntaIdx) => {
    const nuevasFases = [...formData.fases];
    nuevasFases[faseIdx].preguntas = nuevasFases[faseIdx].preguntas.filter((_, i) => i !== preguntaIdx);
    setFormData({ ...formData, fases: nuevasFases });
  };

  const agregarItem = (lista, setLista, item) => {
    if (!item.trim()) return;
    setLista([...lista, item.trim()]);
    return '';
  };

  const eliminarItem = (lista, setLista, idx) => {
    setLista(lista.filter((_, i) => i !== idx));
  };

  const abrirModalCrear = () => {
    setEditandoId(null);
    setFormData({
      nombre: '',
      tipo: 'star',
      descripcion: '',
      objetivo: '',
      perfil_puesto: { titulo: '', seniority: '', requisitos: [], responsabilidades: [] },
      cultura_empresa: { valores: [], ambiente: '' },
      fases: []
    });
    setTempRequisitos([]);
    setTempResponsabilidades([]);
    setTempValores([]);
    setPreguntaActual({
      fase: '',
      pregunta: '',
      objetivo: '',
      criterio_star: '',
      competencia: '',
      peso: 1,
      tiempo_maximo: 120
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditandoId(null);
    setEditandoPreguntaIdx(null);
  };

  const getTipoLabel = (tipo) => {
    if (tipo === 'star') return 'STAR';
    if (tipo === 'tecnica') return 'Técnica';
    if (tipo === 'comportamental') return 'Comportamental';
    return 'General';
  };

  const getTipoColor = (tipo) => {
    if (tipo === 'star') return { bg: '#d1fae5', text: '#065f46' };
    if (tipo === 'tecnica') return { bg: '#dbeafe', text: '#1e40af' };
    if (tipo === 'comportamental') return { bg: '#fef3c7', text: '#92400e' };
    return { bg: '#f1f5f9', text: '#475569' };
  };

  const escapeHtml = (text) => {
    if (!text) return '';
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Tarjeta principal */}
      <div className="card-flat" style={{ padding: '1.5rem' }}>
        
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.25rem' }}>
              🎥 Administración de Entrevistas
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Gestiona las plantillas de entrevista con metodología STAR
            </p>
          </div>
          <button 
            onClick={abrirModalCrear}
            className="btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
          >
            + Nueva Plantilla
          </button>
        </div>

        {/* Grid de plantillas */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              border: '3px solid #e2e8f0', 
              borderTopColor: '#3b82f6', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px'
            }} />
            <p style={{ color: '#64748b' }}>Cargando plantillas...</p>
          </div>
        ) : plantillas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <p>📭 No hay plantillas de entrevista</p>
            <button onClick={abrirModalCrear} className="btn-primary" style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
              Crear primera plantilla
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
            {plantillas.map(plantilla => {
              const tipoStyle = getTipoColor(plantilla.tipo);
              return (
                <div key={plantilla.id} className="card-flat" style={{ 
                  padding: '1rem', 
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.25rem' }}>
                        {plantilla.nombre}
                      </h3>
                      <p style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {plantilla.descripcion?.substring(0, 60) || 'Sin descripción'}
                      </p>
                    </div>
                    <span className="badge" style={{ background: tipoStyle.bg, color: tipoStyle.text, padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '500' }}>
                      {getTipoLabel(plantilla.tipo)}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      📋 {plantilla.preguntas_count || 0} preguntas · {plantilla.fases_count || 1} fase(s)
                    </p>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #e2e8f0'
                  }}>
                    <button 
                      onClick={() => cargarPlantillaParaEditar(plantilla.id)}
                      className="btn-secondary"
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.7rem' }}
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      onClick={() => eliminarPlantilla(plantilla.id)}
                      className="btn-danger"
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.7rem' }}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para crear/editar plantilla - COMPLETO */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-glass" style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', overflow: 'auto', padding: '1.5rem', background: 'white' }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>
                {editandoId ? '✏️ Editar Plantilla' : '✨ Nueva Plantilla'}
              </h3>
              <button onClick={cerrarModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>
            
            {cargandoPlantilla ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando plantilla...</div>
            ) : (
              <>
                {/* Información básica */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.75rem' }}>📋 Información Básica</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Nombre *</label>
                      <input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Tipo</label>
                      <select value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})} className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem', background: 'white' }}>
                        <option value="star">STAR</option>
                        <option value="tecnica">Técnica</option>
                        <option value="comportamental">Comportamental</option>
                        <option value="generica">General</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Descripción</label>
                    <textarea value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} rows="2" className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem' }}></textarea>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Objetivo de la entrevista</label>
                    <textarea value={formData.objetivo} onChange={(e) => setFormData({...formData, objetivo: e.target.value})} rows="3" className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem' }} placeholder="¿Qué se busca evaluar con esta entrevista?"></textarea>
                  </div>
                </div>

                {/* Perfil del puesto */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.75rem' }}>🎯 Perfil del Puesto</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Título del puesto</label>
                      <input type="text" value={formData.perfil_puesto.titulo} onChange={(e) => setFormData({...formData, perfil_puesto: {...formData.perfil_puesto, titulo: e.target.value}})} className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Seniority</label>
                      <select value={formData.perfil_puesto.seniority} onChange={(e) => setFormData({...formData, perfil_puesto: {...formData.perfil_puesto, seniority: e.target.value}})} className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem', background: 'white' }}>
                        <option value="">Seleccione...</option>
                        <option value="Trainee">Trainee</option>
                        <option value="Junior">Junior</option>
                        <option value="Semi-Senior">Semi-Senior</option>
                        <option value="Senior">Senior</option>
                        <option value="Lead">Lead</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Requisitos */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Requisitos</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input type="text" value={nuevoRequisito} onChange={(e) => setNuevoRequisito(e.target.value)} className="input-focus" style={{ flex: 1, padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.75rem' }} placeholder="Ej: 5+ años de experiencia" />
                      <button onClick={() => { if(nuevoRequisito.trim()) { setTempRequisitos([...tempRequisitos, nuevoRequisito]); setNuevoRequisito(''); } }} className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem' }}>+</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {tempRequisitos.map((req, idx) => (
                        <span key={idx} className="badge" style={{ background: '#e0e7ff', color: '#1e40af', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          {req}
                          <button onClick={() => eliminarItem(tempRequisitos, setTempRequisitos, idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Responsabilidades */}
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Responsabilidades</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input type="text" value={nuevaResponsabilidad} onChange={(e) => setNuevaResponsabilidad(e.target.value)} className="input-focus" style={{ flex: 1, padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.75rem' }} placeholder="Ej: Liderar equipo de desarrollo" />
                      <button onClick={() => { if(nuevaResponsabilidad.trim()) { setTempResponsabilidades([...tempResponsabilidades, nuevaResponsabilidad]); setNuevaResponsabilidad(''); } }} className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem' }}>+</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {tempResponsabilidades.map((resp, idx) => (
                        <span key={idx} className="badge" style={{ background: '#d1fae5', color: '#065f46', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          {resp}
                          <button onClick={() => eliminarItem(tempResponsabilidades, setTempResponsabilidades, idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cultura de la empresa */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.75rem' }}>🏢 Cultura de la Empresa</h4>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Valores</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input type="text" value={nuevoValor} onChange={(e) => setNuevoValor(e.target.value)} className="input-focus" style={{ flex: 1, padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.75rem' }} placeholder="Ej: Innovación, Trabajo en equipo" />
                      <button onClick={() => { if(nuevoValor.trim()) { setTempValores([...tempValores, nuevoValor]); setNuevoValor(''); } }} className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem' }}>+</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {tempValores.map((val, idx) => (
                        <span key={idx} className="badge" style={{ background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          {val}
                          <button onClick={() => eliminarItem(tempValores, setTempValores, idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Ambiente de trabajo</label>
                    <textarea value={formData.cultura_empresa.ambiente} onChange={(e) => setFormData({...formData, cultura_empresa: {...formData.cultura_empresa, ambiente: e.target.value}})} rows="2" className="input-focus" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem' }} placeholder="Describe el ambiente laboral..."></textarea>
                  </div>
                </div>

                {/* Fases y Preguntas */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>📋 Fases y Preguntas</h4>
                    <button onClick={agregarFase} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.7rem' }}>+ Agregar Fase</button>
                  </div>
                  
                  {formData.fases.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.75rem' }}>No hay fases. Agrega una fase para comenzar.</p>
                  ) : (
                    formData.fases.map((fase, faseIdx) => (
                      <div key={faseIdx} style={{ marginBottom: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ padding: '0.75rem', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '0.85rem' }}>{fase.nombre}</strong>
                            {fase.descripcion && <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>{fase.descripcion}</p>}
                          </div>
                          <button onClick={() => eliminarFase(faseIdx)} className="btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.6rem' }}>Eliminar Fase</button>
                        </div>
                        
                        {/* Preguntas de la fase */}
                        <div style={{ padding: '0.75rem' }}>
                          {fase.preguntas.length > 0 && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              {fase.preguntas.map((preg, pregIdx) => (
                                <div key={pregIdx} style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                      <p style={{ fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.25rem' }}>{preg.pregunta}</p>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.65rem', color: '#64748b' }}>
                                        <span>🎯 {preg.competencia || 'General'}</span>
                                        <span>⏱️ {preg.tiempo_maximo}s</span>
                                        <span>⚖️ Peso: {preg.peso}</span>
                                        {preg.criterio_star && <span>⭐ STAR: {preg.criterio_star}</span>}
                                      </div>
                                      {preg.objetivo && <p style={{ fontSize: '0.65rem', color: '#475569', marginTop: '0.25rem' }}>📌 {preg.objetivo}</p>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                      <button onClick={() => editarPregunta(faseIdx, pregIdx)} className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.6rem' }}>✏️</button>
                                      <button onClick={() => eliminarPregunta(faseIdx, pregIdx)} className="btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.6rem' }}>🗑️</button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Formulario para agregar pregunta */}
                          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                              {editandoPreguntaIdx !== null ? '✏️ Editando pregunta' : '+ Agregar pregunta a esta fase'}
                            </p>
                            <div style={{ marginBottom: '0.5rem' }}>
                              <textarea
                                value={preguntaActual.pregunta}
                                onChange={(e) => setPreguntaActual({...preguntaActual, pregunta: e.target.value})}
                                placeholder="Escribe la pregunta..."
                                rows="2"
                                className="input-focus"
                                style={{ width: '100%', padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.75rem', marginBottom: '0.5rem' }}
                              />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <input type="text" value={preguntaActual.competencia} onChange={(e) => setPreguntaActual({...preguntaActual, competencia: e.target.value})} className="input-focus" style={{ padding: '0.3rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.7rem' }} placeholder="Competencia" />
                              <input type="number" value={preguntaActual.tiempo_maximo} onChange={(e) => setPreguntaActual({...preguntaActual, tiempo_maximo: parseInt(e.target.value)})} className="input-focus" style={{ padding: '0.3rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.7rem' }} placeholder="Tiempo (segundos)" />
                            </div>
                            <div style={{ marginBottom: '0.5rem' }}>
                              <input type="text" value={preguntaActual.criterio_star} onChange={(e) => setPreguntaActual({...preguntaActual, criterio_star: e.target.value})} className="input-focus" style={{ width: '100%', padding: '0.3rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.7rem' }} placeholder="Criterio STAR (opcional)" />
                            </div>
                            <div style={{ marginBottom: '0.5rem' }}>
                              <textarea
                                value={preguntaActual.objetivo}
                                onChange={(e) => setPreguntaActual({...preguntaActual, objetivo: e.target.value})}
                                placeholder="Objetivo de la pregunta (qué se busca evaluar)"
                                rows="2"
                                className="input-focus"
                                style={{ width: '100%', padding: '0.3rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.7rem' }}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => agregarPreguntaAFase(faseIdx)} className="btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem' }}>
                                {editandoPreguntaIdx !== null ? 'Actualizar Pregunta' : 'Agregar Pregunta'}
                              </button>
                              {editandoPreguntaIdx !== null && (
                                <button onClick={() => { setPreguntaActual({ fase: '', pregunta: '', objetivo: '', criterio_star: '', competencia: '', peso: 1, tiempo_maximo: 120 }); setEditandoPreguntaIdx(null); }} className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem' }}>Cancelar</button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Botones de acción */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                  <button onClick={guardarPlantilla} disabled={loading} className="btn-primary" style={{ flex: 1, padding: '0.5rem' }}>
                    {loading ? 'Guardando...' : (editandoId ? 'Actualizar Plantilla' : 'Crear Plantilla')}
                  </button>
                  <button onClick={cerrarModal} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Cancelar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEntrevistas;