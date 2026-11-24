# Lively — MERN Music Streaming App

React (Vite) + TailwindCSS + shadcn/ui on the front end. Express + MongoDB (Mongoose) on the back end.
**Both deploy to a single Netlify site**: the React build is served as static files and the Express API runs as a Netlify Function at `/api/*`.

## Features

| Requirement | Where it lives |
|---|---|
| Music tailored to preferences (recommended tracks, genres) | Home page → "Recommended for you" uses your favourite genres/artists (picked at sign-up or in Settings) plus the songs you've liked. Also has genre browsing, trending and new releases. `GET /api/tracks/recommended` |
| Search by name, artist, album, movie | Search page with tabs for All / Song / Artist / Album / Movie, plus a genre filter. `GET /api/tracks/search?q=&field=&genre=` |
| Playlists: create, update, delete, add/remove songs | Library page, playlist page (Add songs, Edit, Delete, remove via the ••• menu), and "Add to playlist" from any track's ••• menu |
| High-quality streaming with shuffle / repeat / volume | Bottom player bar, built on **Howler.js** (HTML5 streaming mode). Shuffle, repeat off/all/one, volume + mute, seek bar, queue, media keys / lock-screen controls, space bar = play/pause |
| Customisable playback settings | Speed (0.5×–2×), fade-in, default volume and autoplay-next. Saved to your account in Settings. |
| Download for offline listening | "Download for offline" saves the MP3 to IndexedDB. The Downloads page plays songs without a connection, because a service worker caches the app shell. You can also "Save .mp3" to your device. |
| Likes and comments on tracks and playlists | Heart buttons with counts, and a comment thread (post/delete) on every track page and public playlist |
| Social sharing | Share dialog with Facebook, X/Twitter, WhatsApp and Instagram, plus copy link (see note below) |

> **Instagram note:** Instagram has no web "share URL". On phones the button opens the native share sheet. On desktop it copies the link and opens Instagram so you can paste it.

## Project structure

```
music-app/
├── netlify.toml              # build, function, redirects (API, audio proxy, SPA)
├── package.json              # server dependencies + root scripts
├── netlify/functions/api.mjs # wraps the Express app with serverless-http
├── server/src/
│   ├── app.js                # Express app (routes mounted at /api)
│   ├── index.js              # local dev server (node)
│   ├── db.js                 # cached Mongo connection + auto-seed
│   ├── seedData.js / seed.js # demo catalogue (24 tracks)
│   ├── models/               # User, Track, Playlist, Comment
│   ├── routes/               # auth, tracks, playlists, comments
│   └── middleware/auth.js    # JWT
└── client/                   # Vite + React + Tailwind + shadcn/ui
    └── src/{components,components/ui,context,pages,lib}
```

### API overview
```
POST   /api/auth/register | /api/auth/login        GET/PATCH /api/auth/me
GET    /api/tracks?genre=&sort=popular|new         GET /api/tracks/genres
GET    /api/tracks/search?q=&field=all|name|artist|album|movie&genre=
GET    /api/tracks/recommended                      GET /api/tracks/liked
GET    /api/tracks/:id   POST /api/tracks/:id/like  POST /api/tracks/:id/play
GET    /api/playlists/mine | /api/playlists/public  POST /api/playlists
GET/PATCH/DELETE /api/playlists/:id
POST   /api/playlists/:id/tracks   DELETE /api/playlists/:id/tracks/:trackId
POST   /api/playlists/:id/like
GET/POST /api/comments/:type/:id   (type = track | playlist)   DELETE /api/comments/:commentId
GET    /api/health
```

---

## 1. Run locally

Requires Node 20+.

```bash
npm install              # server deps (root)
npm run install:client   # client deps
```

Create `.env` in the project root (a filled-in one is included; `.env.example` is the template):
```
MONGODB_URI=mongodb+srv://abishekraja84_db_user:<password>@cluster0.yajishq.mongodb.net/musicapp?retryWrites=true&w=majority
JWT_SECRET=<long random string>
PORT=5000
```

Start the API and the client in two terminals:
```bash
npm run dev:server       # http://localhost:5000/api
npm run dev:client       # http://localhost:5173  (proxies /api and /audio)
```

The first API request seeds 24 demo tracks automatically if the collection is empty.
`npm run seed` wipes the tracks and re-inserts them.

> Alternative: `npm i -g netlify-cli` and then `netlify dev` runs the client and the function together, the same way they run on Netlify.

---

## 2. Prepare MongoDB Atlas (do this once)

1. **Allow Netlify to connect.** Netlify Functions don't have fixed IP addresses. In Atlas, go to **Security → Network Access → Add IP Address → Allow Access from Anywhere** (`0.0.0.0/0`) and click **Confirm**.
2. **Rotate the password (recommended).** The current password has been shared in plain text. In **Security → Database Access → abishekraja84_db_user → Edit → Edit Password**, create a new one. Then use the new password in your `.env` and in the Netlify variables below.
3. The database name is taken from the connection string (`/musicapp`). Atlas creates the database on first write.

---

## 3. Deploy to Netlify (frontend + server together)

### Option A: from GitHub (recommended, auto-deploys on every push)

1. Push the project to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Lively music app"
   git branch -M main
   git remote add origin https://github.com/<you>/Lively-music-app.git
   git push -u origin main
   ```
   `.env` is listed in `.gitignore`, so your credentials are **not** pushed. Run `git status` before committing to confirm `.env` is not listed.

2. In Netlify, go to **Add new site → Import an existing project → GitHub** and pick the repo.
3. Netlify reads the build settings from `netlify.toml`, so leave them as they are:
   - Build command: `npm run build`
   - Publish directory: `client/dist`
   - Functions directory: `netlify/functions`
4. Click **Add environment variables** (or after creating the site, go to **Site configuration → Environment variables**) and add:

   | Key | Value |
   |---|---|
   | `MONGODB_URI` | `mongodb+srv://abishekraja84_db_user:<password>@cluster0.yajishq.mongodb.net/musicapp?retryWrites=true&w=majority` |
   | `JWT_SECRET` | any long random string, e.g. the output of `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

5. Click **Deploy**. If you added the variables after the first deploy, go to **Deploys → Trigger deploy → Clear cache and deploy site**.

### Option B: Netlify CLI (no GitHub needed)

```bash
npm i -g netlify-cli
netlify login
netlify init                    # "Create & configure a new site"; accept netlify.toml settings
netlify env:set MONGODB_URI "mongodb+srv://abishekraja84_db_user:<password>@cluster0.yajishq.mongodb.net/musicapp?retryWrites=true&w=majority"
netlify env:set JWT_SECRET "<long random string>"
netlify deploy --build --prod
```

### 4. Verify the deployment

1. Open `https://<your-site>.netlify.app/api/health`. It should return `{"ok":true,"db":true}`.
2. Open the site. The home page should show tracks (seeded on the first API call).
3. Sign up, like a song, create a playlist, comment, and download a track. Then turn off Wi-Fi and open **Downloads**: it should still play.

### Troubleshooting

| Symptom | Fix |
|---|---|
| `{"message":"Database unavailable"}` (503) | Check that Atlas Network Access has `0.0.0.0/0`, that `MONGODB_URI` is set correctly in Netlify, and that the password has no unescaped special characters (URL-encode `@ : / ?` etc.). Then redeploy. |
| `/api/health` shows `"db":false` | `MONGODB_URI` isn't set in Netlify. Add it and redeploy. |
| 404 on refresh of `/playlist/...` | Make sure `netlify.toml` is at the repo root (it contains the SPA redirect). |
| Function logs | Netlify dashboard → **Logs → Functions → api** |

---

## How it works on Netlify

- `netlify.toml` redirects `/api/*` to the `api` function. That function wraps the Express app with `serverless-http`, and the Mongo connection is cached between warm invocations.
- `/audio/*` is a Netlify **proxy** to the royalty-free SoundHelix demo MP3s. Audio is therefore served from your own domain, so streaming and offline downloads have no CORS problems.
- All other paths go to `index.html` for React Router.

## Adding your own music

Each song is a document in the `tracks` collection:
```js
{ title, artist, album, movie, genre, year, duration /*sec*/, coverUrl, audioUrl, bitrate }
```
Host the MP3s on any HTTPS storage that allows CORS (for example Cloudinary, S3 or Firebase Storage), and put the URL in `audioUrl`. You can also add a Netlify proxy rule like the `/audio/*` one in `netlify.toml`. Then add the documents in Atlas (**Browse Collections → Insert Document**) or extend `server/src/seedData.js` and run `npm run seed`.
Only stream music you have the rights to.
