import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Pause, Play } from 'lucide-react';
import api, { errMsg } from '../lib/api';
import { usePlayer } from '../context/PlayerContext';
import LikeButton from '../components/LikeButton';
import DownloadButton from '../components/DownloadButton';
import AddToPlaylist from '../components/AddToPlaylist';
import ShareButtons from '../components/ShareButtons';
import Comments from '../components/Comments';
import { compact, fmtTime } from '../lib/format';

export default function TrackPage() {
  const { id } = useParams();
  const p = usePlayer();
  const [t, setT] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setT(null);
    api.get(`/tracks/${id}`).then((r) => setT(r.data)).catch((e) => setError(errMsg(e)));
  }, [id]);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!t) return <p className="text-slate-400">Loading…</p>;

  const active = p.track?._id === t._id;
  const meta = [t.album, t.movie && t.movie !== t.album ? t.movie : null, t.year].filter(Boolean).join(' · ');

  return (
    <>
      <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end">
        <img src={t.coverUrl} alt={`${t.title} cover`} className="h-52 w-52 rounded-xl bg-ink-600 object-cover shadow-2xl" />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Song · {t.genre}</p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-5xl">{t.title}</h1>
          <p className="mt-2 text-lg text-slate-300">
            <Link to={`/search?q=${encodeURIComponent(t.artist)}&by=artist`} className="font-semibold hover:underline">{t.artist}</Link>
          </p>
          <p className="text-sm text-slate-400">{meta} · {fmtTime(t.duration)} · {compact(t.plays)} plays</p>
        </div>
      </header>

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <button className="btn btn-primary !px-6 !py-3" onClick={() => (active ? p.toggle() : p.play(t, [t]))}>
          {active && p.playing ? <><Pause size={18} fill="white" /> Pause</> : <><Play size={18} fill="white" /> Play</>}
        </button>
        <LikeButton type="track" id={t._id} count={t.likesCount} showCount size={22} />
        <DownloadButton track={t} size={22} label />
        <AddToPlaylist track={t} size={22} />
        <div className="ml-auto"><ShareButtons title={`${t.title} — ${t.artist}`} url={`${location.origin}/track/${t._id}`} /></div>
      </div>

      <div className="max-w-2xl"><Comments type="track" id={t._id} /></div>
    </>
  );
}
