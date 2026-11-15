import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward,
  SlidersHorizontal, Volume1, Volume2, VolumeX, WifiOff,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import LikeButton from './LikeButton';
import { fmtTime } from '../lib/format';

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

const fill = (value, max) => ({ '--fill': `${max ? (value / max) * 100 : 0}%` });

function QuickSettings() {
  const p = usePlayer();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Playback settings" title="Playback settings"
        className={`transition ${open ? 'text-brand-400' : 'text-slate-400 hover:text-white'}`}>
        <SlidersHorizontal size={18} />
      </button>
      {open && (
        <div className="absolute bottom-10 right-0 z-40 w-64 space-y-4 rounded-xl border border-white/10 bg-ink-700 p-4 shadow-2xl">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Streaming quality</p>
            <div className="grid grid-cols-2 gap-2">
              {[['low', 'Data saver'], ['high', 'High']].map(([v, label]) => (
                <button key={v} onClick={() => p.setQuality(v)}
                  className={`rounded-lg px-2 py-1.5 text-sm font-medium ${p.quality === v ? 'bg-brand-500' : 'bg-ink-600 hover:bg-ink-600/70'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Playback speed</p>
            <div className="grid grid-cols-3 gap-1.5">
              {RATES.map((r) => (
                <button key={r} onClick={() => p.setRate(r)}
                  className={`rounded-lg px-2 py-1.5 text-sm font-medium ${p.rate === r ? 'bg-brand-500' : 'bg-ink-600 hover:bg-ink-600/70'}`}>
                  {r}×
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between text-sm">
            Autoplay next
            <input type="checkbox" className="h-4 w-4 accent-violet-500" checked={p.autoplay} onChange={(e) => p.setAutoplay(e.target.checked)} />
          </label>
        </div>
      )}
    </div>
  );
}

export default function PlayerBar() {
  const p = usePlayer();
  const t = p.track;
  if (!t) return null;

  const VolIcon = p.muted || p.volume === 0 ? VolumeX : p.volume < 0.5 ? Volume1 : Volume2;
  const ctrl = 'text-slate-300 transition hover:text-white';

  return (
    <footer className="fixed inset-x-0 bottom-14 z-40 border-t border-white/10 bg-ink-800/95 backdrop-blur md:bottom-0">
      {/* progress (full width on mobile) */}
      <div className="flex items-center gap-2 px-4 pt-1 md:hidden">
        <span className="w-9 text-[10px] tabular-nums text-slate-400">{fmtTime(p.progress)}</span>
        <input type="range" min={0} max={p.duration || 1} step={0.1} value={p.progress} style={fill(p.progress, p.duration)}
          onChange={(e) => p.seek(Number(e.target.value))} className="flex-1" aria-label="Seek" />
        <span className="w-9 text-right text-[10px] tabular-nums text-slate-400">{fmtTime(p.duration)}</span>
      </div>

      <div className="mx-auto grid max-w-screen-2xl grid-cols-[1fr_auto] items-center gap-4 px-4 py-2 md:grid-cols-[1fr_2fr_1fr] md:py-3">
        {/* now playing */}
        <div className="flex min-w-0 items-center gap-3">
          <img src={t.coverUrl} alt="" className="h-12 w-12 rounded-md bg-ink-600 object-cover" />
          <div className="min-w-0">
            <Link to={`/track/${t._id}`} className="block truncate text-sm font-semibold hover:underline">{t.title}</Link>
            <p className="flex items-center gap-1.5 truncate text-xs text-slate-400">
              {t.artist}
              {p.offlineNow && <WifiOff size={11} className="text-emerald-400" aria-label="Playing offline copy" />}
            </p>
          </div>
          <div className="hidden sm:block"><LikeButton type="track" id={t._id} count={t.likesCount} /></div>
        </div>

        {/* transport */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-4 sm:gap-5">
            <button onClick={p.toggleShuffle} aria-label="Shuffle" aria-pressed={p.shuffle}
              className={`hidden sm:block ${p.shuffle ? 'text-brand-400' : ctrl}`}><Shuffle size={18} /></button>
            <button onClick={p.prev} aria-label="Previous" className={ctrl}><SkipBack size={20} fill="currentColor" /></button>
            <button onClick={p.toggle} aria-label={p.playing ? 'Pause' : 'Play'}
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink-900 transition hover:scale-105">
              {p.loading ? <Loader2 size={18} className="animate-spin" /> : p.playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>
            <button onClick={p.next} aria-label="Next" className={ctrl}><SkipForward size={20} fill="currentColor" /></button>
            <button onClick={p.cycleRepeat} aria-label={`Repeat ${p.repeat}`}
              className={`hidden sm:block ${p.repeat !== 'off' ? 'text-brand-400' : ctrl}`}>
              {p.repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>
          <div className="hidden w-full max-w-xl items-center gap-2 md:flex">
            <span className="w-10 text-right text-xs tabular-nums text-slate-400">{fmtTime(p.progress)}</span>
            <input type="range" min={0} max={p.duration || 1} step={0.1} value={p.progress} style={fill(p.progress, p.duration)}
              onChange={(e) => p.seek(Number(e.target.value))} className="flex-1" aria-label="Seek" />
            <span className="w-10 text-xs tabular-nums text-slate-400">{fmtTime(p.duration)}</span>
          </div>
        </div>

        {/* volume + settings (desktop) */}
        <div className="hidden items-center justify-end gap-4 md:flex">
          <QuickSettings />
          <button onClick={p.toggleMute} aria-label="Mute" className={ctrl}><VolIcon size={18} /></button>
          <input type="range" min={0} max={1} step={0.01} value={p.muted ? 0 : p.volume} style={fill(p.muted ? 0 : p.volume, 1)}
            onChange={(e) => p.setVolume(Number(e.target.value))} className="w-28" aria-label="Volume" />
        </div>
      </div>
    </footer>
  );
}
