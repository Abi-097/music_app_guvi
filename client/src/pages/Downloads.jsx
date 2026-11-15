import { useCallback, useEffect, useState } from 'react';
import { HardDriveDownload, Play, WifiOff } from 'lucide-react';
import { getOfflineEntry, listOfflineTracks, saveToDevice } from '../lib/offline';
import { usePlayer } from '../context/PlayerContext';
import TrackRow from '../components/TrackRow';

export default function Downloads() {
  const p = usePlayer();
  const [tracks, setTracks] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);

  const load = useCallback(() => listOfflineTracks().then(setTracks), []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const up = () => setOnline(true), down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  const exportFile = async (t) => saveToDevice(t, (await getOfflineEntry(t._id)).blob);

  if (!tracks) return <p className="text-slate-400">Loading…</p>;

  return (
    <>
      <h1 className="mb-1 text-2xl font-extrabold">Downloads</h1>
      <p className="mb-5 flex items-center gap-2 text-sm text-slate-400">
        {!online && <WifiOff size={14} className="text-amber-400" />}
        {online ? 'Saved on this device — plays without internet.' : "You're offline. These songs still play."}
      </p>

      {tracks.length > 0 && (
        <button className="btn btn-primary mb-5" onClick={() => p.playAll(tracks)}><Play size={16} fill="white" /> Play all</button>
      )}

      <div className="space-y-1">
        {tracks.map((t, i) => (
          <div key={t._id} className="flex items-center gap-2">
            <div className="min-w-0 flex-1"><TrackRow track={t} queue={tracks} index={i} onDownloadChange={load} hideAdd={!online} /></div>
            <button onClick={() => exportFile(t)} title="Save MP3 file to this device" aria-label="Save file to device" className="text-slate-400 hover:text-white">
              <HardDriveDownload size={18} />
            </button>
          </div>
        ))}
      </div>
      {tracks.length === 0 && <p className="text-slate-400">Nothing downloaded yet. Use the download icon on any song.</p>}
    </>
  );
}
