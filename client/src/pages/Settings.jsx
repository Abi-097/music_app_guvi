import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { errMsg } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn, GENRES } from '@/lib/utils';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { settings, updateSettings } = usePlayer();
  const [name, setName] = useState(user.name);
  const [genres, setGenres] = useState(user.preferredGenres || []);
  const [artists, setArtists] = useState((user.preferredArtists || []).join(', '));

  useEffect(() => setGenres(user.preferredGenres || []), [user]);

  const toggle = (g) => setGenres((gs) => (gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g]));

  const saveProfile = async () => {
    try {
      await updateProfile({ name, preferredGenres: genres, preferredArtists: artists.split(',').map((a) => a.trim()).filter(Boolean) });
      toast.success('Preferences saved — your recommendations are updated');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Taste profile</CardTitle>
          <CardDescription>Used to personalise “Recommended for you”, together with the songs you like.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Display name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Favourite genres</Label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggle(g)}
                  className={cn('rounded-full border px-4 py-1.5 text-sm transition', genres.includes(g) ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Favourite artists (comma separated)</Label>
            <Input value={artists} onChange={(e) => setArtists(e.target.value)} placeholder="Aurora Vale, Kilo Wave" />
          </div>
          <Button onClick={saveProfile}>Save preferences</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Playback</CardTitle>
          <CardDescription>Saved to your account and applied instantly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Row label="Default volume" hint={`${Math.round(settings.volume * 100)}%`}>
            <Slider className="w-48" value={[settings.volume * 100]} max={100} onValueChange={([v]) => updateSettings({ volume: v / 100 })} />
          </Row>
          <Row label="Playback speed" hint={`${settings.playbackRate}x`}>
            <Slider className="w-48" value={[settings.playbackRate]} min={0.5} max={2} step={0.05} onValueChange={([v]) => updateSettings({ playbackRate: +v.toFixed(2) })} />
          </Row>
          <Row label="Fade in" hint={settings.fadeInMs ? `${(settings.fadeInMs / 1000).toFixed(1)}s` : 'Off'}>
            <Slider className="w-48" value={[settings.fadeInMs]} max={5000} step={250} onValueChange={([v]) => updateSettings({ fadeInMs: v })} />
          </Row>
          <Row label="Autoplay next song" hint="Keep playing when a song ends">
            <Switch checked={settings.autoplayNext} onCheckedChange={(v) => updateSettings({ autoplayNext: v })} />
          </Row>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {children}
    </div>
  );
}
