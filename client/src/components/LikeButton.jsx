import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { compact } from '../lib/format';

// type: 'track' | 'playlist'
export default function LikeButton({ type, id, count = 0, showCount = false, size = 18 }) {
  const { user, syncLike } = useAuth();
  const field = type === 'track' ? 'likedTracks' : 'likedPlaylists';
  const liked = !!user?.[field]?.includes(id);
  const [n, setN] = useState(count);
  const [busy, setBusy] = useState(false);

  useEffect(() => setN(count), [count]);

  const toggle = async (e) => {
    e.stopPropagation();
    if (!user) return toast('Log in to like', { icon: '🔒' });
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/${type}/${id}/like`);
      syncLike(type, id, data.liked);
      setN(data.likesCount);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={liked ? 'Unlike' : 'Like'}
      aria-pressed={liked}
      className={`flex items-center gap-1.5 transition ${liked ? 'text-pink-500' : 'text-slate-400 hover:text-white'}`}
    >
      <Heart size={size} fill={liked ? 'currentColor' : 'none'} />
      {showCount && <span className="text-xs tabular-nums">{compact(n)}</span>}
    </button>
  );
}
