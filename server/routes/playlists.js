import { Router } from 'express';
import Playlist from '../models/Playlist.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = Router();

const ownedBy = (pl, user) => pl.owner.equals ? pl.owner.equals(user._id) : String(pl.owner) === String(user._id);

// My playlists
router.get('/', protect, async (req, res) => {
  const lists = await Playlist.find({ owner: req.user._id })
    .sort({ updatedAt: -1 })
    .populate('tracks', 'title artist coverUrl');
  res.json(lists);
});

// Public playlists to discover
router.get('/public', async (_req, res) => {
  const lists = await Playlist.find({ isPublic: true })
    .sort({ likesCount: -1, updatedAt: -1 })
    .limit(20)
    .populate('owner', 'name')
    .populate('tracks', 'coverUrl');
  res.json(lists);
});

router.post('/', protect, async (req, res) => {
  const { name, description, isPublic } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Playlist name is required' });
  const pl = await Playlist.create({ name, description, isPublic: !!isPublic, owner: req.user._id });
  res.status(201).json(pl);
});

router.get('/:id', optionalAuth, async (req, res) => {
  const pl = await Playlist.findById(req.params.id)
    .populate('tracks')
    .populate('owner', 'name')
    .catch(() => null);
  if (!pl) return res.status(404).json({ message: 'Playlist not found' });
  const isOwner = req.user && String(pl.owner._id) === String(req.user._id);
  if (!pl.isPublic && !isOwner) return res.status(403).json({ message: 'This playlist is private' });
  res.json(pl);
});

router.put('/:id', protect, async (req, res) => {
  const pl = await Playlist.findById(req.params.id);
  if (!pl) return res.status(404).json({ message: 'Playlist not found' });
  if (!ownedBy(pl, req.user)) return res.status(403).json({ message: 'Not your playlist' });
  const { name, description, isPublic } = req.body;
  if (name !== undefined) pl.name = name;
  if (description !== undefined) pl.description = description;
  if (isPublic !== undefined) pl.isPublic = !!isPublic;
  await pl.save();
  res.json(pl);
});

router.delete('/:id', protect, async (req, res) => {
  const pl = await Playlist.findById(req.params.id);
  if (!pl) return res.status(404).json({ message: 'Playlist not found' });
  if (!ownedBy(pl, req.user)) return res.status(403).json({ message: 'Not your playlist' });
  await pl.deleteOne();
  res.json({ ok: true });
});

router.post('/:id/tracks', protect, async (req, res) => {
  const pl = await Playlist.findById(req.params.id);
  if (!pl) return res.status(404).json({ message: 'Playlist not found' });
  if (!ownedBy(pl, req.user)) return res.status(403).json({ message: 'Not your playlist' });
  const { trackId } = req.body;
  if (!pl.tracks.some((t) => t.equals(trackId))) pl.tracks.push(trackId);
  await pl.save();
  res.json(pl);
});

router.delete('/:id/tracks/:trackId', protect, async (req, res) => {
  const pl = await Playlist.findById(req.params.id);
  if (!pl) return res.status(404).json({ message: 'Playlist not found' });
  if (!ownedBy(pl, req.user)) return res.status(403).json({ message: 'Not your playlist' });
  pl.tracks = pl.tracks.filter((t) => !t.equals(req.params.trackId));
  await pl.save();
  res.json(pl);
});

export default router;
