import { FaFacebookF, FaXTwitter, FaInstagram, FaWhatsapp } from 'react-icons/fa6';
import { Link2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function ShareButtons({ title, path, trigger, open, onOpenChange }) {
  const controlled = open !== undefined;
  const url = `${window.location.origin}${path}`;
  const text = `Listening to ${title} on Lively 🎧`;
  const enc = encodeURIComponent;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  // Instagram has no web share URL: use the native share sheet on mobile, else copy + open Instagram.
  const instagram = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    toast.success('Link copied — paste it into your Instagram story or bio');
    window.open('https://www.instagram.com/', '_blank', 'noopener');
  };

  const targets = [
    { name: 'Facebook', icon: FaFacebookF, color: 'bg-[#1877F2]', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { name: 'X / Twitter', icon: FaXTwitter, color: 'bg-black border border-white/20', href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
    { name: 'WhatsApp', icon: FaWhatsapp, color: 'bg-[#25D366]', href: `https://wa.me/?text=${enc(`${text} ${url}`)}` },
    { name: 'Instagram', icon: FaInstagram, color: 'bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5]', onClick: instagram },
  ];

  return (
    <Dialog {...(controlled ? { open, onOpenChange } : {})}>
      {!controlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="icon" aria-label="Share">
              <Share2 />
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Share “{title}”</DialogTitle>
          <DialogDescription>Send it to friends on your favourite platform.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-3">
          {targets.map((t) => {
            const inner = (
              <>
                <span className={`flex h-12 w-12 items-center justify-center rounded-full text-white ${t.color}`}>
                  <t.icon className="h-5 w-5" />
                </span>
                <span className="text-xs text-muted-foreground">{t.name}</span>
              </>
            );
            return t.href ? (
              <a key={t.name} href={t.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 hover:opacity-90">
                {inner}
              </a>
            ) : (
              <button key={t.name} onClick={t.onClick} className="flex flex-col items-center gap-2 hover:opacity-90">
                {inner}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Input readOnly value={url} onFocus={(e) => e.target.select()} />
          <Button variant="secondary" onClick={copy}>
            <Link2 /> Copy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
