import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Play } from 'lucide-react';
import api from '@/lib/api';
import { usePlayer } from '@/context/PlayerContext';
import { Button } from '@/components/ui/button';
import TrackList from '@/components/TrackList';

export default function Genre() {
  const { genre } = useParams();
  const { playQueue } = usePlayer();
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    api.get(`/tracks?genre=${encodeURIComponent(genre)}&sort=popular`).then((r) => setTracks(r.data));
  }, [genre]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary/30 to-background p-8">
        <p className="text-sm uppercase tracking-wider text-muted-foreground">Genre</p>
        <h1 className="text-4xl font-extrabold md:text-6xl">{genre}</h1>
        <p className="mt-2 text-muted-foreground">{tracks.length} tracks</p>
        <Button size="lg" className="mt-4" onClick={() => playQueue(tracks)} disabled={!tracks.length}>
          <Play className="fill-current" /> Play all
        </Button>
      </div>
      <TrackList tracks={tracks} />
    </div>
  );
}
