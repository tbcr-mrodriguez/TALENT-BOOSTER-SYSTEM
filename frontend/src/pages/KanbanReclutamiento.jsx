import React from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const KanbanReclutamiento = () => {
  return (
    <div style={{ 
      width: '100%', 
      height: 'calc(100vh - 100px)', 
      overflow: 'hidden',
      borderRadius: '12px',
      background: 'white',
      border: '1px solid #e2e8f0'
    }}>
      <iframe
        src={`${API_BASE_URL}/kanban`}
        title="Kanban de Reclutamiento"
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
      />
    </div>
  );
};

export default KanbanReclutamiento;
