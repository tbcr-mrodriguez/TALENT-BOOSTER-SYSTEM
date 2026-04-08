import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FichaCandidato = ({ candidato, onClose, API_URL, onIniciarEntrevista, plantillasDisponibles, cargarPlantillas }) => {
  const [mostrarSelectorPlantilla, setMostrarSelectorPlantilla] = useState(false);
  const [plantillas, setPlantillas] = useState([]);
  const [cargandoPlantillas, setCargandoPlantillas] = useState(false);

  // Usar _parsed si existe, o parsear directamente
  let datos = candidato._parsed;
  if (!datos && candidato.raw_data) {
    try {
      datos = typeof candidato.raw_data === 'string' ? JSON.parse(candidato.raw_data) : candidato.raw_data;
    } catch(e) {
      datos = candidato;
    }
  } else if (!datos) {
    datos = candidato;
  }

  const verCV = () => {
    if (candidato.archivo) {
      window.open(`${API_URL}/view-cv/${encodeURIComponent(candidato.archivo)}`, '_blank');
    } else {
      alert('No hay archivo asociado a este candidato');
    }
  };

  const handleIniciarEntrevista = async () => {
    setCargandoPlantillas(true);
    try {
      const res = await axios.get(`${API_URL}/admin/plantillas-v2`);
      if (res.data.success && res.data.plantillas.length > 0) {
        setPlantillas(res.data.plantillas);
        setMostrarSelectorPlantilla(true);
      } else {
        alert('No hay plantillas de entrevista disponibles. Crea una primero.');
      }
    } catch (error) {
      console.error('Error cargando plantillas:', error);
      alert('Error al cargar las plantillas de entrevista');
    } finally {
      setCargandoPlantillas(false);
    }
  };

  const iniciarEntrevistaConPlantilla = async (plantillaId) => {
    try {
      const res = await axios.post(`${API_URL}/entrevista/iniciar-v2`, {
        candidato_id: candidato.id,
        plantilla_id: plantillaId
      });
      
      if (res.data.success) {
        alert(`✅ Enlace generado:\n${res.data.enlace}`);
        if (window.confirm('¿Abrir la entrevista ahora?')) {
          window.open(res.data.enlace, '_blank');
        }
        setMostrarSelectorPlantilla(false);
      } else {
        alert('Error: ' + (res.data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al generar entrevista: ' + error.message);
    }
  };

  return (
    <>
      <div className="modal-professional" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <div>
            <h2>{datos?.datos_crudos?.nombre || candidato.nombre || 'Candidato'}</h2>
            <p>{datos?.datos_crudos?.profesion_escrita || candidato.profesion || ''}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-outline" onClick={verCV}>
              📄 Ver CV
            </button>
            <button 
              className="btn-primary" 
              onClick={handleIniciarEntrevista}
              style={{ background: '#553BC4' }}
              disabled={cargandoPlantillas}
            >
              {cargandoPlantillas ? 'Cargando...' : '🎥 Video entrevista'}
            </button>
          </div>
        </div>

        <div className="modal-body">
          {datos?.interpretacion && (
            <>
              <div className="modal-section highlight">
                <h3>🤖 INTERPRETACIÓN IA</h3>
                
                <div className="ia-perfil-container">
                  <div className="ia-label">📊 PERFIL INTERPRETADO</div>
                  <p className="ia-text">{datos.interpretacion.perfil_interpretado || 'No disponible'}</p>
                </div>
                
                <div className="ia-grid">
                  <div className="ia-item">
                    <div className="ia-label">🏭 SECTOR DEDUCIDO</div>
                    <span className="badge badge-sector">{datos.interpretacion.sector_deducido || 'No inferido'}</span>
                  </div>
                  <div className="ia-item">
                    <div className="ia-label">📅 EXPERIENCIA DEDUCIDA</div>
                    <span className="badge badge-experiencia">{datos.interpretacion.anos_experiencia_deducidos || 'No inferido'}</span>
                  </div>
                  <div className="ia-item">
                    <div className="ia-label">⭐ SENIORITY</div>
                    <span className={`badge badge-${datos.interpretacion.seniority?.toLowerCase() || 'trainee'}`}>
                      {datos.interpretacion.seniority || 'No inferido'}
                    </span>
                  </div>
                  <div className="ia-item">
                    <div className="ia-label">🏢 INDUSTRIA PRINCIPAL</div>
                    <span className="badge badge-sector">{datos.interpretacion.industria_principal || 'No inferido'}</span>
                  </div>
                </div>

                {datos.interpretacion.industrias_secundarias?.length > 0 && (
                  <div className="ia-section">
                    <div className="ia-label">🏢 INDUSTRIAS SECUNDARIAS</div>
                    <div className="ia-tags">
                      {datos.interpretacion.industrias_secundarias.map((ind, i) => (
                        <span key={i} className="tag-industria">{ind}</span>
                      ))}
                    </div>
                  </div>
                )}

                {datos.datos_crudos?.empresas && datos.datos_crudos.empresas.length > 0 && (
                  <div className="ia-section">
                    <div className="ia-label">🏢 EMPRESAS DESTACADAS</div>
                    <div className="ia-tags">
                      {datos.datos_crudos.empresas.slice(0, 6).map((emp, i) => (
                        <span key={i} className="tag-empresa">🏢 {emp}</span>
                      ))}
                    </div>
                  </div>
                )}

                {datos.interpretacion.habilidades_clave?.length > 0 && (
                  <div className="ia-section">
                    <div className="ia-label">🔑 HABILIDADES CLAVE (TOP 5)</div>
                    <div className="ia-tags">
                      {datos.interpretacion.habilidades_clave.map((hab, i) => (
                        <span key={i} className="tag-habilidad">⭐ {hab}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="ia-grid-2">
                  {datos.interpretacion.fortalezas?.length > 0 && (
                    <div className="ia-section">
                      <div className="ia-label">💪 FORTALEZAS</div>
                      <ul className="ia-list">
                        {datos.interpretacion.fortalezas.map((fort, i) => (
                          <li key={i}>{fort}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {datos.interpretacion.areas_mejora?.length > 0 && (
                    <div className="ia-section">
                      <div className="ia-label">📈 ÁREAS DE MEJORA</div>
                      <ul className="ia-list">
                        {datos.interpretacion.areas_mejora.map((area, i) => (
                          <li key={i}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {datos.interpretacion.rol_tipico && (
                  <div className="ia-section">
                    <div className="ia-label">👔 ROL TÍPICO</div>
                    <div className="ia-valor">{datos.interpretacion.rol_tipico}</div>
                  </div>
                )}

                {datos.interpretacion.nivel_impacto && (
                  <div className="ia-section">
                    <div className="ia-label">⚡ NIVEL DE IMPACTO</div>
                    <span className={`badge badge-impacto ${datos.interpretacion.nivel_impacto?.toLowerCase()}`}>
                      {datos.interpretacion.nivel_impacto}
                    </span>
                  </div>
                )}

                {datos.interpretacion.recomendacion && (
                  <div className="ia-section recomendacion">
                    <div className="ia-label">🎯 RECOMENDACIÓN</div>
                    <div className="ia-valor destacado">{datos.interpretacion.recomendacion}</div>
                  </div>
                )}
              </div>
            </>
          )}

          {datos?.datos_crudos && (
            <div className="modal-section">
              <h3>📄 DATOS DEL CV</h3>
              <div className="info-grid">
                <div><label>📞 Teléfono</label><span>{datos.datos_crudos.telefono || '—'}</span></div>
                <div><label>✉️ Email</label><span>{datos.datos_crudos.email || '—'}</span></div>
                <div><label>📍 Ubicación</label><span>{datos.datos_crudos.ubicacion || '—'}</span></div>
                <div><label>🎓 Carrera</label><span>{datos.datos_crudos.profesion_escrita || '—'}</span></div>
                <div><label>🏛️ Universidad</label><span>{datos.datos_crudos.universidad || '—'}</span></div>
                <div><label>📜 Grado</label><span>{datos.datos_crudos.grado_academico || '—'}</span></div>
              </div>

              {datos.datos_crudos.certificaciones?.length > 0 && (
                <>
                  <div className="ia-label" style={{ marginTop: '1rem' }}>📜 Certificaciones</div>
                  <div className="ia-tags">
                    {datos.datos_crudos.certificaciones.map((cert, i) => (
                      <span key={i} className="tag-certificacion">{cert}</span>
                    ))}
                  </div>
                </>
              )}

              {datos.datos_crudos.perfil_textual && (
                <>
                  <div className="ia-label" style={{ marginTop: '1rem' }}>📝 Perfil (textual del CV)</div>
                  <div className="ia-text">{datos.datos_crudos.perfil_textual}</div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="score-display">
            <span className="score-label">Score IA</span>
            <span className={`score-value score-${Math.floor((datos?.score || candidato.score || 0)/20)*20}`}>
              {datos?.score || candidato.score || 0}
            </span>
          </div>
          <span className="criterio">{datos?.criterio_ai || candidato.criterio_ai || 'No disponible'}</span>
        </div>
      </div>

      {/* Modal selector de plantilla */}
      {mostrarSelectorPlantilla && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
          onClick={() => setMostrarSelectorPlantilla(false)}
        >
          <div 
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '20px',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>
              🎥 Programar entrevista
            </h2>
            
            <p style={{ marginBottom: '20px', color: '#666', fontWeight: 'bold' }}>
              {datos?.datos_crudos?.nombre || candidato.nombre || 'Candidato'}
            </p>

            <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
              {plantillas.map(p => (
                <button
                  key={p.id}
                  onClick={() => iniciarEntrevistaConPlantilla(p.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#553BC4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{p.nombre}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {p.tipo === 'generica' ? '📋 Genérica' : '🎯 Específica'} · 
                    {p.preguntas_count || 0} preguntas
                  </div>
                  {p.descripcion && (
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                      {p.descripcion.substring(0, 80)}
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setMostrarSelectorPlantilla(false)}
              style={{
                padding: '12px',
                background: '#553BC4',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                width: '100%',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FichaCandidato;
