
import { Button } from './ui/button';
import { Plus, LogOut, BookOpenCheck, HeartPulse, Rows3, Check } from 'lucide-react';
import type { CategoryNode } from '@/lib/types';
import CategoryTreeItem from './category-tree-item';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import LanguageSwitcher from './language-switcher';
import MemorialCandleIcon from './memorial-candle-icon';

type AppSidebarProps = {
  categoryTree: CategoryNode;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onAddCategory: (parentPath: string) => void;
  onMoveCategoryRequest: (node: CategoryNode) => void;
  onDeleteCategory: (node: CategoryNode) => void;
  onEditCategory: (node: CategoryNode) => void;
  className?: string;
  isAuthenticated: boolean;
  onLogout: () => void;
  onMemorialClick: () => void;
  onHealingClick: () => void;
  isReorderMode: boolean;
  onToggleReorderMode: () => void;
  onReorderCategory: (path: string, direction: 'up' | 'down') => void;
};

export default function AppSidebar({
  categoryTree,
  selectedCategory,
  onSelectCategory,
  onAddCategory,
  onMoveCategoryRequest,
  onDeleteCategory,
  onEditCategory,
  className,
  isAuthenticated,
  onLogout,
  onMemorialClick,
  onHealingClick,
  isReorderMode,
  onToggleReorderMode,
  onReorderCategory
}: AppSidebarProps) {
  const { t, dir } = useLanguage();

  return (
    <aside className={cn("w-72 flex-shrink-0 bg-secondary/50 p-2 flex flex-col", className, dir === 'rtl' ? 'border-l' : 'border-r')}>
      <div className="p-2 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 justify-center">
          <BookOpenCheck className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-headline font-bold text-primary">{'אמרי נכוחים'}</h1>
        </div>
        <div className="flex items-center justify-center gap-4 mt-4">
            <Button variant="ghost" className="h-14 w-14 p-0" onClick={onMemorialClick} aria-label={t('memorial_candle')}>
                <MemorialCandleIcon />
            </Button>
            <Button variant="ghost" size="icon" onClick={onHealingClick} aria-label={t('healing_prayer')}>
                <HeartPulse className="h-6 w-6 text-destructive" />
            </Button>
        </div>
      </div>
      <div className="flex items-center justify-between px-2 py-1 mt-4">
        <h2 className="text-sm font-semibold text-muted-foreground">{t('categories')}</h2>
        {isAuthenticated && (
            <div className="flex items-center">
                 <Button variant={isReorderMode ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={onToggleReorderMode}>
                    {isReorderMode ? <Check className="h-4 w-4" /> : <Rows3 className="h-4 w-4" />}
                    <span className="sr-only">{isReorderMode ? t('done') : t('reorder')}</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddCategory('')}>
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">{t('add_root_category')}</span>
                </Button>
            </div>
        )}
      </div>
      <ScrollArea className="flex-1" type="auto">
        <div className="p-2 space-y-1 min-w-max">
            <button
                onClick={() => onSelectCategory('All')}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full',
                  dir === 'rtl' ? 'text-right flex-row-reverse' : 'text-left',
                  selectedCategory === 'All'
                      ? 'bg-primary/20 text-primary font-semibold'
                      : 'text-foreground/70 hover:bg-primary/10'
                )}
            >
                {t('all_items')}
            </button>

            {categoryTree.children.map((node, index) => (
                <CategoryTreeItem
                    key={node.path}
                    node={node}
                    selectedCategory={selectedCategory}
                    onSelectCategory={onSelectCategory}
                    onAddCategory={onAddCategory}
                    onMoveCategoryRequest={onMoveCategoryRequest}
                    onDeleteCategory={onDeleteCategory}
                    onEditCategory={onEditCategory}
                    isAuthenticated={isAuthenticated}
                    isReorderMode={isReorderMode}
                    onReorderCategory={onReorderCategory}
                    index={index}
                    siblingsCount={categoryTree.children.length}
                />
            ))}
        </div>
      </ScrollArea>
      <div className="mt-auto border-t border-border">
        <LanguageSwitcher />
        <div className="p-2 border-t border-border">
          {isAuthenticated && (
            <Button variant="ghost" className="w-full justify-start" onClick={onLogout}>
              <LogOut className={cn('h-4 w-4', dir === 'rtl' ? 'ml-2' : 'mr-2')} />
              <span>{t('logout')}</span>
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
