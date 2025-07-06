
import type { ArchiveItem } from '@/lib/types';
import { Music, X } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '@/context/language-context';

type MiniAudioPlayerProps = {
  item: ArchiveItem;
  onClose: () => void;
};

export default function MiniAudioPlayer({ item, onClose }: MiniAudioPlayerProps) {
  const { t } = useLanguage();
  if (!item.url) return null;

  return (
    <div className="bg-secondary/50 text-foreground p-3 flex items-center gap-4 border-b animate-in fade-in-0 slide-in-from-top-4 duration-300">
      <Music className="h-6 w-6 text-primary flex-shrink-0" />
      <div className="flex-grow min-w-0">
        <p className="font-semibold truncate">{item.title}</p>
      </div>
      <audio controls autoPlay src={item.url} className="h-10 rounded-md" preload="metadata" />
      <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-primary/10 h-9 w-9 flex-shrink-0">
        <X className="h-5 w-5" />
        <span className="sr-only">{t('close_player')}</span>
      </Button>
    </div>
  );
}
