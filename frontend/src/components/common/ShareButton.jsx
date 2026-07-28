import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const ShareButton = ({ title }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled the native share sheet — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-primary transition-colors border border-slate-200 rounded-lg px-3 py-2"
    >
      {copied ? <Check className="w-4 h-4 text-success" /> : <Share2 className="w-4 h-4" />}
      {copied ? 'Copied' : 'Share'}
    </button>
  );
};

export default ShareButton;
