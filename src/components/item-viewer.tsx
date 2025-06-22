import Image from 'next/image';
import type { ArchiveItem } from '@/lib/types';
import FileIcon from './file-icon';

type ItemViewerProps = {
  item: ArchiveItem;
};

export default function ItemViewer({ item }: ItemViewerProps) {
  const renderContent = () => {
    switch (item.type) {
      case 'text':
        return <p className="text-base whitespace-pre-wrap leading-relaxed">{item.content}</p>;
      case 'image':
        return (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden">
            <Image 
              src={item.url || 'https://placehold.co/600x400.png'}
              alt={item.title}
              fill
              className="object-contain"
              data-ai-hint={item.content || 'placeholder image'}
            />
          </div>
        );
      case 'audio':
        return <audio controls src={item.url} className="w-full" />;
      case 'video':
        return <video controls src={item.url} className="w-full rounded-lg" />;
      case 'pdf':
      case 'word':
        return (
          <div className="text-center p-8 bg-secondary rounded-lg">
            <FileIcon type={item.type} className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Viewing for <strong>{item.type}</strong> files is not available in this demo.
            </p>
          </div>
        );
      default:
        return <p>Unsupported file type.</p>;
    }
  };

  return <div className="py-4">{renderContent()}</div>;
}
