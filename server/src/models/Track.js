import mongoose from 'mongoose';

const trackSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    album: { type: String, default: '', trim: true },
    movie: { type: String, default: '', trim: true },
    genre: { type: String, required: true, trim: true },
    language: { type: String, default: 'English' },
    year: Number,
    duration: { type: Number, default: 0 }, // seconds
    coverUrl: { type: String, default: '' },
    audioUrl: { type: String, required: true },
    bitrate: { type: Number, default: 320 }, // kbps
    plays: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

trackSchema.index({ title: 'text', artist: 'text', album: 'text', movie: 'text' });
trackSchema.index({ genre: 1 });

export default mongoose.models.Track || mongoose.model('Track', trackSchema);
