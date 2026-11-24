import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ListMusic, ListPlus, MoreHorizontal, Plus, Share2, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';
import { useAuth } from '@/context/AuthContext';
import { downloadTrack } from '@/lib/offline';
import CreatePlaylistDialog from './CreatePlaylistDialog';
import ShareButtons from './ShareButtons';

export default function TrackMenu({ track, onRemove }) {
  const { addToQueue } = usePlayer();
  const { playlists, addToPlaylist } = usePlaylists();
  const { user } = useAuth();
  const nav = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const download = async () => {
    const id = toast.loading(`Downloading “${track.title}”…`);
    try {
      await downloadTrack(track, (p) => toast.loading(`Downloading “${track.title}” — ${p}%`, { id }));
      toast.success('Saved for offline listening', { id });
      window.dispatchEvent(new Event('downloads-changed'));
    } catch (e) {
      toast.error(e.message, { id });
    }
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More options">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={() => addToQueue(track)}>
            <ListPlus /> Add to queue
          </DropdownMenuItem>
          {user ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ListMusic /> Add to playlist
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                  <Plus /> New playlist
                </DropdownMenuItem>
                {playlists.length > 0 && <DropdownMenuSeparator />}
                {playlists.map((p) => (
                  <DropdownMenuItem key={p._id} onClick={() => addToPlaylist(p._id, track)}>
                    {p.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : (
            <DropdownMenuItem onClick={() => nav('/login')}>
              <ListMusic /> Sign in to add to playlist
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={download}>
            <Download /> Download for offline
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShareOpen(true)}>
            <Share2 /> Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => nav(`/track/${track._id}`)}>
            <Info /> Track details & comments
          </DropdownMenuItem>
          {onRemove && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onRemove}>
                <Trash2 /> Remove from playlist
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <CreatePlaylistDialog open={createOpen} onOpenChange={setCreateOpen} initialTrack={track} />
      <ShareButtons title={`${track.title} — ${track.artist}`} path={`/track/${track._id}`} open={shareOpen} onOpenChange={setShareOpen} />
    </>
  );
}
