import { useEffect, useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../lib/format';

// type: 'track' | 'playlist'
export default function Comments({ type, id, onCountChange }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/${type}/${id}/comments`).then((r) => setItems(r.data)).catch(() => {});
  }, [type, id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/${type}/${id}/comments`, { text });
      setItems((c) => [data, ...c]);
      setText('');
      onCountChange?.(1);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (cid) => {
    try {
      await api.delete(`/comments/${cid}`);
      setItems((c) => c.filter((x) => x._id !== cid));
      onCountChange?.(-1);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <section aria-label="Comments">
      <h3 className="mb-3 text-lg font-bold">Comments <span className="text-slate-500">({items.length})</span></h3>

      {user ? (
        <form onSubmit={submit} className="mb-5 flex gap-2">
          <input className="input" placeholder="Add a comment…" maxLength={500} value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn btn-primary" disabled={busy || !text.trim()}><Send size={16} /> Post</button>
        </form>
      ) : (
        <p className="mb-5 text-sm text-slate-400">
          <Link to="/login" className="text-brand-400 hover:underline">Log in</Link> to join the conversation.
        </p>
      )}

      {items.length === 0 && <p className="text-sm text-slate-500">No comments yet — be the first.</p>}
      <ul className="space-y-4">
        {items.map((c) => (
          <li key={c._id} className="flex gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold">
              {c.user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{c.user?.name || 'Unknown'}</span>
                <span className="text-xs text-slate-500">{timeAgo(c.createdAt)}</span>
              </div>
              <p className="break-words text-sm text-slate-300">{c.text}</p>
            </div>
            {user && c.user?._id === user._id && (
              <button onClick={() => remove(c._id)} aria-label="Delete comment" className="text-slate-500 hover:text-red-400">
                <Trash2 size={15} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
