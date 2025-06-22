"use client";

import { useState, useMemo } from 'react';
import { initialData } from '@/lib/data';
import type { ArchiveItem } from '@/lib/types';
import AppSidebar from '@/components/app-sidebar';
import ArchiveView from '@/components/archive-view';
import ItemDialog from './item-dialog';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import type { UploadFormData } from './upload-form';

type DialogState = {
  open: boolean;
  mode: 'view' | 'edit' | 'new';
  item?: ArchiveItem;
};

export default function DigitalArchiveApp() {
  const [items, setItems] = useState<ArchiveItem[]>(initialData);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<DialogState>({ open: false, mode: 'new' });
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  const categories = useMemo(() => ['All', ...new Set(items.map(item => item.category))], [items]);
  
  const availableTags = useMemo(() => {
    const itemsInCategory = selectedCategory === 'All'
      ? items
      : items.filter(item => item.category === selectedCategory);
    
    const allTags = itemsInCategory.flatMap(item => item.tags || []);
    return [...new Set(allTags)];
  }, [items, selectedCategory]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedCategory !== 'All') {
      result = result.filter(item => item.category === selectedCategory);
    }
    if (selectedTag) {
      result = result.filter(item => item.tags?.includes(selectedTag));
    }
    return result;
  }, [items, selectedCategory, selectedTag]);

  const handleOpenDialog = (mode: 'new' | 'edit' | 'view', item?: ArchiveItem) => {
    setDialogState({ open: true, mode, item });
  };

  const handleCloseDialog = () => {
    setDialogState(prevState => ({ ...prevState, open: false }));
  };

  const handleSubmit = async (formData: UploadFormData) => {
    const { tags: tagsString, file, ...itemData } = formData;
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    let itemUrl = dialogState.mode === 'edit' ? dialogState.item?.url : undefined;

    if (file && file.length > 0) {
      const uploadedFile = file[0];
      try {
        itemUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target?.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(uploadedFile);
        });
      } catch (error) {
        console.error("Error reading file:", error);
        toast({
          variant: 'destructive',
          title: 'File Read Error',
          description: 'Could not read the selected file.',
        });
        return;
      }
    }

    if (dialogState.mode === 'new') {
      const newItem: ArchiveItem = {
        ...itemData,
        tags,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: itemUrl,
      };
      setItems(prevItems => [newItem, ...prevItems]);
      toast({ title: "Success", description: "Item added to your archive." });
    } else if (dialogState.mode === 'edit' && dialogState.item) {
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === dialogState.item!.id
            ? { ...item, ...itemData, tags, url: itemUrl, updatedAt: new Date().toISOString() }
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
    setSelectedTag(null);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar
        className="hidden md:flex"
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />
      
      <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Select a category to browse the archive.
          </SheetDescription>
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
          availableTags={availableTags}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
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
