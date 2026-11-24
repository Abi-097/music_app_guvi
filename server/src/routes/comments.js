import { Router } from 'express';
import mongoose from 'mongoose';
import Comment from '../models/Comment.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();
const types = ['track', 'playlist'];

r.get('/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  if (!types.includes(type) || !mongoose.isValidObjectId(id)) return res.json([]);
  const comments = await Comment.find({ targetType: type, targetId: id }).sort({ createdAt: -1 }).limit(100).populate('user', 'name avatar');
  res.json(comments);
});

r.post('/:type/:id', requireAuth, async (req, res) => {
  const { type, id } = req.params;
  const text = (req.body.text || '').trim();
  if (!types.includes(type) || !mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid target' });
  if (!text) return res.status(400).json({ message: 'Comment cannot be empty' });
  const c = await Comment.create({ user: req.userId, targetType: type, targetId: id, text });
  await c.populate('user', 'name avatar');
  res.status(201).json(c);
});

r.delete('/:commentId', requireAuth, async (req, res) => {
  const c = await Comment.findById(req.params.commentId);
  if (!c) return res.status(404).json({ message: 'Comment not found' });
  if (String(c.user) !== req.userId) return res.status(403).json({ message: 'You can only delete your own comments' });
  await c.deleteOne();
  res.json({ ok: true });
});

export default r;
