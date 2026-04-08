import React from 'react';

const FichaCandidato = ({ candidato, onClose, API_URL }) => {
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

  return (
    <div className="modal-professional" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
      <button className="modal-close" onClick={onClose}>×</button>
      
      <div className="modal-header">
        <div>
          <h2>{datos?.datos_crudos?.nombre || candidato.nombre || 'Candidato'}</h2>
          <p>{datos?.datos_crudos?.profesion_escrita || candidato.profesion || ''}</p>
        </div>
        <button className="btn-outline" onClick={verCV}>
          📄 Ver CV
        </button>
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
                  <div className="ia-label">🔑 HABILIDADES CLAVE</div>
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
  );
};

export default FichaCandidato;
