import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Globe, Lock, Pencil, Play, Plus, Search, Shuffle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api, { errMsg } from '@/lib/api';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import TrackList from '@/components/TrackList';
import LikeButton from '@/components/LikeButton';
import ShareButtons from '@/components/ShareButtons';
import Comments from '@/components/Comments';
import { PlaylistCover } from '@/components/PlaylistCard';
import { formatTime } from '@/lib/utils';

export default function PlaylistDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { playQueue, setShuffle } = usePlayer();
  const { refresh } = usePlaylists();
  const [pl, setPl] = useState(null);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({});
  const [q, setQ] = useState('');
  const [found, setFound] = useState([]);

  const load = () => api.get(`/playlists/${id}`).then((r) => setPl(r.data)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!addOpen) return;
    const t = setTimeout(() => api.get(`/tracks/search?q=${encodeURIComponent(q)}`).then((r) => setFound(r.data)), 250);
    return () => clearTimeout(t);
  }, [q, addOpen]);

  if (error) return <p className="py-20 text-center text-muted-foreground">{error}</p>;
  if (!pl) return <Skeleton className="h-72" />;

  const total = pl.tracks.reduce((s, t) => s + (t.duration || 0), 0);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/playlists/${id}`, form);
      await load();
      refresh();
      setEditOpen(false);
      toast.success('Playlist updated');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const removeTrack = async (t) => {
    await api.delete(`/playlists/${id}/tracks/${t._id}`);
    setPl((p) => ({ ...p, tracks: p.tracks.filter((x) => x._id !== t._id) }));
    refresh();
    toast.success(`Removed “${t.title}”`);
  };

  const addTrack = async (t) => {
    await api.post(`/playlists/${id}/tracks`, { trackId: t._id });
    await load();
    refresh();
    toast.success(`Added “${t.title}”`);
  };

  const remove = async () => {
    await api.delete(`/playlists/${id}`);
    refresh();
    toast.success('Playlist deleted');
    nav('/library');
  };

  const inList = new Set(pl.tracks.map((t) => t._id));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end">
        <div className="w-56 shrink-0"><PlaylistCover playlist={pl} className="shadow-2xl" /></div>
        <div className="space-y-2">
          <p className="flex items-center gap-1 text-sm uppercase tracking-wider text-muted-foreground">
            {pl.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />} {pl.isPublic ? 'Public' : 'Private'} playlist
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">{pl.name}</h1>
          {pl.description && <p className="text-muted-foreground">{pl.description}</p>}
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{pl.owner?.name}</span> · {pl.tracks.length} songs · {formatTime(total)} · {pl.likeCount} likes
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={() => { setShuffle(false); playQueue(pl.tracks); }} disabled={!pl.tracks.length}>
          <Play className="fill-current" /> Play
        </Button>
        <Button size="lg" variant="outline" onClick={() => { setShuffle(true); playQueue(pl.tracks, Math.floor(Math.random() * pl.tracks.length)); }} disabled={!pl.tracks.length}>
          <Shuffle /> Shuffle
        </Button>
        {!pl.isOwner && <LikeButton type="playlists" id={pl._id} liked={pl.liked} count={pl.likeCount} showCount className="rounded-full border px-4 py-2" />}
        {pl.isPublic && <ShareButtons title={pl.name} path={`/playlist/${pl._id}`} />}
        {pl.isOwner && (
          <>
            <Button variant="secondary" onClick={() => setAddOpen(true)}><Plus /> Add songs</Button>
            <Button variant="ghost" onClick={() => { setForm({ name: pl.name, description: pl.description, isPublic: pl.isPublic }); setEditOpen(true); }}>
              <Pencil /> Edit
            </Button>
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}><Trash2 /> Delete</Button>
          </>
        )}
      </div>

      <TrackList tracks={pl.tracks} onRemove={pl.isOwner ? removeTrack : undefined} />

      {pl.isPublic && <div className="max-w-2xl"><Comments type="playlist" id={pl._id} /></div>}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={save} className="space-y-4">
            <DialogHeader><DialogTitle>Edit playlist</DialogTitle></DialogHeader>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Cover image URL (optional)</Label>
              <Input value={form.coverUrl ?? pl.coverUrl ?? ''} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} placeholder="https://…" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm font-medium">Public</span>
              <Switch checked={!!form.isPublic} onCheckedChange={(v) => setForm({ ...form, isPublic: v })} />
            </div>
            <DialogFooter><Button type="submit">Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add songs to {pl.name}</DialogTitle></DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search songs, artists, albums, movies…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          </div>
          <ul className="space-y-1">
            {found.map((t) => (
              <li key={t._id} className="flex items-center gap-3 rounded-md p-2 hover:bg-accent">
                <img src={t.coverUrl} alt="" className="h-10 w-10 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.artist} · {t.album}</p>
                </div>
                <Button size="sm" variant={inList.has(t._id) ? 'ghost' : 'secondary'} disabled={inList.has(t._id)} onClick={() => addTrack(t)}>
                  {inList.has(t._id) ? 'Added' : 'Add'}
                </Button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{pl.name}”?</DialogTitle>
            <DialogDescription>This removes the playlist and can’t be undone. The songs themselves stay in the catalogue.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={remove}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
