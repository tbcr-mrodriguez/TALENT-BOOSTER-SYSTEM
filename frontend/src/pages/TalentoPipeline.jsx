import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../App.css';
import EntrevistasDashboard from '../components/EntrevistasDashboard';
import EvaluacionEntrevista from '../components/EvaluacionEntrevista';
import GestionCorreos from '../components/GestionCorreos';


console.log('🔍 Tipo de EntrevistasDashboard:', typeof EntrevistasDashboard);

const API_URL = 'http://localhost:5001/api';


// ========================================
// COMPONENTE PARA EMPRESAS
// ========================================
const EmpresasCandidato = ({ empresas }) => {
  if (!empresas || empresas.length === 0) {
    return <span className="no-data">No se detectaron empresas específicas</span>;
  }

  return (
    <div className="ia-tags">
      {empresas.slice(0, 6).map((emp, i) => (
        <span key={i} className="tag-empresa">🏢 {emp}</span>
      ))}
    </div>
  );
};
// Función segura para parsear raw_data
const safeParseRawData = (data) => {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch(e) {
      console.error('Error parsing raw_data:', e);
      return {};
    }
  }
  return data;
};
// ========================================
// COMPONENTE PARA RESULTADOS DE ENTREVISTA CON ENLACES GUARDADOS
// ========================================
  const ResultadosEntrevistaSection = ({ candidatoId, verResultadoEntrevista }) => {
  const [entrevistas, setEntrevistas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [copiado, setCopiado] = useState(null);

  useEffect(() => {
    const cargarEntrevistas = async () => {
      if (!candidatoId) return;
      
      setCargando(true);
      try {
        const res = await axios.get(`${API_URL}/entrevistas/candidato/${candidatoId}`);
        if (res.data.success) {
          setEntrevistas(res.data.entrevistas);
        }
      } catch (error) {
        console.error('Error cargando entrevistas:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarEntrevistas();
  }, [candidatoId]);

  const copiarEnlace = (enlace) => {
    navigator.clipboard.writeText(enlace);
    setCopiado(enlace);
    setTimeout(() => setCopiado(null), 2000);
  };

  const getEstadoBadge = (estado) => {
    const colores = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'en_progreso': 'bg-blue-100 text-blue-800',
      'completada': 'bg-green-100 text-green-800',
      'analizada': 'bg-purple-100 text-purple-800'
    };
    const textos = {
      'pendiente': '⏳ Pendiente',
      'en_progreso': '🔄 En progreso',
      'completada': '✅ Completada',
      'analizada': '📊 Analizada'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colores[estado] || 'bg-gray-100'}`}>
        {textos[estado] || estado}
      </span>
    );
  };

  if (cargando) {
    return (
      <div className="modal-section">
        <h3 className="text-lg font-semibold mb-4">🎥 Entrevistas programadas</h3>
        <p className="text-center text-gray-500 py-4">Cargando entrevistas...</p>
      </div>
    );
  }

  return (
    <div className="modal-section">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">🎥 Entrevistas programadas</h3>
        {entrevistas.length > 0 && (
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {entrevistas.length} {entrevistas.length === 1 ? 'entrevista' : 'entrevistas'}
          </span>
        )}
      </div>

      {entrevistas.length === 0 ? (
        <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
          No hay entrevistas programadas para este candidato
        </p>
      ) : (
        <div className="space-y-4">
          {entrevistas.map((entrevista, idx) => (
            <div key={idx} className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition">
              <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                <div>
                  <span className="font-medium text-gray-800">{entrevista.plantilla}</span>
                  {entrevista.puesto && (
                    <span className="text-sm text-gray-500 ml-2">({entrevista.puesto})</span>
                  )}
                </div>
                {getEstadoBadge(entrevista.estado)}
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-gray-600">🔗 Enlace:</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                    {entrevista.enlace}
                  </code>
                  <button
                    onClick={() => copiarEnlace(entrevista.enlace)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-1"
                    title="Copiar enlace"
                  >
                    {copiado === entrevista.enlace ? '✅ Copiado!' : '📋 Copiar'}
                  </button>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>
                    📅 {new Date(entrevista.fecha_inicio).toLocaleDateString('es-CR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <div className="flex gap-2">
                    {entrevista.estado === 'pendiente' && (
                      <button
                        onClick={() => window.open(entrevista.enlace, '_blank')}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        ▶️ Iniciar
                      </button>
                    )}
                    {entrevista.estado === 'completada' && (
                      <button
                        onClick={() => verResultadoEntrevista(entrevista.id)}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        📊 Ver resultados
                      </button>
                    )}
                  </div>
                </div>

                {entrevista.puntuacion && (
                  <div className="mt-3 pt-3 border-t flex justify-end">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      Puntuación: {entrevista.puntuacion}/10
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function App() {
  const [globalData, setGlobalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('⏳ Listo. Base de datos persistente activa.');
  const [statusClass, setStatusClass] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [entrevistaParaEvaluar, setEntrevistaParaEvaluar] = useState(null);
  const [modalEvaluacionAbierto, setModalEvaluacionAbierto] = useState(false);
  const [resultadosEntrevistas, setResultadosEntrevistas] = useState([]);
  const [entrevistaSeleccionada, setEntrevistaSeleccionada] = useState(null);
  
  // Estados para búsquedas
  const [searchSkills, setSearchSkills] = useState('');
  const [searchSector, setSearchSector] = useState('');
  const [searchScore, setSearchScore] = useState('');
  const [semanticQuery, setSemanticQuery] = useState('');
  const [semanticInfo, setSemanticInfo] = useState('');
  const [showRanking, setShowRanking] = useState(false);
  const [rankingModel, setRankingModel] = useState('gpt');
  const [rankingExplanation, setRankingExplanation] = useState('');
  // ===== ESTADOS PARA ENTREVISTAS =====
  const [plantillasDisponibles, setPlantillasDisponibles] = useState([]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
  const [mostrarSelectorPlantilla, setMostrarSelectorPlantilla] = useState(false);

  const [activeTab, setActiveTab] = useState('tradicional');

  // ===== ESTADOS PARA RESULTADOS DE ENTREVISTA =====
  const [resultadoEntrevista, setResultadoEntrevista] = useState(null);
  const [modalResultadoAbierto, setModalResultadoAbierto] = useState(false);
  const [cargandoResultado, setCargandoResultado] = useState(false);

  // ===== FUNCIÓN PARA VER RESULTADO DETALLADO =====
  const verResultadoEntrevista = async (entrevistaId) => {
    setCargandoResultado(true);
    try {
      const res = await axios.get(`${API_URL}/entrevista/resultado-detallado/${entrevistaId}`);
      if (res.data.success) {
        setResultadoEntrevista(res.data);
        setModalResultadoAbierto(true);
      } else {
        alert('Error: ' + res.data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error cargando resultado');
    }
    setCargandoResultado(false);
  };

  const cargarResultadosEntrevista = async (candidatoId) => {
    try {
      const res = await axios.get(`${API_URL}/entrevista/resultados/${candidatoId}`);
      if (res.data.success) {
        setResultadosEntrevistas(res.data.resultados);
        return true;
      }
    } catch (error) {
      console.error('Error cargando resultados:', error);
    }
    return false;
  };

  // ===== NUEVOS ESTADOS PARA FILTROS =====
  const [filters, setFilters] = useState({
    nombre: '',
    sector: '',
    experiencia: '',
    seniority: '',
    perfil: '',
    skills: '',
    score: ''
  });

  // ===== ESTADOS PARA EL ASISTENTE =====
  const [mensajesAsistente, setMensajesAsistente] = useState([
    { 
      tipo: 'asistente', 
      texto: '🎯 **Hola, soy tu headhunter personal.**\n\nPuedes preguntarme cosas como:\n• "¿Hay programadores en Cartago?"\n• "Recomiéndame el mejor desarrollador Java"\n• "Gente con experiencia en bancos"\n• "Cuántos perfiles senior tienes?"' 
    }
  ]);
  const [preguntaAsistente, setPreguntaAsistente] = useState('');
  const [asistentePensando, setAsistentePensando] = useState(false);
  const mensajesRef = useRef(null);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    sectores: 0,
    skills: 0,
    senior_percent: 0
  });

  // ===== ESTADOS PARA MATCH DE EMPLEO =====
  const [matchDescripcion, setMatchDescripcion] = useState('');
  const [matchTitulo, setMatchTitulo] = useState('');
  const [matchResultados, setMatchResultados] = useState([]);
  const [matchCargando, setMatchCargando] = useState(false);
  const [matchSeleccionado, setMatchSeleccionado] = useState(null);

  // Auto-scroll para el asistente
  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  }, [mensajesAsistente]);

  // ========================================
  // CARGA INICIAL
  // ========================================
  useEffect(() => {
    loadSavedCandidates();
  }, []);

  // ========================================
  // FUNCIONES AUXILIARES
  // ========================================
  const deducirSeniority = (experiencia) => {
    if (!experiencia || experiencia === "No se pudo inferir") return "No determinado";
    const expStr = experiencia.toString().toLowerCase();
    const match = expStr.match(/(\d+)/);
    if (match) {
      let años = parseInt(match[0]);
      if (años >= 8) return "Senior";
      if (años >= 4) return "Semi-Senior";
      if (años >= 1) return "Junior";
    }
    return "Trainee";
  };

  const actualizarStats = (data) => {
    const sectores = new Set();
    data.forEach(d => {
      if (d.interpretacion?.sector_deducido) {
        sectores.add(d.interpretacion.sector_deducido);
      } else if (d.sector_principal) {
        sectores.add(d.sector_principal);
      }
    });

    let todasSkills = [];
    data.forEach(d => {
      if (d.interpretacion?.habilidades_clave) {
        todasSkills = todasSkills.concat(d.interpretacion.habilidades_clave);
      } else if (d.habilidades) {
        todasSkills = todasSkills.concat(d.habilidades);
      }
    });

    const seniorCount = data.filter(d => {
      const seniority = d.interpretacion?.seniority || deducirSeniority(d.anos_experiencia);
      return seniority === "Senior" || seniority === "Lead";
    }).length;

    const matchPorcent = data.length ? Math.round((seniorCount / data.length) * 100) : 0;

    setStats({
      total: data.length,
      sectores: sectores.size,
      skills: new Set(todasSkills).size,
      senior_percent: matchPorcent
    });
  };

  // ===== FUNCIÓN PARA FILTRAR =====
  const filtrarCandidatos = (candidato) => {
    let datos = candidato;
    if (candidato.raw_data) {
      datos = safeParseRawData(candidato.raw_data);
    }
    
    const nombre = (datos.datos_crudos?.nombre || candidato.nombre || '').toLowerCase();
    const sector = (datos.interpretacion?.sector_deducido || candidato.sector_principal || '').toLowerCase();
    const experiencia = (datos.interpretacion?.anos_experiencia_deducidos || candidato.anos_experiencia || '').toLowerCase();
    const seniority = (datos.interpretacion?.seniority || '').toLowerCase();
    const perfil = (datos.interpretacion?.perfil_interpretado || candidato.perfil_profesional || '').toLowerCase();
    const habilidades = (datos.interpretacion?.habilidades_clave || candidato.habilidades || []).join(' ').toLowerCase();
    const score = datos.score || candidato.score || 0;

    if (filters.nombre && !nombre.includes(filters.nombre.toLowerCase())) return false;
    if (filters.sector && !sector.includes(filters.sector.toLowerCase())) return false;
    if (filters.experiencia && !experiencia.includes(filters.experiencia.toLowerCase())) return false;
    if (filters.seniority && !seniority.includes(filters.seniority.toLowerCase())) return false;
    if (filters.perfil && !perfil.includes(filters.perfil.toLowerCase())) return false;
    if (filters.skills && !habilidades.includes(filters.skills.toLowerCase())) return false;
    if (filters.score) {
      const scoreNum = parseInt(filters.score);
      if (!isNaN(scoreNum) && score < scoreNum) return false;
    }

    return true;
  };

  // ========================================
  // CARGA DE DATOS
  // ========================================
  const loadSavedCandidates = async () => {
    setStatusMessage("📂 Cargando base de datos existente...");
    setStatusClass("analizando");

    try {
      const res = await axios.get(`${API_URL}/candidates`);
      if (res.data.success && res.data.data.length > 0) {
        setGlobalData(res.data.data);
        actualizarStats(res.data.data);
        setStatusMessage(`✅ Base cargada: ${res.data.data.length} candidatos en pipeline`);
        setStatusClass("success");
      } else {
        setStatusMessage("📭 No hay candidatos guardados. Sube CVs para comenzar.");
        setStatusClass("");
      }
    } catch (error) {
      setStatusMessage("📭 Base de datos vacía o error de conexión");
      setStatusClass("");
    }
  };

  // ========================================
  // ANÁLISIS DE CVs
  // ========================================
  const handleAnalyze = async () => {
    const fileInput = document.getElementById('files');
    const files = fileInput?.files;

    if (!files || files.length === 0) {
      alert("Selecciona al menos un CV para analizar");
      return;
    }

    const model = document.getElementById('model')?.value || 'gpt';
    const formData = new FormData();

    for (let f of files) {
      formData.append("files", f);
    }
    formData.append("model", model);

    setStatusMessage(`🤖 Analizando ${files.length} CV(s) con IA...`);
    setStatusClass("analizando");
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/analyze`, formData);
      
      if (!res.data.success) {
        setStatusMessage(`❌ Error: ${res.data.error}`);
        setStatusClass("error");
        setLoading(false);
        return;
      }

      await loadSavedCandidates();
      setStatusMessage(`✅ Análisis completado`);
      setStatusClass("success");
    } catch (error) {
      setStatusMessage(`❌ Error de conexión: ${error.message}`);
      setStatusClass("error");
    }
    setLoading(false);
  };

  // ========================================
  // BÚSQUEDA TRADICIONAL
  // ========================================
  const buscarAvanzado = async () => {
    const skills = searchSkills.split(',').map(s => s.trim()).filter(s => s);
    
    if (skills.length === 0 && !searchSector && !searchScore) {
      alert('Ingresa al menos un criterio de búsqueda');
      return;
    }

    let url = `${API_URL}/search?`;
    const params = [];

    skills.forEach(s => params.push(`skills[]=${encodeURIComponent(s)}`));
    if (searchSector) params.push(`sector=${encodeURIComponent(searchSector)}`);
    if (searchScore) params.push(`min_score=${searchScore}`);

    url += params.join('&');

    setStatusMessage("🔍 Buscando candidatos...");
    setStatusClass("analizando");
    setLoading(true);

    try {
      const res = await axios.get(url);
      
      if (res.data.success) {
        if (res.data.count > 0) {
          setGlobalData(res.data.data);
          actualizarStats(res.data.data);
          setStatusMessage(`✅ ${res.data.count} candidatos encontrados`);
          setStatusClass("success");
        } else {
          alert('No se encontraron candidatos con esos criterios');
          setStatusMessage("❌ No se encontraron resultados");
          setStatusClass("error");
        }
      }
    } catch (error) {
      alert('Error en la búsqueda');
      setStatusMessage("❌ Error en búsqueda");
      setStatusClass("error");
    }
    setLoading(false);
  };

  // ========================================
  // MATCH DE EMPLEO CON IA
  // ========================================
  const buscarMatches = async () => {
    if (!matchDescripcion.trim()) {
      alert('Escribe la descripción del empleo');
      return;
    }

    setMatchCargando(true);
    setStatusMessage("🤖 Buscando los mejores matches...");
    setStatusClass("analizando");

    try {
      const res = await axios.post(`${API_URL}/match-empleo`, {
        titulo: matchTitulo || 'Posición',
        descripcion: matchDescripcion,
        cantidad: 12
      });

      if (res.data.success) {
        setMatchResultados(res.data.candidatos);
        setStatusMessage(`✅ ${res.data.candidatos.length} candidatos encontrados`);
        setStatusClass("success");
      } else {
        alert('Error: ' + res.data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error buscando matches');
    }
    setMatchCargando(false);
  };

  // ========================================
  // BÚSQUEDA SEMÁNTICA
  // ========================================
  const buscarSemantica = async () => {
    if (!semanticQuery.trim()) {
      alert('Escribe qué tipo de perfil buscas');
      return;
    }

    setStatusMessage("🤔 Analizando tu búsqueda...");
    setStatusClass("analizando");
    setSemanticInfo("Procesando búsqueda inteligente...");
    setLoading(true);

    try {
      const analisisRes = await axios.post(`${API_URL}/analyze-search`, {
        query: semanticQuery
      });

      if (!analisisRes.data.success) {
        throw new Error('Error analizando búsqueda');
      }

      const analisis = analisisRes.data.analysis;
      
      setSemanticInfo(`
        🔍 Buscando: ${analisis.rol_buscado || 'perfil relevante'}
        ${analisis.habilidades?.length ? `\n📋 Habilidades: ${analisis.habilidades.join(', ')}` : ''}
        ${analisis.sector ? `\n🏢 Sector: ${analisis.sector}` : ''}
      `);

      const searchRes = await axios.post(`${API_URL}/search-embedding-enhanced`, {
        query: semanticQuery,
        analysis: analisis,
        limite: 30
      });

      if (searchRes.data.success) {
        const candidatos = searchRes.data.data;
        
        setGlobalData(candidatos);
        actualizarStats(candidatos);
        
        let mensaje = `✅ Encontrados ${candidatos.length} candidatos relevantes`;
        if (candidatos.length === 0) {
          mensaje = "❌ No se encontraron candidatos que coincidan con tu búsqueda";
        } else {
          const mejorMatch = candidatos[0];
          mensaje = `✅ ${candidatos.length} candidatos encontrados. Mejor match: ${mejorMatch.datos_crudos?.nombre || mejorMatch.nombre} (${mejorMatch.relevancia || mejorMatch.similitud_semantica}%)`;
        }
        
        setSemanticInfo(mensaje);
        setShowRanking(true);
        setStatusMessage(`✅ Búsqueda inteligente completada`);
        setStatusClass("success");
      } else {
        alert('Error en búsqueda: ' + searchRes.data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error en búsqueda inteligente');
      setStatusMessage("❌ Error en búsqueda");
      setStatusClass("error");
    }
    setLoading(false);
  };

  const limpiarBusquedaSemantica = () => {
    setSemanticQuery('');
    setSemanticInfo('');
    setShowRanking(false);
    setRankingExplanation('');
    loadSavedCandidates();
  };

  // ========================================
  // RANKING CON IA
  // ========================================
  const rankingConIA = async () => {
    if (globalData.length === 0) {
      alert('Primero haz una búsqueda semántica');
      return;
    }

    setStatusMessage("🤖 Mejorando ranking con IA...");
    setStatusClass("analizando");
    setRankingExplanation("Procesando con ChatGPT...");
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/ranking-ia`, {
        candidatos: globalData,
        query: semanticQuery || 'búsqueda semántica',
        model: rankingModel
      });

      if (res.data.success) {
        setGlobalData(res.data.data);
        actualizarStats(res.data.data);
        
        let explicacion = `
          <div style="padding: 12px;">
            <p style="font-weight: 600; color: #6b21a8; margin-bottom: 8px;">🏆 Mejor candidato según IA:</p>
            <p style="margin-bottom: 10px;">${res.data.explicacion || 'No disponible'}</p>
            ${res.data.analisis ? `<p style="font-size: 13px; color: #4b5563; margin-top: 8px;">📊 Análisis: ${res.data.analisis}</p>` : ''}
          </div>
        `;
        
        setRankingExplanation(explicacion);
        setStatusMessage("✅ Ranking mejorado con IA");
        setStatusClass("success");
      } else {
        alert('Error en ranking: ' + res.data.error);
      }
    } catch (error) {
      alert('Error de conexión');
      setStatusMessage("❌ Error en ranking");
      setStatusClass("error");
    }
    setLoading(false);
  };

  // ========================================
  // ASISTENTE INTELIGENTE (HEADHUNTER)
  // ========================================
  const enviarPregunta = async () => {
    if (!preguntaAsistente.trim()) return;
    
    setMensajesAsistente(prev => [...prev, { tipo: 'usuario', texto: preguntaAsistente }]);
    setAsistentePensando(true);
    
    try {
      const res = await axios.post(`${API_URL}/asistente`, {
        mensaje: preguntaAsistente
      });
      
      if (res.data.success) {
        setMensajesAsistente(prev => [...prev, { tipo: 'asistente', texto: res.data.respuesta }]);
      } else {
        setMensajesAsistente(prev => [...prev, { 
          tipo: 'asistente', 
          texto: 'Lo siento, tuve un problema procesando tu pregunta. ¿Puedes intentar de nuevo?' 
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMensajesAsistente(prev => [...prev, { 
        tipo: 'asistente', 
        texto: 'Error de conexión. Por favor, intenta de nuevo.' 
      }]);
    }
    
    setAsistentePensando(false);
    setPreguntaAsistente('');
  };

  // ========================================
  // FICHA DETALLADA
  // ========================================
  const verFicha = (candidato) => {
    // Parsear raw_data de forma segura ANTES de guardar
    const candidatoConDatos = {
      ...candidato,
      _parsed: safeParseRawData(candidato.raw_data)
    };
    setSelectedCandidate(candidatoConDatos);
    cargarResultadosEntrevista(candidato.id);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setSelectedCandidate(null);
  };

  const verCV = (filename) => {
    if (!filename) {
      alert('No hay archivo asociado a este candidato');
      return;
    }
    window.open(`${API_URL}/view-cv/${encodeURIComponent(filename)}`, '_blank');
  };

  // ========================================
  // CARGAR PLANTILLAS DE ENTREVISTA
  // ========================================
  const cargarPlantillas = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/plantillas-v2`);
      if (res.data.success) {
        setPlantillasDisponibles(res.data.plantillas);
      }
    } catch (error) {
      console.error('Error cargando plantillas:', error);
    }
  };

  // ========================================
  // INICIAR ENTREVISTA CON PLANTILLA SELECCIONADA
  // ========================================
  const iniciarEntrevista = async (plantillaId) => {
    console.log('🎥 iniciarEntrevista llamada con plantillaId:', plantillaId);
    console.log('🎥 selectedCandidate:', selectedCandidate);
    
    if (!selectedCandidate) {
      alert('Error: No hay candidato seleccionado');
      return;
    }
  
    try {
      console.log('📤 Enviando petición a:', `${API_URL}/entrevista/iniciar-v2`);
      const res = await axios.post(`${API_URL}/entrevista/iniciar-v2`, {
        candidato_id: selectedCandidate.id,
        plantilla_id: plantillaId
      });
      
      console.log('📥 Respuesta:', res.data);
      
      if (res.data.success) {
        alert(`✅ Enlace generado:\n${res.data.enlace}`);
        if (window.confirm('¿Abrir la entrevista ahora?')) {
          window.open(res.data.enlace, '_blank');
        }
        setMostrarSelectorPlantilla(false);
      } else {
        alert('Error: ' + (res.data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('❌ Error completo:', error);
      alert('Error al generar entrevista: ' + error.message);
    }
  };

  // ========================================
  // EXPORTACIÓN
  // ========================================
  const exportExcel = () => {
    if (globalData.length === 0) {
      alert("No hay datos para exportar");
      return;
    }
    alert('Función de exportación en desarrollo');
  };

  const iniciarEntrevistaVideo = async (candidato) => {
    try {
      const resPlantillas = await axios.get(`${API_URL}/admin/plantillas-v2`);
      
      if (!resPlantillas.data.success || resPlantillas.data.plantillas.length === 0) {
        alert('Primero debe crear una plantilla de entrevista en el panel de administración');
        window.open('/entrevista-admin-v2.html', '_blank');
        return;
      }
  
      const plantillaId = resPlantillas.data.plantillas[0].id;
      
      const res = await axios.post(`${API_URL}/entrevista/iniciar-v2`, {
        candidato_id: candidato.id,
        plantilla_id: plantillaId
      });
      
      if (res.data.success) {
        window.open(res.data.enlace, '_blank');
        alert('✅ Enlace de entrevista generado. Compártelo con el candidato o ábrelo en nueva pestaña.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al iniciar entrevista');
    }
  };

  // ========================================
  // RENDERIZADO
  // ========================================
  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      
      {/* HEADER PROFESIONAL */}
      <header className="professional-header">
        <div className="header-content">
          <div className="logo-area">
            <span className="logo-icon">🎯</span>
            <h1 className="logo-text">Talent<span>Pipeline - TBCR 2026</span></h1>
          </div>
          
          <div className="header-stats">
            <div className="stat-badge">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Candidatos</span>
            </div>
            <div className="stat-badge">
              <span className="stat-value">{stats.sectores}</span>
              <span className="stat-label">Sectores</span>
            </div>
            <div className="stat-badge">
              <span className="stat-value">{stats.skills}</span>
              <span className="stat-label">Skills</span>
            </div>
            <div className="stat-badge">
              <span className="stat-value">{stats.senior_percent}%</span>
              <span className="stat-label">Senior</span>
            </div>
          </div>

          <div className="header-actions">
            <button className="btn-icon" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button className="btn-primary" onClick={exportExcel}>
              📊 Exportar
            </button>
          </div>
        </div>
      </header>

      {/* BARRA DE HERRAMIENTAS */}
      <div className="toolbar">
        <div className="toolbar-group">
          <div className="file-upload">
            <input type="file" id="files" multiple accept=".pdf,.docx" onChange={handleAnalyze} />
            <label htmlFor="files" className="btn-secondary">
              <span>📎</span> Subir CVs
            </label>
          </div>
          <select id="model" className="model-select" defaultValue="gpt">
            <option value="gpt">🤖 ChatGPT</option>
            <option value="deepseek">🧠 DeepSeek</option>
          </select>
          <button className="btn-primary" onClick={handleAnalyze} disabled={loading}>
            {loading ? 'Procesando...' : 'Analizar'}
          </button>
        </div>
        <button onClick={async () => {
  try {
    const res = await axios.post(`${API_URL}/enviar-correo`, {
      to: 'mrodriguez@talentboostercr.com',
      subject: 'Prueba desde React',
      body: '<h1>✅ Hola</h1><p>Correo desde tu aplicación</p>',
      is_html: true
    });
    alert(res.data.success ? '✅ Correo enviado' : '❌ Error: ' + res.data.error);
  } catch (error) {
    alert('❌ Error de conexión: ' + error.message);
  }
}}>
  📧 Probar Email
</button>

        <button className="btn-secondary" onClick={loadSavedCandidates}>
          🔄 Actualizar
        </button>
      </div>

      {/* PANEL DE BÚSQUEDA CON ASISTENTE */}
      <div className="search-panel">
        <div className="search-tabs">
          <button 
            className={`tab-btn ${activeTab === 'tradicional' ? 'active' : ''}`}
            onClick={() => setActiveTab('tradicional')}
          >
            Búsqueda por palabras
          </button>
          <button 
            className={`tab-btn ${activeTab === 'ia' ? 'active' : ''}`}
            onClick={() => setActiveTab('ia')}
          >
            Búsqueda semántica con IA
          </button>
          <button 
            className={`tab-btn ${activeTab === 'asistente' ? 'active' : ''}`}
            onClick={() => setActiveTab('asistente')}
          >
            🤵 Headhunter IA
          </button>
          <button 
            className={`tab-btn ${activeTab === 'entrevistas' ? 'active' : ''}`}
            onClick={() => setActiveTab('entrevistas')}
          >
            🎥 Entrevistas
          </button>

          <button 
            className={`tab-btn ${activeTab === 'correos' ? 'active' : ''}`}
            onClick={() => setActiveTab('correos')}
          >
            📧 Correos
          </button>
        </div>

        <div className="search-content">
          {activeTab === 'tradicional' ? (
            <div className="search-filters">
              <div className="filter-row">
                <div className="filter-group">
                  <label>Habilidades</label>
                  <input 
                    type="text" 
                    placeholder="Python, SQL, Java..."
                    value={searchSkills}
                    onChange={(e) => setSearchSkills(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>Sector</label>
                  <input 
                    type="text" 
                    placeholder="Tecnología, Finanzas..."
                    value={searchSector}
                    onChange={(e) => setSearchSector(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>Score mínimo</label>
                  <input 
                    type="number" 
                    placeholder="70"
                    value={searchScore}
                    onChange={(e) => setSearchScore(e.target.value)}
                  />
                </div>
                <button className="btn-search" onClick={buscarAvanzado}>
                  🔍 Buscar
                </button>
              </div>
            </div>
          ) : activeTab === 'ia' ? (
            <div className="semantic-search">
              <div className="search-input-wrapper">
                <input 
                  type="text" 
                  placeholder="Ej: programador java senior con experiencia en microservicios"
                  value={semanticQuery}
                  onChange={(e) => setSemanticQuery(e.target.value)}
                />
                <button className="btn-ia-search" onClick={buscarSemantica}>
                  🔮 Buscar con IA
                </button>
                {semanticQuery && (
                  <button className="btn-clear" onClick={limpiarBusquedaSemantica}>
                    ✕
                  </button>
                )}
              </div>
              {semanticInfo && (
                <div className="search-info">{semanticInfo}</div>
              )}
            </div>
          ) : activeTab === 'asistente' ? (
            <div className="asistente-tab">
              <div className="asistente-mensajes-container">
                <div className="asistente-mensajes" ref={mensajesRef}>
                  {mensajesAsistente.map((msg, idx) => (
                    <div key={idx} className={`mensaje ${msg.tipo}`}>
                      <div className="mensaje-contenido">{msg.texto}</div>
                    </div>
                  ))}
                  {asistentePensando && (
                    <div className="mensaje asistente pensando">
                      <div className="pensando-indicator">...</div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="asistente-input-container">
                <div className="asistente-input">
                  <input
                    type="text"
                    placeholder="Pregúntame sobre los candidatos..."
                    value={preguntaAsistente}
                    onChange={(e) => setPreguntaAsistente(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && enviarPregunta()}
                    disabled={asistentePensando}
                  />
                  <button 
                    onClick={enviarPregunta}
                    disabled={asistentePensando || !preguntaAsistente.trim()}
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'entrevistas' ? (
            <EntrevistasDashboard />
          ) : activeTab === 'correos' ? (
            <GestionCorreos />
          ) : null}
        </div>
      </div>

      {/* RANKING IA */}
      {showRanking && (
        <div className="ranking-section">
          <div className="ranking-header">
            <h3>
              <span className="ranking-icon">🏆</span>
              Ranking inteligente
            </h3>
            <div className="ranking-controls">
              <select 
                value={rankingModel}
                onChange={(e) => setRankingModel(e.target.value)}
              >
                <option value="gpt">ChatGPT</option>
                <option value="deepseek">DeepSeek</option>
              </select>
              <button onClick={rankingConIA} disabled={loading}>
                ⚡ Mejorar ranking
              </button>
            </div>
          </div>
          {rankingExplanation && (
            <div className="ranking-result">
              <div dangerouslySetInnerHTML={{ __html: rankingExplanation }} />
            </div>
          )}
        </div>
      )}

      {/* ===== MATCH DE EMPLEO CON CARDS ===== */}
      <div className="match-section" style={{
        background: 'white',
        borderRadius: '24px',
        padding: '2rem',
        margin: '2rem 0',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1a1a1a' }}>
              🎯 AI Match
            </h2>
            <p style={{ color: '#666' }}>Describa el puesto y nuestra IA encontrará los mejores candidatos</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Título del puesto (ej: Desarrollador Senior)"
            value={matchTitulo}
            onChange={(e) => setMatchTitulo(e.target.value)}
            style={{
              flex: 1,
              minWidth: '250px',
              padding: '1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '1rem'
            }}
          />
          <textarea
            placeholder="Describa las responsabilidades, requisitos y habilidades necesarias..."
            value={matchDescripcion}
            onChange={(e) => setMatchDescripcion(e.target.value)}
            rows={3}
            style={{
              flex: 2,
              padding: '1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
          <button
            onClick={buscarMatches}
            disabled={matchCargando}
            style={{
              padding: '1rem 2rem',
              background: '#553BC4',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: matchCargando ? 'not-allowed' : 'pointer',
              opacity: matchCargando ? 0.7 : 1,
              whiteSpace: 'nowrap'
            }}
          >
            {matchCargando ? 'Buscando...' : '🔍 Buscar matches'}
          </button>
        </div>

        {matchResultados.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600' }}>
                Mejores candidatos ({matchResultados.length})
              </h3>
              <span style={{ background: '#f0edfe', color: '#553BC4', padding: '0.3rem 1rem', borderRadius: '50px', fontSize: '0.9rem' }}>
                Ordenados por match score
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '1.5rem'
            }}>
              {matchResultados.map((candidato, index) => {
                let datos = candidato;
                if (candidato.raw_data) {
                  datos = safeParseRawData(candidato.raw_data);
                }
                
                const nombre = datos.datos_crudos?.nombre || candidato.nombre || 'Candidato';
                const profesion = datos.datos_crudos?.profesion_escrita || candidato.profesion || '';
                const ubicacion = datos.datos_crudos?.ubicacion || candidato.ubicacion || 'No especificada';
                const experiencia = datos.interpretacion?.anos_experiencia_deducidos || candidato.anos_experiencia || 'N/A';
                const seniority = datos.interpretacion?.seniority || 'N/A';
                const habilidades = datos.interpretacion?.habilidades_clave || candidato.habilidades || [];
                const matchScore = candidato.match_score || candidato.similitud_semantica || 0;

                let scoreColor = '#dc2626';
                if (matchScore >= 80) scoreColor = '#16a34a';
                else if (matchScore >= 60) scoreColor = '#2563eb';
                else if (matchScore >= 40) scoreColor = '#ca8a04';

                return (
                  <div
                    key={index}
                    style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '20px',
                      padding: '1.5rem',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(85,59,196,0.1)';
                      e.currentTarget.style.borderColor = '#553BC4';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                    onClick={() => verFicha(candidato)}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: scoreColor,
                      color: 'white',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '50px',
                      fontSize: '0.8rem',
                      fontWeight: '700'
                    }}>
                      {matchScore}% match
                    </div>

                    <div style={{ marginBottom: '1rem', paddingRight: '60px' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.3rem' }}>
                        {nombre}
                      </h3>
                      <p style={{ color: '#553BC4', fontWeight: '500', fontSize: '0.9rem' }}>
                        {profesion}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                      <span style={{
                        background: '#f0edfe',
                        color: '#553BC4',
                        padding: '0.3rem 0.8rem',
                        borderRadius: '50px',
                        fontSize: '0.8rem',
                        fontWeight: '500'
                      }}>
                        {seniority}
                      </span>
                      <span style={{
                        background: '#f3f4f6',
                        color: '#4b5563',
                        padding: '0.3rem 0.8rem',
                        borderRadius: '50px',
                        fontSize: '0.8rem',
                        fontWeight: '500'
                      }}>
                        📍 {ubicacion}
                      </span>
                      <span style={{
                        background: '#f3f4f6',
                        color: '#4b5563',
                        padding: '0.3rem 0.8rem',
                        borderRadius: '50px',
                        fontSize: '0.8rem',
                        fontWeight: '500'
                      }}>
                        ⏱️ {experiencia}
                      </span>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                      <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
                        Habilidades clave:
                      </p>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {habilidades.slice(0, 4).map((skill, i) => (
                          <span
                            key={i}
                            style={{
                              background: '#f3f4f6',
                              color: '#374151',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                        {habilidades.length > 4 && (
                          <span style={{
                            background: '#f3f4f6',
                            color: '#374151',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            +{habilidades.length - 4}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{
                      marginTop: '1.5rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.85rem',
                      color: '#666'
                    }}>
                      <span>🎯 Match score</span>
                      <span style={{ fontWeight: '700', color: scoreColor }}>{matchScore}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* BARRA DE ESTADO */}
      <div className={`status-bar ${statusClass}`}>
        {statusMessage}
      </div>

      {/* TABLA DE CANDIDATOS CON FILTROS EN COLUMNAS */}
      <div className="table-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="text-xl font-semibold">📋 Pipeline de Talento</h2>
          {globalData.length > 0 && (
            <span className="filters-info">
              Mostrando {globalData.filter(filtrarCandidatos).length} de {globalData.length} candidatos
            </span>
          )}
        </div>
        
        <table className="professional-table">
          <thead>
            <tr>
              <th>
                Nombre
                <div className="column-filter">
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.nombre}
                    onChange={(e) => setFilters({...filters, nombre: e.target.value})}
                    className="filter-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </th>
              <th>
                Sector
                <div className="column-filter">
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.sector}
                    onChange={(e) => setFilters({...filters, sector: e.target.value})}
                    className="filter-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </th>
              <th>
                Experiencia
                <div className="column-filter">
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.experiencia}
                    onChange={(e) => setFilters({...filters, experiencia: e.target.value})}
                    className="filter-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </th>
              <th>
                Seniority
                <div className="column-filter">
                  <select
                    value={filters.seniority}
                    onChange={(e) => setFilters({...filters, seniority: e.target.value})}
                    className="filter-select"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="">Todos</option>
                    <option value="senior">Senior</option>
                    <option value="semi-senior">Semi-Senior</option>
                    <option value="junior">Junior</option>
                    <option value="trainee">Trainee</option>
                  </select>
                </div>
              </th>
              <th>
                Perfil
                <div className="column-filter">
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.perfil}
                    onChange={(e) => setFilters({...filters, perfil: e.target.value})}
                    className="filter-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </th>
              <th>
                Skills
                <div className="column-filter">
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.skills}
                    onChange={(e) => setFilters({...filters, skills: e.target.value})}
                    className="filter-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </th>
              <th>
                Score
                <div className="column-filter">
                  <input
                    type="number"
                    placeholder="Mínimo"
                    value={filters.score}
                    onChange={(e) => setFilters({...filters, score: e.target.value})}
                    className="filter-input filter-number"
                    min="0"
                    max="100"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </th>
              <th>
                <div className="column-filter">
                  <button 
                    className="filter-clear-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters({
                        nombre: '',
                        sector: '',
                        experiencia: '',
                        seniority: '',
                        perfil: '',
                        skills: '',
                        score: ''
                      });
                    }}
                    title="Limpiar filtros"
                  >
                    ✕
                  </button>
                </div>
              </th>
             </tr>
          </thead>
          <tbody>
  {globalData.length === 0 ? (
    <tr>
      <td colSpan="8" className="empty-table">
        No hay candidatos. Sube algunos CVs para comenzar.
      </td>
    </tr>
  ) : (
    globalData
      .filter(filtrarCandidatos)
      .map((candidato, index) => {
        // Parsear raw_data
        let datos = candidato;
        if (candidato.raw_data) {
          try {
            datos = typeof candidato.raw_data === 'string' ? JSON.parse(candidato.raw_data) : candidato.raw_data;
          } catch(e) {
            datos = candidato;
          }
        }
        
        const nombre = datos.datos_crudos?.nombre || candidato.nombre || '—';
        const sector = datos.interpretacion?.sector_deducido || candidato.sector_principal || '—';
        const experiencia = datos.interpretacion?.anos_experiencia_deducidos || candidato.anos_experiencia || '—';
        const seniority = datos.interpretacion?.seniority || deducirSeniority(experiencia);
        const perfil = datos.interpretacion?.perfil_interpretado || candidato.perfil_profesional || '—';
        const habilidades = datos.interpretacion?.habilidades_clave || candidato.habilidades || [];
        const score = datos.score || candidato.score || 0;

        return (
          <tr key={index}>
            <td className="name-cell">{nombre}</td>
            <td><span className="badge badge-sector">{sector}</span></td>
            <td>{experiencia}</td>
            <td><span className={`badge badge-${seniority.toLowerCase()}`}>{seniority}</span></td>
            <td className="profile-cell">{perfil.substring(0, 60)}...</td>
            <td>
              <div className="skills-mini">
                {habilidades.slice(0, 2).map((s, i) => (
                  <span key={i} className="skill-mini">{s}</span>
                ))}
                {habilidades.length > 2 && <span className="skill-mini more">+{habilidades.length-2}</span>}
              </div>
            </td>
            <td>
              <span className={`score-badge score-${Math.floor(score/20)*20}`}>{score}</span>
            </td>
            <td>
              <button className="btn-view" onClick={() => verFicha(candidato)}>
                Ver
              </button>
            </td>
          </tr>
        );
      })
  )}
</tbody>
        </table>
      </div>

      {/* MODAL FICHA */}
      {modalOpen && selectedCandidate && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-professional" onClick={e => e.stopPropagation()}>
          {(() => {
  // Usar el parsed que ya tenemos o parsear de forma segura
  if (!selectedCandidate._parsed) {
    selectedCandidate._parsed = safeParseRawData(selectedCandidate.raw_data);
  }
  return null;
})()}
            
            <button className="modal-close" onClick={cerrarModal}>×</button>
            
            <div className="modal-header">
              <div>
                <h2>{selectedCandidate._parsed?.datos_crudos?.nombre || selectedCandidate.nombre}</h2>
                <p>{selectedCandidate._parsed?.datos_crudos?.profesion_escrita || selectedCandidate.profesion}</p>
              </div>
              <button className="btn-outline" onClick={() => verCV(selectedCandidate.archivo)}>
                📄 Ver CV
              </button>
            </div>

            <button
  onClick={async () => {
    console.log('🔵 Botón clickeado');
    await cargarPlantillas();
    setMostrarSelectorPlantilla(true);
  }}
  className="btn-primary"
  style={{ marginLeft: '1rem', background: '#553BC4' }}
>
  🎥 Video entrevista
</button>

            <div className="modal-body">
              {selectedCandidate._parsed?.interpretacion && (
                <>
                  <div className="modal-section highlight">
                    <h3>🤖 INTERPRETACIÓN IA</h3>
                    
                    <div className="ia-perfil-container">
                      <div className="ia-label">📊 PERFIL INTERPRETADO</div>
                      <p className="ia-text">{selectedCandidate._parsed.interpretacion.perfil_interpretado || 'No disponible'}</p>
                    </div>
                    
                    <div className="ia-grid">
                      <div className="ia-item">
                        <div className="ia-label">🏭 SECTOR DEDUCIDO</div>
                        <span className="badge badge-sector">{selectedCandidate._parsed.interpretacion.sector_deducido || 'No inferido'}</span>
                      </div>
                      <div className="ia-item">
                        <div className="ia-label">📅 EXPERIENCIA DEDUCIDA</div>
                        <span className="badge badge-experiencia">{selectedCandidate._parsed.interpretacion.anos_experiencia_deducidos || 'No inferido'}</span>
                      </div>
                      <div className="ia-item">
                        <div className="ia-label">⭐ SENIORITY</div>
                        <span className={`badge badge-${selectedCandidate._parsed.interpretacion.seniority?.toLowerCase() || 'trainee'}`}>
                          {selectedCandidate._parsed.interpretacion.seniority || 'No inferido'}
                        </span>
                      </div>
                      <div className="ia-item">
                        <div className="ia-label">🏢 INDUSTRIA PRINCIPAL</div>
                        <span className="badge badge-sector">{selectedCandidate._parsed.interpretacion.industria_principal || 'No inferido'}</span>
                      </div>
                    </div>

                    {selectedCandidate._parsed.interpretacion.industrias_secundarias?.length > 0 && (
                      <div className="ia-section">
                        <div className="ia-label">🏢 INDUSTRIAS SECUNDARIAS</div>
                        <div className="ia-tags">
                          {selectedCandidate._parsed.interpretacion.industrias_secundarias.map((ind, i) => (
                            <span key={i} className="tag-industria">{ind}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resultados de entrevistas */}
{selectedCandidate && (
  <div className="modal-section">
    <h3>🎥 Entrevistas realizadas</h3>
    <div className="space-y-4 mt-3">
      {resultadosEntrevistas.map((entrevista, idx) => (
        <div key={idx} className="border rounded-lg p-4 hover:border-[#553BC4] transition cursor-pointer"
             onClick={() => setEntrevistaSeleccionada(entrevista)}>
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">{entrevista.plantilla}</h4>
              <p className="text-sm text-gray-600">
                {new Date(entrevista.fecha).toLocaleDateString('es-CR')}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEntrevistaParaEvaluar(entrevista);
                setModalEvaluacionAbierto(true);
              }}
              className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
            >
              📊 Ver evaluación
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{/* Modal de Evaluación */}
{modalEvaluacionAbierto && entrevistaParaEvaluar && (
  <EvaluacionEntrevista
    entrevistaId={entrevistaParaEvaluar.id}
    onClose={() => setModalEvaluacionAbierto(false)}
  />
)}

                    {/* ===== EMPRESAS DESTACADAS ===== */}
                    {selectedCandidate._parsed?.datos_crudos?.empresas && selectedCandidate._parsed.datos_crudos.empresas.length > 0 ? (
                      <div className="ia-section">
                        <div className="ia-label">🏢 EMPRESAS DESTACADAS</div>
                        <div className="ia-tags">
                          {selectedCandidate._parsed.datos_crudos.empresas.slice(0, 6).map((emp, i) => (
                            <span key={i} className="tag-empresa">🏢 {emp}</span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="ia-section">
                        <div className="ia-label">🏢 EMPRESAS DESTACADAS</div>
                        <div className="no-data">No se encontraron empresas en la experiencia laboral</div>
                      </div>
                    )}

                    {selectedCandidate._parsed.interpretacion.habilidades_clave?.length > 0 && (
                      <div className="ia-section">
                        <div className="ia-label">🔑 HABILIDADES CLAVE (TOP 5)</div>
                        <div className="ia-tags">
                          {selectedCandidate._parsed.interpretacion.habilidades_clave.map((hab, i) => (
                            <span key={i} className="tag-habilidad">⭐ {hab}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="ia-grid-2">
                      {selectedCandidate._parsed.interpretacion.fortalezas?.length > 0 && (
                        <div className="ia-section">
                          <div className="ia-label">💪 FORTALEZAS</div>
                          <ul className="ia-list">
                            {selectedCandidate._parsed.interpretacion.fortalezas.map((fort, i) => (
                              <li key={i}>{fort}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedCandidate._parsed.interpretacion.areas_mejora?.length > 0 && (
                        <div className="ia-section">
                          <div className="ia-label">📈 ÁREAS DE MEJORA</div>
                          <ul className="ia-list">
                            {selectedCandidate._parsed.interpretacion.areas_mejora.map((area, i) => (
                              <li key={i}>{area}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {selectedCandidate._parsed.interpretacion.rol_tipico && (
                      <div className="ia-section">
                        <div className="ia-label">👔 ROL TÍPICO</div>
                        <div className="ia-valor">{selectedCandidate._parsed.interpretacion.rol_tipico}</div>
                      </div>
                    )}

                    {selectedCandidate._parsed.interpretacion.nivel_impacto && (
                      <div className="ia-section">
                        <div className="ia-label">⚡ NIVEL DE IMPACTO</div>
                        <span className={`badge badge-impacto ${selectedCandidate._parsed.interpretacion.nivel_impacto?.toLowerCase()}`}>
                          {selectedCandidate._parsed.interpretacion.nivel_impacto}
                        </span>
                      </div>
                    )}

                    {selectedCandidate._parsed.interpretacion.recomendacion && (
                      <div className="ia-section recomendacion">
                        <div className="ia-label">🎯 RECOMENDACIÓN</div>
                        <div className="ia-valor destacado">{selectedCandidate._parsed.interpretacion.recomendacion}</div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {selectedCandidate._parsed?.datos_crudos && (
                <div className="modal-section">
                  <h3>📄 DATOS DEL CV</h3>
                  <div className="info-grid">
                    <div>
                      <label>📞 Teléfono</label>
                      <span>{selectedCandidate._parsed.datos_crudos.telefono || '—'}</span>
                    </div>
                    <div>
                      <label>✉️ Email</label>
                      <span>{selectedCandidate._parsed.datos_crudos.email || '—'}</span>
                    </div>
                    <div>
                      <label>📍 Ubicación</label>
                      <span>{selectedCandidate._parsed.datos_crudos.ubicacion || '—'}</span>
                    </div>
                    <div>
                      <label>🎓 Carrera</label>
                      <span>{selectedCandidate._parsed.datos_crudos.profesion_escrita || '—'}</span>
                    </div>
                    <div>
                      <label>🏛️ Universidad</label>
                      <span>{selectedCandidate._parsed.datos_crudos.universidad || '—'}</span>
                    </div>
                    <div>
                      <label>📜 Grado</label>
                      <span>{selectedCandidate._parsed.datos_crudos.grado_academico || '—'}</span>
                    </div>
                  </div>

                  {selectedCandidate._parsed.datos_crudos.certificaciones?.length > 0 && (
                    <>
                      <div className="ia-label" style={{ marginTop: '1rem' }}>📜 Certificaciones</div>
                      <div className="ia-tags">
                        {selectedCandidate._parsed.datos_crudos.certificaciones.map((cert, i) => (
                          <span key={i} className="tag-certificacion">{cert}</span>
                        ))}
                      </div>
                    </>
                  )}

                  {selectedCandidate._parsed.datos_crudos.perfil_textual && (
                    <>
                      <div className="ia-label" style={{ marginTop: '1rem' }}>📝 Perfil (textual del CV)</div>
                      <div className="ia-text">{selectedCandidate._parsed.datos_crudos.perfil_textual}</div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <div className="score-display">
                <span className="score-label">Score IA</span>
                <span className={`score-value score-${Math.floor((selectedCandidate._parsed?.score || selectedCandidate.score || 0)/20)*20}`}>
                  {selectedCandidate._parsed?.score || selectedCandidate.score || 0}
                </span>
              </div>
              <span className="criterio">{selectedCandidate._parsed?.criterio_ai || selectedCandidate.criterio_ai || 'No disponible'}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SELECTOR DE PLANTILLA */}
      {mostrarSelectorPlantilla && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
          }}
          onClick={() => setMostrarSelectorPlantilla(false)}
        >
          <div 
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '20px',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>
              🎥 Programar entrevista
            </h2>
            
            <p style={{ marginBottom: '20px', color: '#666', fontWeight: 'bold' }}>
              {selectedCandidate?.datos_crudos?.nombre || 'Candidato'}
            </p>

            <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
            {plantillasDisponibles.map(p => (
  <button
    key={p.id}
    onClick={async () => {
      console.log('🎥 Seleccionada:', p);
      try {
        const res = await axios.post(`${API_URL}/entrevista/iniciar-v2`, {
          candidato_id: selectedCandidate.id,
          plantilla_id: p.id
        });
        
        if (res.data.success) {
          alert(`✅ Enlace generado:\n${res.data.enlace}`);
          window.open(res.data.enlace, '_blank');
        }
      } catch (error) {
        alert('Error: ' + error.message);
      }
      setMostrarSelectorPlantilla(false);
    }}
    className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition"
  >
    <div className="font-medium">{p.nombre}</div>
    <div className="text-sm text-gray-500 mt-1">
      {p.tipo === 'generica' ? '📋 Genérica' : '🎯 Específica'} · 
      {p.preguntas_count || 0} preguntas · 
      {p.fases_count || 0} fases
    </div>
    {p.descripcion && (
      <div className="text-xs text-gray-400 mt-1">{p.descripcion.substring(0, 80)}</div>
    )}
  </button>
))}
            </div>

            <button
              onClick={() => setMostrarSelectorPlantilla(false)}
              style={{
                padding: '12px',
                background: '#553BC4',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                width: '100%',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE RESULTADO DETALLADO DE ENTREVISTA */}
      {modalResultadoAbierto && resultadoEntrevista && (
        <div className="modal-overlay" onClick={() => setModalResultadoAbierto(false)}>
          <div className="modal-professional" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <button className="modal-close" onClick={() => setModalResultadoAbierto(false)}>×</button>
            
            <div className="modal-header">
              <div>
                <h2>📊 Evaluación de Entrevista</h2>
                <p>{resultadoEntrevista.entrevista.candidato_nombre} · {resultadoEntrevista.entrevista.plantilla}</p>
              </div>
              <span className={`badge ${resultadoEntrevista.entrevista.estado === 'completada' ? 'badge-senior' : 'badge-junior'}`}>
                {resultadoEntrevista.entrevista.estado}
              </span>
            </div>

            <div className="modal-body">
              {resultadoEntrevista.entrevista.analisis ? (
                <>
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm text-gray-600">Puntuación global</span>
                        <div className="text-3xl font-bold text-[#2563eb]">
                          {resultadoEntrevista.entrevista.analisis.puntuacion_global || resultadoEntrevista.entrevista.puntuacion}/100
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-600">Recomendación</span>
                        <div className={`text-lg font-semibold ${
                          resultadoEntrevista.entrevista.analisis.recomendacion_final === 'contratar' ? 'text-green-600' :
                          resultadoEntrevista.entrevista.analisis.recomendacion_final === 'considerar' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {resultadoEntrevista.entrevista.analisis.recomendacion_final || 'No disponible'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">📋 Impresión general</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {resultadoEntrevista.entrevista.analisis.impresion_general}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-green-600">✅ Fortalezas destacadas</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {resultadoEntrevista.entrevista.analisis.fortalezas_destacadas?.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-orange-600">📈 Áreas de oportunidad</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {resultadoEntrevista.entrevista.analisis.areas_oportunidad?.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">🔧 Habilidades técnicas</h3>
                      <div className="flex flex-wrap gap-2">
                        {resultadoEntrevista.entrevista.analisis.habilidades_tecnicas?.map((h, i) => (
                          <span key={i} className="tag-habilidad">{h}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">🤝 Habilidades blandas</h3>
                      <div className="flex flex-wrap gap-2">
                        {resultadoEntrevista.entrevista.analisis.habilidades_blandas?.map((h, i) => (
                          <span key={i} className="tag-industria">{h}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mb-3">📝 Análisis por pregunta</h3>
                  <div className="space-y-4">
                    {resultadoEntrevista.entrevista.analisis.analisis_por_pregunta?.map((item, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">Pregunta {idx + 1}</div>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                            Puntuación: {item.puntuacion}/10
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{item.pregunta || resultadoEntrevista.respuestas[idx]?.pregunta}</p>
                        <div className="bg-gray-50 p-3 rounded mb-2 text-sm">
                          <span className="font-medium">Respuesta:</span> {resultadoEntrevista.respuestas[idx]?.respuesta}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.evaluacion}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-green-600 font-medium">✓ Positivo:</span>
                            <ul className="list-disc pl-4">
                              {item.aspectos_positivos?.map((ap, i) => <li key={i}>{ap}</li>)}
                            </ul>
                          </div>
                          <div>
                            <span className="text-orange-600 font-medium">⚡ Mejorar:</span>
                            <ul className="list-disc pl-4">
                              {item.aspectos_mejorar?.map((am, i) => <li key={i}>{am}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">🎯 Coherencia con el perfil</h3>
                    <p>{resultadoEntrevista.entrevista.analisis.coherencia_perfil}</p>
                  </div>

                  {resultadoEntrevista.entrevista.analisis.observaciones_especiales && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm">
                      <span className="font-medium">📌 Observación:</span> {resultadoEntrevista.entrevista.analisis.observaciones_especiales}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay análisis disponible para esta entrevista</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setModalResultadoAbierto(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;