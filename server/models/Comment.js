import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['track', 'playlist'], required: true },
    target: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetModel' },
    text: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

commentSchema.virtual('targetModel').get(function () {
  return this.targetType === 'track' ? 'Track' : 'Playlist';
});

commentSchema.index({ targetType: 1, target: 1, createdAt: -1 });

export default mongoose.model('Comment', commentSchema);
