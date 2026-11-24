import Track from './models/Track.js';

// Demo catalogue. Audio comes from the royalty-free SoundHelix examples,
// served through the /audio/* proxy (netlify.toml in production, vite.config in dev)
// so playback and offline downloads are same-origin.
const raw = [
  ['Neon Skyline', 'Aurora Vale', 'City Lights', '', 'Pop', 2024, 372],
  ['Midnight Drive', 'The Static Hearts', 'Overdrive', '', 'Rock', 2023, 425],
  ['Pulse Theory', 'Kilo Wave', 'Frequencies', '', 'Electronic', 2025, 344],
  ['Blue Hour Sessions', 'Miles Ember Trio', 'After Dark', '', 'Jazz', 2022, 302],
  ['Concrete Poetry', 'MC Rhythmic', 'Street Verses', '', 'Hip-Hop', 2024, 353],
  ['Kadhal Theme', 'A. Raghav', 'Kadhal Kaalam (OST)', 'Kadhal Kaalam', 'Soundtrack', 2023, 300],
  ['Morning Coffee', 'lofi.loop', 'Study Beats Vol. 2', '', 'Lo-fi', 2025, 306],
  ['Sonata in Glass', 'Elena Moravec', 'Modern Classics', '', 'Classical', 2021, 411],
  ['Tidal Drift', 'Oceanic', 'Deep Blue', '', 'Ambient', 2024, 296],
  ['Golden Hour', 'Aurora Vale', 'City Lights', '', 'Pop', 2024, 336],
  ['Thunder Road Revival', 'The Static Hearts', 'Overdrive', '', 'Rock', 2023, 217],
  ['Hyperloop', 'Kilo Wave', 'Frequencies', '', 'Electronic', 2025, 342],
  ['Vettai Title Track', 'Ilaya Sangeetham', 'Vettai (OST)', 'Vettai', 'Soundtrack', 2022, 223],
  ['Rainy Window', 'lofi.loop', 'Study Beats Vol. 2', '', 'Lo-fi', 2025, 343],
  ['Dil Ki Awaaz', 'Arjun Mehra', 'Safar (OST)', 'Safar', 'Soundtrack', 2024, 379],
  ['Starlight Waltz', 'Elena Moravec', 'Modern Classics', '', 'Classical', 2021, 300],
  ['Satellite Love', 'Nova & The Echoes', 'Orbit', '', 'Pop', 2025, 372],
  ['Smoke & Brass', 'Miles Ember Trio', 'After Dark', '', 'Jazz', 2022, 425],
  ['Cipher', 'MC Rhythmic', 'Street Verses', '', 'Hip-Hop', 2024, 344],
  ['Aurora Fields', 'Oceanic', 'Deep Blue', '', 'Ambient', 2024, 302],
  ['Interstellar Run', 'Kilo Wave', 'Night Circuits', 'Starbound', 'Electronic', 2025, 353],
  ['Paper Planes', 'Nova & The Echoes', 'Orbit', '', 'Pop', 2025, 300],
  ['Highway Ghosts', 'The Static Hearts', 'Wildfire', '', 'Rock', 2024, 306],
  ['Monsoon Melody', 'A. Raghav', 'Mazhai (OST)', 'Mazhai', 'Soundtrack', 2025, 411],
];

export const demoTracks = raw.map(([title, artist, album, movie, genre, year, duration], i) => ({
  title,
  artist,
  album,
  movie,
  genre,
  year,
  duration,
  bitrate: 320,
  coverUrl: `https://picsum.photos/seed/${encodeURIComponent(album || title)}/400/400`,
  audioUrl: `/audio/SoundHelix-Song-${(i % 16) + 1}.mp3`,
  plays: Math.floor(Math.random() * 500),
}));

export async function seedIfEmpty() {
  const count = await Track.estimatedDocumentCount();
  if (count === 0) {
    await Track.insertMany(demoTracks);
    console.log(`Seeded ${demoTracks.length} demo tracks`);
  }
}
