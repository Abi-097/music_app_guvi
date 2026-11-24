import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { PlayerProvider } from '@/context/PlayerContext';
import { PlaylistProvider } from '@/context/PlaylistContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PlaylistProvider>
          <PlayerProvider>
            <TooltipProvider>
              <App />
              <Toaster theme="dark" position="top-center" richColors />
            </TooltipProvider>
          </PlayerProvider>
        </PlaylistProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// App-shell caching so the Downloads page opens without a connection.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
