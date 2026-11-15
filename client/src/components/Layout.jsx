import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Disc3, DownloadCloud, Heart, Home, LibraryBig, LogIn, LogOut, Search, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import PlayerBar from './PlayerBar';

const links = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/library', label: 'Library', icon: LibraryBig },
  { to: '/liked', label: 'Liked', icon: Heart },
  { to: '/downloads', label: 'Downloads', icon: DownloadCloud },
];

const item = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
    isActive ? 'bg-ink-600 text-white' : 'text-slate-400 hover:text-white'
  }`;

export default function Layout() {
  const { user, logout } = useAuth();
  const { track } = usePlayer();
  const nav = useNavigate();

  return (
    <div className="flex h-full">
      {/* desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/5 bg-ink-800 p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2 text-xl font-extrabold">
          <Disc3 className="text-brand-400" /> Melodix
        </div>
        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={item}><Icon size={18} /> {label}</NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-1 border-t border-white/5 pt-4">
          {user ? (
            <>
              <NavLink to="/settings" className={item}><Settings size={18} /> Settings</NavLink>
              <button onClick={() => { logout(); nav('/'); }} className={`${item({ isActive: false })} w-full`}>
                <LogOut size={18} /> Log out
              </button>
              <p className="truncate px-3 pt-2 text-xs text-slate-500">{user.name}</p>
            </>
          ) : (
            <NavLink to="/login" className={item}><LogIn size={18} /> Log in</NavLink>
          )}
        </div>
      </aside>

      <main className={`flex-1 overflow-y-auto px-4 pt-6 md:px-8 ${track ? 'pb-48 md:pb-32' : 'pb-24 md:pb-10'}`}>
        <div className="mx-auto max-w-6xl"><Outlet /></div>
      </main>

      <PlayerBar />

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-14 border-t border-white/10 bg-ink-800 md:hidden">
        {[...links.slice(0, 4), user ? { to: '/settings', label: 'Settings', icon: Settings } : { to: '/login', label: 'Log in', icon: LogIn }].map(
          ({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${isActive ? 'text-brand-400' : 'text-slate-400'}`}>
              <Icon size={20} /> {label}
            </NavLink>
          )
        )}
      </nav>
    </div>
  );
}
