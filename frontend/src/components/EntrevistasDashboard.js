// ========================================
// ENTREVISTAS DASHBOARD - INFORME PROFESIONAL COMPLETO
// ========================================
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// Componente separado para cada respuesta (para usar useState correctamente)
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
    <div style={{ 
      marginBottom: '16px', 
      background: '#f8fafc', 
      borderRadius: '16px', 
      overflow: 'hidden',
      border: '1px solid #e2e8f0',
      transition: 'all 0.2s'
    }}>
      <div style={{ 
        padding: '16px 20px', 
        background: '#ffffff',
        borderBottom: mostrarTranscripcion ? '1px solid #e2e8f0' : 'none',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <span style={{ 
            background: '#2563eb', 
            color: 'white', 
            padding: '4px 12px', 
            borderRadius: '20px', 
            fontSize: '12px',
            fontWeight: '600',
            marginRight: '12px'
          }}>
            Pregunta {idx + 1}
          </span>
          <span style={{ fontWeight: '500', color: '#1e293b' }}>{respuesta.pregunta?.substring(0, 80)}...</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {respuesta.video && (
            <a 
              href={`${API_URL}/entrevista/video/${respuesta.video}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                background: '#10b981', 
                color: 'white', 
                padding: '6px 12px', 
                borderRadius: '8px', 
                fontSize: '12px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              🎬 Video
            </a>
          )}
          <button
            onClick={cargarTranscripcion}
            disabled={cargando}
            style={{
              background: mostrarTranscripcion ? '#475569' : '#8b5cf6',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: cargando ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              opacity: cargando ? 0.7 : 1
            }}
          >
            {cargando ? '⏳ Cargando...' : (mostrarTranscripcion ? '📝 Ocultar transcripción' : '📝 Ver transcripción')}
          </button>
        </div>
      </div>
      
      {mostrarTranscripcion && (
        <div style={{ padding: '20px', background: '#fef3c7', borderTop: '1px solid #fde68a' }}>
          <div style={{ 
            background: 'white', 
            padding: '16px', 
            borderRadius: '12px',
            borderLeft: '4px solid #f59e0b'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#92400e', fontWeight: '600' }}>📋 TRANSCRIPCIÓN</span>
              <span style={{ fontSize: '10px', color: '#b45309' }}>
                ⏱️ Tiempo: {respuesta.tiempo || 0} segundos
              </span>
            </div>
            <p style={{ margin: 0, lineHeight: '1.6', color: '#1e293b', whiteSpace: 'pre-wrap' }}>
              {transcripcionCompleta || 'No hay transcripción disponible'}
            </p>
            {(!transcripcionCompleta || transcripcionCompleta === 'Grabación de video') && !cargando && (
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                ⚡ La transcripción se genera automáticamente después de la entrevista.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const EntrevistasDashboard = () => {
  const [entrevistas, setEntrevistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    fechaDesde: '',
    fechaHasta: '',
    busqueda: ''
  });
  const [reporteCompleto, setReporteCompleto] = useState(null);
  const [modalReporteAbierto, setModalReporteAbierto] = useState(false);
  const [cargandoReporte, setCargandoReporte] = useState(false);

  useEffect(() => {
    cargarEntrevistas();
  }, []);

  const cargarEntrevistas = async () => {
    try {
      const res = await axios.get(`${API_URL}/entrevistas/todas`);
      if (res.data.success) {
        const entrevistasMapeadas = res.data.entrevistas.map(e => ({
          id: e.id,
          fecha_inicio: e.fecha,
          candidato_nombre: e.candidato,
          plantilla: e.plantilla,
          estado: e.estado,
          duracion: e.duracion,
          puntuacion_global: e.puntuacion,
          tiene_analisis: e.tiene_analisis
        }));
        setEntrevistas(entrevistasMapeadas);
      }
    } catch (error) {
      console.error('Error cargando entrevistas:', error);
    } finally {
      setLoading(false);
    }
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
    } catch (error) {
      console.error('Error cargando reporte:', error);
      alert('Error al cargar el reporte');
    } finally {
      setCargandoReporte(false);
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (estado) => {
    const textos = {
      'pendiente': '⏳ Pendiente',
      'en_progreso': '🔄 En progreso',
      'completada': '✅ Completada',
      'analizada': '📊 Analizada'
    };
    const colores = {
      'pendiente': '#fef9c3',
      'en_progreso': '#dbeafe',
      'completada': '#dcfce7',
      'analizada': '#f3e8ff'
    };
    const coloresTexto = {
      'pendiente': '#854d0e',
      'en_progreso': '#1e40af',
      'completada': '#166534',
      'analizada': '#6b21a8'
    };
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: '500',
        backgroundColor: colores[estado] || '#f3f4f6',
        color: coloresTexto[estado] || '#374151'
      }}>
        {textos[estado] || estado}
      </span>
    );
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#2563eb';
    if (score >= 40) return '#ca8a04';
    return '#dc2626';
  };

  const entrevistasFiltradas = entrevistas.filter(e => {
    if (filtros.estado !== 'todos' && e.estado !== filtros.estado) return false;
    if (filtros.fechaDesde && new Date(e.fecha_inicio) < new Date(filtros.fechaDesde)) return false;
    if (filtros.fechaHasta && new Date(e.fecha_inicio) > new Date(filtros.fechaHasta)) return false;
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      return (e.candidato_nombre?.toLowerCase().includes(busqueda) ||
              e.plantilla?.toLowerCase().includes(busqueda));
    }
    return true;
  });

  const getCandidatoData = (rawData) => {
    if (!rawData) return {};
    try {
      if (typeof rawData === 'string') return JSON.parse(rawData);
      return rawData;
    } catch {
      return {};
    }
  };

  // Función para exportar a PDF
  const exportarPDF = async () => {
    try {
      const element = document.getElementById('reporte-pdf-content');
      if (!element) return;
      
      // Guardar estilos originales
      const originalOverflow = element.style.overflowY;
      const originalMaxHeight = element.style.maxHeight;
      const originalPosition = element.style.position;
      
      // Temporalmente quitar restricciones para capturar todo
      element.style.overflowY = 'visible';
      element.style.maxHeight = 'none';
      element.style.position = 'relative';
      
      // Pequeño delay para aplicar estilos
      await new Promise(r => setTimeout(r, 100));
      
      const html2pdf = (await import('html2pdf.js')).default;
      
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `informe_entrevista_${reporteCompleto.entrevista?.candidato_nombre?.replace(/\s/g, '_') || 'candidato'}_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          letterRendering: true, 
          useCORS: true,
          logging: false,
          windowWidth: element.scrollWidth
        },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(element).save();
      
      // Restaurar estilos originales
      element.style.overflowY = originalOverflow;
      element.style.maxHeight = originalMaxHeight;
      element.style.position = originalPosition;
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar PDF. Asegúrate de haber instalado html2pdf.js');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`
        @media print {
          .modal-overlay {
            position: absolute !important;
            background: white !important;
            padding: 0 !important;
          }
          .modal-overlay > div {
            box-shadow: none !important;
            padding: 20px !important;
            max-height: none !important;
            overflow: visible !important;
          }
          button {
            display: none !important;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '2rem', color: '#0f172a' }}>🎥 Gestión de Entrevistas</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ background: 'white', padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb', display: 'block' }}>{entrevistas.length}</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Total</span>
          </div>
          <div style={{ background: 'white', padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb', display: 'block' }}>{entrevistas.filter(e => e.estado === 'pendiente').length}</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Pendientes</span>
          </div>
          <div style={{ background: 'white', padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb', display: 'block' }}>{entrevistas.filter(e => e.estado === 'completada').length}</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Completadas</span>
          </div>
          <div style={{ background: 'white', padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb', display: 'block' }}>{entrevistas.filter(e => e.estado === 'analizada').length}</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Analizadas</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <select 
            value={filtros.estado}
            onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
            style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">⏳ Pendiente</option>
            <option value="en_progreso">🔄 En progreso</option>
            <option value="completada">✅ Completada</option>
            <option value="analizada">📊 Analizada</option>
          </select>

          <input
            type="date"
            value={filtros.fechaDesde}
            onChange={(e) => setFiltros({...filtros, fechaDesde: e.target.value})}
            style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
          />

          <input
            type="date"
            value={filtros.fechaHasta}
            onChange={(e) => setFiltros({...filtros, fechaHasta: e.target.value})}
            style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
          />

          <input
            type="text"
            value={filtros.busqueda}
            onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
            style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
            placeholder="🔍 Buscar candidato o plantilla..."
          />
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Fecha</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Candidato</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Plantilla</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Estado</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Duración</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Puntuación</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Cargando entrevistas...</td></tr>
            ) : entrevistasFiltradas.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No hay entrevistas para mostrar</td></tr>
            ) : (
              entrevistasFiltradas.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px' }}>{formatFecha(e.fecha_inicio)}</td>
                  <td style={{ padding: '12px' }}>
                    <strong>{e.candidato_nombre || 'N/A'}</strong>
                  </td>
                  <td style={{ padding: '12px' }}>{e.plantilla || '-'}</td>
                  <td style={{ padding: '12px' }}>{getStatusBadge(e.estado)}</td>
                  <td style={{ padding: '12px' }}>{e.duracion || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    {e.puntuacion_global ? (
                      <span style={{ background: '#2563eb', color: 'white', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>
                        {e.puntuacion_global}/100
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button 
                      onClick={() => verReporteCompleto(e.id)}
                      style={{
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        opacity: (e.estado !== 'analizada' && e.estado !== 'completada') ? 0.5 : 1
                      }}
                      disabled={e.estado !== 'analizada' && e.estado !== 'completada'}
                    >
                      📊 Informe completo
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL - INFORME PROFESIONAL COMPLETO */}
      {modalReporteAbierto && reporteCompleto && (
        <div className="modal-overlay" style={{
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
        }} onClick={() => setModalReporteAbierto(false)}>
          <div id="reporte-pdf-content" style={{
            background: 'white',
            maxWidth: '1200px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '16px',
            padding: '30px',
            position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Botones de acción */}
            <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '10px', zIndex: 10 }}>
              <button 
                onClick={exportarPDF}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Exportar a PDF"
              >
                📄
              </button>
              <button 
                onClick={() => setModalReporteAbierto(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Encabezado */}
            <div style={{ textAlign: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
              <h1 style={{ fontSize: '28px', color: '#0f172a', marginBottom: '8px' }}>📊 INFORME DE EVALUACIÓN</h1>
              <p style={{ color: '#64748b' }}>Entrevista profesional · {reporteCompleto.entrevista?.candidato_nombre || 'Candidato'}</p>
              <p style={{ color: '#64748b', fontSize: '12px' }}>Fecha: {formatFecha(reporteCompleto.entrevista?.fecha_inicio)}</p>
            </div>

            {/* Perfil del Candidato */}
            <div style={{ marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#0f172a' }}>👤 PERFIL DEL CANDIDATO</h2>
              {(() => {
                const candidatoData = getCandidatoData(reporteCompleto.entrevista?.candidato_data);
                const interpretacion = candidatoData?.interpretacion || {};
                const datosCrudos = candidatoData?.datos_crudos || {};
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div><strong>Nombre:</strong> {datosCrudos.nombre || reporteCompleto.entrevista?.candidato_nombre || 'N/A'}</div>
                    <div><strong>Profesión:</strong> {datosCrudos.profesion_escrita || 'N/A'}</div>
                    <div><strong>Seniority:</strong> <span style={{ background: '#e0f2fe', padding: '2px 8px', borderRadius: '12px' }}>{interpretacion.seniority || 'N/A'}</span></div>
                    <div><strong>Años experiencia:</strong> {interpretacion.anos_experiencia_deducidos || 'N/A'}</div>
                    <div><strong>Ubicación:</strong> {datosCrudos.ubicacion || 'N/A'}</div>
                    <div><strong>Email:</strong> {datosCrudos.email || 'N/A'}</div>
                  </div>
                );
              })()}
            </div>

            {/* Perfil del Puesto */}
            {reporteCompleto.plantilla?.perfil_puesto && (
              <div style={{ marginBottom: '30px', background: '#eff6ff', padding: '20px', borderRadius: '12px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#0f172a' }}>🎯 PERFIL DEL PUESTO</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '15px' }}>
                  <div><strong>Título:</strong> {reporteCompleto.plantilla.perfil_puesto.titulo || 'No especificado'}</div>
                  <div><strong>Seniority requerido:</strong> {reporteCompleto.plantilla.perfil_puesto.seniority || 'No especificado'}</div>
                </div>
                {reporteCompleto.plantilla.perfil_puesto.requisitos?.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong>📋 Requisitos del puesto:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      {reporteCompleto.plantilla.perfil_puesto.requisitos.map((req, i) => <li key={i}>{req}</li>)}
                    </ul>
                  </div>
                )}
                {reporteCompleto.plantilla.perfil_puesto.responsabilidades?.length > 0 && (
                  <div>
                    <strong>⚡ Responsabilidades:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      {reporteCompleto.plantilla.perfil_puesto.responsabilidades.map((resp, i) => <li key={i}>{resp}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Cultura Organizacional */}
            {reporteCompleto.plantilla?.cultura_empresa && (
              <div style={{ marginBottom: '30px', background: '#fef3c7', padding: '20px', borderRadius: '12px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#0f172a' }}>🏢 CULTURA ORGANIZACIONAL</h2>
                {reporteCompleto.plantilla.cultura_empresa.valores?.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Valores:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      {reporteCompleto.plantilla.cultura_empresa.valores.map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                  </div>
                )}
                {reporteCompleto.plantilla.cultura_empresa.ambiente && (
                  <div>
                    <strong>Ambiente de trabajo:</strong>
                    <p style={{ marginTop: '8px', fontSize: '14px' }}>{reporteCompleto.plantilla.cultura_empresa.ambiente}</p>
                  </div>
                )}
              </div>
            )}

            {/* Objetivo de la Entrevista */}
            {reporteCompleto.plantilla?.objetivo && (
              <div style={{ marginBottom: '30px', background: '#f0fdf4', padding: '20px', borderRadius: '12px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#0f172a' }}>🎯 OBJETIVO DE LA ENTREVISTA</h2>
                <p style={{ lineHeight: '1.6' }}>{reporteCompleto.plantilla.objetivo}</p>
              </div>
            )}

            {/* Puntuación Global */}
            <div style={{ marginBottom: '30px', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#0f172a' }}>📊 PUNTUACIÓN GLOBAL</h2>
              {(() => {
                const score = reporteCompleto.entrevista?.analisis?.score_global || reporteCompleto.entrevista?.puntuacion || 0;
                const scoreColor = getScoreColor(score);
                return (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', fontWeight: '700', color: scoreColor }}>{score}/100</div>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', marginTop: '10px' }}>
                      <div style={{ width: `${score}%`, height: '8px', background: scoreColor, borderRadius: '4px' }}></div>
                    </div>
                    <p style={{ marginTop: '10px', color: '#64748b' }}>
                      {score >= 80 ? '✅ Perfil altamente compatible' :
                       score >= 60 ? '📌 Perfil compatible con observaciones' :
                       score >= 40 ? '⚠️ Perfil con brechas significativas' :
                       '❌ Perfil no recomendado para el puesto'}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Evaluación General */}
            {reporteCompleto.entrevista?.analisis?.resumen_ejecutivo && (
              <div style={{ marginBottom: '30px', background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#0f172a' }}>📋 EVALUACIÓN GENERAL</h2>
                <p style={{ lineHeight: '1.6', marginBottom: '15px' }}>
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
                    <p style={{ marginTop: '5px', fontSize: '13px' }}>{reporteCompleto.entrevista.analisis.resumen_ejecutivo.justificacion_tecnica}</p>
                  </div>
                )}
                {reporteCompleto.entrevista.analisis.resumen_ejecutivo.justificacion_cultural && (
                  <div style={{ marginTop: '10px', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                    <strong>🏢 Justificación cultural:</strong>
                    <p style={{ marginTop: '5px', fontSize: '13px' }}>{reporteCompleto.entrevista.analisis.resumen_ejecutivo.justificacion_cultural}</p>
                  </div>
                )}
              </div>
            )}

            {/* Fortalezas y Áreas de Mejora */}
            <div style={{ marginBottom: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#059669' }}>✅ FORTALEZAS</h2>
                <ul style={{ paddingLeft: '20px' }}>
                  {(reporteCompleto.entrevista?.analisis?.fortalezas_generales || []).map((f, i) => <li key={i} style={{ marginBottom: '8px' }}>{f}</li>)}
                  {(reporteCompleto.entrevista?.analisis?.fortalezas_destacadas || []).map((f, i) => <li key={i} style={{ marginBottom: '8px' }}>{f}</li>)}
                </ul>
              </div>
              <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '12px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#dc2626' }}>⚠️ ÁREAS DE MEJORA</h2>
                <ul style={{ paddingLeft: '20px' }}>
                  {(reporteCompleto.entrevista?.analisis?.areas_mejora || []).map((a, i) => <li key={i} style={{ marginBottom: '8px' }}>{a}</li>)}
                </ul>
              </div>
            </div>

            {/* Recomendación Final */}
            {reporteCompleto.entrevista?.analisis?.recomendacion_final && (
              <div style={{ marginBottom: '30px', padding: '20px', borderRadius: '12px', background: '#fff7ed', border: '1px solid #fed7aa' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#0f172a' }}>📌 RECOMENDACIÓN FINAL</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', marginBottom: '15px' }}>
                  <span style={{
                    padding: '8px 20px',
                    borderRadius: '20px',
                    fontWeight: '700',
                    background: reporteCompleto.entrevista.analisis.recomendacion_final.decision === 'contratar' ? '#16a34a' :
                               reporteCompleto.entrevista.analisis.recomendacion_final.decision === 'avanzar' ? '#2563eb' : '#dc2626',
                    color: 'white'
                  }}>
                    {reporteCompleto.entrevista.analisis.recomendacion_final.decision === 'contratar' ? '✅ CONTRATAR' :
                     reporteCompleto.entrevista.analisis.recomendacion_final.decision === 'avanzar' ? '🔄 AVANZAR EN PROCESO' :
                     '❌ NO RECOMENDABLE'}
                  </span>
                </div>
                <p style={{ lineHeight: '1.6' }}>{reporteCompleto.entrevista.analisis.recomendacion_final.argumento}</p>
              </div>
            )}

            {/* Insight Headhunter */}
            {reporteCompleto.entrevista?.analisis?.insight_headhunter && (
              <div style={{ marginBottom: '30px', background: '#f3e8ff', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #7c3aed' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#0f172a' }}>🎯 INSIGHT DEL HEADHUNTER</h2>
                <p style={{ lineHeight: '1.6' }}>{reporteCompleto.entrevista.analisis.insight_headhunter}</p>
              </div>
            )}

            {/* Evaluación STAR Promedio */}
            {reporteCompleto.entrevista?.analisis?.evaluacion_star && (
              <div style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#0f172a' }}>⭐ EVALUACIÓN STAR (PROMEDIO)</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ textAlign: 'center', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>{reporteCompleto.entrevista.analisis.evaluacion_star.situacion_promedio || 0}/100</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Situación</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>{reporteCompleto.entrevista.analisis.evaluacion_star.tarea_promedio || 0}/100</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Tarea</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>{reporteCompleto.entrevista.analisis.evaluacion_star.accion_promedio || 0}/100</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Acción</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>{reporteCompleto.entrevista.analisis.evaluacion_star.resultado_promedio || 0}/100</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Resultado</div>
                  </div>
                </div>
              </div>
            )}

            {/* Análisis por Pregunta */}
            {reporteCompleto.entrevista?.analisis?.analisis_por_pregunta?.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#0f172a' }}>📝 ANÁLISIS POR PREGUNTA</h2>
                {reporteCompleto.entrevista.analisis.analisis_por_pregunta.map((item, idx) => {
                  const respuestaOriginal = reporteCompleto.respuestas?.find(r => r.pregunta === item.pregunta);
                  return (
                    <div key={idx} style={{ marginBottom: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ background: '#f8fafc', padding: '15px', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div>
                            <strong style={{ fontSize: '16px' }}>Pregunta {idx + 1}</strong>
                            <span style={{ marginLeft: '10px', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                              {item.competencia || 'Competencia'}
                            </span>
                          </div>
                          <span style={{
                            background: item.puntuacion_star >= 70 ? '#dcfce7' : item.puntuacion_star >= 50 ? '#fef9c3' : '#fee2e2',
                            color: item.puntuacion_star >= 70 ? '#166534' : item.puntuacion_star >= 50 ? '#854d0e' : '#991b1b',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}>
                            Puntuación: {item.puntuacion_star || item.puntuacion || 0}/100
                          </span>
                        </div>
                      </div>
                      <div style={{ padding: '20px' }}>
                        <div style={{ marginBottom: '20px', background: '#f1f5f9', padding: '12px', borderRadius: '8px' }}>
                          <p style={{ marginBottom: '8px' }}><strong>📌 Pregunta:</strong></p>
                          <p style={{ marginBottom: '12px' }}>{item.pregunta}</p>
                          {item.objetivo_pregunta && (
                            <>
                              <p style={{ marginBottom: '4px', fontSize: '13px', color: '#475569' }}><strong>🎯 Objetivo de la pregunta:</strong></p>
                              <p style={{ fontSize: '13px', color: '#475569' }}>{item.objetivo_pregunta}</p>
                            </>
                          )}
                        </div>

                        {respuestaOriginal && (
                          <div style={{ marginBottom: '20px', background: '#fef3c7', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                            <p style={{ marginBottom: '8px' }}><strong>🗣️ Respuesta del candidato:</strong></p>
                            <p style={{ fontStyle: 'italic' }}>{respuestaOriginal.respuesta || '[Grabación de video - revisar archivo]'}</p>
                            <p style={{ marginTop: '8px', fontSize: '12px', color: '#92400e' }}>⏱️ Tiempo de respuesta: {respuestaOriginal.tiempo || 0} segundos</p>
                            {respuestaOriginal.video && (
                              <a href={`${API_URL}/entrevista/video/${respuestaOriginal.video}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#2563eb', display: 'inline-block', marginTop: '8px' }}>
                                🎬 Ver grabación
                              </a>
                            )}
                          </div>
                        )}

                        {item.evaluacion_star && (
                          <div style={{ marginBottom: '20px' }}>
                            <p style={{ fontWeight: '600', marginBottom: '10px' }}>⭐ Evaluación STAR:</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '10px' }}>
                              <div style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>{item.evaluacion_star.situacion || 0}/100</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>Situación</div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>{item.evaluacion_star.tarea || 0}/100</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>Tarea</div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>{item.evaluacion_star.accion || 0}/100</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>Acción</div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>{item.evaluacion_star.resultado || 0}/100</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>Resultado</div>
                              </div>
                            </div>
                            {item.evaluacion_star.comentario && (
                              <p style={{ fontSize: '13px', color: '#475569', background: '#f1f5f9', padding: '8px', borderRadius: '6px' }}>
                                {item.evaluacion_star.comentario}
                              </p>
                            )}
                          </div>
                        )}

                        {item.feedback_detallado && (
                          <div style={{ marginBottom: '20px' }}>
                            <p style={{ fontWeight: '600', marginBottom: '8px' }}>📊 Feedback detallado:</p>
                            <p style={{ lineHeight: '1.6', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>{item.feedback_detallado}</p>
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                          {item.fortalezas?.length > 0 && (
                            <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px' }}>
                              <strong style={{ color: '#059669' }}>✅ Fortalezas en esta pregunta:</strong>
                              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                                {item.fortalezas.map((f, i) => <li key={i} style={{ marginBottom: '4px' }}>{f}</li>)}
                              </ul>
                            </div>
                          )}
                          {item.areas_mejora?.length > 0 && (
                            <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px' }}>
                              <strong style={{ color: '#dc2626' }}>⚠️ Áreas de mejora:</strong>
                              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                                {item.areas_mejora.map((a, i) => <li key={i} style={{ marginBottom: '4px' }}>{a}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>

                        {item.justificacion_puntuacion && (
                          <div style={{ marginTop: '10px', padding: '10px', background: '#e0f2fe', borderRadius: '8px' }}>
                            <p style={{ fontSize: '13px', color: '#0369a1' }}><strong>🎯 Por qué esta puntuación:</strong> {item.justificacion_puntuacion}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Respuestas del Candidato con botón de transcripción */}
            {reporteCompleto.respuestas?.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#0f172a' }}>🎙️ RESPUESTAS DEL CANDIDATO</h2>
                {reporteCompleto.respuestas.map((r, idx) => (
                  <RespuestaItem 
                    key={idx} 
                    respuesta={r} 
                    idx={idx} 
                    API_URL={API_URL}
                  />
                ))}
              </div>
            )}

            {/* Botón cerrar al final */}
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button 
                onClick={() => setModalReporteAbierto(false)}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cerrar informe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntrevistasDashboard;