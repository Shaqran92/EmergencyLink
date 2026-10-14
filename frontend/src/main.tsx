import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './shared/AuthProvider';
import ErrorBoundary from './components/ErrorBoundary';
import App from './app/App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallbackTitle="EmergencyLink System Recovery">
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);

// Register Service Worker for offline operation
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('EmergencyLink ServiceWorker registered: ', reg.scope))
      .catch((err) => console.log('EmergencyLink ServiceWorker registration failed: ', err));
  });
}
