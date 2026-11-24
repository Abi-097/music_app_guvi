import { Route, Routes } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Home from '@/pages/Home';
import Search from '@/pages/Search';
import Genre from '@/pages/Genre';
import TrackDetail from '@/pages/TrackDetail';
import Library from '@/pages/Library';
import PlaylistDetail from '@/pages/PlaylistDetail';
import Liked from '@/pages/Liked';
import Downloads from '@/pages/Downloads';
import Settings from '@/pages/Settings';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';

const guard = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/register" element={<Auth mode="register" />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<Search />} />
        <Route path="genre/:genre" element={<Genre />} />
        <Route path="track/:id" element={<TrackDetail />} />
        <Route path="playlist/:id" element={<PlaylistDetail />} />
        <Route path="downloads" element={<Downloads />} />
        <Route path="library" element={guard(<Library />)} />
        <Route path="liked" element={guard(<Liked />)} />
        <Route path="settings" element={guard(<Settings />)} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
