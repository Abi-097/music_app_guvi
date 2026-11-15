import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Pencil, Play, Plus, Shuffle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import TrackRow from '../components/TrackRow';
import LikeButton from '../components/LikeButton';
import ShareButtons from '../components/ShareButtons';
import Comments from '../components/Comments';
import { PlaylistCover } from './Library';

function AddSongs({ playlist, onAdded }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState([]);

  useEffect(() => {
    if (!q.trim()) return setRes([]);
    const id = setTimeout(() => api.get('/tracks/search', { params: { q } }).then((r) => setRes(r.data.slice(0, 6))), 300);
    return () => clearTimeout(id);
  }, [q]);

  const add = async (t) => {
    try {
      const { data } = await api.post(`/playlists/${playlist._id}/tracks`, { trackId: t._id });
      onAdded(data, t);
      toast.success(`Added “${t.title}”`);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="card mb-6 p-4">
      <h3 className="mb-2 text-sm font-bold">Add songs</h3>
      <input className="input" placeholder="Search songs to add…" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="mt-2 divide-y divide-white/5">
        {res.map((t) => {
          const inList = playlist.tracks.some((x) => x._id === t._id);
          return (
            <li key={t._id} className="flex items-center gap-3 py-2">
              <img src={t.coverUrl} alt="" className="h-9 w-9 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{t.title}</p>
                <p className="truncate text-xs text-slate-400">{t.artist}</p>
              </div>
              <button disabled={inList} onClick={() => add(t)} className="btn btn-ghost !px-3 !py-1.5">
                {inList ? <Check size={14} /> : <Plus size={14} />} {inList ? 'Added' : 'Add'}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function PlaylistPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const p = usePlayer();
  const nav = useNavigate();
  const [pl, setPl] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: '', description: '', isPublic: false });

  useEffect(() => {
    setPl(null);
    api.get(`/playlists/${id}`)
      .then((r) => { setPl(r.data); setDraft({ name: r.data.name, description: r.data.description, isPublic: r.data.isPublic }); })
      .catch((e) => setError(errMsg(e)));
  }, [id, user?._id]);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!pl) return <p className="text-slate-400">Loading…</p>;

  const isOwner = user && pl.owner?._id === user._id;

  const save = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put(`/playlists/${id}`, draft);
      setPl({ ...pl, ...data, tracks: pl.tracks, owner: pl.owner });
      setEditing(false);
      toast.success('Playlist updated');
    } catch (err) { toast.error(errMsg(err)); }
  };

  const removePlaylist = async () => {
    if (!confirm(`Delete “${pl.name}”? This can't be undone.`)) return;
    await api.delete(`/playlists/${id}`);
    toast('Playlist deleted');
    nav('/library');
  };

  const removeTrack = async (t) => {
    const { data } = await api.delete(`/playlists/${id}/tracks/${t._id}`);
    setPl({ ...pl, tracks: pl.tracks.filter((x) => x._id !== t._id), updatedAt: data.updatedAt });
  };

  return (
    <>
      <header className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end">
        <div className="w-44 shrink-0 sm:w-52"><PlaylistCover tracks={pl.tracks} /></div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{pl.isPublic ? 'Public playlist' : 'Private playlist'}</p>
          {editing ? (
            <form onSubmit={save} className="mt-2 space-y-2">
              <input className="input !text-lg font-bold" value={draft.name} required onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              <textarea className="input" rows={2} value={draft.description} placeholder="Description" onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" className="accent-violet-500" checked={draft.isPublic} onChange={(e) => setDraft({ ...draft, isPublic: e.target.checked })} /> Public
              </label>
              <div className="flex gap-2"><button className="btn btn-primary">Save</button><button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button></div>
            </form>
          ) : (
            <>
              <h1 className="mt-1 break-words text-3xl font-extrabold sm:text-4xl">{pl.name}</h1>
              {pl.description && <p className="mt-2 text-slate-300">{pl.description}</p>}
              <p className="mt-2 text-sm text-slate-400">by {pl.owner?.name} · {pl.tracks.length} songs</p>
            </>
          )}
        </div>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" disabled={!pl.tracks.length} onClick={() => p.playAll(pl.tracks)}><Play size={16} fill="white" /> Play</button>
        <button className="btn btn-ghost" disabled={!pl.tracks.length} onClick={() => p.playAll(pl.tracks, { shuffled: true })}><Shuffle size={16} /> Shuffle</button>
        <LikeButton type="playlist" id={pl._id} count={pl.likesCount} showCount size={22} />
        {isOwner && !editing && <button className="btn btn-ghost" onClick={() => setEditing(true)}><Pencil size={14} /> Edit</button>}
        {isOwner && <button className="btn btn-ghost !text-red-300" onClick={removePlaylist}><Trash2 size={14} /> Delete</button>}
        <div className="ml-auto"><ShareButtons title={pl.name} url={`${location.origin}/playlist/${pl._id}`} /></div>
      </div>

      {isOwner && <AddSongs playlist={pl} onAdded={(_, t) => setPl((cur) => ({ ...cur, tracks: [...cur.tracks, t] }))} />}

      <div className="mb-10 space-y-1">
        {pl.tracks.map((t, i) => (
          <TrackRow key={t._id} track={t} queue={pl.tracks} index={i} onRemove={isOwner ? removeTrack : undefined} />
        ))}
        {pl.tracks.length === 0 && <p className="text-slate-400">This playlist is empty{isOwner ? ' — search above to add songs.' : '.'}</p>}
      </div>

      <div className="max-w-2xl"><Comments type="playlist" id={pl._id} /></div>
    </>
  );
}
