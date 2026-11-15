import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Shuffle } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import Shelf from '../components/Shelf';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

export default function Home() {
  const { user } = useAuth();
  const p = usePlayer();
  const [data, setData] = useState(null);
  const [genres, setGenres] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    api.get('/tracks/home').then((r) => setData(r.data)).catch(() => setError('Could not reach the server. Is the API running?'));
    api.get('/tracks/genres').then((r) => setGenres(r.data)).catch(() => {});
  }, [user?._id, user?.favoriteGenres?.join(',')]);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!data) return <p className="text-slate-400">Loading your music…</p>;

  const personalised = user && (user.favoriteGenres?.length || data.recent.length);

  return (
    <>
      <header className="mb-8 rounded-2xl bg-gradient-to-r from-brand-600/40 via-ink-700 to-ink-800 p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{greeting()}{user ? `, ${user.name.split(' ')[0]}` : ''}</h1>
        <p className="mt-1 text-slate-300">
          {personalised ? 'Fresh picks based on what you listen to.' : 'Popular right now. Pick some favourite genres to personalise this page.'}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="btn btn-primary" onClick={() => p.playAll(data.recommended)}><Play size={16} fill="white" /> Play recommended</button>
          <button className="btn btn-ghost" onClick={() => p.playAll(data.recommended, { shuffled: true })}><Shuffle size={16} /> Shuffle</button>
          {!user && <Link to="/register" className="btn btn-ghost">Sign up free</Link>}
          {user && !user.favoriteGenres?.length && <Link to="/settings" className="btn btn-ghost">Choose genres</Link>}
        </div>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold">Browse genres</h2>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <Link key={g.name} to={`/search?genre=${encodeURIComponent(g.name)}`}
              className="rounded-full bg-ink-700 px-4 py-2 text-sm font-semibold transition hover:bg-brand-500">
              {g.name} <span className="text-slate-400">· {g.count}</span>
            </Link>
          ))}
        </div>
      </section>

      <Shelf title={personalised ? 'Recommended for you' : 'Top picks'} subtitle={personalised ? 'Matched to your genres, artists and listening history' : undefined} tracks={data.recommended} />
      <Shelf title="Recently played" tracks={data.recent} />
      <Shelf title="Trending now" tracks={data.trending} />
      {data.shelves.map((s) => <Shelf key={s.genre} title={`More ${s.genre}`} tracks={s.tracks} />)}
      <Shelf title="New releases" tracks={data.newest} />
    </>
  );
}
