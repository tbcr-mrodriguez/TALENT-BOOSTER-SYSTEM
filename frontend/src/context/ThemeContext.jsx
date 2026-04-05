import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const API_URL = 'http://localhost:5001/api';

export const ThemeProvider = ({ children }) => {
  const [config, setConfig] = useState({
    sistema_nombre: 'Talent Pipeline',
    color_primario: '#2563eb',
    color_secundario: '#8b5cf6',
    color_fondo: '#f8fafc',
    color_header: '#ffffff',
    sistema_logo_url: '/logo-default.png'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const res = await axios.get(`${API_URL}/configuracion`);
      if (res.data) {
        setConfig(prev => ({ ...prev, ...res.data }));
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const actualizarConfiguracion = async (clave, valor) => {
    try {
      await axios.put(`${API_URL}/configuracion`, { clave, valor });
      setConfig(prev => ({ ...prev, [clave]: valor }));
      
      // Actualizar CSS variables
      if (clave === 'color_primario') {
        document.documentElement.style.setProperty('--color-primary', valor);
      } else if (clave === 'color_secundario') {
        document.documentElement.style.setProperty('--color-secondary', valor);
      } else if (clave === 'color_fondo') {
        document.documentElement.style.setProperty('--color-background', valor);
      } else if (clave === 'color_header') {
        document.documentElement.style.setProperty('--color-header', valor);
      }
      
      return true;
    } catch (error) {
      console.error('Error actualizando configuración:', error);
      return false;
    }
  };

  // Aplicar CSS variables al cargar
  useEffect(() => {
    if (!loading) {
      document.documentElement.style.setProperty('--color-primary', config.color_primario);
      document.documentElement.style.setProperty('--color-secondary', config.color_secundario);
      document.documentElement.style.setProperty('--color-background', config.color_fondo);
      document.documentElement.style.setProperty('--color-header', config.color_header);
    }
  }, [loading, config]);

  return (
    <ThemeContext.Provider value={{ config, loading, actualizarConfiguracion, recargar: cargarConfiguracion }}>
      {children}
    </ThemeContext.Provider>
  );
};
