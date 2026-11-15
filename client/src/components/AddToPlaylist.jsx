import { useEffect, useRef, useState } from 'react';
import { ListPlus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function AddToPlaylist({ track, size = 18 }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState([]);
  const [name, setName] = useState('');
  const ref = useRef();

  useEffect(() => {
    if (!open) return;
    api.get('/playlists').then((r) => setLists(r.data)).catch(() => {});
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const add = async (pl) => {
    try {
      await api.post(`/playlists/${pl._id}/tracks`, { trackId: track._id });
      toast.success(`Added to “${pl.name}”`);
      setOpen(false);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const createAndAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const { data } = await api.post('/playlists', { name });
      await add(data);
      setName('');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!user) return toast('Log in to use playlists', { icon: '🔒' });
          setOpen((o) => !o);
        }}
        title="Add to playlist"
        aria-label="Add to playlist"
        className="text-slate-400 transition hover:text-white"
      >
        <ListPlus size={size} />
      </button>
      {open && (
        <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-8 z-30 w-60 rounded-xl border border-white/10 bg-ink-700 p-2 shadow-2xl">
          <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Add to playlist</p>
          <ul className="max-h-48 overflow-y-auto">
            {lists.map((pl) => (
              <li key={pl._id}>
                <button onClick={() => add(pl)} className="w-full truncate rounded-lg px-2 py-2 text-left text-sm hover:bg-ink-600">
                  {pl.name}
                </button>
              </li>
            ))}
            {lists.length === 0 && <li className="px-2 py-2 text-sm text-slate-500">No playlists yet</li>}
          </ul>
          <form onSubmit={createAndAdd} className="mt-2 flex gap-1 border-t border-white/10 pt-2">
            <input className="input !py-1.5" placeholder="New playlist" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn btn-primary !px-2.5" aria-label="Create playlist"><Plus size={16} /></button>
          </form>
        </div>
      )}
    </div>
  );
}
