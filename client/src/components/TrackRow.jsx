import { Link } from 'react-router-dom';
import { Pause, Play, X } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import LikeButton from './LikeButton';
import DownloadButton from './DownloadButton';
import AddToPlaylist from './AddToPlaylist';
import { fmtTime } from '../lib/format';

export default function TrackRow({ track, queue, index, onRemove, onDownloadChange, hideAdd = false }) {
  const p = usePlayer();
  const active = p.track?._id === track._id;

  return (
    <div
      onDoubleClick={() => p.play(track, queue)}
      className={`group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-ink-700 md:grid-cols-[auto_1fr_1fr_auto] ${active ? 'bg-ink-700' : ''}`}
    >
      <button
        onClick={() => (active ? p.toggle() : p.play(track, queue))}
        className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-ink-600"
        aria-label={active && p.playing ? `Pause ${track.title}` : `Play ${track.title}`}
      >
        {track.coverUrl && <img src={track.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
        <span className={`absolute inset-0 grid place-items-center bg-black/50 transition ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {active && p.playing ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" />}
        </span>
      </button>

      <div className="min-w-0">
        <Link to={`/track/${track._id}`} className={`block truncate text-sm font-semibold hover:underline ${active ? 'text-brand-400' : ''}`}>
          {index != null && <span className="mr-2 text-slate-500">{index + 1}</span>}
          {track.title}
        </Link>
        <p className="truncate text-xs text-slate-400">{track.artist}</p>
      </div>

      <p className="hidden truncate text-sm text-slate-400 md:block">
        {track.album}{track.movie && track.movie !== track.album ? ` · ${track.movie}` : ''}
      </p>

      <div className="flex items-center gap-3">
        <LikeButton type="track" id={track._id} count={track.likesCount} />
        <DownloadButton track={track} onChange={onDownloadChange} />
        {!hideAdd && <AddToPlaylist track={track} />}
        {onRemove && (
          <button onClick={() => onRemove(track)} aria-label="Remove from playlist" className="text-slate-500 hover:text-red-400">
            <X size={18} />
          </button>
        )}
        <span className="hidden w-10 text-right text-xs tabular-nums text-slate-500 sm:block">{fmtTime(track.duration)}</span>
      </div>
    </div>
  );
}
