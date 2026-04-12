import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CandidatosPortal from './pages/CandidatosPortal';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import TalentoPipeline from './pages/TalentoPipeline';
import KanbanReclutamiento from './pages/KanbanReclutamiento';
import AdminEmpleos from './pages/AdminEmpleos';
import AdminEntrevistas from './pages/AdminEntrevistas';
import EntrevistasDashboard from './pages/EntrevistasDashboard';
import HeadhunterIA from './pages/HeadhunterIA';
import Dashboard from './pages/Dashboard';
import GestionCorreosPage from './pages/GestionCorreosPage';
import AIMatch from './pages/AIMatch';
import PruebaDiseno from './components/PruebaDiseno';

// Componente para proteger rutas que requieren autenticación
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Placeholder para páginas que aún no hemos migrado
const Placeholder = ({ title }) => (
  <div style={{ padding: '24px' }}>
    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{title}</h1>
    <p style={{ color: '#64748b', marginTop: '8px' }}>Próximamente...</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta del portal - SIN LAYOUT, completamente aislada */}
        <Route path="/candidatos-portal" element={<CandidatosPortal />} />
        
        {/* Ruta de login (sin layout) */}
        <Route path="/login" element={<Login />} />
        
        {/* Redirección raíz a login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rutas protegidas con layout - TODAS las rutas internas */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="talento" element={<TalentoPipeline />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="busqueda-ia" element={<Placeholder title="Búsqueda IA" />} />
          <Route path="ai-match" element={<AIMatch />} />
          <Route path="headhunter" element={<HeadhunterIA />} />
          <Route path="entrevistas" element={<AdminEntrevistas />} />
          <Route path="correos" element={<GestionCorreosPage />} />
          <Route path="reclutamiento" element={<KanbanReclutamiento />} />
          <Route path="admin-empleos" element={<AdminEmpleos />} />
          <Route path="configuracion" element={<Placeholder title="Configuración" />} />
          <Route path="resultados-entrevistas" element={<EntrevistasDashboard />} />
          <Route path="prueba" element={<PruebaDiseno />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;