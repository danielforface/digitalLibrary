"use client";

import { useState, useMemo } from 'react';
import { initialData } from '@/lib/data';
import type { ArchiveItem } from '@/lib/types';
import AppSidebar from '@/components/app-sidebar';
import ArchiveView from '@/components/archive-view';
import ItemDialog from './item-dialog';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent } from '@/components/ui/sheet';

type DialogState = {
  open: boolean;
  mode: 'view' | 'edit' | 'new';
  item?: ArchiveItem;
};

export default function DigitalArchiveApp() {
  const [items, setItems] = useState<ArchiveItem[]>(initialData);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dialogState, setDialogState] = useState<DialogState>({ open: false, mode: 'new' });
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  const categories = useMemo(() => ['All', ...new Set(items.map(item => item.category))], [items]);
  
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return items;
    return items.filter(item => item.category === selectedCategory);
  }, [items, selectedCategory]);

  const handleOpenDialog = (mode: 'new' | 'edit' | 'view', item?: ArchiveItem) => {
    setDialogState({ open: true, mode, item });
  };

  const handleCloseDialog = () => {
    setDialogState(prevState => ({ ...prevState, open: false }));
  };

  const handleSubmit = (itemData: Omit<ArchiveItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (dialogState.mode === 'new') {
      const newItem: ArchiveItem = {
        ...itemData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setItems(prevItems => [newItem, ...prevItems]);
      toast({ title: "Success", description: "Item added to your archive." });
    } else if (dialogState.mode === 'edit' && dialogState.item) {
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === dialogState.item!.id
            ? { ...item, ...itemData, updatedAt: new Date().toISOString() }
            : item
        )
      );
      toast({ title: "Success", description: "Item updated." });
    }
    handleCloseDialog();
  };

  const handleDelete = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    toast({ title: "Item Deleted", description: "The item has been removed from your archive.", variant: 'destructive' });
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar
        className="hidden md:flex"
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      
      <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0">
          <AppSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ArchiveView
          items={filteredItems}
          onUpload={() => handleOpenDialog('new')}
          onView={(item) => handleOpenDialog('view', item)}
          onEdit={(item) => handleOpenDialog('edit', item)}
          onDelete={handleDelete}
          categoryTitle={selectedCategory}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
      </div>
      <ItemDialog
        dialogState={dialogState}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        allCategories={categories.filter(c => c !== 'All')}
      />
    </div>
  );
}
