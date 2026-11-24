import { Router } from 'express';
import mongoose from 'mongoose';
import Track from '../models/Track.js';
import User from '../models/User.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const r = Router();
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const shape = (t, userId) => {
  const o = t.toObject ? t.toObject() : t;
  const likes = o.likes || [];
  return { ...o, likes: undefined, likeCount: likes.length, liked: !!userId && likes.some((id) => String(id) === String(userId)) };
};

// GET /tracks?genre=Pop&sort=popular|new&limit=20
r.get('/', optionalAuth, async (req, res) => {
  const { genre, sort = 'new', limit = 50 } = req.query;
  const q = genre ? { genre } : {};
  const sortBy = sort === 'popular' ? { plays: -1 } : { year: -1, createdAt: -1 };
  const tracks = await Track.find(q).sort(sortBy).limit(Math.min(+limit || 50, 100));
  res.json(tracks.map((t) => shape(t, req.userId)));
});

r.get('/genres', async (_req, res) => {
  const genres = await Track.aggregate([
    { $group: { _id: '$genre', count: { $sum: 1 }, cover: { $first: '$coverUrl' } } },
    { $sort: { count: -1 } },
  ]);
  res.json(genres.map((g) => ({ name: g._id, count: g.count, coverUrl: g.cover })));
});

// GET /tracks/search?q=...&field=all|title|artist|album|movie&genre=
r.get('/search', optionalAuth, async (req, res) => {
  const { q = '', field = 'all', genre } = req.query;
  const term = String(q).trim();
  const filter = {};
  if (term) {
    const rx = new RegExp(escape(term), 'i');
    const fields = field === 'all' ? ['title', 'artist', 'album', 'movie'] : [field === 'name' ? 'title' : field];
    filter.$or = fields.filter((f) => ['title', 'artist', 'album', 'movie'].includes(f)).map((f) => ({ [f]: rx }));
  }
  if (genre) filter.genre = genre;
  const tracks = await Track.find(filter).sort({ plays: -1 }).limit(50);
  res.json(tracks.map((t) => shape(t, req.userId)));
});

// Personalised: preferred genres/artists + genres/artists of liked tracks.
r.get('/recommended', optionalAuth, async (req, res) => {
  let genres = [];
  let artists = [];
  const exclude = [];
  if (req.userId) {
    const user = await User.findById(req.userId);
    genres = [...(user?.preferredGenres || [])];
    artists = [...(user?.preferredArtists || [])];
    const liked = await Track.find({ likes: req.userId }).select('genre artist');
    for (const t of liked) {
      genres.push(t.genre);
      artists.push(t.artist);
      exclude.push(t._id);
    }
  }
  let tracks = [];
  if (genres.length || artists.length) {
    tracks = await Track.find({
      _id: { $nin: exclude },
      $or: [{ genre: { $in: genres } }, { artist: { $in: artists } }],
    })
      .sort({ plays: -1 })
      .limit(20);
  }
  if (tracks.length < 8) {
    const more = await Track.find({ _id: { $nin: [...exclude, ...tracks.map((t) => t._id)] } })
      .sort({ plays: -1 })
      .limit(12 - tracks.length);
    tracks = tracks.concat(more);
  }
  res.json(tracks.map((t) => shape(t, req.userId)));
});

r.get('/liked', requireAuth, async (req, res) => {
  const tracks = await Track.find({ likes: req.userId }).sort({ updatedAt: -1 });
  res.json(tracks.map((t) => shape(t, req.userId)));
});

r.get('/:id', optionalAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Track not found' });
  const t = await Track.findById(req.params.id);
  if (!t) return res.status(404).json({ message: 'Track not found' });
  res.json(shape(t, req.userId));
});

r.post('/:id/play', async (req, res) => {
  await Track.updateOne({ _id: req.params.id }, { $inc: { plays: 1 } });
  res.json({ ok: true });
});

r.post('/:id/like', requireAuth, async (req, res) => {
  const t = await Track.findById(req.params.id);
  if (!t) return res.status(404).json({ message: 'Track not found' });
  const liked = t.likes.some((id) => String(id) === req.userId);
  await Track.updateOne({ _id: t._id }, liked ? { $pull: { likes: req.userId } } : { $addToSet: { likes: req.userId } });
  res.json({ liked: !liked, likeCount: t.likes.length + (liked ? -1 : 1) });
});

export default r;
