import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import trackRoutes from './routes/tracks.js';
import playlistRoutes from './routes/playlists.js';
import interactionRoutes from './routes/interactions.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', exposedHeaders: ['Content-Disposition'] }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api', interactionRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/melodix')
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
