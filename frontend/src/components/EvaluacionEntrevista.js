import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = 'http://localhost:5001/api';

const EvaluacionEntrevista = ({ entrevistaId, onClose }) => {
  const [analisis, setAnalisis] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarAnalisis();
  }, [entrevistaId]);

  const cargarAnalisis = async () => {
    setCargando(true);
    try {
      const res = await axios.get(`${API_URL}/entrevista/resultado-detallado/${entrevistaId}`);
      if (res.data.analisis) {
        setAnalisis(res.data.analisis);
      } else {
        const resGenerar = await axios.post(`${API_URL}/entrevista/analizar-profundo/${entrevistaId}`);
        if (resGenerar.data.success) {
          setAnalisis(resGenerar.data.analisis);
        }
      }
    } catch (err) {
      setError('Error cargando el análisis');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const exportarPDF = () => {
    if (!analisis) return;
    
    const doc = new jsPDF();
    let yPos = 20;
    
    // Título
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246);
    doc.text('INFORME DE EVALUACIÓN', 105, yPos, { align: 'center' });
    yPos += 15;
    
    // Datos
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Candidato: ${analisis.entrevista?.candidato_nombre || 'No especificado'}`, 20, yPos);
    yPos += 7;
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CR')}`, 20, yPos);
    yPos += 15;
    
    // Score
    const score = analisis.score_global || 0;
    const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
    doc.setFillColor(245, 245, 245);
    doc.rect(20, yPos, 170, 40, 'F');
    doc.setFontSize(28);
    doc.setTextColor(scoreColor);
    doc.text(`${score}/100`, 105, yPos + 18, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Puntuación Global', 105, yPos + 30, { align: 'center' });
    yPos += 50;
    
    // Recomendación
    doc.setFontSize(12);
    const decision = analisis.recomendacion_final?.decision || 'No disponible';
    let decisionText = '';
    let decisionColor = '';
    if (decision === 'contratar') { decisionText = 'CONTRATAR'; decisionColor = '#10b981'; }
    else if (decision === 'avanzar') { decisionText = 'AVANZAR'; decisionColor = '#3b82f6'; }
    else if (decision === 'validar') { decisionText = 'VALIDAR'; decisionColor = '#f59e0b'; }
    else { decisionText = 'NO RECOMENDABLE'; decisionColor = '#ef4444'; }
    doc.setTextColor(decisionColor);
    doc.text(`✅ ${decisionText}`, 20, yPos);
    yPos += 15;
    doc.setTextColor(0, 0, 0);
    
    // Resumen Ejecutivo
    if (analisis.resumen_ejecutivo) {
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text('📋 RESUMEN EJECUTIVO', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      const resumen = doc.splitTextToSize(analisis.resumen_ejecutivo.nivel_general || 'No disponible', 170);
      doc.text(resumen, 20, yPos);
      yPos += resumen.length * 5 + 10;
      
      // Fortalezas
      doc.setFontSize(11);
      doc.setTextColor(16, 185, 129);
      doc.text('Fortalezas:', 20, yPos);
      yPos += 5;
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      (analisis.resumen_ejecutivo.principales_fortalezas || []).slice(0, 4).forEach((f) => {
        const lines = doc.splitTextToSize(`• ${f}`, 165);
        doc.text(lines, 25, yPos);
        yPos += lines.length * 4 + 2;
      });
      yPos += 5;
      
      // Riesgos
      doc.setFontSize(11);
      doc.setTextColor(239, 68, 68);
      doc.text('Riesgos:', 20, yPos);
      yPos += 5;
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      (analisis.resumen_ejecutivo.principales_riesgos || []).slice(0, 4).forEach((r) => {
        const lines = doc.splitTextToSize(`• ${r}`, 165);
        doc.text(lines, 25, yPos);
        yPos += lines.length * 4 + 2;
      });
      yPos += 10;
    }
    
    // Competencias Blandas
    if (analisis.analisis_competencias_blandas?.length > 0) {
      if (yPos > 250) { doc.addPage(); yPos = 20; }
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text('⭐ COMPETENCIAS BLANDAS', 20, yPos);
      yPos += 10;
      
      const competenciasData = analisis.analisis_competencias_blandas.map(c => [
        c.competencia, `${c.puntuacion}%`, c.nivel, c.evidencia?.substring(0, 60) || ''
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Competencia', 'Score', 'Nivel', 'Evidencia']],
        body: competenciasData,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
        columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 25 }, 2: { cellWidth: 25 }, 3: { cellWidth: 80 } }
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }
    
    // Competencias Técnicas
    if (analisis.analisis_competencias_tecnicas?.length > 0) {
      if (yPos > 250) { doc.addPage(); yPos = 20; }
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text('🔧 COMPETENCIAS TÉCNICAS', 20, yPos);
      yPos += 10;
      
      const tecnicasData = analisis.analisis_competencias_tecnicas.map(c => [
        c.tecnologia, c.nivel_cv || 'N/A', c.nivel_entrevista || 'N/A', c.gap || 'N/A', c.evidencia?.substring(0, 50) || ''
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Tecnología', 'CV', 'Entrevista', 'Gap', 'Evidencia']],
        body: tecnicasData,
        theme: 'striped',
        styles: { fontSize: 7 },
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] }
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }
    
    // Insight
    if (analisis.insight_headhunter) {
      if (yPos > 250) { doc.addPage(); yPos = 20; }
      doc.setFontSize(14);
      doc.setTextColor(139, 92, 246);
      doc.text('🎯 INSIGHT DEL HEADHUNTER', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      const insight = doc.splitTextToSize(analisis.insight_headhunter, 170);
      doc.text(insight, 20, yPos);
      yPos += insight.length * 5 + 15;
      
      if (analisis.deteccion_ia) {
        doc.setFontSize(12);
        doc.setTextColor(100, 116, 139);
        doc.text('🤖 DETECCIÓN DE IA', 20, yPos);
        yPos += 8;
        doc.setFontSize(10);
        doc.text(`Probabilidad: ${analisis.deteccion_ia.probabilidad || 'No determinada'}`, 25, yPos);
        yPos += 6;
        if (analisis.deteccion_ia.razones?.length) {
          doc.text('Razones:', 25, yPos);
          yPos += 5;
          analisis.deteccion_ia.razones.slice(0, 3).forEach((r) => {
            const lines = doc.splitTextToSize(`• ${r}`, 155);
            doc.text(lines, 30, yPos);
            yPos += lines.length * 4 + 2;
          });
        }
        yPos += 10;
      }
    }
    
    // Preguntas de Seguimiento
    if (analisis.preguntas_seguimiento?.length > 0) {
      if (yPos > 250) { doc.addPage(); yPos = 20; }
      doc.setFontSize(12);
      doc.setTextColor(59, 130, 246);
      doc.text('📝 PREGUNTAS DE SEGUIMIENTO', 20, yPos);
      yPos += 8;
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      analisis.preguntas_seguimiento.slice(0, 6).forEach((p) => {
        const lines = doc.splitTextToSize(`• ${p}`, 165);
        doc.text(lines, 25, yPos);
        yPos += lines.length * 4 + 2;
      });
      yPos += 10;
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(`Talent Pipeline - Informe generado el ${new Date().toLocaleDateString('es-CR')}`, 105, 285, { align: 'center' });
      doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
    }
    
    doc.save(`informe_entrevista_${entrevistaId}.pdf`);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excelente';
    if (score >= 80) return 'Muy Bueno';
    if (score >= 70) return 'Bueno';
    if (score >= 60) return 'Aceptable';
    if (score >= 50) return 'Regular';
    return 'Riesgo';
  };

  const getNivelBadge = (nivel) => {
    const colores = {
      'Alto': 'bg-green-100 text-green-800',
      'Medio': 'bg-yellow-100 text-yellow-800',
      'Bajo': 'bg-red-100 text-red-800'
    };
    return colores[nivel] || 'bg-gray-100 text-gray-800';
  };

  if (cargando) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Generando análisis profesional...</p>
          <p className="text-xs text-gray-400 mt-2">Esto puede tomar hasta 20 segundos</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Error al cargar</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={cargarAnalisis} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!analisis) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 text-center">
          <p className="text-gray-600">No hay análisis disponible para esta entrevista</p>
          <button onClick={cargarAnalisis} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Generar análisis
          </button>
        </div>
      </div>
    );
  }

  const score = analisis.score_global || 0;
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">📊 Evaluación de Entrevista</h2>
              <p className="text-blue-100 text-sm mt-1">
                {analisis.entrevista?.candidato_nombre || 'Candidato'} · {analisis.entrevista?.plantilla || 'Entrevista'}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={exportarPDF}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition flex items-center gap-2 text-sm font-medium"
              >
                📄 Exportar PDF
              </button>
              <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl transition"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Score Global */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">Puntuación Global</p>
                <p className="text-5xl font-bold" style={{ color: scoreColor }}>{score}/100</p>
                <p className="text-sm font-medium mt-1" style={{ color: scoreColor }}>{scoreLabel}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 uppercase tracking-wide">Recomendación</p>
                <p className={`text-lg font-bold ${
                  analisis.recomendacion_final?.decision === 'contratar' ? 'text-green-600' :
                  analisis.recomendacion_final?.decision === 'avanzar' ? 'text-blue-600' :
                  analisis.recomendacion_final?.decision === 'validar' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {analisis.recomendacion_final?.decision === 'contratar' && '✅ Contratar'}
                  {analisis.recomendacion_final?.decision === 'avanzar' && '➡️ Avanzar'}
                  {analisis.recomendacion_final?.decision === 'validar' && '🔍 Validar'}
                  {analisis.recomendacion_final?.decision === 'no_recomendable' && '❌ No recomendable'}
                </p>
              </div>
            </div>
          </div>

          {/* Resumen Ejecutivo */}
          {analisis.resumen_ejecutivo && (
            <div className="border-l-4 border-blue-500 bg-blue-50 rounded-r-xl p-5">
              <h3 className="font-semibold text-blue-800 mb-2">📋 Resumen Ejecutivo</h3>
              <p className="text-gray-700">{analisis.resumen_ejecutivo.nivel_general}</p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="font-medium text-green-700 text-sm">✅ Fortalezas</p>
                  <ul className="list-disc pl-5 mt-1">
                    {analisis.resumen_ejecutivo.principales_fortalezas?.slice(0, 3).map((f, i) => (
                      <li key={i} className="text-sm text-gray-600">{f}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-red-700 text-sm">⚠️ Riesgos</p>
                  <ul className="list-disc pl-5 mt-1">
                    {analisis.resumen_ejecutivo.principales_riesgos?.slice(0, 3).map((r, i) => (
                      <li key={i} className="text-sm text-gray-600">{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Competencias Blandas */}
          {analisis.analisis_competencias_blandas?.length > 0 && (
            <div className="border rounded-xl p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-xl">⭐</span> Competencias Blandas
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {analisis.analisis_competencias_blandas.map((c, i) => (
                  <div key={i} className="border-b pb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-700">{c.competencia}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getNivelBadge(c.nivel)}`}>
                        {c.puntuacion} - {c.nivel}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${c.puntuacion}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{c.evidencia}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competencias Técnicas */}
          {analisis.analisis_competencias_tecnicas?.length > 0 && (
            <div className="border rounded-xl p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-xl">🔧</span> Competencias Técnicas
              </h3>
              <div className="space-y-3">
                {analisis.analisis_competencias_tecnicas.map((c, i) => (
                  <div key={i} className="border-b pb-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{c.tecnologia}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.gap === 'Sin gap' ? 'bg-green-100 text-green-700' :
                        c.gap === 'Parcial' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>{c.gap}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">CV: {c.nivel_cv} | Entrevista: {c.nivel_entrevista}</p>
                    <p className="text-xs text-gray-500 mt-1">{c.evidencia}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Análisis de Comunicación y Cognitivo */}
          <div className="grid md:grid-cols-2 gap-4">
            {analisis.analisis_comunicacion && (
              <div className="border rounded-xl p-5">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">🎤</span> Comunicación
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span>Claridad</span><span className="font-medium">{analisis.analisis_comunicacion.claridad}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${analisis.analisis_comunicacion.claridad}%` }}></div></div>
                  <div className="flex justify-between text-sm mt-2"><span>Seguridad</span><span className="font-medium">{analisis.analisis_comunicacion.seguridad}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${analisis.analisis_comunicacion.seguridad}%` }}></div></div>
                </div>
              </div>
            )}

            {analisis.analisis_cognitivo && (
              <div className="border rounded-xl p-5">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">🧠</span> Análisis Cognitivo
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Razonamiento lógico:</span> {analisis.analisis_cognitivo.razonamiento_logico}</p>
                  <p><span className="font-medium">Estructura de ideas:</span> {analisis.analisis_cognitivo.estructura_ideas}</p>
                  <p><span className="font-medium">Resolución de problemas:</span> {analisis.analisis_cognitivo.resolucion_problemas}</p>
                </div>
              </div>
            )}
          </div>

          {/* Insight */}
          {analisis.insight_headhunter && (
            <div className="border-l-4 border-purple-500 bg-purple-50 rounded-r-xl p-5">
              <h3 className="font-semibold text-purple-700 mb-2 flex items-center gap-2">
                <span className="text-xl">🎯</span> Insight del Headhunter
              </h3>
              <p className="text-gray-700">{analisis.insight_headhunter}</p>
            </div>
          )}

          {/* Detección IA */}
          {analisis.deteccion_ia && (
            <div className={`rounded-xl p-4 ${
              analisis.deteccion_ia.probabilidad === 'Alta' ? 'bg-red-50 border border-red-200' :
              analisis.deteccion_ia.probabilidad === 'Media' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <span className="font-medium">Detección de IA</span>
                <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${
                  analisis.deteccion_ia.probabilidad === 'Alta' ? 'bg-red-200 text-red-800' :
                  analisis.deteccion_ia.probabilidad === 'Media' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-green-200 text-green-800'
                }`}>{analisis.deteccion_ia.probabilidad}</span>
              </div>
              <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
                {analisis.deteccion_ia.razones?.slice(0, 2).map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          {/* Preguntas de Seguimiento */}
          {analisis.preguntas_seguimiento?.length > 0 && (
            <div className="border rounded-xl p-5 bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-xl">📝</span> Preguntas de Seguimiento
              </h3>
              <ul className="space-y-2">
                {analisis.preguntas_seguimiento.map((p, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-500">•</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recomendaciones */}
          {analisis.recomendaciones_cliente?.length > 0 && (
            <div className="border rounded-xl p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-xl">💡</span> Recomendaciones
              </h3>
              <ul className="space-y-2">
                {analisis.recomendaciones_cliente.map((r, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-500">✓</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition font-medium">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluacionEntrevista;