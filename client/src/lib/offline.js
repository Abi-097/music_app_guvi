// Offline downloads: audio blobs are stored in IndexedDB so tracks play without a network.
import { get, set, del, keys } from 'idb-keyval';
import api from './api';

const key = (id) => `track:${id}`;

export async function isDownloaded(id) {
  return !!(await get(key(id)));
}

export async function downloadedIds() {
  const all = await keys();
  return all.filter((k) => String(k).startsWith('track:')).map((k) => String(k).slice(6));
}

export async function getOfflineEntry(id) {
  return get(key(id));
}

export async function saveOffline(track, onProgress) {
  const res = await api.get(`/tracks/${track._id}/download`, {
    responseType: 'blob',
    onDownloadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
  });
  await set(key(track._id), { track, blob: res.data, savedAt: Date.now() });
  return res.data;
}

export async function removeOffline(id) {
  await del(key(id));
}

export async function listOfflineTracks() {
  const ids = await downloadedIds();
  const entries = await Promise.all(ids.map((id) => get(key(id))));
  return entries.filter(Boolean).map((e) => e.track);
}

// Also hand the file to the user's device as a normal browser download
export function saveToDevice(track, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${track.artist} - ${track.title}.mp3`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
