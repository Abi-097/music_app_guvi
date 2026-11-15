import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { protect, signToken } from '../middleware/auth.js';

const router = Router();

const publicUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  favoriteGenres: u.favoriteGenres,
  favoriteArtists: u.favoriteArtists,
  settings: u.settings,
  likedTracks: u.likedTracks,
  likedPlaylists: u.likedPlaylists,
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, favoriteGenres = [] } = req.body;
    if (!name || !email || !password || password.length < 6)
      return res.status(400).json({ message: 'Name, email and a 6+ character password are required' });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ message: 'Email already registered' });
    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      favoriteGenres,
    });
    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(password || '', user.password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/me', protect, (req, res) => res.json(publicUser(req.user)));

// Update preferences (genres/artists) and playback settings
router.put('/me', protect, async (req, res) => {
  try {
    const { name, favoriteGenres, favoriteArtists, settings } = req.body;
    const u = req.user;
    if (name) u.name = name;
    if (Array.isArray(favoriteGenres)) u.favoriteGenres = favoriteGenres;
    if (Array.isArray(favoriteArtists)) u.favoriteArtists = favoriteArtists;
    if (settings) u.settings = { ...u.settings.toObject(), ...settings };
    await u.save();
    res.json(publicUser(u));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export default router;
