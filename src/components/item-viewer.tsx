
'use client';

import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
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
  const viewerRef = useRef<HTMLDivElement>(null); // Ref for event delegation

  useEffect(() => {
    // This runs only on the client, so window is available.
    if (item.url) {
      // Use the URL constructor for a robust way of creating the full URL.
      // This correctly handles base paths and ensures a valid URL is formed.
      const fullUrl = new URL(item.url, window.location.origin).href;
      setAbsoluteUrl(fullUrl);
    }
  }, [item.url]);

  // Effect for handling footnote clicks and highlighting
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleFootnoteClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // We look for the anchor tag, which could be the target or its parent
      const anchor = target.closest('a.footnote-ref, a.footnote-backref');
      
      if (anchor) {
        event.preventDefault(); // We handle scroll and highlight manually
        const href = anchor.getAttribute('href');
        if (!href) return;

        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          // Scroll smoothly into view
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Add highlight class and remove it after a delay
          targetElement.classList.add('source-highlight');
          setTimeout(() => {
            targetElement.classList.remove('source-highlight');
          }, 2500); // Highlight for 2.5 seconds
        }
      }
    };

    viewer.addEventListener('click', handleFootnoteClick);

    return () => {
      viewer.removeEventListener('click', handleFootnoteClick);
    };
  }, [item.content]); // Dependency on content ensures the effect re-runs if item changes


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
          <div className="relative w-full h-full max-h-[70vh]">
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
          <div className="w-full h-[75vh] rounded-lg overflow-hidden border">
            <iframe src={item.url!} className="w-full h-full border-0" title={item.title} />
          </div>
        );
      case 'word':
        if (!absoluteUrl) {
          return <p className="text-center py-8">{t('loading_document_viewer')}</p>;
        }
        return (
          <div className="w-full h-[75vh] rounded-lg overflow-hidden border">
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
    <div ref={viewerRef}>
        {renderContent()}
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
