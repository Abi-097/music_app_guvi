import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import api from '../lib/api';
import TrackRow from '../components/TrackRow';

const FILTERS = [
  ['all', 'All'],
  ['title', 'Song'],
  ['artist', 'Artist'],
  ['album', 'Album'],
  ['movie', 'Movie'],
];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const genre = params.get('genre') || '';
  const [q, setQ] = useState(params.get('q') || '');
  const [by, setBy] = useState(params.get('by') || 'all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = q.trim();
    const next = {};
    if (term) next.q = term;
    if (by !== 'all') next.by = by;
    if (genre) next.genre = genre;
    setParams(next, { replace: true });

    // Genre browse with no text → list the genre
    if (!term && genre) {
      setLoading(true);
      api.get('/tracks', { params: { genre, limit: 50 } }).then((r) => setResults(r.data.items)).finally(() => setLoading(false));
      return;
    }
    if (!term) return setResults([]);

    setLoading(true);
    const id = setTimeout(() => {
      api.get('/tracks/search', { params: { q: term, by, genre: genre || undefined } })
        .then((r) => setResults(r.data))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300); // debounce typing
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, by, genre]);

  return (
    <>
      <h1 className="mb-4 text-2xl font-extrabold">Search</h1>
      <div className="relative mb-4">
        <SearchIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input autoFocus className="input !py-3 !pl-10 !text-base" placeholder="Song, artist, album or movie…" value={q}
          onChange={(e) => setQ(e.target.value)} aria-label="Search music" />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTERS.map(([v, label]) => (
          <button key={v} onClick={() => setBy(v)} aria-pressed={by === v}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${by === v ? 'bg-brand-500' : 'bg-ink-600 text-slate-300 hover:bg-ink-600/70'}`}>
            {label}
          </button>
        ))}
        {genre && (
          <button onClick={() => setParams({})} className="ml-2 rounded-full border border-brand-500 px-3 py-1.5 text-sm text-brand-400">
            Genre: {genre} ✕
          </button>
        )}
      </div>

      {loading && <p className="text-slate-400">Searching…</p>}
      {!loading && (q.trim() || genre) && results.length === 0 && <p className="text-slate-400">No results found.</p>}
      {!q.trim() && !genre && <p className="text-slate-500">Start typing to find music by name, artist, album or movie.</p>}

      <div className="space-y-1">
        {results.map((t, i) => <TrackRow key={t._id} track={t} queue={results} index={i} />)}
      </div>
    </>
  );
}
