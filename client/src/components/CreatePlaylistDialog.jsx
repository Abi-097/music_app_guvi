import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { errMsg } from '@/lib/api';
import { usePlaylists } from '@/context/PlaylistContext';

export default function CreatePlaylistDialog({ open, onOpenChange, initialTrack, onCreated }) {
  const { createPlaylist } = usePlaylists();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const p = await createPlaylist({ name, description, isPublic, tracks: initialTrack ? [initialTrack._id] : [] });
      setName('');
      setDescription('');
      onOpenChange(false);
      onCreated?.(p);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>New playlist{initialTrack ? ` with “${initialTrack.title}”` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="pl-name">Name</Label>
            <Input id="pl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My road trip mix" required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pl-desc">Description</Label>
            <Textarea id="pl-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Public playlist</p>
              <p className="text-xs text-muted-foreground">Others can view, like and comment</p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy || !name.trim()}>
              {busy ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
