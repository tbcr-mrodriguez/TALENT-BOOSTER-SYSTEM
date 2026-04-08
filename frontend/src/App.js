
import React from 'react';
import AIMatch from './pages/AIMatch';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import TalentoPipeline from './pages/TalentoPipeline';
import KanbanReclutamiento from './pages/KanbanReclutamiento';
import AdminEmpleos from './pages/AdminEmpleos';
import AdminEntrevistas from './pages/AdminEntrevistas';
import EntrevistasDashboard from './components/EntrevistasDashboard';
import HeadhunterIA from './pages/HeadhunterIA';
import Dashboard from './pages/Dashboard';
import GestionCorreosPage from './pages/GestionCorreosPage';

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
        <Route path="/" element={<MainLayout />}>
          <Route index element={<TalentoPipeline />} />
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
