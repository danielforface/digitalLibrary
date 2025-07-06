
'use client';

import { useState } from 'react';
import type { ArchiveItem, CategoryNode, FileType } from '@/lib/types';
import ArchiveCard from './archive-card';
import { Button } from './ui/button';
import { Menu, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';
import CategoryCard from './category-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

type ArchiveViewProps = {
  items: ArchiveItem[];
  subCategories: CategoryNode[];
  onUpload: () => void;
  onView: (item: ArchiveItem) => void;
  onEdit: (item: ArchiveItem) => void;
  onMove: (item: ArchiveItem) => void;
  onDeleteRequest: (item: ArchiveItem) => void;
  categoryTitle: string;
  onMenuClick: () => void;
  availableTags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  onSelectCategory: (category: string) => void;
  isAuthenticated: boolean;
  sortOption: string;
  onSortChange: (value: string) => void;
  typeFilter: FileType | 'all';
  onTypeFilterChange: (value: FileType | 'all') => void;
};

export default function ArchiveView({ 
  items, 
  subCategories, 
  onUpload, 
  onView, 
  onEdit, 
  onMove, 
  onDeleteRequest, 
  categoryTitle, 
  onMenuClick, 
  availableTags, 
  selectedTag, 
  onSelectTag, 
  onSelectCategory, 
  isAuthenticated,
  sortOption,
  onSortChange,
  typeFilter,
  onTypeFilterChange
}: ArchiveViewProps) {
  const { t, dir } = useLanguage();
  const [tagsExpanded, setTagsExpanded] = useState(false);

  const TAG_LIMIT = 5;
  const visibleTags = tagsExpanded ? availableTags : availableTags.slice(0, TAG_LIMIT);
  const displayTitle = categoryTitle === 'All' ? t('all_items') : categoryTitle.split('/').pop();

  return (
    <main id="archive-view-container" tabIndex={-1} className="flex-1 overflow-y-auto p-6 outline-none">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">{t('open_menu')}</span>
          </Button>
          <h2 className="text-3xl font-headline font-semibold">{displayTitle}</h2>
        </div>
        <Button onClick={onUpload}>
          <Upload className={cn('h-4 w-4', dir === 'rtl' ? 'ml-2' : 'mr-2')} />
          {isAuthenticated ? t('upload_content') : t('admin_login')}
        </Button>
      </header>

      <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 mb-6 p-4 border rounded-lg bg-secondary/30">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Label htmlFor="sort-select" className="flex-shrink-0">{t('sort_by')}:</Label>
          <Select value={sortOption} onValueChange={onSortChange}>
            <SelectTrigger id="sort-select" className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('sort_by')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt:desc">{t('newest')}</SelectItem>
              <SelectItem value="updatedAt:asc">{t('oldest')}</SelectItem>
              <SelectItem value="title:asc">{t('title_asc')}</SelectItem>
              <SelectItem value="title:desc">{t('title_desc')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Label htmlFor="type-filter-select" className="flex-shrink-0">{t('filter_by_type')}:</Label>
          <Select value={typeFilter} onValueChange={(value) => onTypeFilterChange(value as FileType | 'all')}>
            <SelectTrigger id="type-filter-select" className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('filter_by_type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all_types')}</SelectItem>
              <SelectItem value="text">{t('text')}</SelectItem>
              <SelectItem value="image">{t('image')}</SelectItem>
              <SelectItem value="audio">{t('audio')}</SelectItem>
              <SelectItem value="video">{t('video')}</SelectItem>
              <SelectItem value="pdf">{t('pdf')}</SelectItem>
              <SelectItem value="word">{t('word')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
              {t('all_tags')}
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
                {tagsExpanded ? t('show_less') : t('show_more', {count: availableTags.length - TAG_LIMIT})}
                {tagsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      )}
      
      {subCategories.length > 0 || items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {subCategories.map((node) => (
            <CategoryCard
              key={node.path}
              node={node}
              onSelectCategory={onSelectCategory}
            />
          ))}
          {items.map((item, index) => (
            <ArchiveCard
              key={item.id}
              item={item}
              onView={() => onView(item)}
              onEdit={() => onEdit(item)}
              onMove={() => onMove(item)}
              onDeleteRequest={() => onDeleteRequest(item)}
              isAuthenticated={isAuthenticated}
              isPriority={index < 5}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[60vh] border-2 border-dashed rounded-lg text-center p-4">
            <p className="text-muted-foreground text-lg">{t('no_items_found')}</p>
            <p className="text-muted-foreground">{t('no_items_found_desc')}</p>
        </div>
      )}
    </main>
  );
}
