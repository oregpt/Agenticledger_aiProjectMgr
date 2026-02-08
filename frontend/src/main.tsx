import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';

// SSO callback handler — catches tokens from platform redirect (hash fragment)
if (window.location.hash.startsWith('#sso=')) {
  try {
    const payload = window.location.hash.slice(5);
    const data = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    const authData = {
      state: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        currentOrgId: data.currentOrgId,
        isAuthenticated: true,
      },
      version: 0,
    };
    localStorage.setItem('auth-storage', JSON.stringify(authData));
    window.location.hash = '';
    window.location.replace('/');
  } catch {
    window.location.replace('/login?error=sso_failed');
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
