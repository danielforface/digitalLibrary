'use client';

import { useState } from 'react';
import type { ArchiveItem } from '@/lib/types';
import ArchiveCard from './archive-card';
import { Button } from './ui/button';
import { Menu, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from './ui/badge';

type ArchiveViewProps = {
  items: ArchiveItem[];
  onUpload: () => void;
  onView: (item: ArchiveItem) => void;
  onEdit: (item: ArchiveItem) => void;
  onDelete: (itemId: string) => void;
  categoryTitle: string;
  onMenuClick: () => void;
  availableTags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
};

export default function ArchiveView({ items, onUpload, onView, onEdit, onDelete, categoryTitle, onMenuClick, availableTags, selectedTag, onSelectTag }: ArchiveViewProps) {
  const [tagsExpanded, setTagsExpanded] = useState(false);

  const TAG_LIMIT = 5;
  const visibleTags = tagsExpanded ? availableTags : availableTags.slice(0, TAG_LIMIT);

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open Menu</span>
          </Button>
          <h2 className="text-3xl font-headline font-semibold">{categoryTitle}</h2>
        </div>
        <Button onClick={onUpload}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Content
        </Button>
      </header>

      {availableTags.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onSelectTag(null)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                !selectedTag
                  ? 'bg-secondary text-secondary-foreground font-semibold'
                  : 'bg-secondary/50 hover:bg-secondary'
              }`}
            >
              All Tags
            </button>
            {visibleTags.map(tag => (
              <button
                key={tag}
                onClick={() => onSelectTag(tag)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedTag === tag
                    ? 'bg-secondary text-secondary-foreground font-semibold'
                    : 'bg-secondary/50 hover:bg-secondary'
                }`}
              >
                {tag}
              </button>
            ))}
            {availableTags.length > TAG_LIMIT && (
              <button
                onClick={() => setTagsExpanded(!tagsExpanded)}
                className="flex items-center gap-1 px-3 py-1 text-sm rounded-full text-muted-foreground hover:bg-secondary/80 transition-colors"
              >
                {tagsExpanded ? 'Show less' : `Show ${availableTags.length - TAG_LIMIT} more`}
                {tagsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      )}
      
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {items.map((item) => (
            <ArchiveCard
              key={item.id}
              item={item}
              onView={() => onView(item)}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[60vh] border-2 border-dashed rounded-lg text-center p-4">
            <p className="text-muted-foreground text-lg">No items match your criteria.</p>
            <p className="text-muted-foreground">Try selecting a different category or tag.</p>
        </div>
      )}
    </main>
  );
}
