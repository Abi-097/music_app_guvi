import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api
      .get('/auth/me')
      .then((r) => setUser(r.data))
      .catch((e) => {
        if (e?.response?.status === 401) localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  const finish = (data) => {
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) => finish((await api.post('/auth/login', { email, password })).data);
  const register = async (payload) => finish((await api.post('/auth/register', payload)).data);
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  const updateProfile = useCallback(async (patch) => {
    const { data } = await api.patch('/auth/me', patch);
    setUser(data);
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
