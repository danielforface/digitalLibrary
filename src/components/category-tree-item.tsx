
'use client';

import { useState, useEffect } from 'react';
import { Folder, ChevronRight, Plus, Trash2, MoreVertical, Move, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryNode } from '@/lib/types';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/context/language-context';

type CategoryTreeItemProps = {
  node: CategoryNode;
  selectedCategory: string;
  onSelectCategory: (path: string) => void;
  onAddCategory: (parentPath: string) => void;
  onMoveCategoryRequest: (node: CategoryNode) => void;
  onDeleteCategory: (node: CategoryNode) => void;
  onEditCategory: (node: CategoryNode) => void;
  level?: number;
  isAuthenticated: boolean;
};

export default function CategoryTreeItem({
  node,
  selectedCategory,
  onSelectCategory,
  onAddCategory,
  onMoveCategoryRequest,
  onDeleteCategory,
  onEditCategory,
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

  const handleMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveCategoryRequest(node);
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteCategory(node);
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditCategory(node);
  }


  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-md text-sm font-medium transition-colors w-full',
          dir === 'rtl' && 'flex-row-reverse',
          selectedCategory === node.path ? 'bg-primary/20' : 'hover:bg-primary/10'
        )}
        style={dir === 'rtl' 
            ? { paddingRight: `${level * 1.25}rem` } 
            : { paddingLeft: `${level * 1.25}rem` }
        }
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
            <div className={cn("opacity-0 group-hover:opacity-100 transition-opacity flex items-center shrink-0 pr-1", dir === 'rtl' && 'pl-1 pr-0')}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">{t('more_options')}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={handleAdd}>
                            <Plus className={cn('h-4 w-4', dir === 'rtl' ? 'ml-2' : 'mr-2')} />
                            <span>{t('add_subcategory')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleEdit}>
                            <Edit className={cn('h-4 w-4', dir === 'rtl' ? 'ml-2' : 'mr-2')} />
                            <span>{t('edit_category_btn')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleMove}>
                            <Move className={cn('h-4 w-4', dir === 'rtl' ? 'ml-2' : 'mr-2')} />
                            <span>{t('move_category_btn')}</span>
                        </DropdownMenuItem>
                        {node.path && (
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className={cn('h-4 w-4', dir === 'rtl' ? 'ml-2' : 'mr-2')} />
                                <span>{t('delete_category_btn')}</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
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
              onMoveCategoryRequest={onMoveCategoryRequest}
              onDeleteCategory={onDeleteCategory}
              onEditCategory={onEditCategory}
              level={level + 1}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
