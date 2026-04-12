import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import FichaCandidato from '../components/FichaCandidato';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const safeParseRawData = (data) => {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch(e) {
      console.error('Error parsing raw_data:', e);
      return {};
    }
  }
  return data;
};

const HeadhunterIA = () => {
  const [mensajesAsistente, setMensajesAsistente] = useState([
    { 
      tipo: 'asistente', 
      texto: '🎯 **Hola, soy tu headhunter personal.**\n\nPuedes preguntarme cosas como:\n• "¿Hay programadores en Cartago?"\n• "Recomiéndame el mejor desarrollador Java"\n• "Gente con experiencia en bancos"\n• "Cuántos perfiles senior tienes?"' 
    }
  ]);
  const [preguntaAsistente, setPreguntaAsistente] = useState('');
  const [asistentePensando, setAsistentePensando] = useState(false);
  const mensajesRef = useRef(null);
  
  const [globalData, setGlobalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    nombre: '',
    sector: '',
    experiencia: '',
    seniority: '',
    perfil: '',
    skills: '',
    score: ''
  });

  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  }, [mensajesAsistente]);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/candidates`);
      if (res.data.success) {
        setGlobalData(res.data.data);
      }
    } catch (error) {
      console.error('Error cargando candidatos:', error);
    }
    setLoading(false);
  };

  const deducirSeniority = (experiencia) => {
    if (!experiencia || experiencia === "No se pudo inferir") return "No determinado";
    const expStr = experiencia.toString().toLowerCase();
    const match = expStr.match(/(\d+)/);
    if (match) {
      let años = parseInt(match[0]);
      if (años >= 8) return "Senior";
      if (años >= 4) return "Semi-Senior";
      if (años >= 1) return "Junior";
    }
    return "Trainee";
  };

  const filtrarCandidatos = (candidato) => {
    let datos = candidato;
    if (candidato.raw_data) {
      datos = safeParseRawData(candidato.raw_data);
    }
    
    const nombre = (datos.datos_crudos?.nombre || candidato.nombre || '').toLowerCase();
    const sector = (datos.interpretacion?.sector_deducido || candidato.sector_principal || '').toLowerCase();
    const experiencia = (datos.interpretacion?.anos_experiencia_deducidos || candidato.anos_experiencia || '').toLowerCase();
    const seniority = (datos.interpretacion?.seniority || '').toLowerCase();
    const perfil = (datos.interpretacion?.perfil_interpretado || candidato.perfil_profesional || '').toLowerCase();
    const habilidades = (datos.interpretacion?.habilidades_clave || candidato.habilidades || []).join(' ').toLowerCase();
    const score = datos.score || candidato.score || 0;

    if (filters.nombre && !nombre.includes(filters.nombre.toLowerCase())) return false;
    if (filters.sector && !sector.includes(filters.sector.toLowerCase())) return false;
    if (filters.experiencia && !experiencia.includes(filters.experiencia.toLowerCase())) return false;
    if (filters.seniority && !seniority.includes(filters.seniority.toLowerCase())) return false;
    if (filters.perfil && !perfil.includes(filters.perfil.toLowerCase())) return false;
    if (filters.skills && !habilidades.includes(filters.skills.toLowerCase())) return false;
    if (filters.score) {
      const scoreNum = parseInt(filters.score);
      if (!isNaN(scoreNum) && score < scoreNum) return false;
    }

    return true;
  };

  const verFicha = (candidato) => {
    const candidatoConDatos = {
      ...candidato,
      _parsed: safeParseRawData(candidato.raw_data),
      id: candidato.id,
      archivo: candidato.archivo
    };
    setSelectedCandidate(candidatoConDatos);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setSelectedCandidate(null);
  };

  const enviarPregunta = async () => {
    if (!preguntaAsistente.trim()) return;
    
    setMensajesAsistente(prev => [...prev, { tipo: 'usuario', texto: preguntaAsistente }]);
    setAsistentePensando(true);
    
    try {
      const res = await axios.post(`${API_URL}/asistente`, {
        mensaje: preguntaAsistente
      });
      
      if (res.data.success) {
        setMensajesAsistente(prev => [...prev, { tipo: 'asistente', texto: res.data.respuesta }]);
      } else {
        setMensajesAsistente(prev => [...prev, { 
          tipo: 'asistente', 
          texto: 'Lo siento, tuve un problema procesando tu pregunta. ¿Puedes intentar de nuevo?' 
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMensajesAsistente(prev => [...prev, { 
        tipo: 'asistente', 
        texto: 'Error de conexión. Por favor, intenta de nuevo.' 
      }]);
    }
    
    setAsistentePensando(false);
    setPreguntaAsistente('');
  };

  const limpiarFiltros = () => {
    setFilters({
      nombre: '',
      sector: '',
      experiencia: '',
      seniority: '',
      perfil: '',
      skills: '',
      score: ''
    });
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ==================== HEADHUNTER IA - CHAT ==================== */}
      <div className="card-flat" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
            🤵 Headhunter IA
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>
            Pregúntame sobre los candidatos en tu pipeline
          </p>
        </div>

        {/* Chat container - Fondo gris suave */}
        <div style={{ 
          height: '320px', 
          overflow: 'auto',
          marginBottom: '1rem',
          background: '#f8fafc',
          borderRadius: '16px',
          padding: '1rem'
        }}>
          <div ref={mensajesRef}>
            {mensajesAsistente.map((msg, idx) => (
              <div key={idx} style={{
                marginBottom: '1rem',
                textAlign: msg.tipo === 'usuario' ? 'right' : 'left'
              }}>
                <div style={{
                  display: 'inline-block',
                  background: msg.tipo === 'usuario' ? '#3b82f6' : '#e2e8f0',
                  color: msg.tipo === 'usuario' ? 'white' : '#1e293b',
                  padding: '0.75rem 1rem',
                  borderRadius: '16px',
                  maxWidth: '80%',
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.875rem',
                  lineHeight: 1.5
                }}>
                  {msg.texto}
                </div>
              </div>
            ))}
            {asistentePensando && (
              <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                <div style={{
                  display: 'inline-block',
                  background: '#e2e8f0',
                  color: '#1e293b',
                  padding: '0.75rem 1rem',
                  borderRadius: '16px'
                }}>
                  <span className="spinner" style={{ marginRight: '8px', display: 'inline-block' }}></span>
                  Pensando...
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Input del chat */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            className="input-focus"
            placeholder="Pregúntame sobre los candidatos..."
            value={preguntaAsistente}
            onChange={(e) => setPreguntaAsistente(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && enviarPregunta()}
            disabled={asistentePensando}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'all 0.2s'
            }}
          />
          <button 
            className="btn-primary"
            onClick={enviarPregunta}
            disabled={asistentePensando || !preguntaAsistente.trim()}
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Enviar
          </button>
        </div>
      </div>

      {/* ==================== PIPELINE DE TALENTO ==================== */}
      <div className="card-flat" style={{ padding: '1.5rem' }}>
        
        {/* Header con acciones */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
            📋 Pipeline de Talento
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={loadCandidates} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
              🔄 Actualizar
            </button>
            <button onClick={limpiarFiltros} className="btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
              ✕ Limpiar filtros
            </button>
          </div>
        </div>

        {/* Filtros - Fondo gris suave */}
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          marginBottom: '1.5rem', 
          flexWrap: 'wrap',
          padding: '1rem',
          background: '#f8fafc',
          borderRadius: '12px'
        }}>
          <input
            type="text"
            placeholder="Nombre..."
            value={filters.nombre}
            onChange={(e) => setFilters({...filters, nombre: e.target.value})}
            className="input-focus"
            style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', width: '110px', fontSize: '0.75rem' }}
          />
          <input
            type="text"
            placeholder="Sector..."
            value={filters.sector}
            onChange={(e) => setFilters({...filters, sector: e.target.value})}
            className="input-focus"
            style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', width: '110px', fontSize: '0.75rem' }}
          />
          <input
            type="text"
            placeholder="Experiencia..."
            value={filters.experiencia}
            onChange={(e) => setFilters({...filters, experiencia: e.target.value})}
            className="input-focus"
            style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', width: '110px', fontSize: '0.75rem' }}
          />
          <select
            value={filters.seniority}
            onChange={(e) => setFilters({...filters, seniority: e.target.value})}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', width: '100px', fontSize: '0.75rem', background: 'white' }}
          >
            <option value="">Seniority</option>
            <option value="senior">Senior</option>
            <option value="semi-senior">Semi-Senior</option>
            <option value="junior">Junior</option>
            <option value="trainee">Trainee</option>
          </select>
          <input
            type="text"
            placeholder="Perfil..."
            value={filters.perfil}
            onChange={(e) => setFilters({...filters, perfil: e.target.value})}
            className="input-focus"
            style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', width: '110px', fontSize: '0.75rem' }}
          />
          <input
            type="text"
            placeholder="Skills..."
            value={filters.skills}
            onChange={(e) => setFilters({...filters, skills: e.target.value})}
            className="input-focus"
            style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', width: '110px', fontSize: '0.75rem' }}
          />
          <input
            type="number"
            placeholder="Score mín."
            value={filters.score}
            onChange={(e) => setFilters({...filters, score: e.target.value})}
            className="input-focus"
            style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', width: '90px', fontSize: '0.75rem' }}
          />
        </div>

        {/* Tabla de candidatos - Estilo Flat */}
{/* Tabla de candidatos - Compacta y sin desborde */}
<div style={{ overflowX: 'auto', width: '100%' }}>
  <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse' }}>
    <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
      <tr>
        <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>Nombre</th>
        <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>Sector / Seniority</th>
        <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>Experiencia</th>
        <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>Skills</th>
        <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>Score</th>
        <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>Acción</th>
      </tr>
    </thead>
    <tbody>
      {loading ? (
        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</td></tr>
      ) : globalData.filter(filtrarCandidatos).length === 0 ? (
        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No hay candidatos</td></tr>
      ) : (
        globalData.filter(filtrarCandidatos).map((candidato, idx) => {
          let datos = candidato;
          if (candidato.raw_data) {
            datos = safeParseRawData(candidato.raw_data);
          }
          const nombre = datos.datos_crudos?.nombre || candidato.nombre || '—';
          const sector = datos.interpretacion?.sector_deducido || candidato.sector_principal || '—';
          const experiencia = datos.interpretacion?.anos_experiencia_deducidos || candidato.anos_experiencia || '—';
          const seniority = datos.interpretacion?.seniority || deducirSeniority(experiencia);
          const habilidades = datos.interpretacion?.habilidades_clave || candidato.habilidades || [];
          const score = datos.score || candidato.score || 0;
          
          let scoreColor = '#dc2626';
          if (score >= 80) scoreColor = '#16a34a';
          else if (score >= 60) scoreColor = '#2563eb';
          else if (score >= 40) scoreColor = '#ca8a04';

          return (
            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px 8px', fontSize: '0.8rem', fontWeight: '500' }}>{nombre}</td>
              <td style={{ padding: '10px 8px' }}>
                <div>
                  <span style={{ background: '#e0e7ff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem' }}>{sector}</span>
                  <span style={{ 
                    marginLeft: '6px',
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    fontSize: '0.7rem',
                    background: seniority === 'Senior' ? '#d1fae5' : seniority === 'Semi-Senior' ? '#dbeafe' : seniority === 'Junior' ? '#fef3c7' : '#f3f4f6',
                    color: seniority === 'Senior' ? '#065f46' : seniority === 'Semi-Senior' ? '#1e40af' : seniority === 'Junior' ? '#92400e' : '#374151'
                  }}>
                    {seniority}
                  </span>
                </div>
              </td>
              <td style={{ padding: '10px 8px', fontSize: '0.8rem', color: '#475569' }}>{experiencia}</td>
              <td style={{ padding: '10px 8px' }}>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {habilidades.slice(0, 2).map((s, i) => (
                    <span key={i} style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>{s}</span>
                  ))}
                  {habilidades.length > 2 && (
                    <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>+{habilidades.length-2}</span>
                  )}
                </div>
              </td>
              <td style={{ padding: '10px 8px' }}>
                <span style={{ background: scoreColor, color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                  {score}
                </span>
              </td>
              <td style={{ padding: '10px 8px' }}>
                <button onClick={() => verFicha(candidato)} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.7rem', cursor: 'pointer' }}>
                  Ver
                </button>
              </td>
            </tr>
          );
        })
      )}
    </tbody>
  </table>
</div>
      </div>

      {/* Modal Ficha del Candidato */}
      {modalOpen && selectedCandidate && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div onClick={(e) => e.stopPropagation()}>
            <FichaCandidato 
              candidato={selectedCandidate}
              onClose={cerrarModal}
              API_URL={API_URL}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HeadhunterIA;