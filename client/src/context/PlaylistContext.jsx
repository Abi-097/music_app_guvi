import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import api, { errMsg } from '@/lib/api';
import { useAuth } from './AuthContext';

const PlaylistContext = createContext(null);

export function PlaylistProvider({ children }) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);

  const refresh = useCallback(async () => {
    if (!user) return setPlaylists([]);
    const { data } = await api.get('/playlists/mine');
    setPlaylists(data);
  }, [user]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const createPlaylist = async (payload) => {
    const { data } = await api.post('/playlists', payload);
    await refresh();
    toast.success(`Created “${data.name}”`);
    return data;
  };

  const addToPlaylist = async (playlistId, track) => {
    try {
      const { data } = await api.post(`/playlists/${playlistId}/tracks`, { trackId: track._id });
      toast.success(`Added to ${data.name}`);
      refresh();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <PlaylistContext.Provider value={{ playlists, refresh, createPlaylist, addToPlaylist }}>{children}</PlaylistContext.Provider>
  );
}

export const usePlaylists = () => useContext(PlaylistContext);
