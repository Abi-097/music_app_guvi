import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    // Preferences drive recommendations
    favoriteGenres: { type: [String], default: [] },
    favoriteArtists: { type: [String], default: [] },
    // Customizable playback settings (synced across devices)
    settings: {
      quality: { type: String, enum: ['low', 'high'], default: 'high' },
      playbackRate: { type: Number, default: 1, min: 0.5, max: 2 },
      volume: { type: Number, default: 0.8, min: 0, max: 1 },
      autoplay: { type: Boolean, default: true },
    },
    likedTracks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }],
    likedPlaylists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Playlist' }],
    // Lightweight listening history to improve recommendations
    recentlyPlayed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }],
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
