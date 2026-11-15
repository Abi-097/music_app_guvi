import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, Lock, Music2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../lib/api';

export function PlaylistCover({ tracks = [] }) {
  const covers = tracks.map((t) => t.coverUrl).filter(Boolean).slice(0, 4);
  if (!covers.length)
    return <div className="grid aspect-square place-items-center rounded-lg bg-ink-600 text-slate-500"><Music2 size={32} /></div>;
  if (covers.length < 4) return <img src={covers[0]} alt="" className="aspect-square w-full rounded-lg object-cover" />;
  return (
    <div className="grid aspect-square grid-cols-2 overflow-hidden rounded-lg">
      {covers.map((c, i) => <img key={i} src={c} alt="" className="h-full w-full object-cover" />)}
    </div>
  );
}

export default function Library() {
  const nav = useNavigate();
  const [lists, setLists] = useState(null);
  const [creating, setCreating] = useState(false);
  const [f, setF] = useState({ name: '', description: '', isPublic: false });

  const load = () => api.get('/playlists').then((r) => setLists(r.data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/playlists', f);
      toast.success('Playlist created');
      nav(`/playlist/${data._id}`);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Your playlists</h1>
        <button className="btn btn-primary" onClick={() => setCreating((c) => !c)}><Plus size={16} /> New playlist</button>
      </div>

      {creating && (
        <form onSubmit={create} className="card mb-6 max-w-lg space-y-3 p-5">
          <input className="input" autoFocus placeholder="Playlist name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <textarea className="input" rows={2} placeholder="Description (optional)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" className="accent-violet-500" checked={f.isPublic} onChange={(e) => setF({ ...f, isPublic: e.target.checked })} />
            Make public (others can find, like and comment)
          </label>
          <div className="flex gap-2">
            <button className="btn btn-primary">Create</button>
            <button type="button" className="btn btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </form>
      )}

      {lists === null && <p className="text-slate-400">Loading…</p>}
      {lists?.length === 0 && !creating && <p className="text-slate-400">No playlists yet. Create one, or use the + icon on any song.</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {lists?.map((pl) => (
          <Link key={pl._id} to={`/playlist/${pl._id}`} className="rounded-xl bg-ink-800 p-3 transition hover:bg-ink-700">
            <PlaylistCover tracks={pl.tracks} />
            <p className="mt-3 truncate font-semibold">{pl.name}</p>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              {pl.isPublic ? <Globe size={12} /> : <Lock size={12} />} {pl.tracks.length} songs
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
