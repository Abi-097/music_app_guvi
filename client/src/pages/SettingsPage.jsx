import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { errMsg } from '../lib/api';
import GenrePicker from '../components/GenrePicker';

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const p = usePlayer();
  const [name, setName] = useState(user.name);
  const [genres, setGenres] = useState(user.favoriteGenres || []);
  const [artists, setArtists] = useState((user.favoriteArtists || []).join(', '));
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile({
        name,
        favoriteGenres: genres,
        favoriteArtists: artists.split(',').map((a) => a.trim()).filter(Boolean),
      });
      toast.success('Preferences saved');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const seg = (active) => `rounded-lg px-3 py-2 text-sm font-semibold ${active ? 'bg-brand-500' : 'bg-ink-600 hover:bg-ink-600/70'}`;

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-extrabold">Settings</h1>

      <form onSubmit={save} className="card space-y-5 p-6">
        <h2 className="text-lg font-bold">Profile &amp; taste</h2>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <p className="mb-2 text-sm text-slate-400">Favourite genres</p>
          <GenrePicker value={genres} onChange={setGenres} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Favourite artists (comma separated)</label>
          <input className="input" value={artists} onChange={(e) => setArtists(e.target.value)} placeholder="Aurora Vale, Iron Sparrow" />
        </div>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save preferences'}</button>
      </form>

      <section className="card space-y-5 p-6">
        <h2 className="text-lg font-bold">Playback <span className="text-xs font-normal text-slate-500">· saved automatically</span></h2>
        <div>
          <p className="mb-2 text-sm text-slate-400">Streaming quality</p>
          <div className="flex gap-2">
            <button className={seg(p.quality === 'low')} onClick={() => p.setQuality('low')}>Data saver</button>
            <button className={seg(p.quality === 'high')} onClick={() => p.setQuality('high')}>High quality</button>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm text-slate-400">Playback speed</p>
          <div className="flex flex-wrap gap-2">
            {RATES.map((r) => <button key={r} className={seg(p.rate === r)} onClick={() => p.setRate(r)}>{r}×</button>)}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Default volume · {Math.round(p.volume * 100)}%</label>
          <input type="range" min={0} max={1} step={0.01} value={p.volume} onChange={(e) => p.setVolume(Number(e.target.value))}
            style={{ '--fill': `${p.volume * 100}%` }} className="w-full" />
        </div>
        <label className="flex items-center justify-between text-sm">
          Autoplay next track
          <input type="checkbox" className="h-4 w-4 accent-violet-500" checked={p.autoplay} onChange={(e) => p.setAutoplay(e.target.checked)} />
        </label>
      </section>
    </div>
  );
}
