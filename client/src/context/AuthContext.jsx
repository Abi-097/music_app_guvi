import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('melodix_token')) {
      setReady(true);
      return;
    }
    api
      .get('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem('melodix_token'))
      .finally(() => setReady(true));
  }, []);

  const finish = (data) => {
    localStorage.setItem('melodix_token', data.token);
    setUser(data.user);
  };

  const login = async (email, password) => finish((await api.post('/auth/login', { email, password })).data);
  const register = async (payload) => finish((await api.post('/auth/register', payload)).data);
  const logout = () => {
    localStorage.removeItem('melodix_token');
    setUser(null);
  };

  const updateProfile = useCallback(async (patch) => {
    const { data } = await api.put('/auth/me', patch);
    setUser(data);
    return data;
  }, []);

  // Keep local liked lists in sync after a like toggle
  const syncLike = useCallback((type, id, liked) => {
    const field = type === 'track' ? 'likedTracks' : 'likedPlaylists';
    setUser((u) => {
      if (!u) return u;
      const set = new Set(u[field]);
      liked ? set.add(id) : set.delete(id);
      return { ...u, [field]: [...set] };
    });
  }, []);

  return (
    <AuthCtx.Provider value={{ user, ready, login, register, logout, updateProfile, syncLike }}>
      {children}
    </AuthCtx.Provider>
  );
}
