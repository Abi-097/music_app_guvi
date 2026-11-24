import { Link } from 'react-router-dom';
import { ListMusic, Lock } from 'lucide-react';

export function PlaylistCover({ playlist, className = '' }) {
  const covers = (playlist.tracks || []).map((t) => t?.coverUrl).filter(Boolean).slice(0, 4);
  if (playlist.coverUrl) return <img src={playlist.coverUrl} alt="" className={`aspect-square w-full rounded-lg object-cover ${className}`} />;
  if (covers.length >= 4)
    return (
      <div className={`grid aspect-square w-full grid-cols-2 overflow-hidden rounded-lg ${className}`}>
        {covers.map((c, i) => <img key={i} src={c} alt="" className="h-full w-full object-cover" />)}
      </div>
    );
  if (covers.length) return <img src={covers[0]} alt="" className={`aspect-square w-full rounded-lg object-cover ${className}`} />;
  return (
    <div className={`flex aspect-square w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary/40 to-secondary ${className}`}>
      <ListMusic className="h-1/3 w-1/3 text-foreground/70" />
    </div>
  );
}

export default function PlaylistCard({ playlist }) {
  return (
    <Link to={`/playlist/${playlist._id}`} className="group block rounded-xl bg-card p-3 transition hover:bg-accent">
      <PlaylistCover playlist={playlist} className="shadow-lg" />
      <p className="mt-3 flex items-center gap-1 truncate font-semibold">
        {!playlist.isPublic && <Lock className="h-3 w-3 shrink-0" />} {playlist.name}
      </p>
      <p className="truncate text-sm text-muted-foreground">
        {playlist.owner?.name ? `By ${playlist.owner.name} · ` : ''}
        {playlist.tracks?.length || 0} songs
      </p>
    </Link>
  );
}
