import TrackCard from './TrackCard';

export default function Shelf({ title, subtitle, tracks }) {
  if (!tracks?.length) return null;
  return (
    <section className="mb-8">
      <div className="mb-3">
        <h2 className="text-xl font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
        {tracks.map((t) => (
          <TrackCard key={t._id} track={t} queue={tracks} />
        ))}
      </div>
    </section>
  );
}
