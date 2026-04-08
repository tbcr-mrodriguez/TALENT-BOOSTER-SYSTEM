import React, { useState } from 'react';
import axios from 'axios';

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

  return (
    <div style={{
      background: 'white',
      borderRadius: '24px',
      padding: '2rem',
      margin: '0',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1a1a1a' }}>
            🎯 AI Match
          </h2>
          <p style={{ color: '#666' }}>Describa el puesto y nuestra IA encontrará los mejores candidatos</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Título del puesto (ej: Desarrollador Senior)"
          value={matchTitulo}
          onChange={(e) => setMatchTitulo(e.target.value)}
          style={{
            flex: 1,
            minWidth: '250px',
            padding: '1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            fontSize: '1rem'
          }}
        />
        <textarea
          placeholder="Describa las responsabilidades, requisitos y habilidades necesarias..."
          value={matchDescripcion}
          onChange={(e) => setMatchDescripcion(e.target.value)}
          rows={3}
          style={{
            flex: 2,
            padding: '1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            fontSize: '1rem',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
        <button
          onClick={buscarMatches}
          disabled={matchCargando}
          style={{
            padding: '1rem 2rem',
            background: '#553BC4',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: matchCargando ? 'not-allowed' : 'pointer',
            opacity: matchCargando ? 0.7 : 1,
            whiteSpace: 'nowrap'
          }}
        >
          {matchCargando ? 'Buscando...' : '🔍 Buscar matches'}
        </button>
      </div>

      {matchResultados.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600' }}>
              Mejores candidatos ({matchResultados.length})
            </h3>
            <span style={{ background: '#f0edfe', color: '#553BC4', padding: '0.3rem 1rem', borderRadius: '50px', fontSize: '0.9rem' }}>
              Ordenados por match score
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem'
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

              let scoreColor = '#dc2626';
              if (matchScore >= 80) scoreColor = '#16a34a';
              else if (matchScore >= 60) scoreColor = '#2563eb';
              else if (matchScore >= 40) scoreColor = '#ca8a04';

              return (
                <div
                  key={index}
                  style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(85,59,196,0.1)';
                    e.currentTarget.style.borderColor = '#553BC4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                  onClick={() => verFicha(candidato)}
                >
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: scoreColor,
                    color: 'white',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '50px',
                    fontSize: '0.8rem',
                    fontWeight: '700'
                  }}>
                    {matchScore}% match
                  </div>

                  <div style={{ marginBottom: '1rem', paddingRight: '60px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.3rem' }}>
                      {nombre}
                    </h3>
                    <p style={{ color: '#553BC4', fontWeight: '500', fontSize: '0.9rem' }}>
                      {profesion}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <span style={{
                      background: '#f0edfe',
                      color: '#553BC4',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '50px',
                      fontSize: '0.8rem',
                      fontWeight: '500'
                    }}>
                      {seniority}
                    </span>
                    <span style={{
                      background: '#f3f4f6',
                      color: '#4b5563',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '50px',
                      fontSize: '0.8rem',
                      fontWeight: '500'
                    }}>
                      📍 {ubicacion}
                    </span>
                    <span style={{
                      background: '#f3f4f6',
                      color: '#4b5563',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '50px',
                      fontSize: '0.8rem',
                      fontWeight: '500'
                    }}>
                      ⏱️ {experiencia}
                    </span>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
                      Habilidades clave:
                    </p>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      {habilidades.slice(0, 4).map((skill, i) => (
                        <span
                          key={i}
                          style={{
                            background: '#f3f4f6',
                            color: '#374151',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                      {habilidades.length > 4 && (
                        <span style={{
                          background: '#f3f4f6',
                          color: '#374151',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          +{habilidades.length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    marginTop: '1.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.85rem',
                    color: '#666'
                  }}>
                    <span>🎯 Match score</span>
                    <span style={{ fontWeight: '700', color: scoreColor }}>{matchScore}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Ficha del Candidato */}
      {modalOpen && selectedCandidate && (
        <div style={{
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
        }} onClick={cerrarModal}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '24px'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {selectedCandidate._parsed?.datos_crudos?.nombre || selectedCandidate.nombre}
              </h2>
              <button onClick={cerrarModal} style={{ fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            
            <div>
              <p><strong>Profesión:</strong> {selectedCandidate._parsed?.datos_crudos?.profesion_escrita || selectedCandidate.profesion}</p>
              <p><strong>Ubicación:</strong> {selectedCandidate._parsed?.datos_crudos?.ubicacion || 'No especificada'}</p>
              <p><strong>Experiencia:</strong> {selectedCandidate._parsed?.interpretacion?.anos_experiencia_deducidos || 'N/A'}</p>
              <p><strong>Seniority:</strong> {selectedCandidate._parsed?.interpretacion?.seniority || 'N/A'}</p>
              
              <div style={{ marginTop: '16px' }}>
                <strong>Habilidades:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {selectedCandidate._parsed?.interpretacion?.habilidades_clave?.map((h, i) => (
                    <span key={i} style={{ background: '#f0edfe', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>{h}</span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <strong>Perfil interpretado:</strong>
                <p style={{ marginTop: '8px', color: '#666' }}>{selectedCandidate._parsed?.interpretacion?.perfil_interpretado || 'No disponible'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIMatch;
