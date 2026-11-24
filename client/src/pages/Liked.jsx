import { useEffect, useState } from 'react';
import { Heart, Play } from 'lucide-react';
import api from '@/lib/api';
import { usePlayer } from '@/context/PlayerContext';
import { Button } from '@/components/ui/button';
import TrackList from '@/components/TrackList';

export default function Liked() {
  const { playQueue } = usePlayer();
  const [tracks, setTracks] = useState(null);
  useEffect(() => { api.get('/tracks/liked').then((r) => setTracks(r.data)); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-6 rounded-2xl bg-gradient-to-br from-indigo-600/50 to-background p-8">
        <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-primary shadow-2xl">
          <Heart className="h-14 w-14 fill-white text-white" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-wider text-muted-foreground">Playlist</p>
          <h1 className="text-4xl font-extrabold md:text-6xl">Liked Songs</h1>
          <p className="text-muted-foreground">{tracks?.length || 0} songs</p>
        </div>
      </div>
      <Button size="lg" onClick={() => playQueue(tracks)} disabled={!tracks?.length}><Play className="fill-current" /> Play</Button>
      {tracks && <TrackList tracks={tracks} />}
    </div>
  );
}
