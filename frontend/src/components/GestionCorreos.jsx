import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const GestionCorreos = () => {
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPlantillas();
  }, []);

  const cargarPlantillas = async () => {
    try {
      const res = await axios.get(`${API_URL}/correos/plantillas`);
      if (res.data.success) {
        setPlantillas(res.data.plantillas);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-flat" style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '1rem' }}>
        📧 Gestión de Correos
      </h2>
      <p style={{ color: '#64748b', marginBottom: '1rem' }}>
        Módulo de gestión de correos electrónicos
      </p>
      
      {loading ? (
        <p>Cargando plantillas...</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {plantillas.map(p => (
            <div key={p.id} className="card-flat" style={{ padding: '1rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{p.nombre}</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Asunto: {p.asunto}</p>
            </div>
          ))}
          {plantillas.length === 0 && (
            <p style={{ textAlign: 'center', color: '#94a3b8' }}>No hay plantillas de correo</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GestionCorreos;
