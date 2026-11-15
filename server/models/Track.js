import mongoose from 'mongoose';

const trackSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    album: { type: String, trim: true, default: '' },
    movie: { type: String, trim: true, default: '' }, // for film soundtracks
    genre: { type: String, trim: true, default: 'Other' },
    year: Number,
    duration: Number, // seconds
    coverUrl: { type: String, default: '' },
    // Two renditions so users can pick streaming quality
    audio: {
      high: { type: String, required: true },
      low: { type: String },
    },
    plays: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

trackSchema.index({ title: 'text', artist: 'text', album: 'text', movie: 'text' });
trackSchema.index({ genre: 1, plays: -1 });

export default mongoose.model('Track', trackSchema);
