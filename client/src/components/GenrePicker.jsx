import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function GenrePicker({ value, onChange }) {
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    api.get('/tracks/genres').then((r) => setGenres(r.data.map((g) => g.name))).catch(() => {});
  }, []);

  const toggle = (g) => onChange(value.includes(g) ? value.filter((x) => x !== g) : [...value, g]);

  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((g) => (
        <button type="button" key={g} onClick={() => toggle(g)} aria-pressed={value.includes(g)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${value.includes(g) ? 'bg-brand-500 text-white' : 'bg-ink-600 text-slate-300 hover:bg-ink-600/70'}`}>
          {g}
        </button>
      ))}
      {genres.length === 0 && <p className="text-sm text-slate-500">No genres yet — run the seed script.</p>}
    </div>
  );
}
