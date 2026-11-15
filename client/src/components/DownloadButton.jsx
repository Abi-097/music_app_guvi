import { useEffect, useState } from 'react';
import { ArrowDownToLine, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { isDownloaded, removeOffline, saveOffline } from '../lib/offline';
import { errMsg } from '../lib/api';

// Saves the track into on-device storage (IndexedDB) for offline playback.
export default function DownloadButton({ track, size = 18, onChange, label = false }) {
  const [state, setState] = useState('idle'); // idle | loading | done
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let alive = true;
    isDownloaded(track._id).then((d) => alive && setState(d ? 'done' : 'idle'));
    return () => (alive = false);
  }, [track._id]);

  const click = async (e) => {
    e.stopPropagation();
    if (state === 'loading') return;
    try {
      if (state === 'done') {
        await removeOffline(track._id);
        setState('idle');
        toast('Removed from downloads');
      } else {
        setState('loading');
        setPct(0);
        await saveOffline(track, setPct);
        setState('done');
        toast.success('Downloaded for offline listening');
      }
      onChange?.();
    } catch (err) {
      setState('idle');
      toast.error(errMsg(err));
    }
  };

  const title = state === 'done' ? 'Downloaded — click to remove' : state === 'loading' ? `Downloading ${pct}%` : 'Download for offline';

  return (
    <button
      onClick={click}
      title={title}
      aria-label={title}
      className={`flex items-center gap-1.5 transition ${state === 'done' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}
    >
      {state === 'loading' ? (
        <Loader2 size={size} className="animate-spin" />
      ) : state === 'done' ? (
        <CheckCircle2 size={size} />
      ) : (
        <ArrowDownToLine size={size} />
      )}
      {label && <span className="text-sm">{state === 'done' ? 'Downloaded' : state === 'loading' ? `${pct || ''}%` : 'Download'}</span>}
    </button>
  );
}
