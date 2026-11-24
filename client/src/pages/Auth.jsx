import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { errMsg } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, GENRES } from '@/lib/utils';

export default function Auth({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [genres, setGenres] = useState([]);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isRegister) await register({ ...form, preferredGenres: genres });
      else await login(form.email, form.password);
      toast.success(isRegister ? 'Welcome to Lively!' : 'Welcome back');
      nav(loc.state?.from || '/', { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/20 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto mb-2 flex items-center gap-2 text-2xl font-extrabold"><img src="/favicon.svg" alt="" className="h-9 w-9" /> Lively</Link>
          <CardTitle className="text-2xl">{isRegister ? 'Create your account' : 'Log in'}</CardTitle>
          <CardDescription>{isRegister ? 'Free forever. Personalised from day one.' : 'Pick up where you left off.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={set('name')} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={set('password')} required minLength={6} autoComplete={isRegister ? 'new-password' : 'current-password'} />
            </div>
            {isRegister && (
              <div className="space-y-2">
                <Label>What do you like? (pick a few)</Label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setGenres((gs) => (gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g]))}
                      className={cn('rounded-full border px-3 py-1 text-xs transition', genres.includes(g) ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy ? 'Please wait…' : isRegister ? 'Sign up' : 'Log in'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isRegister ? 'Already have an account? ' : 'New to Lively? '}
            <Link to={isRegister ? '/login' : '/register'} className="text-primary hover:underline">{isRegister ? 'Log in' : 'Sign up'}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
