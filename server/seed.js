import 'dotenv/config';
import mongoose from 'mongoose';
import Track from './models/Track.js';

// Demo audio: SoundHelix example songs (royalty-free demo files).
// Replace `audio` URLs with your own CDN / S3 / Cloudinary links for production.
const sh = (n) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;
const cover = (seed) => `https://picsum.photos/seed/${seed}/400/400`;

const tracks = [
  { title: 'Neon Skyline', artist: 'Aurora Vale', album: 'City Lights', genre: 'Electronic', year: 2024, movie: '', n: 1 },
  { title: 'Midnight Drive', artist: 'Aurora Vale', album: 'City Lights', genre: 'Electronic', year: 2024, movie: '', n: 2 },
  { title: 'Golden Hour', artist: 'The Marigolds', album: 'Sunday Letters', genre: 'Pop', year: 2023, movie: '', n: 3 },
  { title: 'Paper Boats', artist: 'The Marigolds', album: 'Sunday Letters', genre: 'Pop', year: 2023, movie: '', n: 4 },
  { title: 'Thunder Road Home', artist: 'Iron Sparrow', album: 'Dust & Diesel', genre: 'Rock', year: 2022, movie: '', n: 5 },
  { title: 'Burn the Map', artist: 'Iron Sparrow', album: 'Dust & Diesel', genre: 'Rock', year: 2022, movie: '', n: 6 },
  { title: 'Monsoon Eyes', artist: 'Ravi Kumar', album: 'Kadhal Kalam', genre: 'Soundtrack', year: 2025, movie: 'Kadhal Kalam', n: 7 },
  { title: 'Chennai Nights', artist: 'Ravi Kumar', album: 'Kadhal Kalam', genre: 'Soundtrack', year: 2025, movie: 'Kadhal Kalam', n: 8 },
  { title: 'Hero Theme', artist: 'Ananya Rao', album: 'Veera OST', genre: 'Soundtrack', year: 2024, movie: 'Veera', n: 9 },
  { title: 'Blue Hour Jazz', artist: 'Quartet No. 9', album: 'After Dark', genre: 'Jazz', year: 2021, movie: '', n: 10 },
  { title: 'Velvet Corners', artist: 'Quartet No. 9', album: 'After Dark', genre: 'Jazz', year: 2021, movie: '', n: 11 },
  { title: 'Rooftop Rain', artist: 'Lo-Fi Lotus', album: 'Study Session', genre: 'Lo-Fi', year: 2025, movie: '', n: 12 },
  { title: 'Cold Coffee', artist: 'Lo-Fi Lotus', album: 'Study Session', genre: 'Lo-Fi', year: 2025, movie: '', n: 13 },
  { title: 'Concrete Poetry', artist: 'MC Kestrel', album: 'Bars & Bridges', genre: 'Hip-Hop', year: 2024, movie: '', n: 14 },
  { title: 'Run It Back', artist: 'MC Kestrel', album: 'Bars & Bridges', genre: 'Hip-Hop', year: 2024, movie: '', n: 15 },
  { title: 'Silk Road Sunrise', artist: 'Ananya Rao', album: 'Raaga Reborn', genre: 'Classical', year: 2023, movie: '', n: 16 },
];

await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/melodix');
await Track.deleteMany({});
await Track.insertMany(
  tracks.map(({ n, ...t }) => ({
    ...t,
    duration: 240 + n * 7,
    coverUrl: cover(`${t.album}-${t.genre}`.replace(/\s+/g, '')),
    audio: { high: sh(n), low: sh(n) },
    plays: Math.floor(Math.random() * 5000),
  }))
);
console.log(`Seeded ${tracks.length} tracks`);
await mongoose.disconnect();
