import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    volume: { type: Number, default: 0.8, min: 0, max: 1 },
    playbackRate: { type: Number, default: 1, min: 0.5, max: 2 },
    autoplayNext: { type: Boolean, default: true },
    fadeInMs: { type: Number, default: 0, min: 0, max: 5000 },
    streamingQuality: { type: String, enum: ['normal', 'high', 'lossless'], default: 'high' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String, default: '' },
    preferredGenres: [{ type: String }],
    preferredArtists: [{ type: String }],
    settings: { type: settingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', userSchema);
