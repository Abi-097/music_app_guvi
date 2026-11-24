import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TrackList from '@/components/TrackList';
import { GENRES } from '@/lib/utils';

const FIELDS = [
  { value: 'all', label: 'All' },
  { value: 'name', label: 'Song name' },
  { value: 'artist', label: 'Artist' },
  { value: 'album', label: 'Album' },
  { value: 'movie', label: 'Movie' },
];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const field = params.get('field') || 'all';
  const genre = params.get('genre') || 'any';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const update = (patch) => {
    const next = Object.fromEntries(params);
    Object.assign(next, patch);
    Object.keys(next).forEach((k) => (!next[k] || next[k] === 'any' || (k === 'field' && next[k] === 'all')) && delete next[k]);
    setParams(next, { replace: true });
  };

  // Debounce typing into the URL.
  useEffect(() => {
    const t = setTimeout(() => update({ q }), 300);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams({ q: params.get('q') || '', field });
    if (genre !== 'any') query.set('genre', genre);
    api
      .get(`/tracks/search?${query}`)
      .then((r) => setResults(r.data))
      .finally(() => setLoading(false));
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Search</h1>
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search by ${FIELDS.find((f) => f.value === field)?.label.toLowerCase() === 'all' ? 'song, artist, album or movie' : FIELDS.find((f) => f.value === field)?.label.toLowerCase()}…`}
            className="h-12 rounded-full pl-11 text-base"
            autoFocus
          />
        </div>
        <Select value={genre} onValueChange={(v) => update({ genre: v })}>
          <SelectTrigger className="h-12 rounded-full md:w-48">
            <SelectValue placeholder="Any genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any genre</SelectItem>
            {GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Tabs value={field} onValueChange={(v) => update({ field: v })}>
        <TabsList className="flex-wrap">
          {FIELDS.map((f) => <TabsTrigger key={f.value} value={f.value}>{f.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      <div>
        <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {results.length} result{results.length === 1 ? '' : 's'}
          {params.get('q') ? <> for “<span className="text-foreground">{params.get('q')}</span>”</> : ''}
        </p>
        <TrackList tracks={results} />
      </div>
    </div>
  );
}
