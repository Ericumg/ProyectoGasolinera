import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { StationProvider } from './context/StationContext';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <StationProvider>
          <App />
        </StationProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
