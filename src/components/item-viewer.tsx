
'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { ArchiveItem } from '@/lib/types';
import FileIcon from './file-icon';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';

type ItemViewerProps = {
  item: ArchiveItem;
};

export default function ItemViewer({ item }: ItemViewerProps) {
  const { t, dir } = useLanguage();
  const [absoluteUrl, setAbsoluteUrl] = useState('');

  useEffect(() => {
    // This runs only on the client, so window is available.
    if (item.url) {
      // Use the URL constructor for a robust way of creating the full URL.
      // This correctly handles base paths and ensures a valid URL is formed.
      const fullUrl = new URL(item.url, window.location.origin).href;
      setAbsoluteUrl(fullUrl);
    }
  }, [item.url]);

  const renderContent = () => {
    if (!item.url && item.type !== 'text') {
      return (
        <div className="text-center p-8 bg-secondary rounded-lg">
          <FileIcon type={item.type} className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('file_not_available')}</p>
        </div>
      );
    }

    switch (item.type) {
      case 'text':
        return (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
              {item.content || ''}
            </ReactMarkdown>
          </div>
        );
      case 'image':
        return (
          <div className="relative w-full h-full">
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
          <div className="w-full h-full rounded-lg overflow-hidden border">
            <iframe src={item.url!} className="w-full h-full border-0" title={item.title} />
          </div>
        );
      case 'word':
        if (!absoluteUrl) {
          return <p className="text-center py-8">{t('loading_document_viewer')}</p>;
        }
        return (
          <div className="w-full h-full rounded-lg overflow-hidden border">
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(absoluteUrl)}&embedded=true`}
              className="w-full h-full border-0"
              title={item.title}
            />
          </div>
        );
      default:
        return <p>{t('unsupported_file_type')}</p>;
    }
  };

  const showDownloadButton = ['pdf', 'word', 'image', 'audio', 'video'].includes(item.type);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow min-h-0 overflow-y-auto py-4">
        {renderContent()}
      </div>
      {showDownloadButton && item.url && (
        <div className={cn("pt-4 flex-shrink-0", dir === 'rtl' ? 'text-left' : 'text-right')}>
          <Button asChild>
            <a href={item.url} download={item.title}>
              <Download className={cn('h-4 w-4', dir === 'rtl' ? 'ml-2' : 'mr-2')} />
              {t('download')}
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
