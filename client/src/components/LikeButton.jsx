import { useState } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

// type: 'tracks' | 'playlists'
export default function LikeButton({ type, id, liked: initialLiked, count: initialCount, showCount = false, className, onChange }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [liked, setLiked] = useState(!!initialLiked);
  const [count, setCount] = useState(initialCount || 0);
  const [busy, setBusy] = useState(false);

  const toggle = async (e) => {
    e.stopPropagation();
    if (!user) return nav('/login');
    setBusy(true);
    setLiked(!liked);
    setCount((c) => c + (liked ? -1 : 1));
    try {
      const { data } = await api.post(`/${type}/${id}/like`);
      setLiked(data.liked);
      setCount(data.likeCount);
      onChange?.(data);
    } catch (err) {
      setLiked(liked);
      setCount(initialCount);
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={liked ? 'Unlike' : 'Like'}
      className={cn('inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-foreground', liked && 'text-primary hover:text-primary', className)}
    >
      <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
      {showCount && <span className="text-sm tabular-nums">{count}</span>}
    </button>
  );
}
