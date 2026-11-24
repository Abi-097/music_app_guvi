import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';
import trackRoutes from './routes/tracks.js';
import playlistRoutes from './routes/playlists.js';
import commentRoutes from './routes/comments.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  if (!Buffer.isBuffer(req.body)) return next();
  const raw = req.body.toString('utf8');
  if (!raw) {
    req.body = {};
    return next();
  }
  if ((req.headers['content-type'] || '').includes('application/json')) {
    try {
      req.body = JSON.parse(raw);
    } catch {
      return res.status(400).json({ message: 'Invalid JSON body' });
    }
  } else {
    req.body = {};
  }
  next();
});

const health = (_req, res) => res.json({ ok: true, db: !!process.env.MONGODB_URI });
app.get(['/api/health', '/.netlify/functions/api/health'], health);

// Ensure DB is connected before every request (cheap once cached).
app.use(async (_req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    res.status(503).json({ message: 'Database unavailable' });
  }
});

const api = express.Router();
api.use('/auth', authRoutes);
api.use('/tracks', trackRoutes);
api.use('/playlists', playlistRoutes);
api.use('/comments', commentRoutes);

// Mounted on both paths so it works locally and behind the Netlify redirect.
app.use('/api', api);
app.use('/.netlify/functions/api', api);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

export default app;
