import { useEffect, useState } from 'react';
import { Play, Shuffle } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import TrackRow from '../components/TrackRow';

export default function Liked() {
  const { user } = useAuth();
  const p = usePlayer();
  const [tracks, setTracks] = useState(null);

  // refetch when the liked set changes so unliked songs drop off
  useEffect(() => {
    api.get('/tracks/liked').then((r) => setTracks(r.data));
  }, [user?.likedTracks?.length]);

  if (!tracks) return <p className="text-slate-400">Loading…</p>;

  return (
    <>
      <h1 className="mb-1 text-2xl font-extrabold">Liked songs</h1>
      <p className="mb-5 text-sm text-slate-400">{tracks.length} songs</p>
      {tracks.length > 0 && (
        <div className="mb-5 flex gap-3">
          <button className="btn btn-primary" onClick={() => p.playAll(tracks)}><Play size={16} fill="white" /> Play</button>
          <button className="btn btn-ghost" onClick={() => p.playAll(tracks, { shuffled: true })}><Shuffle size={16} /> Shuffle</button>
        </div>
      )}
      <div className="space-y-1">
        {tracks.map((t, i) => <TrackRow key={t._id} track={t} queue={tracks} index={i} />)}
      </div>
      {tracks.length === 0 && <p className="text-slate-400">Tap the heart on any song to save it here.</p>}
    </>
  );
}
