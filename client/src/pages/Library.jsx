import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '@/lib/api';
import { usePlaylists } from '@/context/PlaylistContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PlaylistCard from '@/components/PlaylistCard';
import CreatePlaylistDialog from '@/components/CreatePlaylistDialog';

const Grid = ({ children }) => <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">{children}</div>;

export default function Library() {
  const { playlists, refresh } = usePlaylists();
  const [community, setCommunity] = useState([]);
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    refresh();
    api.get('/playlists/public').then((r) => setCommunity(r.data));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">Your Library</h1>
        <Button onClick={() => setOpen(true)}><Plus /> New playlist</Button>
      </div>
      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">My playlists ({playlists.length})</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>
        <TabsContent value="mine">
          {playlists.length ? (
            <Grid>{playlists.map((p) => <PlaylistCard key={p._id} playlist={p} />)}</Grid>
          ) : (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <p className="font-semibold">No playlists yet</p>
              <p className="mb-4 text-sm text-muted-foreground">Create one, then add songs from any track’s ••• menu.</p>
              <Button onClick={() => setOpen(true)}><Plus /> Create playlist</Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="community">
          <Grid>{community.map((p) => <PlaylistCard key={p._id} playlist={p} />)}</Grid>
          {!community.length && <p className="text-muted-foreground">No public playlists yet.</p>}
        </TabsContent>
      </Tabs>
      <CreatePlaylistDialog open={open} onOpenChange={setOpen} onCreated={(p) => nav(`/playlist/${p._id}`)} />
    </div>
  );
}
