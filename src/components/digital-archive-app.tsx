"use client";

import { useState, useMemo, useEffect } from 'react';
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
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<DialogState>({ open: false, mode: 'new' });
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/archive');
        if (!response.ok) {
          throw new Error('Failed to fetch archive items');
        }
        const data: ArchiveItem[] = await response.json();
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

  const handleCloseDialog = () => {
    setDialogState(prevState => ({ ...prevState, open: false }));
  };

  const handleSubmit = async (formData: UploadFormData) => {
    const apiFormData = new FormData();
    // Use Object.entries to iterate over form data and append to FormData
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
      let response;
      let url = '/api/archive';
      let method = 'POST';

      if (dialogState.mode === 'edit' && dialogState.item) {
        url = `/api/archive/${dialogState.item.id}`;
        method = 'PUT';
      }

      response = await fetch(url, { method, body: apiFormData });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server responded with ${response.status}`);
      }

      const resultItem: ArchiveItem = await response.json();

      if (dialogState.mode === 'new') {
        setItems(prevItems => [resultItem, ...prevItems]);
        toast({ title: "Success", description: "Item added to your archive." });
      } else { // edit mode
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === resultItem.id ? resultItem : item
          )
        );
        toast({ title: "Success", description: "Item updated." });
      }
      handleCloseDialog();

    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        variant: 'destructive',
        title: 'Upload Error',
        description: (error as Error).message || 'Could not save the item.',
      });
    }
  };


  const handleDelete = async (itemId: string) => {
    try {
      const response = await fetch(`/api/archive/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete the item.');
      }
      
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
      toast({ title: "Item Deleted", description: "The item has been removed from your archive.", variant: 'destructive' });

    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not delete the item.',
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
