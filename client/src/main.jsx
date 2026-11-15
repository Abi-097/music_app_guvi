import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PlayerProvider>
          <App />
          <Toaster position="top-center" toastOptions={{ style: { background: '#25253a', color: '#fff' } }} />
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
