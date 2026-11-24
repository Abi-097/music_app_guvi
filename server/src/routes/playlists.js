import { Router } from 'express';
import mongoose from 'mongoose';
import Playlist from '../models/Playlist.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const r = Router();

const shape = (p, userId) => {
  const o = p.toObject ? p.toObject() : p;
  const likes = o.likes || [];
  const tracks = (o.tracks || []).map((t) =>
    t && t.likes ? { ...t, likes: undefined, likeCount: t.likes.length, liked: t.likes.some((id) => String(id) === String(userId)) } : t
  );
  return {
    ...o,
    tracks,
    likes: undefined,
    likeCount: likes.length,
    liked: !!userId && likes.some((id) => String(id) === String(userId)),
    isOwner: !!userId && String(o.owner?._id || o.owner) === String(userId),
  };
};

async function loadOwned(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Playlist not found' }), null;
  const p = await Playlist.findById(req.params.id);
  if (!p) return res.status(404).json({ message: 'Playlist not found' }), null;
  if (String(p.owner) !== req.userId) return res.status(403).json({ message: 'Not your playlist' }), null;
  return p;
}

r.get('/mine', requireAuth, async (req, res) => {
  const lists = await Playlist.find({ owner: req.userId }).sort({ updatedAt: -1 }).populate('tracks', 'coverUrl');
  res.json(lists.map((p) => shape(p, req.userId)));
});

r.get('/public', optionalAuth, async (req, res) => {
  const lists = await Playlist.find({ isPublic: true, 'tracks.0': { $exists: true } })
    .sort({ updatedAt: -1 })
    .limit(20)
    .populate('owner', 'name')
    .populate('tracks', 'coverUrl');
  res.json(lists.map((p) => shape(p, req.userId)));
});

r.post('/', requireAuth, async (req, res) => {
  const { name, description = '', isPublic = true, tracks = [] } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Playlist name is required' });
  const p = await Playlist.create({ name, description, isPublic, tracks, owner: req.userId });
  res.status(201).json(shape(p, req.userId));
});

r.get('/:id', optionalAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Playlist not found' });
  const p = await Playlist.findById(req.params.id).populate('owner', 'name').populate('tracks');
  if (!p) return res.status(404).json({ message: 'Playlist not found' });
  if (!p.isPublic && String(p.owner?._id) !== req.userId) return res.status(403).json({ message: 'This playlist is private' });
  res.json(shape(p, req.userId));
});

r.patch('/:id', requireAuth, async (req, res) => {
  const p = await loadOwned(req, res);
  if (!p) return;
  for (const k of ['name', 'description', 'isPublic', 'coverUrl', 'tracks']) if (req.body[k] !== undefined) p[k] = req.body[k];
  await p.save();
  res.json(shape(p, req.userId));
});

r.delete('/:id', requireAuth, async (req, res) => {
  const p = await loadOwned(req, res);
  if (!p) return;
  await p.deleteOne();
  res.json({ ok: true });
});

r.post('/:id/tracks', requireAuth, async (req, res) => {
  const p = await loadOwned(req, res);
  if (!p) return;
  const { trackId } = req.body;
  if (!p.tracks.some((t) => String(t) === trackId)) p.tracks.push(trackId);
  await p.save();
  res.json(shape(p, req.userId));
});

r.delete('/:id/tracks/:trackId', requireAuth, async (req, res) => {
  const p = await loadOwned(req, res);
  if (!p) return;
  p.tracks = p.tracks.filter((t) => String(t) !== req.params.trackId);
  await p.save();
  res.json(shape(p, req.userId));
});

r.post('/:id/like', requireAuth, async (req, res) => {
  const p = await Playlist.findById(req.params.id);
  if (!p) return res.status(404).json({ message: 'Playlist not found' });
  const liked = p.likes.some((id) => String(id) === req.userId);
  await Playlist.updateOne({ _id: p._id }, liked ? { $pull: { likes: req.userId } } : { $addToSet: { likes: req.userId } });
  res.json({ liked: !liked, likeCount: p.likes.length + (liked ? -1 : 1) });
});

export default r;
