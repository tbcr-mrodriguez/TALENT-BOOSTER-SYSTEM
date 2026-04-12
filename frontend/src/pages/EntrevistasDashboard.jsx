import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const RespuestaItem = ({ respuesta, idx, API_URL, onTranscripcionCargada }) => {
  const [mostrarTranscripcion, setMostrarTranscripcion] = useState(false);
  const [transcripcionCompleta, setTranscripcionCompleta] = useState(respuesta.respuesta || '');
  const [cargando, setCargando] = useState(false);

  const cargarTranscripcion = async () => {
    if (!mostrarTranscripcion && (!respuesta.respuesta || respuesta.respuesta === 'Grabación de video')) {
      setCargando(true);
      try {
        const res = await axios.get(`${API_URL}/entrevista/transcripcion/${respuesta.id}`);
        if (res.data.success && res.data.transcripcion) {
          setTranscripcionCompleta(res.data.transcripcion);
          if (onTranscripcionCargada) {
            onTranscripcionCargada(respuesta.id, res.data.transcripcion);
          }
        }
      } catch (error) {
        console.error('Error cargando transcripción:', error);
        setTranscripcionCompleta('No se pudo cargar la transcripción');
      } finally {
        setCargando(false);
      }
    }
    setMostrarTranscripcion(!mostrarTranscripcion);
  };

  return (
    <div style={{ marginBottom: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white' }}>
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: mostrarTranscripcion ? '1px solid #e2e8f0' : 'none' }}>
        <div>
          <span style={{ background: '#3b82f6', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', marginRight: '10px' }}>Pregunta {idx + 1}</span>
          <span style={{ fontWeight: '500', color: '#1e293b', fontSize: '13px' }}>{respuesta.pregunta?.substring(0, 80)}...</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {respuesta.video && (
            <a href={`${API_URL}/entrevista/video/${respuesta.video}`} target="_blank" rel="noopener noreferrer" style={{ padding: '4px 10px', fontSize: '11px', background: '#10b981', color: 'white', borderRadius: '6px', textDecoration: 'none' }}>
              🎬 Video
            </a>
          )}
          <button onClick={cargarTranscripcion} disabled={cargando} style={{ padding: '4px 10px', fontSize: '11px', background: mostrarTranscripcion ? '#64748b' : '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: cargando ? 0.7 : 1 }}>
            {cargando ? '⏳ Cargando...' : (mostrarTranscripcion ? '📝 Ocultar' : '📝 Ver transcripción')}
          </button>
        </div>
      </div>
      {mostrarTranscripcion && (
        <div style={{ padding: '16px', background: '#fef3c7' }}>
          <div style={{ background: 'white', padding: '12px', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', color: '#92400e', fontWeight: '600' }}>📋 TRANSCRIPCIÓN</span>
              <span style={{ fontSize: '9px', color: '#b45309' }}>⏱️ Tiempo: {respuesta.tiempo || 0} seg</span>
            </div>
            <p style={{ margin: 0, lineHeight: '1.5', color: '#1e293b', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
              {transcripcionCompleta || 'No hay transcripción disponible'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const EntrevistasDashboard = () => {
  const [entrevistas, setEntrevistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ estado: 'todos', fechaDesde: '', fechaHasta: '', busqueda: '' });
  const [reporteCompleto, setReporteCompleto] = useState(null);
  const [modalReporteAbierto, setModalReporteAbierto] = useState(false);
  const [cargandoReporte, setCargandoReporte] = useState(false);

  useEffect(() => { cargarEntrevistas(); }, []);

  const cargarEntrevistas = async () => {
    try {
      const res = await axios.get(`${API_URL}/entrevistas/todas`);
      if (res.data.success) {
        const entrevistasMapeadas = res.data.entrevistas.map(e => ({
          id: e.id, fecha_inicio: e.fecha, candidato_nombre: e.candidato,
          plantilla: e.plantilla, estado: e.estado, duracion: e.duracion,
          puntuacion_global: e.puntuacion, tiene_analisis: e.tiene_analisis
        }));
        setEntrevistas(entrevistasMapeadas);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const verReporteCompleto = async (entrevistaId) => {
    setCargandoReporte(true);
    try {
      const res = await axios.get(`${API_URL}/entrevista/reporte-completo-v2/${entrevistaId}`);
      if (res.data.success) {
        setReporteCompleto(res.data);
        setModalReporteAbierto(true);
      } else {
        alert('Error: ' + (res.data.error || 'No se pudo cargar el reporte'));
      }
    } catch (error) { alert('Error al cargar el reporte'); }
    finally { setCargandoReporte(false); }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (estado) => {
    const config = {
      pendiente: { bg: '#fef3c7', text: '#92400e', label: 'Pendiente' },
      en_progreso: { bg: '#dbeafe', text: '#1e40af', label: 'En progreso' },
      completada: { bg: '#d1fae5', text: '#065f46', label: 'Completada' },
      analizada: { bg: '#e0e7ff', text: '#1e40af', label: 'Analizada' }
    };
    const c = config[estado] || { bg: '#f1f5f9', text: '#475569', label: estado };
    return <span style={{ background: c.bg, color: c.text, padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '500' }}>{c.label}</span>;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const entrevistasFiltradas = entrevistas.filter(e => {
    if (filtros.estado !== 'todos' && e.estado !== filtros.estado) return false;
    if (filtros.fechaDesde && new Date(e.fecha_inicio) < new Date(filtros.fechaDesde)) return false;
    if (filtros.fechaHasta && new Date(e.fecha_inicio) > new Date(filtros.fechaHasta)) return false;
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      return (e.candidato_nombre?.toLowerCase().includes(busqueda) || e.plantilla?.toLowerCase().includes(busqueda));
    }
    return true;
  });

  const getCandidatoData = (rawData) => {
    if (!rawData) return {};
    try { return typeof rawData === 'string' ? JSON.parse(rawData) : rawData; } catch { return {}; }
  };

  const exportarPDF = async () => {
    try {
      const element = document.getElementById('reporte-pdf-content');
      if (!element) return;
      const originalOverflow = element.style.overflowY;
      const originalMaxHeight = element.style.maxHeight;
      element.style.overflowY = 'visible';
      element.style.maxHeight = 'none';
      await new Promise(r => setTimeout(r, 100));
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf().set({ margin: 0.5, filename: `informe_${Date.now()}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } }).from(element).save();
      element.style.overflowY = originalOverflow;
      element.style.maxHeight = originalMaxHeight;
    } catch (error) { alert('Error al generar PDF'); }
  };

  const totalCount = entrevistas.length;
  const pendientesCount = entrevistas.filter(e => e.estado === 'pendiente').length;
  const completadasCount = entrevistas.filter(e => e.estado === 'completada').length;
  const analizadasCount = entrevistas.filter(e => e.estado === 'analizada').length;

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>🎥 Resultados Entrevistas</h1>
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>Gestión y análisis de entrevistas realizadas</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ padding: '8px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
              <span style={{ fontSize: '20px', fontWeight: '700', color: 'white', display: 'block' }}>{totalCount}</span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Total</span>
            </div>
            <div style={{ padding: '8px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#fcd34d', display: 'block' }}>{pendientesCount}</span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Pendientes</span>
            </div>
            <div style={{ padding: '8px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#34d399', display: 'block' }}>{completadasCount}</span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Completadas</span>
            </div>
            <div style={{ padding: '8px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#a78bfa', display: 'block' }}>{analizadasCount}</span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Analizadas</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', padding: '16px', marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <select value={filtros.estado} onChange={(e) => setFiltros({...filtros, estado: e.target.value})} style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}>
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En progreso</option>
            <option value="completada">Completada</option>
            <option value="analizada">Analizada</option>
          </select>
          <input type="date" value={filtros.fechaDesde} onChange={(e) => setFiltros({...filtros, fechaDesde: e.target.value})} style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
          <input type="date" value={filtros.fechaHasta} onChange={(e) => setFiltros({...filtros, fechaHasta: e.target.value})} style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
          <input type="text" value={filtros.busqueda} onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})} placeholder="Buscar candidato o plantilla..." style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
        </div>
      </div>

      <div style={{ background: 'white', overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
        <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Fecha</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Candidato</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Plantilla</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Estado</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Duración</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Puntuación</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Cargando entrevistas...</td>
              </tr>
            ) : entrevistasFiltradas.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No hay entrevistas para mostrar</td>
              </tr>
            ) : (
              entrevistasFiltradas.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontSize: '12px' }}>{formatFecha(e.fecha_inicio)}</td>
                  <td style={{ padding: '12px', fontWeight: '500', fontSize: '13px' }}>{e.candidato_nombre || 'N/A'}</td>
                  <td style={{ padding: '12px', fontSize: '12px' }}>{e.plantilla || '-'}</td>
                  <td style={{ padding: '12px' }}>{getStatusBadge(e.estado)}</td>
                  <td style={{ padding: '12px', fontSize: '12px' }}>{e.duracion || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    {e.puntuacion_global ? (
                      <span style={{ background: getScoreColor(e.puntuacion_global), color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                        {e.puntuacion_global}/100
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button onClick={() => verReporteCompleto(e.id)} disabled={e.estado !== 'analizada' && e.estado !== 'completada'} style={{ padding: '6px 14px', fontSize: '11px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: (e.estado !== 'analizada' && e.estado !== 'completada') ? 0.5 : 1 }}>
                      Ver informe
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalReporteAbierto && reporteCompleto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={() => setModalReporteAbierto(false)}>
          <div id="reporte-pdf-content" style={{ background: 'white', maxWidth: '1000px', width: '100%', maxHeight: '90vh', overflow: 'auto', padding: '24px', borderRadius: '24px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px', zIndex: 10 }}>
              <button onClick={exportarPDF} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer' }}>📄</button>
              <button onClick={() => setModalReporteAbierto(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #e2e8f0' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>📊 INFORME DE EVALUACIÓN</h1>
              <p style={{ color: '#64748b', fontSize: '13px' }}>Entrevista profesional · {reporteCompleto.entrevista?.candidato_nombre || 'Candidato'}</p>
              <p style={{ color: '#94a3b8', fontSize: '11px' }}>Fecha: {formatFecha(reporteCompleto.entrevista?.fecha_inicio)}</p>
            </div>

            <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '20px', borderRadius: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>👤 PERFIL DEL CANDIDATO</h2>
              {(() => {
                const candidatoData = getCandidatoData(reporteCompleto.entrevista?.candidato_data);
                const interpretacion = candidatoData?.interpretacion || {};
                const datosCrudos = candidatoData?.datos_crudos || {};
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px' }}>
                    <div><strong>Nombre:</strong> {datosCrudos.nombre || reporteCompleto.entrevista?.candidato_nombre || 'N/A'}</div>
                    <div><strong>Profesión:</strong> {datosCrudos.profesion_escrita || 'N/A'}</div>
                    <div><strong>Seniority:</strong> <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>{interpretacion.seniority || 'N/A'}</span></div>
                    <div><strong>Años experiencia:</strong> {interpretacion.anos_experiencia_deducidos || 'N/A'}</div>
                    <div><strong>Ubicación:</strong> {datosCrudos.ubicacion || 'N/A'}</div>
                    <div><strong>Email:</strong> {datosCrudos.email || 'N/A'}</div>
                  </div>
                );
              })()}
            </div>

            {reporteCompleto.plantilla?.perfil_puesto && (
              <div style={{ marginBottom: '20px', background: '#eff6ff', padding: '20px', borderRadius: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>🎯 PERFIL DEL PUESTO</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px', marginBottom: '12px' }}>
                  <div><strong>Título:</strong> {reporteCompleto.plantilla.perfil_puesto.titulo || 'No especificado'}</div>
                  <div><strong>Seniority requerido:</strong> {reporteCompleto.plantilla.perfil_puesto.seniority || 'No especificado'}</div>
                </div>
                {reporteCompleto.plantilla.perfil_puesto.requisitos?.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Requisitos del puesto:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '12px' }}>
                      {reporteCompleto.plantilla.perfil_puesto.requisitos.map((req, i) => <li key={i}>{req}</li>)}
                    </ul>
                  </div>
                )}
                {reporteCompleto.plantilla.perfil_puesto.responsabilidades?.length > 0 && (
                  <div>
                    <strong>Responsabilidades:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '12px' }}>
                      {reporteCompleto.plantilla.perfil_puesto.responsabilidades.map((resp, i) => <li key={i}>{resp}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {reporteCompleto.plantilla?.cultura_empresa && (
              <div style={{ marginBottom: '20px', background: '#fef3c7', padding: '20px', borderRadius: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>🏢 CULTURA ORGANIZACIONAL</h2>
                {reporteCompleto.plantilla.cultura_empresa.valores?.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Valores:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '12px' }}>
                      {reporteCompleto.plantilla.cultura_empresa.valores.map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                  </div>
                )}
                {reporteCompleto.plantilla.cultura_empresa.ambiente && (
                  <div>
                    <strong>Ambiente de trabajo:</strong>
                    <p style={{ marginTop: '8px', fontSize: '13px' }}>{reporteCompleto.plantilla.cultura_empresa.ambiente}</p>
                  </div>
                )}
              </div>
            )}

            {reporteCompleto.plantilla?.objetivo && (
              <div style={{ marginBottom: '20px', background: '#f0fdf4', padding: '20px', borderRadius: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>🎯 OBJETIVO DE LA ENTREVISTA</h2>
                <p style={{ lineHeight: '1.6', fontSize: '13px' }}>{reporteCompleto.plantilla.objetivo}</p>
              </div>
            )}

            <div style={{ marginBottom: '20px', background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>📊 PUNTUACIÓN GLOBAL</h2>
              {(() => {
                const score = reporteCompleto.entrevista?.analisis?.score_global || reporteCompleto.entrevista?.puntuacion || 0;
                const scoreColor = getScoreColor(score);
                return (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '40px', fontWeight: '700', color: scoreColor }}>{score}/100</div>
                    <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', marginTop: '8px' }}>
                      <div style={{ width: `${score}%`, height: '6px', background: scoreColor, borderRadius: '4px' }}></div>
                    </div>
                    <p style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                      {score >= 80 ? '✅ Perfil altamente compatible' : score >= 60 ? '📌 Perfil compatible con observaciones' : score >= 40 ? '⚠️ Perfil con brechas significativas' : '❌ Perfil no recomendado para el puesto'}
                    </p>
                  </div>
                );
              })()}
            </div>

            {reporteCompleto.entrevista?.analisis?.resumen_ejecutivo && (
              <div style={{ marginBottom: '20px', background: '#f0fdf4', padding: '20px', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>📋 EVALUACIÓN GENERAL</h2>
                <p style={{ lineHeight: '1.6', fontSize: '13px' }}>
                  {typeof reporteCompleto.entrevista.analisis.resumen_ejecutivo === 'string' 
                    ? reporteCompleto.entrevista.analisis.resumen_ejecutivo 
                    : reporteCompleto.entrevista.analisis.resumen_ejecutivo.evaluacion_general || 'No disponible'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '15px' }}>
                  <div style={{ textAlign: 'center', padding: '10px', background: '#dcfce7', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700' }}>
                      {reporteCompleto.entrevista.analisis.resumen_ejecutivo.cumple_requisitos_tecnicos ? '✅' : '❌'}
                    </div>
                    <div style={{ fontSize: '11px' }}>Requisitos técnicos</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px', background: '#dcfce7', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700' }}>
                      {reporteCompleto.entrevista.analisis.resumen_ejecutivo.cumple_requisitos_experiencia ? '✅' : '❌'}
                    </div>
                    <div style={{ fontSize: '11px' }}>Experiencia requerida</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px', background: '#dcfce7', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700' }}>
                      {reporteCompleto.entrevista.analisis.resumen_ejecutivo.cumple_ajuste_cultural ? '✅' : '❌'}
                    </div>
                    <div style={{ fontSize: '11px' }}>Ajuste cultural</div>
                  </div>
                </div>
                {reporteCompleto.entrevista.analisis.resumen_ejecutivo.justificacion_tecnica && (
                  <div style={{ marginTop: '15px', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                    <strong>🔧 Justificación técnica:</strong>
                    <p style={{ marginTop: '5px', fontSize: '12px' }}>{reporteCompleto.entrevista.analisis.resumen_ejecutivo.justificacion_tecnica}</p>
                  </div>
                )}
                {reporteCompleto.entrevista.analisis.resumen_ejecutivo.justificacion_cultural && (
                  <div style={{ marginTop: '10px', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                    <strong>🏢 Justificación cultural:</strong>
                    <p style={{ marginTop: '5px', fontSize: '12px' }}>{reporteCompleto.entrevista.analisis.resumen_ejecutivo.justificacion_cultural}</p>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#065f46', marginBottom: '8px' }}>✅ FORTALEZAS</h3>
                <ul style={{ paddingLeft: '20px', fontSize: '12px', color: '#475569' }}>
                  {(reporteCompleto.entrevista?.analisis?.fortalezas_generales || []).map((f, i) => <li key={i}>{f}</li>)}
                  {(reporteCompleto.entrevista?.analisis?.fortalezas_destacadas || []).map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
              <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626', marginBottom: '8px' }}>⚠️ ÁREAS DE MEJORA</h3>
                <ul style={{ paddingLeft: '20px', fontSize: '12px', color: '#475569' }}>
                  {(reporteCompleto.entrevista?.analisis?.areas_mejora || []).map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            </div>

            {reporteCompleto.entrevista?.analisis?.recomendacion_final && (
              <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '16px', background: '#fff7ed', border: '1px solid #fed7aa' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>📌 RECOMENDACIÓN FINAL</h2>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ background: reporteCompleto.entrevista.analisis.recomendacion_final.decision === 'contratar' ? '#10b981' : reporteCompleto.entrevista.analisis.recomendacion_final.decision === 'avanzar' ? '#3b82f6' : '#ef4444', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                    {reporteCompleto.entrevista.analisis.recomendacion_final.decision === 'contratar' ? '✅ CONTRATAR' : reporteCompleto.entrevista.analisis.recomendacion_final.decision === 'avanzar' ? '🔄 AVANZAR' : '❌ NO RECOMENDABLE'}
                  </span>
                </div>
                <p style={{ fontSize: '13px', lineHeight: '1.5', color: '#475569' }}>{reporteCompleto.entrevista.analisis.recomendacion_final.argumento}</p>
              </div>
            )}

            {reporteCompleto.entrevista?.analisis?.insight_headhunter && (
              <div style={{ marginBottom: '20px', background: '#f3e8ff', padding: '16px', borderRadius: '16px', borderLeft: '4px solid #7c3aed' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>🎯 INSIGHT DEL HEADHUNTER</h2>
                <p style={{ fontSize: '13px', lineHeight: '1.5' }}>{reporteCompleto.entrevista.analisis.insight_headhunter}</p>
              </div>
            )}

            {reporteCompleto.entrevista?.analisis?.evaluacion_star && (
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>⭐ EVALUACIÓN STAR (PROMEDIO)</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb' }}>{reporteCompleto.entrevista.analisis.evaluacion_star.situacion_promedio || 0}/100</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Situación</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb' }}>{reporteCompleto.entrevista.analisis.evaluacion_star.tarea_promedio || 0}/100</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Tarea</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb' }}>{reporteCompleto.entrevista.analisis.evaluacion_star.accion_promedio || 0}/100</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Acción</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb' }}>{reporteCompleto.entrevista.analisis.evaluacion_star.resultado_promedio || 0}/100</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Resultado</div>
                  </div>
                </div>
              </div>
            )}

            {reporteCompleto.entrevista?.analisis?.analisis_por_pregunta?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>📝 ANÁLISIS POR PREGUNTA</h2>
                {reporteCompleto.entrevista.analisis.analisis_por_pregunta.map((item, idx) => {
                  const respuestaOriginal = reporteCompleto.respuestas?.find(r => r.pregunta === item.pregunta);
                  return (
                    <div key={idx} style={{ marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ background: '#f8fafc', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div>
                            <strong>Pregunta {idx + 1}</strong>
                            <span style={{ marginLeft: '8px', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>
                              {item.competencia || 'Competencia'}
                            </span>
                          </div>
                          <span style={{
                            background: item.puntuacion_star >= 70 ? '#dcfce7' : item.puntuacion_star >= 50 ? '#fef9c3' : '#fee2e2',
                            color: item.puntuacion_star >= 70 ? '#166534' : item.puntuacion_star >= 50 ? '#854d0e' : '#991b1b',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            Puntuación: {item.puntuacion_star || item.puntuacion || 0}/100
                          </span>
                        </div>
                      </div>
                      <div style={{ padding: '16px' }}>
                        <div style={{ marginBottom: '16px', background: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
                          <p style={{ marginBottom: '6px', fontSize: '12px' }}><strong>📌 Pregunta:</strong></p>
                          <p style={{ marginBottom: '10px', fontSize: '12px' }}>{item.pregunta}</p>
                          {item.objetivo_pregunta && (
                            <>
                              <p style={{ marginBottom: '4px', fontSize: '11px', color: '#475569' }}><strong>🎯 Objetivo de la pregunta:</strong></p>
                              <p style={{ fontSize: '11px', color: '#475569' }}>{item.objetivo_pregunta}</p>
                            </>
                          )}
                        </div>

                        {respuestaOriginal && (
                          <div style={{ marginBottom: '16px', background: '#fef3c7', padding: '10px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                            <p style={{ marginBottom: '6px', fontSize: '12px' }}><strong>🗣️ Respuesta del candidato:</strong></p>
                            <p style={{ fontStyle: 'italic', fontSize: '12px' }}>{respuestaOriginal.respuesta || '[Grabación de video - revisar archivo]'}</p>
                            <p style={{ marginTop: '6px', fontSize: '10px', color: '#92400e' }}>⏱️ Tiempo de respuesta: {respuestaOriginal.tiempo || 0} segundos</p>
                            {respuestaOriginal.video && (
                              <a href={`${API_URL}/entrevista/video/${respuestaOriginal.video}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#2563eb', display: 'inline-block', marginTop: '6px' }}>
                                🎬 Ver grabación
                              </a>
                            )}
                          </div>
                        )}

                        {item.evaluacion_star && (
                          <div style={{ marginBottom: '16px' }}>
                            <p style={{ fontWeight: '600', marginBottom: '8px', fontSize: '12px' }}>⭐ Evaluación STAR:</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
                              <div style={{ textAlign: 'center', padding: '6px', background: '#f8fafc', borderRadius: '6px' }}>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#2563eb' }}>{item.evaluacion_star.situacion || 0}/100</div>
                                <div style={{ fontSize: '10px', color: '#64748b' }}>Situación</div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '6px', background: '#f8fafc', borderRadius: '6px' }}>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#2563eb' }}>{item.evaluacion_star.tarea || 0}/100</div>
                                <div style={{ fontSize: '10px', color: '#64748b' }}>Tarea</div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '6px', background: '#f8fafc', borderRadius: '6px' }}>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#2563eb' }}>{item.evaluacion_star.accion || 0}/100</div>
                                <div style={{ fontSize: '10px', color: '#64748b' }}>Acción</div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '6px', background: '#f8fafc', borderRadius: '6px' }}>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#2563eb' }}>{item.evaluacion_star.resultado || 0}/100</div>
                                <div style={{ fontSize: '10px', color: '#64748b' }}>Resultado</div>
                              </div>
                            </div>
                            {item.evaluacion_star.comentario && (
                              <p style={{ fontSize: '11px', color: '#475569', background: '#f1f5f9', padding: '6px', borderRadius: '6px' }}>
                                {item.evaluacion_star.comentario}
                              </p>
                            )}
                          </div>
                        )}

                        {item.feedback_detallado && (
                          <div style={{ marginBottom: '16px' }}>
                            <p style={{ fontWeight: '600', marginBottom: '6px', fontSize: '12px' }}>📊 Feedback detallado:</p>
                            <p style={{ lineHeight: '1.5', background: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '12px' }}>{item.feedback_detallado}</p>
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                          {item.fortalezas?.length > 0 && (
                            <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '8px' }}>
                              <strong style={{ color: '#059669', fontSize: '11px' }}>✅ Fortalezas en esta pregunta:</strong>
                              <ul style={{ marginTop: '6px', paddingLeft: '20px', fontSize: '11px' }}>
                                {item.fortalezas.map((f, i) => <li key={i}>{f}</li>)}
                              </ul>
                            </div>
                          )}
                          {item.areas_mejora?.length > 0 && (
                            <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '8px' }}>
                              <strong style={{ color: '#dc2626', fontSize: '11px' }}>⚠️ Áreas de mejora:</strong>
                              <ul style={{ marginTop: '6px', paddingLeft: '20px', fontSize: '11px' }}>
                                {item.areas_mejora.map((a, i) => <li key={i}>{a}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>

                        {item.justificacion_puntuacion && (
                          <div style={{ marginTop: '8px', padding: '8px', background: '#e0f2fe', borderRadius: '8px' }}>
                            <p style={{ fontSize: '11px', color: '#0369a1' }}><strong>🎯 Por qué esta puntuación:</strong> {item.justificacion_puntuacion}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {reporteCompleto.respuestas?.length > 0 && (
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>🎙️ RESPUESTAS DEL CANDIDATO</h2>
                {reporteCompleto.respuestas.map((r, idx) => (
                  <RespuestaItem key={idx} respuesta={r} idx={idx} API_URL={API_URL} />
                ))}
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button onClick={() => setModalReporteAbierto(false)} style={{ padding: '8px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cerrar informe</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntrevistasDashboard;
