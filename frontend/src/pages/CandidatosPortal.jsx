import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const CandidatosPortal = () => {
  const [puestos, setPuestos] = useState([]);
  const [puestosFiltrados, setPuestosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState('tarjetas');
  const [modalPostularAbierto, setModalPostularAbierto] = useState(false);
  const [modalTalentoAbierto, setModalTalentoAbierto] = useState(false);
  const [modalResultadoAbierto, setModalResultadoAbierto] = useState(false);
  const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false);
  const [puestoSeleccionado, setPuestoSeleccionado] = useState(null);
  const [puestoDetalle, setPuestoDetalle] = useState(null);
  const [resultadoModal, setResultadoModal] = useState({ icono: '', titulo: '', mensaje: '' });
  const [cargandoTalento, setCargandoTalento] = useState(false);
  const [mensajeTalento, setMensajeTalento] = useState({ text: '', type: '' });
  const [filtros, setFiltros] = useState({
    search: '',
    cliente: '',
    seniority: '',
    ubicacion: '',
    salario: '0',
    ordenar: 'fecha_desc'
  });
  const [clientesUnicos, setClientesUnicos] = useState([]);
  const [postulaciones, setPostulaciones] = useState([]);
  const [emailBuscar, setEmailBuscar] = useState('');
  const [mostrandoPostulaciones, setMostrandoPostulaciones] = useState(false);
  const [preguntasAdicionales, setPreguntasAdicionales] = useState([]);

  useEffect(() => {
    cargarPuestos();
    cargarClientes();
  }, []);

  const cargarPuestos = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/puestos`);
      if (res.data.success) {
        setPuestos(res.data.puestos);
        aplicarFiltros();
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const cargarClientes = async () => {
    try {
      const res = await axios.get(`${API_URL}/puestos`);
      if (res.data.success) {
        const clientes = [...new Set(res.data.puestos.map(p => p.cliente).filter(c => c))];
        setClientesUnicos(clientes);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const extraerSalarioMinimo = (salarioStr) => {
    if (!salarioStr) return 0;
    const match = salarioStr.match(/\$?(\d+(?:,\d+)?)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''));
    }
    return 0;
  };

  const aplicarFiltros = () => {
    let filtrados = [...puestos];
    
    if (filtros.search) {
      const search = filtros.search.toLowerCase();
      filtrados = filtrados.filter(p => 
        p.titulo.toLowerCase().includes(search) ||
        p.cliente.toLowerCase().includes(search) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(search)) ||
        (p.habilidades_requeridas && p.habilidades_requeridas.some(h => h.toLowerCase().includes(search)))
      );
    }
    
    if (filtros.cliente) filtrados = filtrados.filter(p => p.cliente === filtros.cliente);
    if (filtros.seniority) filtrados = filtrados.filter(p => p.seniority === filtros.seniority);
    if (filtros.ubicacion) filtrados = filtrados.filter(p => p.ubicacion?.includes(filtros.ubicacion));
    
    const salarioMin = parseInt(filtros.salario) || 0;
    if (salarioMin > 0) {
      filtrados = filtrados.filter(p => extraerSalarioMinimo(p.salario_oferta) >= salarioMin);
    }
    
    filtrados.sort((a, b) => {
      switch(filtros.ordenar) {
        case 'fecha_desc': return new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion);
        case 'fecha_asc': return new Date(a.fecha_publicacion) - new Date(b.fecha_publicacion);
        case 'salario_desc': return extraerSalarioMinimo(b.salario_oferta) - extraerSalarioMinimo(a.salario_oferta);
        case 'salario_asc': return extraerSalarioMinimo(a.salario_oferta) - extraerSalarioMinimo(b.salario_oferta);
        case 'titulo_asc': return a.titulo.localeCompare(b.titulo);
        default: return 0;
      }
    });
    
    setPuestosFiltrados(filtrados);
  };

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, puestos]);

  const verDetallesPuesto = async (puestoId) => {
    try {
      const res = await axios.get(`${API_URL}/puesto/${puestoId}`);
      if (res.data.success) {
        setPuestoDetalle(res.data.puesto);
        setModalDetallesAbierto(true);
      }
    } catch (error) {
      alert('Error al cargar los detalles');
    }
  };

  const abrirModalPostular = async (puestoId) => {
    try {
      const res = await axios.get(`${API_URL}/puesto/${puestoId}`);
      if (res.data.success) {
        setPuestoSeleccionado(res.data.puesto);
        setPreguntasAdicionales(res.data.puesto.preguntas || []);
        setModalPostularAbierto(true);
      }
    } catch (error) {
      alert('Error al cargar el puesto');
    }
  };

  const enviarPostulacion = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const res = await axios.post(`${API_URL}/postular`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        setModalPostularAbierto(false);
        setResultadoModal({
          icono: '✅',
          titulo: '¡Postulación exitosa!',
          mensaje: 'Hemos recibido tu postulación. El equipo la revisará y te contactará pronto.'
        });
        setModalResultadoAbierto(true);
        e.target.reset();
      } else {
        setResultadoModal({
          icono: '❌',
          titulo: 'Error',
          mensaje: res.data.error || 'Hubo un problema'
        });
        setModalResultadoAbierto(true);
      }
    } catch (error) {
      setResultadoModal({
        icono: '❌',
        titulo: 'Error',
        mensaje: 'Error de conexión con el servidor'
      });
      setModalResultadoAbierto(true);
    }
  };

  const enviarTalento = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Mostrar mensaje de "cargando"
    setCargandoTalento(true);
    setMensajeTalento({ text: '🔄 Subiendo tu CV...', type: 'info' });
    
    try {
        const res = await axios.post(`${API_URL}/talento-general`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (res.data.success) {
            setModalTalentoAbierto(false);
            setMensajeTalento({ text: '', type: '' });
            setResultadoModal({
                icono: '✅',
                titulo: '¡CV Recibido!',
                mensaje: res.data.message || 'Tu CV ha sido recibido. Te enviaremos un correo cuando el análisis esté completo.'
            });
            setModalResultadoAbierto(true);
            e.target.reset();
        } else {
            setResultadoModal({
                icono: '❌',
                titulo: 'Error',
                mensaje: res.data.error || 'Hubo un problema'
            });
            setModalResultadoAbierto(true);
        }
    } catch (error) {
        setResultadoModal({
            icono: '❌',
            titulo: 'Error',
            mensaje: 'Error de conexión con el servidor'
        });
        setModalResultadoAbierto(true);
    }
    setCargandoTalento(false);
};

  const cargarMisPostulaciones = async () => {
    if (!emailBuscar) {
      alert('Ingresa tu correo electrónico');
      return;
    }
    
    try {
      const res = await axios.get(`${API_URL}/mis-postulaciones`, { params: { email: emailBuscar } });
      if (res.data.success && res.data.postulaciones) {
        setPostulaciones(res.data.postulaciones);
        setMostrandoPostulaciones(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const cambiarTab = (tab) => {
    setMostrandoPostulaciones(tab === 'postulaciones');
    if (tab === 'puestos') {
      cargarPuestos();
    }
  };

  const resetFiltros = () => {
    setFiltros({
      search: '',
      cliente: '',
      seniority: '',
      ubicacion: '',
      salario: '0',
      ordenar: 'fecha_desc'
    });
  };

  const eliminarFiltro = (tipo) => {
    setFiltros(prev => ({ ...prev, [tipo]: '' }));
  };

  const escapeHtml = (text) => {
    if (!text) return '';
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh' }}>
      
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', padding: '20px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🎯</div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Portal de Empleo</h1>
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>Encuentra tu próxima oportunidad profesional</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => cambiarTab('postulaciones')} style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', border: 'none', color: 'white', fontWeight: '500' }}>
              Mis postulaciones
            </button>
            <button onClick={() => setModalTalentoAbierto(true)} style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', border: 'none', color: 'white', fontWeight: '500' }}>
              Subir CV
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
          <button onClick={() => cambiarTab('puestos')} style={{
            padding: '12px 24px',
            borderRadius: '12px 12px 0 0',
            border: 'none',
            background: !mostrandoPostulaciones ? '#3b82f6' : 'transparent',
            color: !mostrandoPostulaciones ? 'white' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Puestos disponibles
          </button>
          <button onClick={() => cambiarTab('postulaciones')} style={{
            padding: '12px 24px',
            borderRadius: '12px 12px 0 0',
            border: 'none',
            background: mostrandoPostulaciones ? '#3b82f6' : 'transparent',
            color: mostrandoPostulaciones ? 'white' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Mis postulaciones
          </button>
        </div>

        {/* Panel de puestos */}
        {!mostrandoPostulaciones ? (
          <>
            {/* Filtros */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Buscar</label>
                  <input type="text" value={filtros.search} onChange={(e) => setFiltros({...filtros, search: e.target.value})} placeholder="Título, cliente o habilidad..." style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }} />
                </div>
                <div style={{ width: '140px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Cliente</label>
                  <select value={filtros.cliente} onChange={(e) => setFiltros({...filtros, cliente: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}>
                    <option value="">Todos</option>
                    {clientesUnicos.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ width: '120px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Seniority</label>
                  <select value={filtros.seniority} onChange={(e) => setFiltros({...filtros, seniority: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}>
                    <option value="">Todos</option>
                    <option value="Trainee">Trainee</option>
                    <option value="Junior">Junior</option>
                    <option value="Semi-Senior">Semi-Senior</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>
                <div style={{ width: '120px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Ubicación</label>
                  <select value={filtros.ubicacion} onChange={(e) => setFiltros({...filtros, ubicacion: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}>
                    <option value="">Todas</option>
                    <option value="Remoto">Remoto</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Presencial">Presencial</option>
                  </select>
                </div>
                <div style={{ width: '120px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Salario mín.</label>
                  <select value={filtros.salario} onChange={(e) => setFiltros({...filtros, salario: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}>
                    <option value="0">Todos</option>
                    <option value="1500">$1,500+</option>
                    <option value="2000">$2,000+</option>
                    <option value="2500">$2,500+</option>
                    <option value="3000">$3,000+</option>
                    <option value="4000">$4,000+</option>
                  </select>
                </div>
                <div style={{ width: '120px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Ordenar</label>
                  <select value={filtros.ordenar} onChange={(e) => setFiltros({...filtros, ordenar: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}>
                    <option value="fecha_desc">Más reciente</option>
                    <option value="fecha_asc">Más antiguo</option>
                    <option value="salario_desc">Mayor salario</option>
                    <option value="salario_asc">Menor salario</option>
                    <option value="titulo_asc">Título A-Z</option>
                  </select>
                </div>
                <button onClick={resetFiltros} style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Limpiar</button>
              </div>
              
              {/* Filtros activos */}
              {filtros.search && (
                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🔍 "{filtros.search}"
                    <button onClick={() => eliminarFiltro('search')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }}>×</button>
                  </span>
                </div>
              )}
            </div>

            {/* Vista de puestos */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>{puestosFiltrados.length} puestos encontrados</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setVistaActual('tarjetas')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: vistaActual === 'tarjetas' ? '#3b82f6' : '#f1f5f9', color: vistaActual === 'tarjetas' ? 'white' : '#64748b', cursor: 'pointer' }}>Tarjetas</button>
                <button onClick={() => setVistaActual('lista')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: vistaActual === 'lista' ? '#3b82f6' : '#f1f5f9', color: vistaActual === 'lista' ? 'white' : '#64748b', cursor: 'pointer' }}>Lista</button>
              </div>
            </div>

            {/* Grid de tarjetas */}
            {vistaActual === 'tarjetas' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px', gridColumn: '1/-1' }}>Cargando puestos...</div>
                ) : puestosFiltrados.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', gridColumn: '1/-1' }}>No hay puestos disponibles</div>
                ) : (
                  puestosFiltrados.map(p => (
                    <div key={p.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: '600', background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '20px' }}>{escapeHtml(p.cliente)}</span>
                          <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '8px', color: '#1e293b' }}>{escapeHtml(p.titulo)}</h3>
                        </div>
                        <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px' }}>{escapeHtml(p.seniority || 'N/A')}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>{escapeHtml(p.descripcion?.substring(0, 120))}...</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                        {(p.habilidades_requeridas || []).slice(0, 4).map(h => (
                          <span key={h} style={{ fontSize: '11px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px' }}>{escapeHtml(h)}</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                        <span>📍 {escapeHtml(p.ubicacion || 'No especificada')}</span>
                        {p.salario_oferta && <span style={{ color: '#10b981', fontWeight: '600' }}>{escapeHtml(p.salario_oferta)}</span>}
                      </div>
                      <button onClick={() => verDetallesPuesto(p.id)} style={{ width: '100%', padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer', marginBottom: '8px', fontWeight: '500' }}>Ver detalles</button>
                      <button onClick={() => abrirModalPostular(p.id)} style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '500' }}>Postular ahora</button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Vista de lista */}
            {vistaActual === 'lista' && (
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>Cargando puestos...</div>
                ) : puestosFiltrados.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No hay puestos disponibles</div>
                ) : (
                  puestosFiltrados.map(p => (
                    <div key={p.id} style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '600', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '12px' }}>{escapeHtml(p.cliente)}</span>
                          <span style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>{escapeHtml(p.seniority || 'N/A')}</span>
                        </div>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{escapeHtml(p.titulo)}</h4>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          <span>📍 {escapeHtml(p.ubicacion || 'N/A')}</span>
                          {p.salario_oferta && <span style={{ color: '#10b981' }}>{escapeHtml(p.salario_oferta)}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => verDetallesPuesto(p.id)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Ver detalles</button>
                        <button onClick={() => abrirModalPostular(p.id)} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Postular</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        ) : (
          /* Mis postulaciones */
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Mis postulaciones</h2>
            
            {postulaciones.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <p>Ingresa tu email para ver tus postulaciones</p>
                <div style={{ display: 'flex', gap: '12px', maxWidth: '400px', margin: '20px auto 0' }}>
                  <input type="email" value={emailBuscar} onChange={(e) => setEmailBuscar(e.target.value)} placeholder="tu@email.com" style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                  <button onClick={cargarMisPostulaciones} style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Buscar</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {postulaciones.map(p => (
                  <div key={p.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{escapeHtml(p.titulo)}</h3>
                        <p style={{ fontSize: '13px', color: '#64748b' }}>{escapeHtml(p.cliente)}</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{new Date(p.fecha_postulacion).toLocaleDateString()}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          padding: '4px 12px', 
                          borderRadius: '20px', 
                          fontSize: '12px', 
                          fontWeight: '600',
                          background: p.estado === 'revisado' ? '#d1fae5' : p.estado === 'contacto' ? '#dbeafe' : p.estado === 'rechazado' ? '#fee2e2' : '#fef3c7',
                          color: p.estado === 'revisado' ? '#065f46' : p.estado === 'contacto' ? '#1e40af' : p.estado === 'rechazado' ? '#991b1b' : '#92400e'
                        }}>
                          {p.estado === 'revisado' ? 'Revisado' : p.estado === 'contacto' ? 'En contacto' : p.estado === 'rechazado' ? 'No seleccionado' : 'Pendiente'}
                        </span>
                        {p.match_score > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <span style={{ fontSize: '20px', fontWeight: '700', color: getScoreColor(p.match_score) }}>{p.match_score}%</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}> match</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal de postulación */}
      {modalPostularAbierto && puestoSeleccionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={() => setModalPostularAbierto(false)}>
          <div style={{ background: 'white', borderRadius: '24px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Postular a: {escapeHtml(puestoSeleccionado.titulo)}</h2>
              <button onClick={() => setModalPostularAbierto(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            
            <form onSubmit={enviarPostulacion} style={{ padding: '24px' }}>
              <input type="hidden" name="puesto_id" value={puestoSeleccionado.id} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Nombre completo *</label>
                  <input type="text" name="nombre" required style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Correo electrónico *</label>
                  <input type="email" name="email" required style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Teléfono *</label>
                <input type="tel" name="telefono" required style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Adjuntar CV (PDF o DOCX) *</label>
                <input type="file" name="cv" accept=".pdf,.docx" required style={{ width: '100%' }} />
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Aceptamos archivos PDF y Word</p>
              </div>
              
              {preguntasAdicionales.length > 0 && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '16px' }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '12px' }}>Información adicional</h4>
                  {preguntasAdicionales.map((p, idx) => (
                    <div key={idx} style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>{escapeHtml(p.pregunta)} {p.requerido && '*'}</label>
                      {p.tipo === 'select' ? (
                        <select name={`respuesta_${p.id}`} required={p.requerido} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}>
                          <option value="">Seleccione...</option>
                          {(p.opciones || []).map(opt => <option key={opt} value={opt}>{escapeHtml(opt)}</option>)}
                        </select>
                      ) : (
                        <input type={p.tipo === 'number' ? 'number' : 'text'} name={`respuesta_${p.id}`} required={p.requerido} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '500' }}>Enviar postulación</button>
                <button type="button" onClick={() => setModalPostularAbierto(false)} style={{ padding: '12px 24px', background: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de talento general */}
      {modalTalentoAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={() => setModalTalentoAbierto(false)}>
          <div style={{ background: 'white', borderRadius: '24px', maxWidth: '500px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Agregar a la base de talento</h2>
              <button onClick={() => setModalTalentoAbierto(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            
            <form onSubmit={enviarTalento} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Nombre completo *</label>
                <input type="text" name="nombre" required style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Correo electrónico *</label>
                <input type="email" name="email" required style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Teléfono *</label>
                <input type="tel" name="telefono" required style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Adjuntar CV (opcional)</label>
                <input type="file" name="cv" accept=".pdf,.docx" style={{ width: '100%' }} />
              </div>
              <button 
    type="submit" 
    disabled={cargandoTalento}
    style={{ 
        width: '100%', 
        padding: '12px', 
        background: cargandoTalento ? '#94a3b8' : '#10b981', 
        color: 'white', 
        border: 'none', 
        borderRadius: '10px', 
        cursor: cargandoTalento ? 'not-allowed' : 'pointer', 
        fontWeight: '500' 
    }}
>
    {cargandoTalento ? '⏳ Procesando...' : 'Guardar en talento'}
</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de resultados */}
      {modalResultadoAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={() => setModalResultadoAbierto(false)}>
          <div style={{ background: 'white', borderRadius: '24px', maxWidth: '400px', width: '100%', padding: '32px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{resultadoModal.icono}</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>{resultadoModal.titulo}</h3>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>{resultadoModal.mensaje}</p>
            <button onClick={() => setModalResultadoAbierto(false)} style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Modal de detalles del puesto */}
      {modalDetallesAbierto && puestoDetalle && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={() => setModalDetallesAbierto(false)}>
          <div style={{ background: 'white', borderRadius: '24px', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Detalles del puesto</h2>
              <button onClick={() => setModalDetallesAbierto(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{escapeHtml(puestoDetalle.cliente)}</span>
                  <span style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>{escapeHtml(puestoDetalle.seniority || 'No especificado')}</span>
                  <span style={{ background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>✅ Activo</span>
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>{escapeHtml(puestoDetalle.titulo)}</h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: '#64748b' }}>
                  <span>📍 {escapeHtml(puestoDetalle.ubicacion || 'No especificada')}</span>
                  {puestoDetalle.salario_oferta && <span style={{ color: '#10b981', fontWeight: '600' }}>{escapeHtml(puestoDetalle.salario_oferta)}</span>}
                  <span>📅 Publicado: {new Date(puestoDetalle.fecha_publicacion).toLocaleDateString()}</span>
                </div>
              </div>

              {puestoDetalle.sobre_empresa && (
                <div style={{ marginBottom: '24px', background: '#eff6ff', padding: '20px', borderRadius: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Sobre la empresa</h3>
                  <p style={{ lineHeight: 1.6 }}>{escapeHtml(puestoDetalle.sobre_empresa)}</p>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Descripción del puesto</h3>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                  <p>{escapeHtml(puestoDetalle.descripcion || 'No hay descripción disponible.')}</p>
                </div>
              </div>

              {puestoDetalle.responsabilidades?.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Responsabilidades</h3>
                  <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {puestoDetalle.responsabilidades.map((r, i) => <li key={i}>{escapeHtml(r)}</li>)}
                  </ul>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Requisitos</h3>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                  <p style={{ whiteSpace: 'pre-line' }}>{escapeHtml(puestoDetalle.requisitos || 'No se especificaron requisitos.')}</p>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Habilidades requeridas</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(puestoDetalle.habilidades_requeridas || []).map(h => (
                    <span key={h} style={{ background: '#f3e8ff', color: '#6b21a8', padding: '6px 14px', borderRadius: '20px', fontSize: '13px' }}>{escapeHtml(h)}</span>
                  ))}
                </div>
              </div>

              {puestoDetalle.beneficios?.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Beneficios</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {puestoDetalle.beneficios.map(b => (
                      <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px' }}>
                        <span style={{ color: '#10b981' }}>✅</span> {escapeHtml(b)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Información adicional</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {puestoDetalle.horario && <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}><span style={{ fontSize: '11px', color: '#64748b' }}>Horario</span><p style={{ fontWeight: '500' }}>{escapeHtml(puestoDetalle.horario)}</p></div>}
                  {puestoDetalle.tipo_contrato && <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}><span style={{ fontSize: '11px', color: '#64748b' }}>Tipo de contrato</span><p style={{ fontWeight: '500' }}>{escapeHtml(puestoDetalle.tipo_contrato)}</p></div>}
                  {puestoDetalle.modalidad && <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}><span style={{ fontSize: '11px', color: '#64748b' }}>Modalidad</span><p style={{ fontWeight: '500' }}>{escapeHtml(puestoDetalle.modalidad)}</p></div>}
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}><span style={{ fontSize: '11px', color: '#64748b' }}>Seniority</span><p style={{ fontWeight: '500' }}>{escapeHtml(puestoDetalle.seniority || 'No especificado')}</p></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button onClick={() => setModalDetallesAbierto(false)} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cerrar</button>
                <button onClick={() => { setModalDetallesAbierto(false); abrirModalPostular(puestoDetalle.id); }} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Postular ahora</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidatosPortal;
