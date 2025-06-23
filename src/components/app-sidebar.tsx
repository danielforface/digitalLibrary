import { Button } from './ui/button';
import { Plus, LogOut } from 'lucide-react';
import type { CategoryNode } from '@/lib/types';
import CategoryTreeItem from './category-tree-item';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';

type AppSidebarProps = {
  categoryTree: CategoryNode;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onAddCategory: (parentPath: string) => void;
  onDeleteCategory: (node: CategoryNode) => void;
  className?: string;
  isAuthenticated: boolean;
  onLogout: () => void;
};

export default function AppSidebar({
  categoryTree,
  selectedCategory,
  onSelectCategory,
  onAddCategory,
  onDeleteCategory,
  className,
  isAuthenticated,
  onLogout
}: AppSidebarProps) {
  return (
    <aside className={cn("w-72 flex-shrink-0 bg-secondary/50 border-r p-2 flex flex-col", className)}>
      <div className="p-2">
        <h1 className="text-2xl font-headline font-bold text-primary">Digital Archive</h1>
      </div>
      <div className="flex items-center justify-between px-2 py-1">
        <h2 className="text-sm font-semibold text-muted-foreground">Categories</h2>
        {isAuthenticated && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddCategory('')}>
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add Root Category</span>
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
            <button
                onClick={() => onSelectCategory('All')}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors w-full ${
                selectedCategory === 'All'
                    ? 'bg-primary/20 text-primary font-semibold'
                    : 'text-foreground/70 hover:bg-primary/10'
                }`}
            >
                All Items
            </button>

            {categoryTree.children.map((node) => (
                <CategoryTreeItem
                    key={node.path}
                    node={node}
                    selectedCategory={selectedCategory}
                    onSelectCategory={onSelectCategory}
                    onAddCategory={onAddCategory}
                    onDeleteCategory={onDeleteCategory}
                    isAuthenticated={isAuthenticated}
                />
            ))}
        </div>
      </ScrollArea>
      <div className="mt-auto p-2 border-t border-border">
        {isAuthenticated && (
          <Button variant="ghost" className="w-full justify-start" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </Button>
        )}
      </div>
    </aside>
  );
}
