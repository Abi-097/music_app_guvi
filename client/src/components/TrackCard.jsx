import { Link } from 'react-router-dom';
import { Pause, Play } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export default function TrackCard({ track, queue }) {
  const p = usePlayer();
  const active = p.track?._id === track._id;

  return (
    <div className="group w-40 shrink-0 rounded-xl bg-ink-800 p-3 transition hover:bg-ink-700 sm:w-44">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-ink-600">
        {track.coverUrl && <img src={track.coverUrl} alt={`${track.title} cover`} loading="lazy" className="h-full w-full object-cover" />}
        <button
          onClick={() => (active ? p.toggle() : p.play(track, queue))}
          aria-label={`Play ${track.title}`}
          className={`absolute bottom-2 right-2 grid h-10 w-10 place-items-center rounded-full bg-brand-500 shadow-lg transition hover:scale-105 ${active ? 'opacity-100' : 'translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'}`}
        >
          {active && p.playing ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" className="ml-0.5" />}
        </button>
      </div>
      <Link to={`/track/${track._id}`} className="mt-3 block truncate text-sm font-semibold hover:underline">{track.title}</Link>
      <p className="truncate text-xs text-slate-400">{track.artist}</p>
    </div>
  );
}
