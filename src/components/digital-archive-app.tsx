
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { ArchiveItem } from '@/lib/types';
import AppSidebar from '@/components/app-sidebar';
import ArchiveView from '@/components/archive-view';
import ItemDialog from './item-dialog';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { UploadFormData } from './upload-form';
import { getArchiveItems, createArchiveItem, updateArchiveItem, deleteArchiveItem } from '@/app/actions';

type DialogState = {
  open: boolean;
  mode: 'view' | 'edit' | 'new';
  item?: ArchiveItem;
};

export default function DigitalArchiveApp() {
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<DialogState>({ open: false, mode: 'new' });
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        const data = await getArchiveItems();
        setItems(data);
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load archive data.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, [toast]);

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

  const handleViewItem = (item: ArchiveItem) => {
    if (item.type === 'pdf' && item.url) {
      window.open(item.url, '_blank')?.focus();
    } else {
      handleOpenDialog('view', item);
    }
  };

  const handleCloseDialog = () => {
    setDialogState(prevState => ({ ...prevState, open: false }));
  };

  const handleSubmit = async (formData: UploadFormData) => {
    setIsSubmitting(true);
    const apiFormData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'file') {
        if (value instanceof FileList && value.length > 0) {
          apiFormData.append('file', value[0]);
        }
      } else if (value !== undefined && value !== null) {
        apiFormData.append(key, String(value));
      }
    });

    try {
      if (dialogState.mode === 'edit' && dialogState.item) {
        const updatedItem = await updateArchiveItem(dialogState.item.id, apiFormData);
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === updatedItem.id ? updatedItem : item
          )
        );
        toast({ title: "Success", description: "Item updated." });
      } else {
        const newItem = await createArchiveItem(apiFormData);
        setItems(prevItems => [newItem, ...prevItems]);
        toast({ title: "Success", description: "Item added to your archive." });
      }

      handleCloseDialog();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        variant: 'destructive',
        title: 'Submission Error',
        description: (error instanceof Error) ? error.message : 'An unknown error occurred.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };


  const handleDelete = async (itemId: string) => {
    try {
      await deleteArchiveItem(itemId);
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
      toast({ title: "Item Deleted", description: "The item has been removed from your archive.", variant: 'destructive' });

    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error instanceof Error) ? error.message : 'Could not delete the item.',
      });
    }
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
          onView={handleViewItem}
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
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
