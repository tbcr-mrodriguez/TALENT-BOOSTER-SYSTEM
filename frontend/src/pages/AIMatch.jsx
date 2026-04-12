import React, { useState } from 'react';
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

const AIMatch = () => {
  const [matchDescripcion, setMatchDescripcion] = useState('');
  const [matchTitulo, setMatchTitulo] = useState('');
  const [matchResultados, setMatchResultados] = useState([]);
  const [matchCargando, setMatchCargando] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const verFicha = (candidato) => {
    const candidatoConDatos = {
      ...candidato,
      _parsed: safeParseRawData(candidato.raw_data)
    };
    setSelectedCandidate(candidatoConDatos);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setSelectedCandidate(null);
  };

  const buscarMatches = async () => {
    if (!matchDescripcion.trim()) {
      alert('Escribe la descripción del empleo');
      return;
    }

    setMatchCargando(true);

    try {
      const res = await axios.post(`${API_URL}/match-empleo`, {
        titulo: matchTitulo || 'Posición',
        descripcion: matchDescripcion,
        cantidad: 12
      });

      if (res.data.success) {
        setMatchResultados(res.data.candidatos);
      } else {
        alert('Error: ' + res.data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error buscando matches');
    }
    setMatchCargando(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return { bg: '#d1fae5', text: '#065f46' };
    if (score >= 60) return { bg: '#dbeafe', text: '#1e40af' };
    if (score >= 40) return { bg: '#fed7aa', text: '#9a3412' };
    return { bg: '#fee2e2', text: '#991b1b' };
  };

  const getSeniorityColor = (seniority) => {
    if (seniority === 'Senior') return { bg: '#d1fae5', text: '#065f46' };
    if (seniority === 'Semi-Senior') return { bg: '#dbeafe', text: '#1e40af' };
    if (seniority === 'Junior') return { bg: '#fef3c7', text: '#92400e' };
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
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.25rem' }}>
            🎯 AI Match
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Describe el puesto y nuestra IA encontrará los mejores candidatos
          </p>
        </div>

        {/* Formulario de búsqueda */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Título del puesto (ej: Desarrollador Senior)"
            value={matchTitulo}
            onChange={(e) => setMatchTitulo(e.target.value)}
            className="input-focus"
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.75rem 1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '0.875rem'
            }}
          />
          <textarea
            placeholder="Describe las responsabilidades, requisitos y habilidades necesarias..."
            value={matchDescripcion}
            onChange={(e) => setMatchDescripcion(e.target.value)}
            rows={3}
            className="input-focus"
            style={{
              flex: 2,
              padding: '0.75rem 1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
          <button
            onClick={buscarMatches}
            disabled={matchCargando}
            className="btn-primary"
            style={{
              padding: '0.75rem 1.5rem',
              whiteSpace: 'nowrap',
              opacity: matchCargando ? 0.7 : 1
            }}
          >
            {matchCargando ? 'Buscando...' : 'Buscar matches'}
          </button>
        </div>

        {/* Resultados */}
        {matchResultados.length > 0 && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                Mejores candidatos ({matchResultados.length})
              </h3>
              <span className="badge" style={{ background: '#e0e7ff', color: '#1e40af', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.7rem' }}>
                Ordenados por match score
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1rem'
            }}>
              {matchResultados.map((candidato, index) => {
                let datos = candidato;
                if (candidato.raw_data) {
                  datos = safeParseRawData(candidato.raw_data);
                }
                
                const nombre = datos.datos_crudos?.nombre || candidato.nombre || 'Candidato';
                const profesion = datos.datos_crudos?.profesion_escrita || candidato.profesion || '';
                const ubicacion = datos.datos_crudos?.ubicacion || candidato.ubicacion || 'No especificada';
                const experiencia = datos.interpretacion?.anos_experiencia_deducidos || candidato.anos_experiencia || 'N/A';
                const seniority = datos.interpretacion?.seniority || 'N/A';
                const habilidades = datos.interpretacion?.habilidades_clave || candidato.habilidades || [];
                const matchScore = candidato.match_score || candidato.similitud_semantica || 0;
                const scoreStyle = getScoreColor(matchScore);
                const seniorityStyle = getSeniorityColor(seniority);

                return (
                  <div
                    key={index}
                    className="card-flat"
                    onClick={() => verFicha(candidato)}
                    style={{
                      padding: '1rem',
                      cursor: 'pointer',
                      border: '1px solid #e2e8f0',
                      position: 'relative',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    {/* Score badge */}
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      background: scoreStyle.bg,
                      color: scoreStyle.text,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '20px',
                      fontSize: '0.65rem',
                      fontWeight: '600'
                    }}>
                      {matchScore}% match
                    </div>

                    {/* Nombre y profesión */}
                    <div style={{ marginBottom: '0.75rem', paddingRight: '60px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.25rem' }}>
                        {nombre}
                      </h3>
                      <p style={{ color: '#3b82f6', fontWeight: '500', fontSize: '0.75rem' }}>
                        {profesion}
                      </p>
                    </div>

                    {/* Badges */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      <span className="badge" style={{ background: seniorityStyle.bg, color: seniorityStyle.text, padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '500' }}>
                        {seniority}
                      </span>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '500' }}>
                        📍 {ubicacion}
                      </span>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '500' }}>
                        ⏱️ {experiencia}
                      </span>
                    </div>

                    {/* Habilidades */}
                    <div style={{ marginTop: '0.5rem' }}>
                      <p style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.25rem' }}>
                        Habilidades clave:
                      </p>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {habilidades.slice(0, 4).map((skill, i) => (
                          <span key={i} className="badge" style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.6rem' }}>
                            {skill}
                          </span>
                        ))}
                        {habilidades.length > 4 && (
                          <span className="badge" style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.6rem' }}>
                            +{habilidades.length - 4}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer de la tarjeta */}
                    <div style={{
                      marginTop: '0.75rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.65rem',
                      color: '#64748b'
                    }}>
                      <span>🎯 Match score</span>
                      <span style={{ fontWeight: '700', color: scoreStyle.text }}>{matchScore}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay resultados */}
        {matchResultados.length === 0 && !matchCargando && matchDescripcion && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <p>No se encontraron candidatos que coincidan con esta búsqueda.</p>
            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Intenta con una descripción más detallada.</p>
          </div>
        )}
      </div>

      {/* Modal Ficha del Candidato */}
      {modalOpen && selectedCandidate && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div onClick={(e) => e.stopPropagation()}>
            <FichaCandidato 
              candidato={{
                ...selectedCandidate,
                _parsed: selectedCandidate._parsed,
                id: selectedCandidate.id,
                archivo: selectedCandidate.archivo
              }}
              onClose={cerrarModal}
              API_URL={API_URL}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AIMatch;