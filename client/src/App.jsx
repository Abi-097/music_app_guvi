import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import PlaylistPage from './pages/PlaylistPage';
import TrackPage from './pages/TrackPage';
import Liked from './pages/Liked';
import Downloads from './pages/Downloads';
import SettingsPage from './pages/SettingsPage';
import { Login, Register } from './pages/AuthPages';

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { ready } = useAuth();
  if (!ready) return <div className="grid h-full place-items-center text-slate-400">Loading…</div>;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<Search />} />
        <Route path="track/:id" element={<TrackPage />} />
        <Route path="playlist/:id" element={<PlaylistPage />} />
        <Route path="downloads" element={<Downloads />} />
        <Route path="library" element={<Protected><Library /></Protected>} />
        <Route path="liked" element={<Protected><Liked /></Protected>} />
        <Route path="settings" element={<Protected><SettingsPage /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
