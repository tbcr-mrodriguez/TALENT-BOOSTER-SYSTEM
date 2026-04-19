import React, { useState, useEffect } from 'react';
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
  FileText,
  LogOut,
  Bell
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const menuItems = [
  /*{ path: '/talento', icon: Users, label: 'Pipeline de Talento' },*/
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/ai-match', icon: Brain, label: 'AI Match' },
  { path: '/headhunter', icon: MessageSquare, label: 'Headhunter IA' },
  { path: '/entrevistas', icon: Video, label: 'Configuración Entrevistas' },
  { path: '/resultados-entrevistas', icon: FileText, label: 'Resultados Entrevistas' },
  { path: '/correos', icon: Mail, label: 'Correos' },
  { path: '/reclutamiento', icon: Briefcase, label: 'Reclutamiento' },
  { path: '/admin-empleos', icon: Settings, label: 'Admin Empleos' }
];

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState('Usuario');
  const location = useLocation();

  // Obtener nombre del usuario desde localStorage
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        setUserName(userData.nombre || userData.email || 'Usuario');
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  };

  // Obtener el título de la página actual
  const getPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.label : 'Talent Pipeline';
  };

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: '#f8fafc' 
    }}>
      {/* ==================== SIDEBAR (Flat 2.0) ==================== */}
      <div style={{
        width: sidebarOpen ? '260px' : '80px',
        background: 'white',
        borderRight: '1px solid #e2e8f0',
        transition: 'width 0.3s ease',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '18px' }}>🎯</span>
            </div>
            {sidebarOpen && (
              <div>
                <h1 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Talent</h1>
                <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: 0, lineHeight: 1 }}>Pipeline</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Menú */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
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
                  borderRadius: '12px',
                  background: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#2563eb' : '#64748b',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
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

          {/* Portal del Candidato - Se abre en nueva pestaña SIN el layout */}
          <a
            href="/candidatos-portal"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              marginBottom: '4px',
              borderRadius: '12px',
              background: 'transparent',
              color: '#64748b',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Briefcase size={20} strokeWidth={1.5} />
            {sidebarOpen && <span>Portal del Candidato</span>}
          </a>
        </nav>

        {/* Footer del Sidebar - Cerrar Sesión */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #e2e8f0',
          marginTop: 'auto'
        }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              width: '100%',
              borderRadius: '12px',
              background: 'transparent',
              color: '#ef4444',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </div>

      {/* ==================== MAIN CONTENT ==================== */}
      <div style={{
        marginLeft: sidebarOpen ? '260px' : '80px',
        flex: 1,
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header (Flat 2.0) */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
              {getPageTitle()}
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0' }}>
              {new Date().toLocaleDateString('es-CR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Notificaciones */}
            <button style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '10px',
              padding: '8px',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Bell size={20} color="#64748b" />
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                background: '#ef4444',
                borderRadius: '50%'
              }} />
            </button>
            
            {/* Usuario */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 12px 6px 8px',
              borderRadius: '40px',
              background: '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
            >
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>{userName}</span>
            </div>
          </div>
        </header>

        {/* Contenido principal con padding y fondo */}
        <main style={{ 
          padding: '24px',
          background: '#f8fafc',
          flex: 1
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;