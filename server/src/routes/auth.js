import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const r = Router();

const publicUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  avatar: u.avatar,
  preferredGenres: u.preferredGenres,
  preferredArtists: u.preferredArtists,
  settings: u.settings,
});

r.post('/register', async (req, res) => {
  const { name, email, password, preferredGenres = [] } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Email already registered' });
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 10), preferredGenres });
  res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
});

r.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({ token: signToken(user._id), user: publicUser(user) });
});

r.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(publicUser(user));
});

r.patch('/me', requireAuth, async (req, res) => {
  const allowed = ['name', 'avatar', 'preferredGenres', 'preferredArtists'];
  const update = {};
  for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
  if (req.body.settings) {
    for (const [k, v] of Object.entries(req.body.settings)) update[`settings.${k}`] = v;
  }
  const user = await User.findByIdAndUpdate(req.userId, { $set: update }, { new: true, runValidators: true });
  res.json(publicUser(user));
});

export default r;
