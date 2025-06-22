'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { ArchiveItem } from '@/lib/types';
import FileIcon from './file-icon';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type ItemViewerProps = {
  item: ArchiveItem;
};

export default function ItemViewer({ item }: ItemViewerProps) {
  const [absoluteUrl, setAbsoluteUrl] = useState('');

  useEffect(() => {
    // This runs only on the client, so window is available.
    if (item.url) {
      setAbsoluteUrl(window.location.origin + item.url);
    }
  }, [item.url]);

  const renderContent = () => {
    if (!item.url && item.type !== 'text') {
      return (
        <div className="text-center p-8 bg-secondary rounded-lg">
          <FileIcon type={item.type} className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">File not available for this item.</p>
        </div>
      );
    }

    switch (item.type) {
      case 'text':
        return (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {item.content || ''}
            </ReactMarkdown>
          </div>
        );
      case 'image':
        return (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden">
            <Image
              src={item.url!}
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
        return (
          <div className="w-full h-[70vh] rounded-lg overflow-hidden border">
            <iframe src={item.url!} className="w-full h-full border-0" title={item.title} />
          </div>
        );
      case 'word':
        if (!absoluteUrl) {
          return <p className="text-center py-8">Loading document viewer...</p>;
        }
        return (
          <div className="w-full h-[70vh] rounded-lg overflow-hidden border">
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(absoluteUrl)}&embedded=true`}
              className="w-full h-full border-0"
              title={item.title}
            />
          </div>
        );
      default:
        return <p>Unsupported file type.</p>;
    }
  };

  const showDownloadButton = ['pdf', 'word', 'image', 'audio', 'video'].includes(item.type);

  return (
    <div className="py-4 space-y-4">
      {renderContent()}
      {showDownloadButton && item.url && (
        <div className="text-right pt-2">
          <Button asChild>
            <a href={item.url} download={item.title}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
