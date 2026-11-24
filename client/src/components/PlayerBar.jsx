import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Gauge, ListOrdered, Loader2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume1, Volume2, VolumeX,
} from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn, formatTime } from '@/lib/utils';
import LikeButton from './LikeButton';

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function PlayerBar() {
  const p = usePlayer();
  const [dragging, setDragging] = useState(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const t = p.current;

  if (!t) return null;

  const vol = p.muted ? 0 : p.settings.volume;
  const VolIcon = vol === 0 ? VolumeX : vol < 0.5 ? Volume1 : Volume2;
  const pos = dragging ?? p.position;

  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="grid h-20 grid-cols-[1fr_auto] items-center gap-4 px-4 md:grid-cols-[1fr_2fr_1fr]">
        {/* Now playing */}
        <div className="flex min-w-0 items-center gap-3">
          <img src={t.coverUrl} alt="" className="h-14 w-14 rounded-md object-cover shadow" />
          <div className="min-w-0">
            <Link to={`/track/${t._id}`} className="block truncate text-sm font-semibold hover:underline">{t.title}</Link>
            <p className="truncate text-xs text-muted-foreground">{t.artist}</p>
            <p className="hidden text-[10px] font-medium uppercase tracking-wider text-primary sm:block">{t.bitrate || 320} kbps · HQ</p>
          </div>
          <LikeButton key={t._id} type="tracks" id={t._id} liked={t.liked} count={t.likeCount} className="ml-1 hidden sm:inline-flex" />
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={() => p.setShuffle(!p.shuffle)} className={cn('hidden md:inline-flex', p.shuffle && 'text-primary')} aria-label="Shuffle" title="Shuffle">
              <Shuffle />
            </Button>
            <Button variant="ghost" size="icon" onClick={p.prev} aria-label="Previous">
              <SkipBack className="fill-current" />
            </Button>
            <Button size="icon" className="h-10 w-10 rounded-full bg-foreground text-background hover:bg-foreground/90" onClick={p.togglePlay} aria-label={p.isPlaying ? 'Pause' : 'Play'}>
              {p.isLoading ? <Loader2 className="animate-spin" /> : p.isPlaying ? <Pause className="fill-current" /> : <Play className="ml-0.5 fill-current" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={p.next} aria-label="Next">
              <SkipForward className="fill-current" />
            </Button>
            <Button variant="ghost" size="icon" onClick={p.cycleRepeat} className={cn('relative hidden md:inline-flex', p.repeat !== 'off' && 'text-primary')} aria-label={`Repeat: ${p.repeat}`} title={`Repeat: ${p.repeat}`}>
              {p.repeat === 'one' ? <Repeat1 /> : <Repeat />}
            </Button>
          </div>
          <div className="hidden w-full max-w-xl items-center gap-2 text-xs tabular-nums text-muted-foreground md:flex">
            <span className="w-10 text-right">{formatTime(pos)}</span>
            <Slider
              value={[pos]}
              max={p.duration || 1}
              step={0.5}
              onValueChange={([v]) => setDragging(v)}
              onValueCommit={([v]) => {
                p.seek(v);
                setDragging(null);
              }}
              aria-label="Seek"
            />
            <span className="w-10">{formatTime(p.duration)}</span>
          </div>
        </div>

        {/* Extras */}
        <div className="hidden items-center justify-end gap-1 md:flex">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="tabular-nums" title="Playback speed">
                <Gauge /> {p.settings.playbackRate}x
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Playback speed</DropdownMenuLabel>
              {RATES.map((r) => (
                <DropdownMenuItem key={r} onClick={() => p.updateSettings({ playbackRate: r })} className={cn(r === p.settings.playbackRate && 'text-primary')}>
                  {r}x {r === 1 && '(normal)'}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={() => setQueueOpen(true)} aria-label="Queue" title="Queue">
            <ListOrdered />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => p.setMuted(!p.muted)} aria-label="Mute">
            <VolIcon />
          </Button>
          <Slider className="w-28" value={[vol * 100]} max={100} step={1} onValueChange={([v]) => p.setVolume(v / 100)} aria-label="Volume" />
        </div>
      </div>
      {/* Mobile progress line */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-secondary md:hidden">
        <div className="h-full bg-primary" style={{ width: `${p.duration ? (pos / p.duration) * 100 : 0}%` }} />
      </div>

      <Dialog open={queueOpen} onOpenChange={setQueueOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Play queue</DialogTitle>
          </DialogHeader>
          <ul className="space-y-1">
            {p.queue.map((q, i) => (
              <li key={`${q._id}-${i}`}>
                <button onClick={() => p.jumpTo(i)} className={cn('flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-accent', i === p.index && 'bg-accent')}>
                  <img src={q.coverUrl} alt="" className="h-10 w-10 rounded object-cover" />
                  <div className="min-w-0">
                    <p className={cn('truncate text-sm font-medium', i === p.index && 'text-primary')}>{q.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{q.artist}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
