import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FichaCandidato = ({ candidato, onClose, API_URL }) => {
  const [mostrarModalPlantillas, setMostrarModalPlantillas] = useState(false);
  const [plantillas, setPlantillas] = useState([]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState('');
  const [cargando, setCargando] = useState(false);

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

  useEffect(() => {
    cargarPlantillas();
  }, []);

  const cargarPlantillas = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/plantillas-v2`);
      if (res.data.success) {
        setPlantillas(res.data.plantillas);
      }
    } catch (error) {
      console.error('Error cargando plantillas:', error);
    }
  };

  const verCV = () => {
    if (candidato.archivo) {
      window.open(`${API_URL}/view-cv/${encodeURIComponent(candidato.archivo)}`, '_blank');
    } else {
      alert('No hay archivo asociado a este candidato');
    }
  };

  const abrirModalPlantillas = () => {
    setMostrarModalPlantillas(true);
  };

  const cerrarModalPlantillas = () => {
    setMostrarModalPlantillas(false);
    setPlantillaSeleccionada('');
  };

  const iniciarEntrevista = async () => {
    if (!plantillaSeleccionada) {
        alert('Selecciona una plantilla de entrevista');
        return;
    }

    // 🔥 LOGS PARA DIAGNÓSTICO
    console.log('📤 Enviando solicitud a:', `${API_URL}/entrevista/iniciar-v2`);
    console.log('📦 Datos enviados:', {
        candidato_id: candidato.id,
        plantilla_id: plantillaSeleccionada
    });
    console.log('👤 Candidato completo:', candidato);
    setCargando(true);
    try {
        const res = await axios.post(`${API_URL}/entrevista/iniciar-v2`, {
            candidato_id: candidato.id,
            plantilla_id: plantillaSeleccionada
        });

        console.log('✅ Respuesta:', res.data);

        if (res.data.success) {
            if (res.data.correo_enviado) {
                alert(`✅ ${res.data.mensaje_usuario || `Invitación enviada a ${res.data.candidato_email}. El candidato recibirá un correo con el enlace para realizar la entrevista.`}`);
            } else {
                alert(`⚠️ No se pudo enviar el correo a ${res.data.candidato_email || 'el candidato'}. Error: ${res.data.mensaje || 'Error desconocido'}`);
            }
            cerrarModalPlantillas();
        } else {
            alert('❌ Error: ' + (res.data.error || 'No se pudo iniciar la entrevista'));
        }
    } catch (error) {
        console.error('❌ Error completo:', error);
        if (error.response) {
            console.error('📄 Respuesta del servidor:', error.response.data);
            alert(`❌ Error ${error.response.status}: ${error.response.data?.error || error.response.data?.message || 'Error desconocido'}`);
        } else {
            alert('❌ Error al iniciar la entrevista: ' + error.message);
        }
    }
    setCargando(false);
};
  const escapeHtml = (text) => {
    if (!text) return '';
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  const score = datos?.score || candidato.score || 0;
  const scoreClass = score >= 80 ? 'score-80' : score >= 60 ? 'score-60' : score >= 40 ? 'score-40' : 'score-20';

  return (
    <>
      {/* Modal principal - Ficha del candidato (SIN overlay oscuro) */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 1000,
        pointerEvents: 'none'
      }}>
        <div style={{ 
          background: 'white', 
          borderRadius: '24px', 
          maxWidth: '800px', 
          width: '90%', 
          maxHeight: '85vh', 
          overflow: 'auto',
          boxShadow: '0 20px 35px -8px rgba(0,0,0,0.2)',
          pointerEvents: 'auto'
        }}>
          
          {/* Header */}
          <div style={{ 
            padding: '1.25rem 1.5rem', 
            borderBottom: '1px solid #e2e8f0', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'white',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.25rem' }}>
                {escapeHtml(datos?.datos_crudos?.nombre || candidato.nombre || 'Candidato')}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {escapeHtml(datos?.datos_crudos?.profesion_escrita || candidato.profesion || '')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={verCV} style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                📄 Ver CV
              </button>
              <button onClick={abrirModalPlantillas} style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                🎥 Iniciar Entrevista
              </button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>
          </div>

          {/* Body - Mismo contenido que antes */}
          <div style={{ padding: '1.5rem' }}>
            
            {/* INTERPRETACIÓN IA */}
            {datos?.interpretacion && (
              <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🤖 INTERPRETACIÓN IA
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    📊 PERFIL INTERPRETADO
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                    {escapeHtml(datos.interpretacion.perfil_interpretado || 'No disponible')}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ background: 'white', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>🏭 SECTOR DEDUCIDO</div>
                    <span style={{ fontSize: '0.7rem', marginTop: '0.25rem', display: 'inline-block', background: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                      {escapeHtml(datos.interpretacion.sector_deducido || 'No inferido')}
                    </span>
                  </div>
                  <div style={{ background: 'white', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>📅 EXPERIENCIA DEDUCIDA</div>
                    <span style={{ fontSize: '0.7rem', marginTop: '0.25rem', display: 'inline-block', background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                      {escapeHtml(datos.interpretacion.anos_experiencia_deducidos || 'No inferido')}
                    </span>
                  </div>
                  <div style={{ background: 'white', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>⭐ SENIORITY</div>
                    <span style={{ fontSize: '0.7rem', marginTop: '0.25rem', display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '20px', background: datos.interpretacion.seniority === 'Senior' ? '#d1fae5' : datos.interpretacion.seniority === 'Semi-Senior' ? '#dbeafe' : datos.interpretacion.seniority === 'Junior' ? '#fef3c7' : '#f1f5f9', color: datos.interpretacion.seniority === 'Senior' ? '#065f46' : datos.interpretacion.seniority === 'Semi-Senior' ? '#1e40af' : datos.interpretacion.seniority === 'Junior' ? '#92400e' : '#475569' }}>
                      {escapeHtml(datos.interpretacion.seniority || 'No inferido')}
                    </span>
                  </div>
                  <div style={{ background: 'white', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>🏢 INDUSTRIA PRINCIPAL</div>
                    <span style={{ fontSize: '0.7rem', marginTop: '0.25rem', display: 'inline-block', background: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                      {escapeHtml(datos.interpretacion.industria_principal || 'No inferido')}
                    </span>
                  </div>
                </div>

                {datos.interpretacion.industrias_secundarias?.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>🏢 INDUSTRIAS SECUNDARIAS</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {datos.interpretacion.industrias_secundarias.map((ind, i) => (
                        <span key={i} style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem' }}>
                          {escapeHtml(ind)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {datos.datos_crudos?.empresas && datos.datos_crudos.empresas.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>🏢 EMPRESAS DESTACADAS</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {datos.datos_crudos.empresas.slice(0, 6).map((emp, i) => (
                        <span key={i} style={{ background: '#d1fae5', color: '#065f46', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem' }}>
                          🏢 {escapeHtml(emp)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {datos.interpretacion.habilidades_clave?.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>🔑 HABILIDADES CLAVE</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {datos.interpretacion.habilidades_clave.map((hab, i) => (
                        <span key={i} style={{ background: '#f3e8ff', color: '#6b21a8', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem' }}>
                          ⭐ {escapeHtml(hab)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  {datos.interpretacion.fortalezas?.length > 0 && (
                    <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#065f46', textTransform: 'uppercase', marginBottom: '0.5rem' }}>💪 FORTALEZAS</div>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: '#475569' }}>
                        {datos.interpretacion.fortalezas.map((fort, i) => (
                          <li key={i}>{escapeHtml(fort)}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {datos.interpretacion.areas_mejora?.length > 0 && (
                    <div style={{ background: '#fffbeb', padding: '0.75rem', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#92400e', textTransform: 'uppercase', marginBottom: '0.5rem' }}>📈 ÁREAS DE MEJORA</div>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: '#475569' }}>
                        {datos.interpretacion.areas_mejora.map((area, i) => (
                          <li key={i}>{escapeHtml(area)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {datos.interpretacion.rol_tipico && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>👔 ROL TÍPICO</div>
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>{escapeHtml(datos.interpretacion.rol_tipico)}</div>
                  </div>
                )}

                {datos.interpretacion.nivel_impacto && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>⚡ NIVEL DE IMPACTO</div>
                    <span style={{ fontSize: '0.75rem', display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '20px', background: datos.interpretacion.nivel_impacto === 'Alto' ? '#d1fae5' : datos.interpretacion.nivel_impacto === 'Medio' ? '#fef3c7' : '#fee2e2', color: datos.interpretacion.nivel_impacto === 'Alto' ? '#065f46' : datos.interpretacion.nivel_impacto === 'Medio' ? '#92400e' : '#991b1b' }}>
                      {escapeHtml(datos.interpretacion.nivel_impacto)}
                    </span>
                  </div>
                )}

                {datos.interpretacion.recomendacion && (
                  <div style={{ background: '#e0e7ff', padding: '0.75rem', borderRadius: '10px', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#1e40af', textTransform: 'uppercase', marginBottom: '0.25rem' }}>🎯 RECOMENDACIÓN</div>
                    <div style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: '500' }}>
                      {escapeHtml(datos.interpretacion.recomendacion)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DATOS DEL CV */}
            {datos?.datos_crudos && (
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', marginBottom: '1rem' }}>📄 DATOS DEL CV</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>📞 Teléfono</div>
                    <div style={{ fontSize: '0.8rem', color: '#1e293b' }}>{escapeHtml(datos.datos_crudos.telefono || '—')}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>✉️ Email</div>
                    <div style={{ fontSize: '0.8rem', color: '#1e293b' }}>{escapeHtml(datos.datos_crudos.email || '—')}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>📍 Ubicación</div>
                    <div style={{ fontSize: '0.8rem', color: '#1e293b' }}>{escapeHtml(datos.datos_crudos.ubicacion || '—')}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>🎓 Carrera</div>
                    <div style={{ fontSize: '0.8rem', color: '#1e293b' }}>{escapeHtml(datos.datos_crudos.profesion_escrita || '—')}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>🏛️ Universidad</div>
                    <div style={{ fontSize: '0.8rem', color: '#1e293b' }}>{escapeHtml(datos.datos_crudos.universidad || '—')}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>📜 Grado</div>
                    <div style={{ fontSize: '0.8rem', color: '#1e293b' }}>{escapeHtml(datos.datos_crudos.grado_academico || '—')}</div>
                  </div>
                </div>

                {datos.datos_crudos.certificaciones?.length > 0 && (
                  <>
                    <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>📜 Certificaciones</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {datos.datos_crudos.certificaciones.map((cert, i) => (
                        <span key={i} style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem' }}>
                          {escapeHtml(cert)}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer con Score */}
          <div style={{ 
            padding: '1rem 1.5rem', 
            borderTop: '1px solid #e2e8f0', 
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Score IA</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444' }}>
                {score}
              </span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#475569', background: 'white', padding: '0.25rem 0.75rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              {escapeHtml(datos?.criterio_ai || candidato.criterio_ai || 'No disponible')}
            </span>
          </div>
        </div>
      </div>

      {/* Modal de selección de plantilla (independiente) */}
      {mostrarModalPlantillas && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          backdropFilter: 'blur(4px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1100 
        }} onClick={cerrarModalPlantillas}>
          <div style={{ 
            background: 'white', 
            borderRadius: '20px', 
            maxWidth: '500px', 
            width: '90%', 
            padding: '1.5rem',
            boxShadow: '0 20px 35px -8px rgba(0,0,0,0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>🎥 Seleccionar Entrevista</h3>
              <button onClick={cerrarModalPlantillas} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                Selecciona la plantilla de entrevista
              </label>
              <select
                value={plantillaSeleccionada}
                onChange={(e) => setPlantillaSeleccionada(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', background: 'white' }}
              >
                <option value="">-- Seleccionar plantilla --</option>
                {plantillas.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.preguntas_count || 0} preguntas)
                  </option>
                ))}
              </select>
            </div>

            {plantillas.length === 0 && (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', padding: '0.5rem' }}>
                No hay plantillas disponibles. Crea una en "Configuración Entrevistas".
              </p>
            )}
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={iniciarEntrevista} disabled={cargando || !plantillaSeleccionada} style={{ flex: 1, padding: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: (!plantillaSeleccionada || cargando) ? 0.5 : 1 }}>
                {cargando ? 'Iniciando...' : 'Iniciar Entrevista'}
              </button>
              <button onClick={cerrarModalPlantillas} style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FichaCandidato;