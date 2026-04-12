import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const EvaluacionEntrevista = ({ entrevistaId, onClose }) => {
  const [evaluacion, setEvaluacion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEvaluacion();
  }, [entrevistaId]);

  const cargarEvaluacion = async () => {
    try {
      const res = await axios.get(`${API_URL}/entrevista/resultado-detallado/${entrevistaId}`);
      if (res.data.success) {
        setEvaluacion(res.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-professional" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
          <div className="p-8 text-center">Cargando evaluación...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-professional" style={{ maxWidth: '700px', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2>📊 Evaluación de Entrevista</h2>
          <p>{evaluacion?.entrevista?.candidato_nombre}</p>
        </div>

        <div className="modal-body">
          {evaluacion?.entrevista?.analisis ? (
            <>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <span className="text-sm text-gray-600">Puntuación Global</span>
                    <div className="text-2xl font-bold text-blue-600">
                      {evaluacion.entrevista.analisis.score_global || evaluacion.entrevista.puntuacion}/100
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Recomendación</span>
                    <div className="font-semibold">
                      {evaluacion.entrevista.analisis.recomendacion_final?.decision || 'No disponible'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">📋 Resumen Ejecutivo</h3>
                <p className="text-gray-700">{evaluacion.entrevista.analisis.resumen_ejecutivo?.evaluacion_general}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-green-700 mb-2">✅ Fortalezas</h4>
                  <ul className="list-disc pl-4 text-sm">
                    {(evaluacion.entrevista.analisis.fortalezas_generales || []).map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-orange-700 mb-2">📈 Áreas de mejora</h4>
                  <ul className="list-disc pl-4 text-sm">
                    {(evaluacion.entrevista.analisis.areas_mejora || []).map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500">No hay análisis disponible para esta entrevista</p>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default EvaluacionEntrevista;
