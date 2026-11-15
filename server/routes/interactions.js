import { Router } from 'express';
import Track from '../models/Track.js';
import Playlist from '../models/Playlist.js';
import Comment from '../models/Comment.js';
import { protect } from '../middleware/auth.js';

const router = Router();

const MODELS = {
  track: { Model: Track, userField: 'likedTracks' },
  playlist: { Model: Playlist, userField: 'likedPlaylists' },
};

const resolve = (req, res) => {
  const cfg = MODELS[req.params.type];
  if (!cfg) {
    res.status(400).json({ message: 'type must be "track" or "playlist"' });
    return null;
  }
  return cfg;
};

// Toggle like. Returns { liked, likesCount }
router.post('/:type/:id/like', protect, async (req, res) => {
  const cfg = resolve(req, res);
  if (!cfg) return;
  const doc = await cfg.Model.findById(req.params.id).catch(() => null);
  if (!doc) return res.status(404).json({ message: 'Not found' });

  const list = req.user[cfg.userField];
  const already = list.some((id) => id.equals(doc._id));
  if (already) req.user[cfg.userField] = list.filter((id) => !id.equals(doc._id));
  else list.push(doc._id);
  doc.likesCount = Math.max(0, doc.likesCount + (already ? -1 : 1));
  await Promise.all([req.user.save(), doc.save()]);
  res.json({ liked: !already, likesCount: doc.likesCount });
});

router.get('/:type/:id/comments', async (req, res) => {
  const cfg = resolve(req, res);
  if (!cfg) return;
  const comments = await Comment.find({ targetType: req.params.type, target: req.params.id })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('user', 'name');
  res.json(comments);
});

router.post('/:type/:id/comments', protect, async (req, res) => {
  const cfg = resolve(req, res);
  if (!cfg) return;
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ message: 'Comment cannot be empty' });
  const doc = await cfg.Model.findById(req.params.id).catch(() => null);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const comment = await Comment.create({
    user: req.user._id,
    targetType: req.params.type,
    target: doc._id,
    text,
  });
  doc.commentsCount += 1;
  await doc.save();
  await comment.populate('user', 'name');
  res.status(201).json(comment);
});

router.delete('/comments/:commentId', protect, async (req, res) => {
  const c = await Comment.findById(req.params.commentId);
  if (!c) return res.status(404).json({ message: 'Comment not found' });
  if (!c.user.equals(req.user._id)) return res.status(403).json({ message: 'Not your comment' });
  const { Model } = MODELS[c.targetType];
  await Model.findByIdAndUpdate(c.target, { $inc: { commentsCount: -1 } });
  await c.deleteOne();
  res.json({ ok: true });
});

export default router;
