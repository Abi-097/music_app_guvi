import { Router } from 'express';
import Track from '../models/Track.js';
import User from '../models/User.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/tracks?genre=&page=&limit=
router.get('/', async (req, res) => {
  const { genre, page = 1, limit = 24 } = req.query;
  const filter = genre ? { genre } : {};
  const [items, total] = await Promise.all([
    Track.find(filter)
      .sort({ plays: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Track.countDocuments(filter),
  ]);
  res.json({ items, total, page: Number(page) });
});

router.get('/genres', async (_req, res) => {
  const genres = await Track.aggregate([
    { $group: { _id: '$genre', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json(genres.map((g) => ({ name: g._id, count: g.count })));
});

// GET /api/tracks/search?q=&by=all|title|artist|album|movie
router.get('/search', async (req, res) => {
  const { q = '', by = 'all', genre } = req.query;
  const term = q.trim();
  if (!term) return res.json([]);
  const rx = new RegExp(escapeRegex(term), 'i');
  const fields = by === 'all' ? ['title', 'artist', 'album', 'movie'] : [by];
  if (!fields.every((f) => ['title', 'artist', 'album', 'movie'].includes(f)))
    return res.status(400).json({ message: 'Invalid search field' });
  const filter = { $or: fields.map((f) => ({ [f]: rx })) };
  if (genre) filter.genre = genre;
  res.json(await Track.find(filter).sort({ plays: -1 }).limit(50));
});

// Personalised home feed: recommended tracks + genre shelves + trending + recents
router.get('/home', optionalAuth, async (req, res) => {
  const user = req.user;
  const prefGenres = user?.favoriteGenres || [];
  const prefArtists = user?.favoriteArtists || [];

  // Infer taste from liked + recently played tracks too
  let inferredGenres = [];
  if (user) {
    const history = await Track.find({
      _id: { $in: [...user.likedTracks, ...user.recentlyPlayed] },
    }).select('genre artist');
    const tally = {};
    history.forEach((t) => (tally[t.genre] = (tally[t.genre] || 0) + 1));
    inferredGenres = Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g);
    history.forEach((t) => !prefArtists.includes(t.artist) && prefArtists.push(t.artist));
  }
  const genres = [...new Set([...prefGenres, ...inferredGenres])];

  const exclude = user ? user.likedTracks : [];
  const recommended = genres.length || prefArtists.length
    ? await Track.find({
        _id: { $nin: exclude },
        $or: [{ genre: { $in: genres } }, { artist: { $in: prefArtists } }],
      })
        .sort({ plays: -1 })
        .limit(12)
    : await Track.find().sort({ likesCount: -1, plays: -1 }).limit(12);

  const trending = await Track.find().sort({ plays: -1 }).limit(10);
  const newest = await Track.find().sort({ createdAt: -1 }).limit(10);

  const shelves = await Promise.all(
    (genres.length ? genres : ['Pop', 'Rock', 'Electronic']).slice(0, 4).map(async (g) => ({
      genre: g,
      tracks: await Track.find({ genre: g }).sort({ plays: -1 }).limit(10),
    }))
  );

  const recent = user
    ? (await User.findById(user._id).populate('recentlyPlayed')).recentlyPlayed.slice(0, 10)
    : [];

  res.json({ recommended, trending, newest, shelves: shelves.filter((s) => s.tracks.length), recent });
});

router.get('/liked', protect, async (req, res) => {
  const u = await User.findById(req.user._id).populate('likedTracks');
  res.json(u.likedTracks);
});

router.get('/:id', async (req, res) => {
  const track = await Track.findById(req.params.id).catch(() => null);
  if (!track) return res.status(404).json({ message: 'Track not found' });
  res.json(track);
});

// Record a play (updates counters + history)
router.post('/:id/play', optionalAuth, async (req, res) => {
  const track = await Track.findByIdAndUpdate(req.params.id, { $inc: { plays: 1 } }, { new: true });
  if (!track) return res.status(404).json({ message: 'Track not found' });
  if (req.user) {
    const history = [track._id, ...req.user.recentlyPlayed.filter((id) => !id.equals(track._id))].slice(0, 30);
    req.user.recentlyPlayed = history;
    await req.user.save();
  }
  res.json({ plays: track.plays });
});

// Download: proxies the audio file with an attachment header so the browser saves it
router.get('/:id/download', async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) return res.status(404).json({ message: 'Track not found' });
    const src = track.audio.high;
    const upstream = await fetch(src);
    if (!upstream.ok) return res.status(502).json({ message: 'Audio source unavailable' });
    const safe = `${track.artist} - ${track.title}`.replace(/[^\w\- ]+/g, '').trim() || 'track';
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${safe}.mp3"`);
    const len = upstream.headers.get('content-length');
    if (len) res.setHeader('Content-Length', len);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    const reader = upstream.body.getReader();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ message: e.message });
    else res.end();
  }
});

export default router;
