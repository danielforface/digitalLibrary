import type { ArchiveItem } from '@/lib/types';
import ArchiveCard from './archive-card';
import { Button } from './ui/button';
import { Menu, Upload } from 'lucide-react';

type ArchiveViewProps = {
  items: ArchiveItem[];
  onUpload: () => void;
  onView: (item: ArchiveItem) => void;
  onEdit: (item: ArchiveItem) => void;
  onDelete: (itemId: string) => void;
  categoryTitle: string;
  onMenuClick: () => void;
};

export default function ArchiveView({ items, onUpload, onView, onEdit, onDelete, categoryTitle, onMenuClick }: ArchiveViewProps) {
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
            <p className="text-muted-foreground text-lg">No items in this category.</p>
            <p className="text-muted-foreground">Upload something to get started!</p>
        </div>
      )}
    </main>
  );
}
