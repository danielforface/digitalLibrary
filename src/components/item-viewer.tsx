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
import React from 'react';

type ItemViewerProps = {
  item: ArchiveItem;
};

export default function ItemViewer({ item }: ItemViewerProps) {
  const { t, dir } = useLanguage();
  const [absoluteUrl, setAbsoluteUrl] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  const handleFootnoteJump = (targetElement: HTMLElement | null) => {
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetElement.classList.add('source-highlight');
      setTimeout(() => {
        targetElement.classList.remove('source-highlight');
      }, 2500);
    }
  };

  useEffect(() => {
    if (item.url) {
      const fullUrl = new URL(item.url, window.location.origin).href;
      setAbsoluteUrl(fullUrl);
    }
  }, [item.url]);
  
  useEffect(() => {
    if (contentRef.current && item.type === 'text') {
      const links = Array.from(contentRef.current.querySelectorAll('a'));
      const notes: Map<string, { refs: HTMLElement[], def: HTMLElement | null }> = new Map();

      // --- Pass 1: Find all potential malformed footnote links and categorize them ---
      links.forEach(link => {
        const href = link.getAttribute('href');
        const text = link.textContent?.trim();
        const isPotentiallyMalformed = !href || href === '' || href.startsWith('file:');
        const match = text?.match(/^\[(\d+)\]$/);

        if (match && isPotentiallyMalformed) {
          const num = match[1];
          if (!notes.has(num)) {
            notes.set(num, { refs: [], def: null });
          }
          
          const parentText = link.parentElement?.textContent?.trim();
          // Heuristic: If parent paragraph starts with the link text, it's a definition.
          if (parentText?.startsWith(text!)) {
            notes.get(num)!.def = link;
          } else {
            notes.get(num)!.refs.push(link);
          }
        }
      });
      
      // --- Pass 2: Wire up the connections for malformed links ---
      notes.forEach((note, num) => {
        if (note.def && note.refs.length > 0) {
          const defTargetEl = note.def.closest('p') || note.def;
          defTargetEl.id = `definition-target-${num}`;

          note.refs.forEach((refLink, index) => {
            const refTargetEl = refLink.closest('p') || refLink;
            refTargetEl.id = `reference-target-${num}-${index}`;
            
            refLink.onclick = (e) => {
              e.preventDefault();
              handleFootnoteJump(defTargetEl);
            };
          });
          
          note.def.onclick = (e) => {
            e.preventDefault();
            const firstRefEl = document.getElementById(`reference-target-${num}-0`);
            handleFootnoteJump(firstRefEl);
          };

        } else {
          // Neutralize links that don't have a pair
          note.refs.forEach(refLink => { refLink.onclick = (e) => e.preventDefault(); });
          if (note.def) { note.def.onclick = (e) => e.preventDefault(); }
        }
      });

      // --- Pass 3: Handle standard GFM links and other web links ---
      links.forEach(link => {
        // If the link was already handled by our custom logic, skip it.
        if (link.onclick) return;

        const href = link.getAttribute('href');
        
        // Handle standard GFM footnotes (which use hash links)
        if (href && href.startsWith('#')) {
          link.onclick = (e) => {
            e.preventDefault();
            try {
              const targetId = decodeURIComponent(href.substring(1));
              const targetElement = document.getElementById(targetId);
              handleFootnoteJump(targetElement);
            } catch (err) { console.error('Error jumping to GFM footnote:', err); }
          };
        } else {
          // Open all other valid web links in a new tab
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
      });
    }
  }, [item.content, item.type]);


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
          <div ref={contentRef}>
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeRaw]}
              >
                {item.content || ''}
              </ReactMarkdown>
            </div>
          </div>
        );
      case 'image':
        return (
          <div className="relative w-full h-[75dvh]">
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
          <div className="w-full h-[75dvh] rounded-lg overflow-hidden border">
            <iframe src={item.url!} className="w-full h-full border-0" title={item.title} />
          </div>
        );
      case 'word':
        if (!absoluteUrl) {
          return <p className="text-center py-8">{t('loading_document_viewer')}</p>;
        }
        return (
          <div className="w-full h-[75dvh] rounded-lg overflow-hidden border">
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
    <div className='pb-6'>
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
