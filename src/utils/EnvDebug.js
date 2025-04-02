import React from 'react';

const EnvDebug = () => {
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      background: '#333', 
      padding: '10px',
      borderRadius: '5px',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <h4>Environment Variables:</h4>
      <div>SUPABASE_URL: {process.env.REACT_APP_SUPABASE_URL ? '✅ Loaded' : '❌ Missing'}</div>
      <div>SUPABASE_ANON_KEY: {process.env.REACT_APP_SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Missing'}</div>
      <div>NODE_ENV: {process.env.NODE_ENV}</div>
    </div>
  );
};

export default EnvDebug; 