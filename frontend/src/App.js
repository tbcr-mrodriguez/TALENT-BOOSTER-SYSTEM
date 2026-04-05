import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import TalentoPipeline from './pages/TalentoPipeline';

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
          <Route path="dashboard" element={<Placeholder title="Dashboard" />} />
          <Route path="busqueda-ia" element={<Placeholder title="Búsqueda IA" />} />
          <Route path="ai-match" element={<Placeholder title="AI Match" />} />
          <Route path="headhunter" element={<Placeholder title="Headhunter IA" />} />
          <Route path="entrevistas" element={<Placeholder title="Entrevistas" />} />
          <Route path="correos" element={<Placeholder title="Correos" />} />
          <Route path="reclutamiento" element={<Placeholder title="Reclutamiento" />} />
          <Route path="configuracion" element={<Placeholder title="Configuración" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
