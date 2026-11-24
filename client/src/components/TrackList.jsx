import { Link } from 'react-router-dom';
import { Pause, Play } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { cn, formatTime } from '@/lib/utils';
import LikeButton from './LikeButton';
import TrackMenu from './TrackMenu';

function Equalizer() {
  return (
    <span className="flex h-4 items-end gap-[2px]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-[3px] animate-pulse rounded-sm bg-primary" style={{ height: `${50 + i * 20}%`, animationDelay: `${i * 150}ms` }} />
      ))}
    </span>
  );
}

export default function TrackList({ tracks, onRemove, showAlbum = true }) {
  const { current, isPlaying, playTrack, togglePlay } = usePlayer();

  if (!tracks?.length) return <p className="py-10 text-center text-muted-foreground">No tracks here yet.</p>;

  return (
    <div className="w-full">
      <div className="grid grid-cols-[2rem_1fr_auto] gap-4 border-b px-3 pb-2 text-xs uppercase tracking-wider text-muted-foreground md:grid-cols-[2rem_1.5fr_1fr_auto]">
        <span>#</span>
        <span>Title</span>
        {showAlbum && <span className="hidden md:block">Album / Movie</span>}
        <span className="pr-12 text-right">Time</span>
      </div>
      <ul className="mt-2">
        {tracks.map((t, i) => {
          const active = current?._id === t._id;
          return (
            <li
              key={`${t._id}-${i}`}
              onDoubleClick={() => playTrack(t, tracks)}
              className={cn(
                'group grid grid-cols-[2rem_1fr_auto] items-center gap-4 rounded-md px-3 py-2 hover:bg-accent md:grid-cols-[2rem_1.5fr_1fr_auto]',
                active && 'bg-accent/60'
              )}
            >
              <button
                className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
                onClick={() => (active ? togglePlay() : playTrack(t, tracks))}
                aria-label={active && isPlaying ? 'Pause' : 'Play'}
              >
                <span className="group-hover:hidden">{active && isPlaying ? <Equalizer /> : <span className={cn(active && 'text-primary')}>{i + 1}</span>}</span>
                <span className="hidden text-foreground group-hover:block">
                  {active && isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                </span>
              </button>
              <div className="flex min-w-0 items-center gap-3">
                <img src={t.coverUrl} alt="" className="h-10 w-10 shrink-0 rounded object-cover" loading="lazy" />
                <div className="min-w-0">
                  <Link to={`/track/${t._id}`} className={cn('block truncate font-medium hover:underline', active && 'text-primary')}>
                    {t.title}
                  </Link>
                  <Link to={`/search?q=${encodeURIComponent(t.artist)}&field=artist`} className="block truncate text-sm text-muted-foreground hover:underline">
                    {t.artist}
                  </Link>
                </div>
              </div>
              {showAlbum && (
                <div className="hidden min-w-0 text-sm text-muted-foreground md:block">
                  <p className="truncate">{t.album}</p>
                  {t.movie && <p className="truncate text-xs">🎬 {t.movie}</p>}
                </div>
              )}
              <div className="flex items-center gap-3">
                <LikeButton type="tracks" id={t._id} liked={t.liked} count={t.likeCount} />
                <span className="w-10 text-right text-sm tabular-nums text-muted-foreground">{formatTime(t.duration)}</span>
                <TrackMenu track={t} onRemove={onRemove ? () => onRemove(t) : undefined} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
