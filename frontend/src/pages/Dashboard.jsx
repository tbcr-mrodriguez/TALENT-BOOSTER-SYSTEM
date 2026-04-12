import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCandidatos: 0,
    totalEntrevistas: 0,
    totalPuestosActivos: 0,
    matchPromedio: 0,
    candidatosPorSeniority: [],
    candidatosPorSector: [],
    entrevistasPorEstado: [],
    candidatosPorEtapa: [],
    ultimosCandidatos: [],
    postulacionesPorMes: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodo, setPeriodo] = useState('6');

  useEffect(() => {
    cargarDashboard();
  }, [periodo]);

  const cargarDashboard = async () => {
    try {
      setRefreshing(true);
      const res = await axios.get(`${API_URL}/dashboard?periodo=${periodo}`);
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return { bg: '#d1fae5', text: '#065f46' };
    if (score >= 60) return { bg: '#fed7aa', text: '#9a3412' };
    return { bg: '#fee2e2', text: '#991b1b' };
  };

  const getSeniorityColor = (seniority) => {
    if (seniority === 'Senior') return { bg: '#d1fae5', text: '#065f46' };
    if (seniority === 'Semi-Senior') return { bg: '#dbeafe', text: '#1e40af' };
    if (seniority === 'Junior') return { bg: '#fef3c7', text: '#92400e' };
    return { bg: '#f1f5f9', text: '#475569' };
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '400px',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #e2e8f0', 
            borderTopColor: '#3b82f6', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 12px'
          }} />
          <p style={{ color: '#64748b', fontSize: '13px' }}>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .kpi-card {
          transition: all 0.3s ease;
        }
        .kpi-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -12px rgba(0,0,0,0.15);
        }
        .table-row:hover {
          background: #f8fafc;
        }
      `}</style>

      {/* Barra de controles (periodo y actualizar) */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'center', 
        gap: '12px',
        marginBottom: '24px'
      }}>
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            background: 'white',
            color: '#475569',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <option value="3">Últimos 3 meses</option>
          <option value="6">Últimos 6 meses</option>
          <option value="12">Últimos 12 meses</option>
        </select>
        <button
          onClick={cargarDashboard}
          disabled={refreshing}
          style={{
            padding: '8px 18px',
            borderRadius: '10px',
            border: 'none',
            background: '#3b82f6',
            color: 'white',
            fontSize: '13px',
            fontWeight: '500',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            opacity: refreshing ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* KPIs Grid - 4 tarjetas principales */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Total Candidatos */}
        <div className="kpi-card" style={{ 
          background: 'white', 
          borderRadius: '20px', 
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase' }}>
                Total Candidatos
              </p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginTop: '4px' }}>
                {stats.totalCandidatos.toLocaleString()}
              </p>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Entrevistas */}
        <div className="kpi-card" style={{ 
          background: 'white', 
          borderRadius: '20px', 
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase' }}>
                Entrevistas
              </p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginTop: '4px' }}>
                {stats.totalEntrevistas.toLocaleString()}
              </p>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Puestos Activos */}
        <div className="kpi-card" style={{ 
          background: 'white', 
          borderRadius: '20px', 
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase' }}>
                Puestos Activos
              </p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginTop: '4px' }}>
                {stats.totalPuestosActivos.toLocaleString()}
              </p>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Match Promedio */}
        <div className="kpi-card" style={{ 
          background: 'white', 
          borderRadius: '20px', 
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase' }}>
                Match Promedio
              </p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginTop: '4px' }}>
                {stats.matchPromedio}%
              </p>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Seniority Distribution */}
      <div style={{ 
        background: 'white', 
        borderRadius: '20px', 
        padding: '20px',
        border: '1px solid #e2e8f0',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
          📊 Distribución por Seniority
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {stats.candidatosPorSeniority.map((item, idx) => {
            const total = stats.candidatosPorSeniority.reduce((sum, i) => sum + i.value, 0);
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            let barColor = '#3b82f6';
            if (item.name === 'Senior') barColor = '#10b981';
            if (item.name === 'Semi-Senior') barColor = '#8b5cf6';
            if (item.name === 'Junior') barColor = '#f59e0b';
            if (item.name === 'Trainee') barColor = '#ef4444';
            
            return (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#475569' }}>{item.name}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{item.value}</span>
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${percentage}%`, 
                    height: '8px', 
                    background: barColor, 
                    borderRadius: '8px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            );
          })}
          {stats.candidatosPorSeniority.length === 0 && (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No hay datos</p>
          )}
        </div>
      </div>

      {/* Sectores y Pipeline en 2 columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        
        {/* Sectores */}
        <div style={{ 
          background: 'white', 
          borderRadius: '20px', 
          padding: '20px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
            🏭 Principales Sectores
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.candidatosPorSector.slice(0, 5).map((item, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '10px 12px',
                background: '#f8fafc',
                borderRadius: '12px'
              }}>
                <span style={{ fontSize: '13px', color: '#475569' }}>{item.name}</span>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  background: '#e0e7ff', 
                  color: '#1e40af',
                  padding: '2px 10px',
                  borderRadius: '20px'
                }}>
                  {item.value}
                </span>
              </div>
            ))}
            {stats.candidatosPorSector.length === 0 && (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No hay datos</p>
            )}
          </div>
        </div>

        {/* Pipeline de Reclutamiento */}
        {stats.candidatosPorEtapa && stats.candidatosPorEtapa.length > 0 && (
          <div style={{ 
            background: 'white', 
            borderRadius: '20px', 
            padding: '20px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
              🔄 Pipeline de Reclutamiento
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
              gap: '12px'
            }}>
              {stats.candidatosPorEtapa.map((etapa, idx) => (
                <div key={idx} style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '14px',
                  textAlign: 'center',
                  border: '1px solid #e2e8f0'
                }}>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6', marginBottom: '4px' }}>
                    {etapa.cantidad}
                  </p>
                  <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                    {etapa.nombre}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Postulaciones por Mes - Barras simplificadas */}
      {stats.postulacionesPorMes && stats.postulacionesPorMes.length > 0 && (
        <div style={{ 
          background: 'white', 
          borderRadius: '20px', 
          padding: '20px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
            📈 Evolución de Postulaciones
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
            {stats.postulacionesPorMes.map((item, idx) => {
              const maxValue = Math.max(...stats.postulacionesPorMes.map(i => i.cantidad), 1);
              const height = (item.cantidad / maxValue) * 120;
              return (
                <div key={idx} style={{ textAlign: 'center', minWidth: '55px' }}>
                  <div style={{ 
                    height: `${Math.max(height, 4)}px`, 
                    width: '36px', 
                    background: 'linear-gradient(180deg, #3b82f6 0%, #60a5fa 100%)',
                    borderRadius: '8px 8px 4px 4px',
                    marginBottom: '8px',
                    transition: 'height 0.5s ease'
                  }} />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>{item.mes}</span>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#1e293b', display: 'block' }}>{item.cantidad}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Últimos Candidatos */}
      {stats.ultimosCandidatos && stats.ultimosCandidatos.length > 0 && (
        <div style={{ 
          background: 'white', 
          borderRadius: '20px', 
          padding: '20px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
            🆕 Últimos Candidatos
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '500' }}>Nombre</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '500' }}>Profesión</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '500' }}>Seniority</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '500' }}>Score</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '500' }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {stats.ultimosCandidatos.map((c, idx) => {
                  const seniorityStyle = getSeniorityColor(c.seniority);
                  const scoreStyle = getScoreColor(c.score);
                  return (
                    <tr key={idx} className="table-row" style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{c.nombre || '—'}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#475569' }}>{c.profesion || '—'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '500',
                          background: seniorityStyle.bg,
                          color: seniorityStyle.text
                        }}>
                          {c.seniority || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '500',
                          background: scoreStyle.bg,
                          color: scoreStyle.text
                        }}>
                          {c.score || 0}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '12px', color: '#64748b' }}>
                        {c.fecha ? new Date(c.fecha).toLocaleDateString('es-CR') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;