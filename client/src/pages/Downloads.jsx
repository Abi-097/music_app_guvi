import { useEffect, useState } from 'react';
import { Download, HardDriveDownload, Play, Save, Trash2, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { listDownloads, removeDownload, saveFileToDevice } from '@/lib/offline';
import { usePlayer } from '@/context/PlayerContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const mb = (b) => `${(b / 1024 / 1024).toFixed(1)} MB`;

export default function Downloads() {
  const { playTrack } = usePlayer();
  const [items, setItems] = useState([]);
  const [online, setOnline] = useState(navigator.onLine);

  const load = () => listDownloads().then(setItems);
  useEffect(() => {
    load();
    const on = () => setOnline(navigator.onLine);
    window.addEventListener('online', on);
    window.addEventListener('offline', on);
    window.addEventListener('downloads-changed', load);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', on);
      window.removeEventListener('downloads-changed', load);
    };
  }, []);

  const total = items.reduce((s, t) => s + (t.size || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight"><HardDriveDownload /> Downloads</h1>
          <p className="text-muted-foreground">{items.length} songs · {mb(total)} stored in this browser for offline listening</p>
        </div>
        {items.length > 0 && <Button size="lg" onClick={() => playTrack(items[0], items)}><Play className="fill-current" /> Play all</Button>}
      </div>
      {!online && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
          <WifiOff className="h-4 w-4" /> You’re offline — downloaded songs below still play.
        </div>
      )}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          <Download className="mx-auto mb-3 h-8 w-8" />
          Use “Download for offline” from any track’s ••• menu or its detail page.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <Card key={t._id} className="flex items-center gap-3 p-3">
              <button onClick={() => playTrack(t, items)} className="relative shrink-0" aria-label="Play">
                <img src={t.coverUrl} alt="" className="h-12 w-12 rounded object-cover" />
                <Play className="absolute inset-0 m-auto h-5 w-5 fill-white text-white opacity-0 hover:opacity-100" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{t.title}</p>
                <p className="truncate text-sm text-muted-foreground">{t.artist} · {mb(t.size)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => saveFileToDevice(t)} title="Save .mp3 to device"><Save /> <span className="hidden sm:inline">Save file</span></Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove download"
                onClick={async () => { await removeDownload(t._id); load(); toast.success('Removed from downloads'); }}
              >
                <Trash2 />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
