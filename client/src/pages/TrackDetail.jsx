import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import api, { errMsg } from '@/lib/api';
import { usePlayer } from '@/context/PlayerContext';
import { downloadTrack, isDownloaded, saveFileToDevice } from '@/lib/offline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import LikeButton from '@/components/LikeButton';
import ShareButtons from '@/components/ShareButtons';
import TrackMenu from '@/components/TrackMenu';
import Comments from '@/components/Comments';
import TrackList from '@/components/TrackList';
import { formatTime } from '@/lib/utils';

export default function TrackDetail() {
  const { id } = useParams();
  const { current, isPlaying, playTrack, togglePlay } = usePlayer();
  const [track, setTrack] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    setTrack(null);
    api
      .get(`/tracks/${id}`)
      .then(({ data }) => {
        setTrack(data);
        return api.get(`/tracks?genre=${encodeURIComponent(data.genre)}&limit=8`);
      })
      .then((r) => setRelated(r.data.filter((t) => t._id !== id)))
      .catch((e) => setError(errMsg(e)));
    isDownloaded(id).then(setOffline);
  }, [id]);

  if (error) return <p className="py-20 text-center text-muted-foreground">{error}</p>;
  if (!track) return <Skeleton className="h-72" />;

  const active = current?._id === track._id;

  const download = async () => {
    try {
      setProgress(0);
      await downloadTrack(track, setProgress);
      setOffline(true);
      toast.success('Saved for offline listening');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end">
        <img src={track.coverUrl} alt={track.title} className="h-56 w-56 rounded-xl object-cover shadow-2xl" />
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">Song</p>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">{track.title}</h1>
          <p className="text-muted-foreground">
            <Link to={`/search?q=${encodeURIComponent(track.artist)}&field=artist`} className="font-semibold text-foreground hover:underline">{track.artist}</Link>
            {' · '}
            <Link to={`/search?q=${encodeURIComponent(track.album)}&field=album`} className="hover:underline">{track.album}</Link>
            {track.year ? ` · ${track.year}` : ''} · {formatTime(track.duration)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to={`/genre/${encodeURIComponent(track.genre)}`}><Badge variant="secondary">{track.genre}</Badge></Link>
            {track.movie && <Link to={`/search?q=${encodeURIComponent(track.movie)}&field=movie`}><Badge variant="outline">🎬 {track.movie}</Badge></Link>}
            <Badge variant="outline">{track.bitrate} kbps</Badge>
            <Badge variant="outline">{track.plays} plays</Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={() => (active ? togglePlay() : playTrack(track, [track, ...related]))}>
          {active && isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current" />}
          {active && isPlaying ? 'Pause' : 'Play'}
        </Button>
        <LikeButton type="tracks" id={track._id} liked={track.liked} count={track.likeCount} showCount className="rounded-full border px-4 py-2" />
        {offline ? (
          <Button variant="outline" className="rounded-full" onClick={() => saveFileToDevice(track)}>
            <Download /> Downloaded · Save .mp3
          </Button>
        ) : (
          <Button variant="outline" className="rounded-full" onClick={download} disabled={progress !== null}>
            <Download /> {progress !== null ? `Downloading ${progress}%` : 'Download'}
          </Button>
        )}
        <ShareButtons title={`${track.title} — ${track.artist}`} path={`/track/${track._id}`} />
        <TrackMenu track={track} />
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
        <Comments type="track" id={track._id} />
        {related.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-bold">More {track.genre}</h2>
            <TrackList tracks={related} showAlbum={false} />
          </section>
        )}
      </div>
    </div>
  );
}
