import { cn } from '@/lib/utils';
import { Folder } from 'lucide-react';

type AppSidebarProps = {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  className?: string;
};

export default function AppSidebar({ categories, selectedCategory, onSelectCategory, className }: AppSidebarProps) {
  return (
    <aside className={cn("w-64 flex-shrink-0 bg-secondary/50 border-r p-4 flex flex-col", className)}>
      <h1 className="text-2xl font-headline font-bold text-primary mb-8">Digital Archive</h1>
      <nav className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground px-2 mb-2">Categories</h2>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
              selectedCategory === category
                ? 'bg-primary/20 text-primary font-semibold'
                : 'text-foreground/70 hover:bg-primary/10'
            )}
          >
            <Folder className="h-4 w-4" />
            {category}
          </button>
        ))}
      </nav>
    </aside>
  );
}
