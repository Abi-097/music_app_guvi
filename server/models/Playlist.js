import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }],
    isPublic: { type: Boolean, default: false },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Playlist', playlistSchema);
