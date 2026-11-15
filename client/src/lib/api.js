import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('melodix_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const apiBase = import.meta.env.VITE_API_URL || '/api';
export const errMsg = (e) => e?.response?.data?.message || e.message || 'Something went wrong';

export default api;
