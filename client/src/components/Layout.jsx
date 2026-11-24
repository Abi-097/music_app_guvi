import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Download, Heart, Home, Library, LogOut, Menu, Plus, Search, Settings, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import PlayerBar from './PlayerBar';
import CreatePlaylistDialog from './CreatePlaylistDialog';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 px-2 text-xl font-extrabold tracking-tight">
      <img src="/favicon.svg" alt="" className="h-8 w-8" /> Lively
    </Link>
  );
}

const nav = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/library', label: 'Your Library', icon: Library },
  { to: '/liked', label: 'Liked Songs', icon: Heart },
  { to: '/downloads', label: 'Downloads', icon: Download },
];

function Sidebar({ onNavigate }) {
  const { user } = useAuth();
  const { playlists } = usePlaylists();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <div className="pt-2"><Logo /></div>
      <nav className="space-y-1">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={onNavigate}
            className={({ isActive }) => cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground', isActive && 'bg-accent text-foreground')}
          >
            <n.icon className="h-5 w-5" /> {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="flex items-center justify-between px-3 pt-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Playlists</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => (user ? setOpen(true) : navigate('/login'))} aria-label="Create playlist">
          <Plus />
        </Button>
      </div>
      <div className="-mt-2 flex-1 space-y-0.5 overflow-y-auto">
        {user ? (
          playlists.length ? (
            playlists.map((p) => (
              <NavLink key={p._id} to={`/playlist/${p._id}`} onClick={onNavigate} className={({ isActive }) => cn('block truncate rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground', isActive && 'text-primary')}>
                {p.name}
              </NavLink>
            ))
          ) : (
            <p className="px-3 text-sm text-muted-foreground">Create your first playlist with the + button.</p>
          )
        ) : (
          <p className="px-3 text-sm text-muted-foreground">Sign in to build playlists.</p>
        )}
      </div>
      <CreatePlaylistDialog open={open} onOpenChange={setOpen} onCreated={(p) => navigate(`/playlist/${p._id}`)} />
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { current } = usePlayer();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className={cn('hidden w-64 shrink-0 border-r bg-card/40 lg:block', current && 'pb-20')}>
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r bg-background">
            <button className="absolute right-3 top-4" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X /></button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu /></Button>
            <div className="lg:hidden"><Logo /></div>
          </div>
          {user ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full bg-card py-1 pl-1 pr-3 hover:bg-accent">
                  <Avatar className="h-8 w-8"><AvatarFallback>{user.name[0]?.toUpperCase()}</AvatarFallback></Avatar>
                  <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}><Settings /> Settings & preferences</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { logout(); navigate('/'); }}><LogOut /> Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" asChild><Link to="/register">Sign up</Link></Button>
              <Button asChild className="rounded-full"><Link to="/login">Log in</Link></Button>
            </div>
          )}
        </header>
        <main className={cn('flex-1 overflow-y-auto', current && 'pb-24')}>
          <div className="mx-auto max-w-7xl p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
      <PlayerBar />
    </div>
  );
}
