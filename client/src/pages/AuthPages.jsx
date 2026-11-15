import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Disc3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../lib/api';
import GenrePicker from '../components/GenrePicker';

function Shell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-full place-items-center bg-gradient-to-br from-ink-900 via-ink-800 to-[#1d1040] p-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-2 text-2xl font-extrabold"><Disc3 className="text-brand-400" /> Melodix</div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="mb-6 text-sm text-slate-400">{subtitle}</p>
        {children}
        <p className="mt-6 text-center text-sm text-slate-400">{footer}</p>
      </div>
    </div>
  );
}

export function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(f.email, f.password);
      nav('/');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Welcome back" subtitle="Log in to pick up where you left off."
      footer={<>New here? <Link to="/register" className="text-brand-400 hover:underline">Create an account</Link> · <Link to="/" className="hover:underline">Browse</Link></>}>
      <form onSubmit={submit} className="space-y-3">
        <input className="input" type="email" placeholder="Email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input className="input" type="password" placeholder="Password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
    </Shell>
  );
}

export function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [genres, setGenres] = useState([]);
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register({ ...f, favoriteGenres: genres });
      nav('/');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Create your account" subtitle="Tell us what you like and we'll tailor your home feed."
      footer={<>Already have an account? <Link to="/login" className="text-brand-400 hover:underline">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-3">
        <input className="input" placeholder="Name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className="input" type="email" placeholder="Email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input className="input" type="password" placeholder="Password (min 6 characters)" minLength={6} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <div className="pt-2">
          <p className="mb-2 text-sm font-semibold">Favourite genres</p>
          <GenrePicker value={genres} onChange={setGenres} />
        </div>
        <button className="btn btn-primary mt-2 w-full" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
      </form>
    </Shell>
  );
}
