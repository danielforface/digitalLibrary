
'use client';

import { useState, useEffect } from 'react';
import { Folder, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryNode } from '@/lib/types';
import { Button } from './ui/button';
import { useLanguage } from '@/context/language-context';

type CategoryTreeItemProps = {
  node: CategoryNode;
  selectedCategory: string;
  onSelectCategory: (path: string) => void;
  onAddCategory: (parentPath: string) => void;
  onDeleteCategory: (node: CategoryNode) => void;
  level?: number;
  isAuthenticated: boolean;
};

export default function CategoryTreeItem({
  node,
  selectedCategory,
  onSelectCategory,
  onAddCategory,
  onDeleteCategory,
  level = 0,
  isAuthenticated,
}: CategoryTreeItemProps) {
  const { t, dir } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Expand if it's a parent of the selected category or the category itself
    if (selectedCategory.startsWith(node.path)) {
      setIsExpanded(true);
    }
  }, [selectedCategory, node.path]);


  const hasChildren = node.children.length > 0;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectCategory(node.path);
  }

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }
  
  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddCategory(node.path);
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteCategory(node);
  }


  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-md text-sm font-medium transition-colors w-full',
          selectedCategory === node.path ? 'bg-primary/20' : 'hover:bg-primary/10'
        )}
        style={{ paddingInlineStart: `${level * 0.75}rem` }}
      >
        {hasChildren ? (
          <button
            onClick={handleToggleExpand}
            className="p-1 rounded-sm hover:bg-primary/20"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <ChevronRight
              className={cn(
                  'h-4 w-4 shrink-0 transition-transform duration-200', 
                  isExpanded && 'rotate-90',
                  dir === 'rtl' && '-scale-x-100'
                )}
            />
          </button>
        ) : (
          <div className="w-6 shrink-0" /> // Placeholder for alignment
        )}
        
        <button
          onClick={handleSelect}
          className={cn(
            'flex flex-1 items-center gap-2 py-2 truncate',
            dir === 'rtl' ? 'text-right flex-row-reverse' : 'text-left',
            selectedCategory === node.path ? 'text-primary font-semibold' : 'text-foreground/80'
          )}
        >
          <Folder className="h-4 w-4 shrink-0" />
          <span className="truncate">{node.name}</span>
        </button>
        
        {isAuthenticated && (
            <div className={cn("opacity-0 group-hover:opacity-100 transition-opacity flex items-center shrink-0", dir === 'rtl' ? 'pl-2' : 'pr-2')}>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleAdd} aria-label={t('add_subcategory_to', {name: node.name})}>
                    <Plus className="h-4 w-4"/>
                </Button>
                {node.path && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/70 hover:text-destructive" onClick={handleDelete} aria-label={t('delete_category', {name: node.name})}>
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                )}
            </div>
        )}
      </div>
      {isExpanded && hasChildren && (
        <div className="mt-1">
          {node.children.map((child) => (
            <CategoryTreeItem
              key={child.path}
              node={child}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
              onAddCategory={onAddCategory}
              onDeleteCategory={onDeleteCategory}
              level={level + 1}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
