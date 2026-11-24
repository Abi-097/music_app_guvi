import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Howl, Howler } from 'howler';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getOfflineBlob } from '@/lib/offline';
import { useAuth } from './AuthContext';

const PlayerContext = createContext(null);

const DEFAULT_SETTINGS = { volume: 0.8, playbackRate: 1, autoplayNext: true, fadeInMs: 0, streamingQuality: 'high' };
const loadLocal = () => {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('playerSettings') || '{}') };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export function PlayerProvider({ children }) {
  const { user, updateProfile } = useAuth();
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // off | all | one
  const [muted, setMuted] = useState(false);
  const [settings, setSettings] = useState(loadLocal);

  const howlRef = useRef(null);
  const blobUrlRef = useRef(null);
  const historyRef = useRef([]);
  const s = useRef({});
  s.current = { queue, index, shuffle, repeat, settings };

  const current = queue[index] || null;

  // Pull saved playback settings from the account on sign-in.
  useEffect(() => {
    if (user?.settings) setSettings((prev) => ({ ...prev, ...user.settings }));
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist settings locally + to the account (debounced).
  const saveTimer = useRef();
  const updateSettings = useCallback(
    (patch) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        localStorage.setItem('playerSettings', JSON.stringify(next));
        return next;
      });
      if (user) {
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => updateProfile({ settings: patch }).catch(() => {}), 800);
      }
    },
    [user, updateProfile]
  );

  // Apply volume / mute / rate live.
  useEffect(() => {
    Howler.volume(1);
    howlRef.current?.volume(muted ? 0 : settings.volume);
  }, [settings.volume, muted]);
  useEffect(() => {
    howlRef.current?.rate(settings.playbackRate);
  }, [settings.playbackRate]);

  const pickNext = useCallback((auto) => {
    const { queue: q, index: i, shuffle: sh, repeat: rep, settings: st } = s.current;
    if (!q.length) return -1;
    if (auto && !st.autoplayNext) return -1;
    if (sh && q.length > 1) {
      let n;
      do n = Math.floor(Math.random() * q.length);
      while (n === i);
      return n;
    }
    if (i + 1 < q.length) return i + 1;
    return rep === 'all' ? 0 : -1;
  }, []);

  const goTo = useCallback((n, pushHistory = true) => {
    if (n < 0) {
      setIsPlaying(false);
      howlRef.current?.stop();
      return;
    }
    if (pushHistory && s.current.index >= 0) historyRef.current.push(s.current.index);
    setIndex(n);
  }, []);

  const next = useCallback((auto = false) => goTo(pickNext(auto)), [goTo, pickNext]);

  // Build a new Howl whenever the current track changes.
  useEffect(() => {
    if (!current) return;
    let cancelled = false;
    howlRef.current?.unload();
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = null;
    setIsLoading(true);
    setPosition(0);
    setDuration(current.duration || 0);

    (async () => {
      const blob = await getOfflineBlob(current._id).catch(() => null);
      if (cancelled) return;
      let src = current.audioUrl;
      if (blob) src = blobUrlRef.current = URL.createObjectURL(blob);
      const { settings: st } = s.current;
      const howl = new Howl({
        src: [src],
        html5: true, // stream instead of downloading the whole file first
        format: ['mp3'],
        volume: muted ? 0 : st.volume,
        rate: st.playbackRate,
        onload: () => {
          setDuration(howl.duration());
          setIsLoading(false);
        },
        onplay: () => {
          setIsPlaying(true);
          setIsLoading(false);
          setDuration(howl.duration());
        },
        onpause: () => setIsPlaying(false),
        onstop: () => setIsPlaying(false),
        onend: () => {
          if (s.current.repeat === 'one') {
            howl.seek(0);
            howl.play();
          } else next(true);
        },
        onloaderror: (_id, err) => {
          setIsLoading(false);
          toast.error(`Couldn't load “${current.title}”${navigator.onLine ? '' : ' — you are offline. Download tracks to play them offline.'}`);
          console.error(err);
        },
        onplayerror: () => howl.once('unlock', () => howl.play()),
      });
      howlRef.current = howl;
      howl.play();
      if (st.fadeInMs > 0) howl.fade(0, muted ? 0 : st.volume, st.fadeInMs);
      api.post(`/tracks/${current._id}/play`).catch(() => {});

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: current.title,
          artist: current.artist,
          album: current.album,
          artwork: current.coverUrl ? [{ src: current.coverUrl, sizes: '400x400' }] : [],
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [current?._id, index]); // eslint-disable-line react-hooks/exhaustive-deps

  // Progress ticker.
  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => {
      const p = howlRef.current?.seek();
      if (typeof p === 'number') setPosition(p);
    }, 250);
    return () => clearInterval(t);
  }, [isPlaying]);

  useEffect(() => () => howlRef.current?.unload(), []);

  const playQueue = useCallback((tracks, start = 0) => {
    if (!tracks?.length) return;
    historyRef.current = [];
    setQueue(tracks);
    if (s.current.queue[s.current.index]?._id === tracks[start]?._id && howlRef.current) {
      setIndex(start);
      howlRef.current.play();
    } else {
      setIndex(start);
    }
  }, []);

  const playTrack = useCallback((track, list) => {
    const tracks = list?.length ? list : [track];
    const i = Math.max(0, tracks.findIndex((t) => t._id === track._id));
    playQueue(tracks, i);
  }, [playQueue]);

  const togglePlay = useCallback(() => {
    const h = howlRef.current;
    if (!h) return;
    if (h.playing()) h.pause();
    else h.play();
  }, []);

  const prev = useCallback(() => {
    const h = howlRef.current;
    if (h && h.seek() > 3) return h.seek(0);
    const last = historyRef.current.pop();
    if (last !== undefined) return goTo(last, false);
    if (s.current.index > 0) goTo(s.current.index - 1, false);
    else h?.seek(0);
  }, [goTo]);

  const seek = useCallback((sec) => {
    howlRef.current?.seek(sec);
    setPosition(sec);
  }, []);

  const addToQueue = useCallback((track) => {
    setQueue((q) => (q.length ? [...q, track] : [track]));
    if (s.current.index < 0) setIndex(0);
    toast.success('Added to queue');
  }, []);

  const cycleRepeat = () => setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'));

  // OS media keys / lock-screen controls.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play', togglePlay);
    navigator.mediaSession.setActionHandler('pause', togglePlay);
    navigator.mediaSession.setActionHandler('nexttrack', () => next());
    navigator.mediaSession.setActionHandler('previoustrack', prev);
  }, [togglePlay, next, prev]);

  // Keyboard: space = play/pause (when not typing).
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space' || ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      e.preventDefault();
      togglePlay();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay]);

  const value = {
    queue, index, current, isPlaying, isLoading, position, duration, shuffle, repeat, muted, settings,
    playTrack, playQueue, togglePlay, next: () => next(false), prev, seek, addToQueue,
    setShuffle, cycleRepeat, setMuted, updateSettings,
    setVolume: (v) => { setMuted(false); updateSettings({ volume: v }); },
    jumpTo: (i) => goTo(i),
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export const usePlayer = () => useContext(PlayerContext);
