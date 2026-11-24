import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api, { errMsg } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(d).toLocaleDateString();
}

// type: 'track' | 'playlist'
export default function Comments({ type, id }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/comments/${type}/${id}`).then((r) => setComments(r.data)).catch(() => {});
  }, [type, id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/comments/${type}/${id}`, { text });
      setComments((c) => [data, ...c]);
      setText('');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (cid) => {
    try {
      await api.delete(`/comments/${cid}`);
      setComments((c) => c.filter((x) => x._id !== cid));
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <MessageCircle className="h-5 w-5" /> Comments <span className="text-muted-foreground">({comments.length})</span>
      </h2>
      {user ? (
        <form onSubmit={submit} className="flex gap-3">
          <Avatar>
            <AvatarFallback>{user.name[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Share your thoughts…" maxLength={1000} />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={busy || !text.trim()}>
                Post comment
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">Sign in</Link> to join the conversation.
        </p>
      )}
      <ul className="space-y-4">
        {comments.map((c) => (
          <li key={c._id} className="flex gap-3">
            <Avatar>
              <AvatarFallback>{c.user?.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 rounded-lg bg-card p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">
                  {c.user?.name || 'Deleted user'} <span className="ml-1 font-normal text-muted-foreground">· {timeAgo(c.createdAt)}</span>
                </p>
                {user && c.user?._id === user._id && (
                  <button onClick={() => remove(c._id)} className="text-muted-foreground hover:text-destructive" aria-label="Delete comment">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{c.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
