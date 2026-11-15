import { Facebook, Instagram, Link2, Twitter } from 'lucide-react';
import toast from 'react-hot-toast';

// Social sharing for a track or playlist page URL.
export default function ShareButtons({ url, title }) {
  const link = url || window.location.href;
  const text = `Listening to ${title} on Melodix`;

  const open = (href) => window.open(href, '_blank', 'noopener,noreferrer,width=600,height=500');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  // Instagram has no web "share link" endpoint: use the native share sheet on
  // mobile, otherwise copy the link and open Instagram so it can be pasted.
  const instagram = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: link });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await copy();
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  };

  const base = 'grid h-9 w-9 place-items-center rounded-full bg-ink-600 text-slate-300 transition hover:text-white';

  return (
    <div className="flex items-center gap-2">
      <button className={`${base} hover:bg-[#1877F2]`} aria-label="Share on Facebook"
        onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`)}>
        <Facebook size={16} />
      </button>
      <button className={`${base} hover:bg-[#1DA1F2]`} aria-label="Share on Twitter"
        onClick={() => open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`)}>
        <Twitter size={16} />
      </button>
      <button className={`${base} hover:bg-gradient-to-tr hover:from-yellow-500 hover:via-pink-500 hover:to-purple-600`}
        aria-label="Share on Instagram" onClick={instagram}>
        <Instagram size={16} />
      </button>
      <button className={`${base} hover:bg-brand-500`} aria-label="Copy link" onClick={copy}>
        <Link2 size={16} />
      </button>
    </div>
  );
}
