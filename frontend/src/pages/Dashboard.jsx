import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts';

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
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [periodo, setPeriodo] = useState('6'); // meses

  const COLORS = {
    blue: '#3b82f6',
    green: '#10b981',
    orange: '#f59e0b',
    red: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec489a',
    cyan: '#06b6d4',
    indigo: '#6366f1'
  };

  const COLORS_ARRAY = Object.values(COLORS);

  const cargarDashboard = async () => {
    try {
      setRefreshing(true);
      const res = await axios.get(`${API_URL}/dashboard?periodo=${periodo}`);
      if (res.data.success) {
        setStats(res.data.data);
        setError(null);
      } else {
        setError(res.data.error);
      }
    } catch (err) {
      console.error('Error cargando dashboard:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
    const interval = setInterval(cargarDashboard, 60000); // cada minuto
    return () => clearInterval(interval);
  }, [periodo]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '3px solid #e2e8f0', 
            borderTopColor: '#3b82f6', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#64748b' }}>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const KPI_CARD_STYLE = {
    background: 'white',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease'
  };

  const SECTION_STYLE = {
    background: 'white',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    marginBottom: '24px'
  };

  return (
    <div style={{ 
      background: '#f1f5f9', 
      minHeight: '100vh',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .kpi-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -12px rgba(0,0,0,0.15);
        }
        .table-row:hover {
          background: #f8fafc;
        }
      `}</style>

      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: 'white',
        padding: '32px 32px',
        marginBottom: '32px'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
              📊 Talent Pipeline Dashboard
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              Métricas en tiempo real de tu pipeline de talento
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                border: '1px solid #334155',
                background: '#334155',
                color: 'white',
                fontSize: '14px',
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
                padding: '8px 20px',
                borderRadius: '12px',
                border: 'none',
                background: '#3b82f6',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                opacity: refreshing ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg className={`${refreshing ? 'spin' : ''}`} style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px 32px' }}>
        
        {/* KPIs Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Total Candidatos */}
          <div className="kpi-card" style={KPI_CARD_STYLE}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '13px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Candidatos
                </p>
                <p style={{ fontSize: '42px', fontWeight: '700', color: '#1e293b', marginTop: '8px' }}>
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
          <div className="kpi-card" style={KPI_CARD_STYLE}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '13px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Entrevistas Realizadas
                </p>
                <p style={{ fontSize: '42px', fontWeight: '700', color: '#1e293b', marginTop: '8px' }}>
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
          <div className="kpi-card" style={KPI_CARD_STYLE}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '13px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Puestos Activos
                </p>
                <p style={{ fontSize: '42px', fontWeight: '700', color: '#1e293b', marginTop: '8px' }}>
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
          <div className="kpi-card" style={KPI_CARD_STYLE}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '13px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Match Promedio
                </p>
                <p style={{ fontSize: '42px', fontWeight: '700', color: '#1e293b', marginTop: '8px' }}>
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

        {/* Gráficos principales 2x2 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* Seniority Distribution */}
          <div style={SECTION_STYLE}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>📊</span> Distribución por Seniority
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats.candidatosPorSeniority} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ background: 'white', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill={COLORS.blue} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sector Distribution */}
          <div style={SECTION_STYLE}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>🏭</span> Distribución por Sector
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={stats.candidatosPorSector}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                >
                  {stats.candidatosPorSector.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_ARRAY[index % COLORS_ARRAY.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'white', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Entrevistas por Estado */}
          <div style={SECTION_STYLE}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>🎥</span> Entrevistas por Estado
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={stats.entrevistasPorEstado}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                >
                  {stats.entrevistasPorEstado.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_ARRAY[(index + 2) % COLORS_ARRAY.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'white', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Postulaciones por Mes */}
          <div style={SECTION_STYLE}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>📅</span> Postulaciones por Mes
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={stats.postulacionesPorMes}>
                <defs>
                  <linearGradient id="colorPostulaciones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ background: 'white', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="cantidad" stroke={COLORS.blue} fill="url(#colorPostulaciones)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline de Reclutamiento */}
        {stats.candidatosPorEtapa && stats.candidatosPorEtapa.length > 0 && (
          <div style={SECTION_STYLE}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>🔄</span> Pipeline de Reclutamiento
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '16px'
            }}>
              {stats.candidatosPorEtapa.map((etapa, idx) => (
                <div key={idx} style={{
                  background: '#f8fafc',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s'
                }}>
                  <p style={{ fontSize: '32px', fontWeight: '700', color: COLORS.blue, marginBottom: '8px' }}>
                    {etapa.cantidad}
                  </p>
                  <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                    {etapa.nombre}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Últimos Candidatos */}
        {stats.ultimosCandidatos && stats.ultimosCandidatos.length > 0 && (
          <div style={SECTION_STYLE}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>🆕</span> Últimos Candidatos Agregados
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Nombre</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Profesión</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Seniority</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Score</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.ultimosCandidatos.map((c, idx) => (
                    <tr key={idx} className="table-row" style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{c.nombre || '—'}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#475569' }}>{c.profesion || '—'}</td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: c.seniority === 'Senior' ? '#d1fae5' : c.seniority === 'Semi-Senior' ? '#dbeafe' : '#f1f5f9',
                          color: c.seniority === 'Senior' ? '#065f46' : c.seniority === 'Semi-Senior' ? '#1e40af' : '#475569'
                        }}>
                          {c.seniority || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: c.score >= 80 ? '#d1fae5' : c.score >= 60 ? '#fed7aa' : '#fee2e2',
                          color: c.score >= 80 ? '#065f46' : c.score >= 60 ? '#9a3412' : '#991b1b'
                        }}>
                          {c.score || 0}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#64748b' }}>
                        {c.fecha ? new Date(c.fecha).toLocaleDateString('es-CR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          padding: '24px', 
          color: '#94a3b8', 
          fontSize: '12px',
          borderTop: '1px solid #e2e8f0',
          marginTop: '24px'
        }}>
          <p>Datos actualizados en tiempo real · Última actualización: {new Date().toLocaleTimeString('es-CR')}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
