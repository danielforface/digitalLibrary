
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { ArchiveItem, CategoryNode } from '@/lib/types';
import AppSidebar from '@/components/app-sidebar';
import ArchiveView from '@/components/archive-view';
import ItemDialog from './item-dialog';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { UploadFormData } from './upload-form';
import { getArchiveItems, createArchiveItem, updateArchiveItem, deleteArchiveItem } from '@/app/actions';
import MiniAudioPlayer from './mini-audio-player';
import DeleteCategoryDialog from './delete-category-dialog';
import MoveItemDialog from './move-item-dialog';

function buildCategoryTree(items: ArchiveItem[], extraCategoryPaths: string[]): CategoryNode {
  const root: CategoryNode = { name: 'Root', path: '', children: [], itemCount: 0 };
  const allPaths = [...new Set([...items.map(i => i.category), ...extraCategoryPaths])].filter(Boolean);
  
  const nodes: Record<string, CategoryNode> = { '': root };

  allPaths.sort().forEach(path => {
    path.split('/').reduce((parentPath, part) => {
      const currentPath = parentPath ? `${parentPath}/${part}` : part;
      if (!nodes[currentPath]) {
        nodes[currentPath] = { name: part, path: currentPath, children: [], itemCount: 0 };
      }
      return currentPath;
    }, '');
  });

  Object.values(nodes).forEach(node => {
    if (node.path) {
      const parts = node.path.split('/');
      parts.pop();
      const parentPath = parts.join('/');
      if (nodes[parentPath] && !nodes[parentPath].children.some(child => child.path === node.path)) {
        nodes[parentPath].children.push(node);
      }
    }
  });

  items.forEach(item => {
    if (item.category && nodes[item.category]) {
      nodes[item.category].itemCount++;
    }
  });

  function sumCounts(node: CategoryNode): number {
    const childCounts = node.children.reduce((sum, child) => sum + sumCounts(child), 0);
    node.itemCount += childCounts;
    return node.itemCount;
  }

  sumCounts(root);
  return root;
}


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
  const [nowPlaying, setNowPlaying] = useState<ArchiveItem | null>(null);
  const [extraCategories, setExtraCategories] = useState<string[]>([]);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryNode | null>(null);
  const [itemToMove, setItemToMove] = useState<ArchiveItem | null>(null);
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

  const categoryTree = useMemo(() => buildCategoryTree(items, extraCategories), [items, extraCategories]);

  const allCategoryPaths = useMemo(() => {
    const paths = new Set<string>();
    const traverse = (node: CategoryNode) => {
      if (node.path) paths.add(node.path);
      node.children.forEach(traverse);
    };
    traverse(categoryTree);
    return Array.from(paths).sort();
  }, [categoryTree]);

  const categories = useMemo(() => ['All', ...allCategoryPaths], [allCategoryPaths]);

  const filteredItems = useMemo(() => {
    let categoryFiltered = items;
    if (selectedCategory !== 'All') {
        categoryFiltered = items.filter(item => 
            item.category === selectedCategory || item.category.startsWith(`${selectedCategory}/`)
        );
    }
    if (!selectedTag) {
        return categoryFiltered;
    }
    return categoryFiltered.filter(item => item.tags?.includes(selectedTag));
  }, [items, selectedCategory, selectedTag]);
  
  const availableTags = useMemo(() => {
    const categoryFiltered = (selectedCategory === 'All') 
        ? items 
        : items.filter(item => item.category === selectedCategory || item.category.startsWith(`${selectedCategory}/`));
    const allTags = categoryFiltered.flatMap(item => item.tags || []);
    return [...new Set(allTags)].sort();
  }, [items, selectedCategory]);


  const handleOpenDialog = (mode: 'new' | 'edit' | 'view', item?: ArchiveItem) => {
    setDialogState({ open: true, mode, item });
  };

  const handleViewItem = (item: ArchiveItem) => {
    if (item.type === 'audio' && item.url) {
      setNowPlaying(item);
    } else if ((item.type === 'pdf' || item.type === 'image' || item.type === 'video') && item.url) {
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
      // Remove from extra categories if it was one
      if (formData.category) {
        setExtraCategories(prev => prev.filter(p => p !== formData.category));
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

  const handleAddCategory = (parentPath: string) => {
    const newCategoryName = window.prompt(`Enter name for new category inside "${parentPath || 'Root'}":`);
    if (newCategoryName && !newCategoryName.includes('/')) {
      const newPath = parentPath ? `${parentPath}/${newCategoryName}` : newCategoryName;
      if (allCategoryPaths.includes(newPath)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Category already exists.' });
        return;
      }
      setExtraCategories(prev => [...prev, newPath]);
      toast({ title: 'Category Added', description: `"${newPath}" is ready to be used.`});
    } else if (newCategoryName) {
        toast({ variant: 'destructive', title: 'Error', description: 'Category name cannot contain slashes.' });
    }
  };

  const handleDeleteCategoryRequest = (node: CategoryNode) => {
    // For categories with items, open the dialog.
    if (node.itemCount > 0) {
      setCategoryToDelete(node);
    } else {
        // For empty categories, confirm and remove from state.
        if(window.confirm(`Are you sure you want to delete the empty category "${node.path}"?`)) {
            setExtraCategories(prev => prev.filter(p => p !== node.path && !p.startsWith(`${node.path}/`)));
            toast({ title: 'Empty category removed.' });
            if (selectedCategory === node.path) {
                setSelectedCategory('All');
            }
        }
    }
  };
  
  const handleCloseDeleteDialog = () => {
      const path = categoryToDelete?.path;
      setCategoryToDelete(null);
      // After action, we may need to remove from extraCategories if it's now empty.
      if (path) {
          const isCategoryEmpty = !items.some(item => item.category.startsWith(path));
          if(isCategoryEmpty) {
            setExtraCategories(prev => prev.filter(p => p !== path && !p.startsWith(`${path}/`)));
          }
      }
      setSelectedCategory('All'); // Reselect All to be safe
  };

  const handleMoveRequest = (item: ArchiveItem) => {
    setItemToMove(item);
  };

  const handleCloseMoveDialog = () => {
      setItemToMove(null);
  };
  
  const handleConfirmMove = async (itemId: string, newCategory: string) => {
      const itemToMove = items.find(i => i.id === itemId);
      if (!itemToMove) {
          toast({ variant: 'destructive', title: 'Error', description: 'Item not found.' });
          return;
      }

      setIsSubmitting(true);
      try {
          const formData = new FormData();
          formData.append('title', itemToMove.title);
          formData.append('category', newCategory);
          formData.append('description', itemToMove.description);
          formData.append('type', itemToMove.type);
          formData.append('tags', itemToMove.tags?.join(', ') || '');
          if (itemToMove.content) {
              formData.append('content', itemToMove.content);
          }
          
          const updatedItem = await updateArchiveItem(itemId, formData);
          
          setItems(prevItems =>
            prevItems.map(item =>
              item.id === updatedItem.id ? updatedItem : item
            )
          );
          
          toast({ title: "Success", description: `Item moved to "${newCategory || 'Root'}".` });
          handleCloseMoveDialog();
      } catch (error) {
          console.error("Error moving item:", error);
          toast({
              variant: 'destructive',
              title: 'Error',
              description: (error instanceof Error) ? error.message : 'Could not move the item.',
          });
      } finally {
          setIsSubmitting(false);
      }
  };


  return (
    <div className="flex h-screen bg-background">
      <AppSidebar
        className="hidden md:flex"
        categoryTree={categoryTree}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategoryRequest}
      />
      
      <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Select a category to browse the archive.
          </SheetDescription>
          <AppSidebar
            categoryTree={categoryTree}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategoryRequest}
          />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden">
        {nowPlaying && <MiniAudioPlayer item={nowPlaying} onClose={() => setNowPlaying(null)} />}
        <ArchiveView
          items={filteredItems}
          onUpload={() => handleOpenDialog('new')}
          onView={handleViewItem}
          onEdit={(item) => handleOpenDialog('edit', item)}
          onMove={handleMoveRequest}
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
      <DeleteCategoryDialog
        isOpen={!!categoryToDelete}
        onClose={handleCloseDeleteDialog}
        categoryNode={categoryToDelete}
        allCategoryPaths={allCategoryPaths}
      />
      <MoveItemDialog
          isOpen={!!itemToMove}
          onClose={handleCloseMoveDialog}
          item={itemToMove}
          allCategoryPaths={allCategoryPaths}
          onConfirmMove={handleConfirmMove}
          isSubmitting={isSubmitting}
      />
    </div>
  );
}
