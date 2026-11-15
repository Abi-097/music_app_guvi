import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { getOfflineEntry } from '../lib/offline';
import { useAuth } from './AuthContext';

const PlayerCtx = createContext(null);
export const usePlayer = () => useContext(PlayerCtx);

export function PlayerProvider({ children }) {
  const { user, updateProfile } = useAuth();

  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [rate, setRateState] = useState(1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // off | all | one
  const [quality, setQualityState] = useState('high');
  const [autoplay, setAutoplayState] = useState(true);
  const [offlineNow, setOfflineNow] = useState(false);

  const howlRef = useRef(null);
  const blobRef = useRef(null);
  const loadId = useRef(0);
  const history = useRef([]);
  const live = useRef({});
  live.current = { queue, index, shuffle, repeat, volume, muted, rate, quality, autoplay, progress };

  const track = index >= 0 ? queue[index] : null;

  /* ---------- hydrate saved playback settings once per login ---------- */
  const hydrated = useRef(null);
  useEffect(() => {
    if (user && hydrated.current !== user._id) {
      hydrated.current = user._id;
      const s = user.settings || {};
      if (s.volume != null) setVolumeState(s.volume);
      if (s.playbackRate) setRateState(s.playbackRate);
      if (s.quality) setQualityState(s.quality);
      if (s.autoplay != null) setAutoplayState(s.autoplay);
    }
    if (!user) hydrated.current = null;
  }, [user]);

  const persist = useRef();
  const saveSettings = useCallback(
    (patch) => {
      if (!user) return;
      clearTimeout(persist.current);
      persist.current = setTimeout(() => updateProfile({ settings: patch }).catch(() => {}), 600);
    },
    [user, updateProfile]
  );

  /* ---------- core loader ---------- */
  const load = useCallback(async (t, { autoplay: shouldPlay = true, startAt = 0 } = {}) => {
    const myId = ++loadId.current;
    howlRef.current?.unload();
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    blobRef.current = null;
    setLoading(true);
    setProgress(startAt);
    setDuration(t.duration || 0);

    let src;
    const offline = await getOfflineEntry(t._id);
    if (myId !== loadId.current) return;
    if (offline) {
      src = URL.createObjectURL(offline.blob);
      blobRef.current = src;
      setOfflineNow(true);
    } else {
      src = (live.current.quality === 'low' && t.audio?.low) || t.audio?.high;
      setOfflineNow(false);
    }

    const howl = new Howl({
      src: [src],
      format: ['mp3'],
      html5: true, // streams progressively instead of downloading the full file first
      volume: live.current.muted ? 0 : live.current.volume,
      rate: live.current.rate,
      onload: () => {
        if (myId !== loadId.current) return;
        setLoading(false);
        setDuration(howl.duration() || t.duration || 0);
        if (startAt) howl.seek(startAt);
      },
      onplay: () => myId === loadId.current && (setPlaying(true), setLoading(false)),
      onpause: () => myId === loadId.current && setPlaying(false),
      onstop: () => myId === loadId.current && setPlaying(false),
      onend: () => myId === loadId.current && handleEnd(),
      onloaderror: () => {
        if (myId !== loadId.current) return;
        setLoading(false);
        setPlaying(false);
        toast.error('Could not load this track');
      },
      onplayerror: () => {
        if (myId !== loadId.current) return;
        setPlaying(false);
        // Browsers block autoplay until a user gesture; retry on next unlock
        howl.once('unlock', () => howl.play());
      },
    });
    howlRef.current = howl;
    if (shouldPlay) howl.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recordPlay = (t) => api.post(`/tracks/${t._id}/play`).catch(() => {});

  const startAt = useCallback(
    (i, q = live.current.queue) => {
      const t = q[i];
      if (!t) return;
      setIndex(i);
      load(t);
      recordPlay(t);
    },
    [load]
  );

  /* ---------- public controls ---------- */
  const play = useCallback(
    (t, list) => {
      const q = list?.length ? list : [t];
      const i = Math.max(0, q.findIndex((x) => x._id === t._id));
      live.current.queue = q;
      history.current = [];
      setQueue(q);
      startAt(i, q);
    },
    [startAt]
  );

  const playAll = useCallback(
    (list, { shuffled = false } = {}) => {
      if (!list.length) return;
      setShuffle(shuffled);
      live.current.shuffle = shuffled;
      const first = shuffled ? list[Math.floor(Math.random() * list.length)] : list[0];
      play(first, list);
    },
    [play]
  );

  const toggle = useCallback(() => {
    const h = howlRef.current;
    if (!h) return;
    h.playing() ? h.pause() : h.play();
  }, []);

  const next = useCallback(
    (auto = false) => {
      const { queue: q, index: i, shuffle: sh, repeat: rp } = live.current;
      if (!q.length) return;
      let ni;
      if (sh && q.length > 1) {
        do ni = Math.floor(Math.random() * q.length);
        while (ni === i);
      } else {
        ni = i + 1;
        if (ni >= q.length) {
          if (rp === 'all' || !auto) ni = 0;
          else {
            howlRef.current?.stop();
            setProgress(0);
            return;
          }
        }
      }
      history.current.push(i);
      startAt(ni);
    },
    [startAt]
  );

  const prev = useCallback(() => {
    const { queue: q, index: i, progress: p } = live.current;
    if (!q.length) return;
    if (p > 3) {
      howlRef.current?.seek(0);
      setProgress(0);
      return;
    }
    const back = history.current.pop();
    startAt(back != null ? back : (i - 1 + q.length) % q.length);
  }, [startAt]);

  // used by onend (declared with function hoisting through ref)
  function handleEnd() {
    const { repeat: rp, autoplay: ap } = live.current;
    if (rp === 'one') {
      howlRef.current?.seek(0);
      howlRef.current?.play();
    } else if (rp === 'all' || ap) next(true);
    else setPlaying(false);
  }

  const seek = useCallback((t) => {
    howlRef.current?.seek(t);
    setProgress(t);
  }, []);

  const setVolume = useCallback(
    (v) => {
      setVolumeState(v);
      setMuted(false);
      howlRef.current?.volume(v);
      saveSettings({ volume: v });
    },
    [saveSettings]
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      howlRef.current?.volume(m ? live.current.volume : 0);
      return !m;
    });
  }, []);

  const setRate = useCallback(
    (r) => {
      setRateState(r);
      howlRef.current?.rate(r);
      saveSettings({ playbackRate: r });
    },
    [saveSettings]
  );

  const setQuality = useCallback(
    (q) => {
      setQualityState(q);
      live.current.quality = q;
      saveSettings({ quality: q });
      const { queue: qu, index: i, progress: p } = live.current;
      // Re-load the current stream at the new quality, resuming where we were
      if (qu[i] && !blobRef.current) load(qu[i], { autoplay: howlRef.current?.playing(), startAt: p });
    },
    [load, saveSettings]
  );

  const setAutoplay = useCallback(
    (v) => {
      setAutoplayState(v);
      saveSettings({ autoplay: v });
    },
    [saveSettings]
  );

  const enqueue = useCallback(
    (t, { playNext = false } = {}) => {
      const { queue: q, index: i } = live.current;
      if (!q.length) return play(t, [t]);
      const nq = [...q];
      nq.splice(playNext ? i + 1 : nq.length, 0, t);
      live.current.queue = nq;
      setQueue(nq);
      toast.success(playNext ? 'Playing next' : 'Added to queue');
    },
    [play]
  );

  /* ---------- progress ticker ---------- */
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const h = howlRef.current;
      if (h && h.playing()) setProgress(h.seek() || 0);
    }, 250);
    return () => clearInterval(id);
  }, [playing]);

  /* ---------- OS media keys / lock screen ---------- */
  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: track.coverUrl ? [{ src: track.coverUrl, sizes: '400x400', type: 'image/jpeg' }] : [],
    });
    navigator.mediaSession.setActionHandler('play', toggle);
    navigator.mediaSession.setActionHandler('pause', toggle);
    navigator.mediaSession.setActionHandler('nexttrack', () => next(false));
    navigator.mediaSession.setActionHandler('previoustrack', prev);
  }, [track, toggle, next, prev]);

  /* ---------- keyboard: space = play/pause ---------- */
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag) && howlRef.current) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  useEffect(() => () => howlRef.current?.unload(), []);

  const value = {
    queue, index, track, playing, loading, progress, duration,
    volume, muted, rate, shuffle, repeat, quality, autoplay, offlineNow,
    play, playAll, toggle, next: () => next(false), prev, seek,
    setVolume, toggleMute, setRate, setQuality, setAutoplay, enqueue,
    toggleShuffle: () => setShuffle((s) => !s),
    cycleRepeat: () => setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')),
  };

  return <PlayerCtx.Provider value={value}>{children}</PlayerCtx.Provider>;
}
