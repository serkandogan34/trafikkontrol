import React from 'react'
import Dashboard from './components/Dashboard'

// React App Component - Modern Traffic Management Dashboard
const ReactApp: React.FC = () => {
  return (
    <div className="react-app">
      {/* React Dashboard */}
      <Dashboard />
      
      {/* React Features Indicator */}
      <div 
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.9))',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        ⚛️ React UI Active
      </div>
    </div>
  )
}

export default ReactApp