import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import TrackCard from '@/components/TrackCard';
import PlaylistCard from '@/components/PlaylistCard';
import TrackList from '@/components/TrackList';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function Shelf({ title, subtitle, children, action }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const Grid = ({ children }) => <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">{children}</div>;
const Loading = () => <Grid>{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}</Grid>;

export default function Home() {
  const { user } = useAuth();
  const { playQueue } = usePlayer();
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/tracks/recommended'),
      api.get('/tracks?sort=popular&limit=10'),
      api.get('/tracks?sort=new&limit=12'),
      api.get('/tracks/genres'),
      api.get('/playlists/public'),
    ])
      .then(([rec, pop, fresh, genres, pls]) =>
        setData({ rec: rec.data, pop: pop.data, fresh: fresh.data, genres: genres.data, pls: pls.data })
      )
      .catch(() => setData({ rec: [], pop: [], fresh: [], genres: [], pls: [] }));
  }, [user?._id, user?.preferredGenres?.join()]);

  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/30 via-emerald-900/30 to-background p-6 md:p-10">
        <p className="text-sm font-medium text-primary">{greeting()}{user ? `, ${user.name.split(' ')[0]}` : ''}</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-5xl">Music made for you.</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          {user?.preferredGenres?.length
            ? `Picks based on your love for ${user.preferredGenres.slice(0, 3).join(', ')} and the songs you like.`
            : user
              ? <>Tell us what you like in <Link to="/settings" className="text-primary hover:underline">Settings</Link> for better recommendations.</>
              : 'Sign up to get recommendations tuned to your taste, build playlists and listen offline.'}
        </p>
        {data?.rec?.length > 0 && (
          <Button size="lg" className="mt-6" onClick={() => playQueue(data.rec)}>
            <Play className="fill-current" /> Play your mix
          </Button>
        )}
      </div>

      <Shelf title="Recommended for you" subtitle="Based on your preferred genres and liked songs">
        {data ? <Grid>{data.rec.slice(0, 12).map((t) => <TrackCard key={t._id} track={t} list={data.rec} />)}</Grid> : <Loading />}
      </Shelf>

      <Shelf title="Browse genres">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(data?.genres || []).map((g, i) => (
            <Link
              key={g.name}
              to={`/genre/${encodeURIComponent(g.name)}`}
              className="relative h-24 overflow-hidden rounded-xl p-4 font-bold transition hover:scale-[1.02]"
              style={{ background: `hsl(${(i * 47) % 360} 60% 32%)` }}
            >
              {g.name}
              <span className="block text-xs font-normal opacity-80">{g.count} tracks</span>
              <img src={g.coverUrl} alt="" className="absolute -bottom-2 -right-3 h-16 w-16 rotate-[25deg] rounded shadow-lg" />
            </Link>
          ))}
        </div>
      </Shelf>

      <Shelf title="Trending now" subtitle="Most played on Lively">
        {data ? <TrackList tracks={data.pop} /> : <Skeleton className="h-64" />}
      </Shelf>

      <Shelf title="New releases">
        {data ? <Grid>{data.fresh.map((t) => <TrackCard key={t._id} track={t} list={data.fresh} />)}</Grid> : <Loading />}
      </Shelf>

      {data?.pls?.length > 0 && (
        <Shelf title="Community playlists">
          <Grid>{data.pls.map((p) => <PlaylistCard key={p._id} playlist={p} />)}</Grid>
        </Shelf>
      )}
    </div>
  );
}
