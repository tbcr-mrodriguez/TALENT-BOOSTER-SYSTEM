import React from 'react';

const PruebaDiseno = () => {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px',
      borderRadius: '20px',
      textAlign: 'center',
      color: 'white'
    }}>
      <h1 style={{ fontSize: '32px' }}>🎨 NUEVO DISEÑO FLAT 2.0</h1>
      <p style={{ fontSize: '18px', marginTop: '16px' }}>
        Si ves esto con fondo morado y texto blanco, React está funcionando correctamente.
      </p>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '16px',
        marginTop: '20px',
        color: '#333'
      }}>
        <p>✅ Los estilos inline funcionan</p>
        <p>✅ React está cargando el componente correcto</p>
        <p>✅ El problema es con EntrevistasDashboard específicamente</p>
      </div>
    </div>
  );
};

export default PruebaDiseno;
