// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import Admin from './Admin';
import './styles/tailwind.css';

const root = createRoot(document.getElementById('root'));

const pathname = window.location.pathname || '/';

// Se a URL começar com /admin → abre o painel admin
if (pathname.startsWith('/admin')) {
  root.render(
    <React.StrictMode>
      <Admin />
    </React.StrictMode>
  );
} 
// Caso contrário → abre o site normal
else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
