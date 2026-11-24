// Usage: npm run seed  (wipes and re-inserts the demo tracks)
import mongoose from 'mongoose';
import Track from './models/Track.js';
import { demoTracks } from './seedData.js';

await mongoose.connect(process.env.MONGODB_URI);
await Track.deleteMany({});
await Track.insertMany(demoTracks);
console.log(`Inserted ${demoTracks.length} tracks`);
await mongoose.disconnect();
