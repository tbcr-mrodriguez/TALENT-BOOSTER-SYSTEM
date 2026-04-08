import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Search, 
  Brain, 
  MessageSquare, 
  Video, 
  Mail, 
  Briefcase, 
  Settings,
  Menu,
  X,
  FileText
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const menuItems = [
  { path: '/talento', icon: Users, label: 'Pipeline de Talento' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/busqueda-ia', icon: Search, label: 'Búsqueda IA' },
  { path: '/ai-match', icon: Brain, label: 'AI Match' },
  { path: '/headhunter', icon: MessageSquare, label: 'Headhunter IA' },
  { path: '/entrevistas', icon: Video, label: 'Configuración Entrevistas' },
  { path: '/resultados-entrevistas', icon: FileText, label: 'Resultados Entrevistas' },
  { path: '/correos', icon: Mail, label: 'Correos' },
  { path: '/reclutamiento', icon: Briefcase, label: 'Reclutamiento' },
  { path: '/admin-empleos', icon: Settings, label: 'Admin Empleos' },
  { path: '/configuracion', icon: Settings, label: 'Configuración' }
];

const portalItem = { 
  path: `${API_BASE_URL}/candidatos-portal.html`, 
  icon: Briefcase, 
  label: 'Portal del Candidato' 
};

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '260px' : '80px',
        background: 'white',
        boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
        transition: 'width 0.3s',
        position: 'fixed',
        height: '100vh',
        overflow: 'hidden',
        zIndex: 50
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center'
        }}>
          {sidebarOpen ? (
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>Talent Pipeline</h1>
          ) : (
            <span style={{ fontSize: '1.5rem' }}>🎯</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              padding: '4px 8px',
              cursor: 'pointer'
            }}
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Menu */}
        <nav style={{ padding: '16px 12px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  marginBottom: '4px',
                  borderRadius: '10px',
                  background: isActive ? '#e0e7ff' : 'transparent',
                  color: isActive ? '#2563eb' : '#475569',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400
                }}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}

          {/* Separador */}
          <div style={{
            height: '1px',
            background: '#e2e8f0',
            margin: '12px 0'
          }} />

          {/* Portal del Candidato */}
          <a
            href={portalItem.path}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              marginBottom: '4px',
              borderRadius: '10px',
              background: 'transparent',
              color: '#475569',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 400,
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <portalItem.icon size={20} />
            {sidebarOpen && <span>{portalItem.label}</span>}
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div style={{
        marginLeft: sidebarOpen ? '260px' : '80px',
        padding: '24px',
        flex: 1,
        transition: 'margin-left 0.3s',
        width: '100%'
      }}>
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
