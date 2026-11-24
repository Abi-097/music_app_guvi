// Offline downloads: audio blobs + track metadata kept in IndexedDB.
import { createStore, get, set, del, entries } from 'idb-keyval';

const audioStore = createStore('wavely-offline', 'audio');
const metaStore = createStore('wavely-offline-meta', 'tracks');

export async function downloadTrack(track, onProgress) {
  const res = await fetch(track.audioUrl);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const total = +res.headers.get('content-length') || 0;
  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total && onProgress) onProgress(Math.round((received / total) * 100));
  }
  const blob = new Blob(chunks, { type: 'audio/mpeg' });
  await set(track._id, blob, audioStore);
  await set(track._id, { ...track, downloadedAt: Date.now(), size: blob.size }, metaStore);
  return blob;
}

export const isDownloaded = async (id) => !!(await get(id, metaStore));
export const getOfflineBlob = (id) => get(id, audioStore);

export async function removeDownload(id) {
  await del(id, audioStore);
  await del(id, metaStore);
}

export async function listDownloads() {
  const all = await entries(metaStore);
  return all.map(([, v]) => v).sort((a, b) => b.downloadedAt - a.downloadedAt);
}

// Also lets the user save a real .mp3 file to their device.
export async function saveFileToDevice(track) {
  const blob = (await getOfflineBlob(track._id)) || (await (await fetch(track.audioUrl)).blob());
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${track.artist} - ${track.title}.mp3`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
