import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import FichaCandidato from '../components/FichaCandidato';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Función segura para parsear raw_data
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
  
  // Estados para candidatos
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

  // Auto-scroll para el asistente
  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  }, [mensajesAsistente]);

  // Cargar candidatos al inicio
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

  // Función para limpiar filtros
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
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: '2rem',
      height: 'calc(100vh - 100px)',
      overflow: 'auto'
    }}>
      {/* Sección del Headhunter IA */}
      <div style={{ 
        background: 'white', 
        borderRadius: '24px',
        padding: '1.5rem',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1a1a1a' }}>
            🤵 Headhunter IA
          </h2>
          <p style={{ color: '#666' }}>Pregúntame sobre los candidatos en tu pipeline</p>
        </div>

        <div style={{ 
          height: '300px', 
          overflow: 'auto',
          marginBottom: '1rem',
          background: '#f9fafb',
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
                  background: msg.tipo === 'usuario' ? '#553BC4' : '#e5e7eb',
                  color: msg.tipo === 'usuario' ? 'white' : '#1f2937',
                  padding: '0.75rem 1rem',
                  borderRadius: '16px',
                  maxWidth: '80%',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.texto}
                </div>
              </div>
            ))}
            {asistentePensando && (
              <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                <div style={{
                  display: 'inline-block',
                  background: '#e5e7eb',
                  color: '#1f2937',
                  padding: '0.75rem 1rem',
                  borderRadius: '16px'
                }}>
                  Pensando...
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Pregúntame sobre los candidatos..."
            value={preguntaAsistente}
            onChange={(e) => setPreguntaAsistente(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && enviarPregunta()}
            disabled={asistentePensando}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          <button 
            onClick={enviarPregunta}
            disabled={asistentePensando || !preguntaAsistente.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#553BC4',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: (asistentePensando || !preguntaAsistente.trim()) ? 'not-allowed' : 'pointer',
              opacity: (asistentePensando || !preguntaAsistente.trim()) ? 0.7 : 1
            }}
          >
            Enviar
          </button>
        </div>
      </div>

      {/* Sección de Pipeline de Talento - CON TODAS LAS COLUMNAS ORIGINALES */}
      <div style={{ 
        background: 'white', 
        borderRadius: '24px',
        padding: '1.5rem',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1a1a1a' }}>
            📋 Pipeline de Talento
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={loadCandidates} style={{
              padding: '0.5rem 1rem',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              🔄 Actualizar
            </button>
            <button onClick={limpiarFiltros} style={{
              padding: '0.5rem 1rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              ✕ Limpiar filtros
            </button>
          </div>
        </div>

        {/* Filtros por columna - como en el original */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginBottom: '1rem', 
          flexWrap: 'wrap',
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '12px',
          fontSize: '0.8rem'
        }}>
          <input
            type="text"
            placeholder="Filtrar nombre..."
            value={filters.nombre}
            onChange={(e) => setFilters({...filters, nombre: e.target.value})}
            style={{ padding: '0.4rem', border: '1px solid #e5e7eb', borderRadius: '6px', width: '120px', fontSize: '0.8rem' }}
          />
          <input
            type="text"
            placeholder="Filtrar sector..."
            value={filters.sector}
            onChange={(e) => setFilters({...filters, sector: e.target.value})}
            style={{ padding: '0.4rem', border: '1px solid #e5e7eb', borderRadius: '6px', width: '120px', fontSize: '0.8rem' }}
          />
          <input
            type="text"
            placeholder="Filtrar experiencia..."
            value={filters.experiencia}
            onChange={(e) => setFilters({...filters, experiencia: e.target.value})}
            style={{ padding: '0.4rem', border: '1px solid #e5e7eb', borderRadius: '6px', width: '120px', fontSize: '0.8rem' }}
          />
          <select
            value={filters.seniority}
            onChange={(e) => setFilters({...filters, seniority: e.target.value})}
            style={{ padding: '0.4rem', border: '1px solid #e5e7eb', borderRadius: '6px', width: '110px', fontSize: '0.8rem' }}
          >
            <option value="">Seniority</option>
            <option value="senior">Senior</option>
            <option value="semi-senior">Semi-Senior</option>
            <option value="junior">Junior</option>
            <option value="trainee">Trainee</option>
          </select>
          <input
            type="text"
            placeholder="Filtrar perfil..."
            value={filters.perfil}
            onChange={(e) => setFilters({...filters, perfil: e.target.value})}
            style={{ padding: '0.4rem', border: '1px solid #e5e7eb', borderRadius: '6px', width: '120px', fontSize: '0.8rem' }}
          />
          <input
            type="text"
            placeholder="Filtrar skills..."
            value={filters.skills}
            onChange={(e) => setFilters({...filters, skills: e.target.value})}
            style={{ padding: '0.4rem', border: '1px solid #e5e7eb', borderRadius: '6px', width: '120px', fontSize: '0.8rem' }}
          />
          <input
            type="number"
            placeholder="Score mínimo"
            value={filters.score}
            onChange={(e) => setFilters({...filters, score: e.target.value})}
            style={{ padding: '0.4rem', border: '1px solid #e5e7eb', borderRadius: '6px', width: '100px', fontSize: '0.8rem' }}
          />
        </div>

        {/* Tabla de candidatos - CON TODAS LAS COLUMNAS ORIGINALES */}
        <div style={{ overflow: 'auto', maxHeight: '400px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'white', borderBottom: '2px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left' }}>Nombre</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Sector</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Experiencia</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Seniority</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Perfil</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Skills</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Score</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ padding: '40px', textAlign: 'center' }}>Cargando candidatos...</td></tr>
              ) : globalData.filter(filtrarCandidatos).length === 0 ? (
                <tr><td colSpan="8" style={{ padding: '40px', textAlign: 'center' }}>No hay candidatos</td></tr>
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
                  const perfil = datos.interpretacion?.perfil_interpretado || candidato.perfil_profesional || '—';
                  const habilidades = datos.interpretacion?.habilidades_clave || candidato.habilidades || [];
                  const score = datos.score || candidato.score || 0;
                  
                  let scoreColor = '#dc2626';
                  if (score >= 80) scoreColor = '#16a34a';
                  else if (score >= 60) scoreColor = '#2563eb';
                  else if (score >= 40) scoreColor = '#ca8a04';

                  let seniorityClass = 'badge-trainee';
                  if (seniority === 'Senior') seniorityClass = 'badge-senior';
                  else if (seniority === 'Semi-Senior') seniorityClass = 'badge-semi';
                  else if (seniority === 'Junior') seniorityClass = 'badge-junior';

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{nombre}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: '#f0edfe', padding: '4px 8px', borderRadius: '20px', fontSize: '12px' }}>{sector}</span>
                      </td>
                      <td style={{ padding: '12px' }}>{experiencia}</td>
                      <td style={{ padding: '12px' }}>
                        <span className={`badge ${seniorityClass}`} style={{ padding: '4px 8px', borderRadius: '20px', fontSize: '12px' }}>
                          {seniority}
                        </span>
                      </td>
                      <td style={{ padding: '12px', maxWidth: '200px' }}>
                        <div style={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          maxWidth: '200px'
                        }}>
                          {typeof perfil === 'string' ? perfil.substring(0, 60) : '—'}
                          {(typeof perfil === 'string' && perfil.length > 60) ? '...' : ''}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {habilidades.slice(0, 2).map((s, i) => (
                            <span key={i} style={{ background: '#e5e7eb', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>{s}</span>
                          ))}
                          {habilidades.length > 2 && (
                            <span style={{ background: '#e5e7eb', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>+{habilidades.length-2}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          background: scoreColor, 
                          color: 'white', 
                          padding: '4px 8px', 
                          borderRadius: '20px', 
                          fontSize: '12px', 
                          fontWeight: 'bold' 
                        }}>
                          {score}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button 
                          onClick={() => verFicha(candidato)}
                          style={{ 
                            padding: '6px 12px', 
                            background: '#553BC4', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
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
        <div className="modal-overlay" onClick={cerrarModal} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <FichaCandidato 
            candidato={selectedCandidate}
            onClose={cerrarModal}
            API_URL={API_URL}
          />
        </div>
      )}
    </div>
  );
};

export default HeadhunterIA;
