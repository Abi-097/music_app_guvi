import { Link } from 'react-router-dom';
import { Pause, Play } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { cn } from '@/lib/utils';

export default function TrackCard({ track, list }) {
  const { current, isPlaying, playTrack, togglePlay } = usePlayer();
  const active = current?._id === track._id;

  return (
    <div className="group relative rounded-xl bg-card p-3 transition hover:bg-accent">
      <div className="relative">
        <img src={track.coverUrl} alt={track.title} className="aspect-square w-full rounded-lg object-cover shadow-lg" loading="lazy" />
        <button
          onClick={() => (active ? togglePlay() : playTrack(track, list))}
          aria-label="Play"
          className={cn(
            'absolute bottom-2 right-2 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100',
            active && 'translate-y-0 opacity-100'
          )}
        >
          {active && isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
        </button>
      </div>
      <Link to={`/track/${track._id}`} className="mt-3 block">
        <p className={cn('truncate font-semibold', active && 'text-primary')}>{track.title}</p>
        <p className="truncate text-sm text-muted-foreground">{track.artist}</p>
      </Link>
    </div>
  );
}
