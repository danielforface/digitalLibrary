
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { ArchiveItem, CategoryNode } from '@/lib/types';
import AppSidebar from '@/components/app-sidebar';
import ArchiveView from '@/components/archive-view';
import ItemDialog from './item-dialog';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { getArchiveItems, createArchiveItem, updateArchiveItem, deleteArchiveItem, getCategoryPaths, addCategoryPath, deleteEmptyCategory, moveCategory, renameCategory } from '@/app/actions';
import MiniAudioPlayer from './mini-audio-player';
import DeleteCategoryDialog from './delete-category-dialog';
import DeleteItemDialog from './delete-item-dialog';
import MoveItemDialog from './move-item-dialog';
import AddCategoryDialog from './add-category-dialog';
import LoginDialog from './login-dialog';
import { login } from '@/app/auth-actions';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';
import MemorialDialog from './memorial-dialog';
import HealingDialog from './healing-dialog';
import MoveCategoryDialog from './move-category-dialog';
import EditCategoryDialog from './edit-category-dialog';

const AUTH_STORAGE_KEY = 'is_admin_authed';

function buildCategoryTree(items: ArchiveItem[], persistedPaths: string[]): CategoryNode {
  const root: CategoryNode = { name: 'Root', path: '', children: [], itemCount: 0 };
  
  const allCategoryPaths = [...new Set([...items.map(i => i.category), ...persistedPaths])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const nodes: Record<string, CategoryNode> = { '': root };

  allCategoryPaths.forEach(path => {
    let currentPath = '';
    path.split('/').forEach((part, index, parts) => {
        const parentPath = parts.slice(0, index).join('/');
        currentPath = currentPath ? `${currentPath}/${part}` : part;
      
        if (!nodes[currentPath]) {
            nodes[currentPath] = { name: part, path: currentPath, children: [], itemCount: 0 };
            const parentNode = nodes[parentPath];
            if (parentNode && !parentNode.children.some(child => child.path === currentPath)) {
                parentNode.children.push(nodes[currentPath]);
            }
        }
    });
  });

  items.forEach(item => {
    if (item.category && nodes[item.category]) {
      let currentNode = nodes[item.category];
      while(currentNode) {
        currentNode.itemCount++;
        if (currentNode.path === '') {
            break;
        }
        const parentPath = currentNode.path.substring(0, currentNode.path.lastIndexOf('/'));
        currentNode = nodes[parentPath];
      }
    } else {
        root.itemCount++;
    }
  });
  
  Object.values(nodes).forEach(node => {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
  });
  
  return root;
}


type DialogState = {
  open: boolean;
  mode: 'view' | 'edit' | 'new';
  item?: ArchiveItem;
};

type DigitalArchiveAppProps = {
  initialItems: ArchiveItem[];
  initialCategories: string[];
}

export default function DigitalArchiveApp({ initialItems, initialCategories }: DigitalArchiveAppProps) {
  const { t, dir } = useLanguage();
  const [items, setItems] = useState<ArchiveItem[]>(initialItems);
  const [persistedCategories, setPersistedCategories] = useState<string[]>(initialCategories);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<DialogState>({ open: false, mode: 'new' });
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<ArchiveItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryNode | null>(null);
  const [categoryToMove, setCategoryToMove] = useState<CategoryNode | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryNode | null>(null);
  const [itemToMove, setItemToMove] = useState<ArchiveItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ArchiveItem | null>(null);
  const [addCategoryParentPath, setAddCategoryParentPath] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void | Promise<void>) | null>(null);
  const [showMemorialDialog, setShowMemorialDialog] = useState(false);
  const [showHealingDialog, setShowHealingDialog] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const authStatus = localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    setIsAuthenticated(authStatus);
  }, []);

  const handleProtectedAction = useCallback((action: () => void | Promise<void>) => {
    if (isAuthenticated) {
        action();
    } else {
        setPendingAction(() => action);
        setShowLoginDialog(true);
    }
  }, [isAuthenticated]);

  const categoryTree = useMemo(() => buildCategoryTree(items, persistedCategories), [items, persistedCategories]);

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

  const { displayedSubCategories, displayedItems } = useMemo(() => {
    let subCategories: CategoryNode[] = [];
    let directItems: ArchiveItem[] = [];

    if (selectedCategory === 'All') {
        subCategories = categoryTree.children;
        directItems = items.filter(item => !item.category);
    } else {
        let selectedNode: CategoryNode | undefined;
        const findNode = (node: CategoryNode, path: string): CategoryNode | undefined => {
            if (node.path === path) return node;
            for (const child of node.children) {
                const found = findNode(child, path);
                if (found) return found;
            }
            return undefined;
        };
        selectedNode = findNode(categoryTree, selectedCategory);

        if (selectedNode) {
            subCategories = selectedNode.children;
        }
        directItems = items.filter(item => item.category === selectedCategory);
    }
    
    return { displayedSubCategories: subCategories, displayedItems: directItems };
  }, [items, selectedCategory, categoryTree]);
  
  const filteredAndTaggedItems = useMemo(() => {
      if (!selectedTag) {
          return displayedItems;
      }
      return displayedItems.filter(item => item.tags?.includes(selectedTag));
  }, [displayedItems, selectedTag]);

  const availableTags = useMemo(() => {
    const allTags = displayedItems.flatMap(item => item.tags || []);
    return [...new Set(allTags)].sort();
  }, [displayedItems]);


  const handleOpenDialog = (mode: 'new' | 'edit' | 'view', item?: ArchiveItem) => {
    setDialogState({ open: true, mode, item });
  };

  const handleViewItem = (item: ArchiveItem) => {
    if (item.type === 'audio' && item.url) {
      setNowPlaying(item);
    } else if (item.url && ['pdf', 'image', 'video'].includes(item.type)) {
      window.open(item.url, '_blank')?.focus();
    } else {
      handleOpenDialog('view', item);
    }
  };

  const handleCloseDialog = () => {
    setDialogState(prevState => ({ ...prevState, open: false }));
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    
    try {
      if (dialogState.mode === 'edit' && dialogState.item) {
        const updatedItem = await updateArchiveItem(dialogState.item.id, formData);
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === updatedItem.id ? updatedItem : item
          )
        );
        toast({ title: t('success'), description: t('item_updated') });
      } else {
        const newItem = await createArchiveItem(formData);
        setItems(prevItems => [newItem, ...prevItems]);
        toast({ title: t('success'), description: t('item_added') });
      }

      const category = formData.get('category') as string;
      if (category && !persistedCategories.includes(category)) {
        setPersistedCategories(prev => [...prev, category].sort());
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        variant: 'destructive',
        title: t('submission_error'),
        description: (error instanceof Error) ? error.message : t('unexpected_error'),
      });
    } finally {
        setIsSubmitting(false);
    }
  };


  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteArchiveItem(itemToDelete.id);
      setItems(prevItems => prevItems.filter(item => item.id !== itemToDelete!.id));
      toast({ title: t('item_deleted'), description: t('item_removed'), variant: 'destructive' });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: (error instanceof Error) ? error.message : t('could_not_delete_item'),
      });
    } finally {
      setItemToDelete(null);
      setTimeout(() => {
        const mainContent = document.getElementById('archive-view-container');
        mainContent?.focus({ preventScroll: true });
      }, 50);
    }
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setSelectedTag(null);
    setMobileMenuOpen(false);
  };

  const handleAddCategoryRequest = (parentPath: string) => {
     handleProtectedAction(() => setAddCategoryParentPath(parentPath));
  };

  const handleConfirmAddCategory = async (newCategoryName: string) => {
    if (addCategoryParentPath === null) return;

    if (newCategoryName.includes('/')) {
        toast({ variant: 'destructive', title: t('error'), description: t('category_name_no_slashes') });
        return;
    }
    
    const newPath = addCategoryParentPath ? `${addCategoryParentPath}/${newCategoryName}` : newCategoryName;

    if (allCategoryPaths.includes(newPath)) {
      toast({ variant: 'destructive', title: t('error'), description: t('category_already_exists') });
      return;
    }

    try {
      await addCategoryPath(newPath);
      setPersistedCategories(prev => [...prev, newPath].sort());
      toast({ title: t('category_added'), description: t('category_ready', { path: newPath })});
      setAddCategoryParentPath(null);
    } catch (error) {
      toast({ variant: 'destructive', title: t('error'), description: (error as Error).message });
    }
  };

  const handleCloseAddCategoryDialog = () => {
    setAddCategoryParentPath(null);
  };


  const handleDeleteCategoryRequest = (node: CategoryNode) => handleProtectedAction(() => {
    if (node.itemCount > 0) {
      setCategoryToDelete(node);
    } else {
        if(window.confirm(`Are you sure you want to delete the empty category "${node.path}"? This cannot be undone.`)) {
            deleteEmptyCategory(node.path).then(() => {
                setPersistedCategories(prev => prev.filter(p => p !== node.path && !p.startsWith(`${node.path}/`)));
                toast({ title: t('empty_category_removed') });
                if (selectedCategory.startsWith(node.path)) {
                    setSelectedCategory('All');
                }
            }).catch(error => {
                toast({ variant: 'destructive', title: t('error'), description: (error as Error).message });
            });
        }
    }
  });
  
  const handleCloseDeleteDialog = () => {
      const path = categoryToDelete?.path;
      setCategoryToDelete(null);
      if (path && (selectedCategory === path || selectedCategory.startsWith(`${path}/`))) {
          setSelectedCategory('All');
      }
  };

  const handleMoveItemRequest = (item: ArchiveItem) => {
    handleProtectedAction(() => setItemToMove(item));
  };

  const handleCloseMoveItemDialog = () => {
      setItemToMove(null);
  };
  
  const handleConfirmMoveItem = async (itemId: string, newCategory: string) => {
      const itemToMove = items.find(i => i.id === itemId);
      if (!itemToMove) {
          toast({ variant: 'destructive', title: t('error'), description: t('item_not_found') });
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
          
          toast({ title: t('success'), description: t('item_moved_to', { category: newCategory || t('root_category') }) });
          handleCloseMoveItemDialog();
      } catch (error) {
          console.error("Error moving item:", error);
          toast({
              variant: 'destructive',
              title: t('error'),
              description: (error instanceof Error) ? error.message : t('could_not_move_item'),
          });
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleMoveCategoryRequest = (node: CategoryNode) => {
    handleProtectedAction(() => setCategoryToMove(node));
  };
  
  const handleConfirmMoveCategory = async (sourcePath: string, destinationPath: string) => {
      setIsSubmitting(true);
      try {
          const result = await moveCategory(sourcePath, destinationPath);
          toast({
              title: t('success'),
              description: t('category_moved_success', { 
                count: result.movedItemsCount, 
                category: destinationPath || t('root_category') 
              })
          });
          
          const [newItemData, newCategoryData] = await Promise.all([
              getArchiveItems(),
              getCategoryPaths(),
          ]);
          setItems(newItemData);
          setPersistedCategories(newCategoryData);
  
          if (selectedCategory.startsWith(sourcePath)) {
              const sourceName = sourcePath.split('/').pop() || '';
              const newSelectedPath = [destinationPath, sourceName].filter(Boolean).join('/');
              const updatedPath = selectedCategory.replace(sourcePath, newSelectedPath);
              setSelectedCategory(updatedPath);
          }
  
      } catch (error) {
          toast({
              variant: 'destructive',
              title: t('error'),
              description: (error as Error).message,
          });
      } finally {
          setIsSubmitting(false);
          setCategoryToMove(null);
      }
  }

  const handleEditCategoryRequest = (node: CategoryNode) => {
    handleProtectedAction(() => setCategoryToEdit(node));
  };

  const handleConfirmEditCategory = async (newName: string) => {
    if (!categoryToEdit) return;
    setIsSubmitting(true);
    try {
      const { newPath } = await renameCategory(categoryToEdit.path, newName);
      
      const [newItemData, newCategoryData] = await Promise.all([
          getArchiveItems(),
          getCategoryPaths(),
      ]);
      setItems(newItemData);
      setPersistedCategories(newCategoryData);

      if (selectedCategory.startsWith(categoryToEdit.path)) {
        const updatedSelectedPath = selectedCategory.replace(categoryToEdit.path, newPath);
        setSelectedCategory(updatedSelectedPath);
      }
      
      toast({ title: t('success'), description: t('category_updated_success') });
      setCategoryToEdit(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: (error as Error).message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSuccess = () => {
    localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    setIsAuthenticated(true);
    setShowLoginDialog(false);
    toast({ title: t('success'), description: t('logged_in_success') });
    if (pendingAction) {
        pendingAction();
        setPendingAction(null);
    }
  };

  const handleLogout = () => {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setIsAuthenticated(false);
      toast({ title: t('logged_out'), description: t('view_only_mode')});
  }

  return (
    <div className={cn("flex h-screen bg-background")}>
      <AppSidebar
        className="hidden md:flex"
        categoryTree={categoryTree}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        onAddCategory={handleAddCategoryRequest}
        onMoveCategoryRequest={handleMoveCategoryRequest}
        onDeleteCategory={handleDeleteCategoryRequest}
        onEditCategory={handleEditCategoryRequest}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onMemorialClick={() => setShowMemorialDialog(true)}
        onHealingClick={() => setShowHealingDialog(true)}
      />
      
      <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className="p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Select a category to browse the archive.
          </SheetDescription>
          <AppSidebar
            categoryTree={categoryTree}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            onAddCategory={handleAddCategoryRequest}
            onMoveCategoryRequest={handleMoveCategoryRequest}
            onDeleteCategory={handleDeleteCategoryRequest}
            onEditCategory={handleEditCategoryRequest}
            isAuthenticated={isAuthenticated}
            onLogout={handleLogout}
            onMemorialClick={() => setShowMemorialDialog(true)}
            onHealingClick={() => setShowHealingDialog(true)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden">
        {nowPlaying && <MiniAudioPlayer item={nowPlaying} onClose={() => setNowPlaying(null)} />}
        <ArchiveView
          items={filteredAndTaggedItems}
          subCategories={displayedSubCategories}
          onUpload={() => handleProtectedAction(() => handleOpenDialog('new'))}
          onView={handleViewItem}
          onEdit={(item) => handleProtectedAction(() => handleOpenDialog('edit', item))}
          onMove={handleMoveItemRequest}
          onDeleteRequest={(item) => handleProtectedAction(() => setItemToDelete(item))}
          categoryTitle={selectedCategory}
          onMenuClick={() => setMobileMenuOpen(true)}
          availableTags={availableTags}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          onSelectCategory={handleSelectCategory}
          isAuthenticated={isAuthenticated}
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
       <DeleteItemDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        item={itemToDelete}
      />
      <MoveItemDialog
          isOpen={!!itemToMove}
          onClose={handleCloseMoveItemDialog}
          item={itemToMove}
          allCategoryPaths={allCategoryPaths}
          onConfirmMove={handleConfirmMoveItem}
          isSubmitting={isSubmitting}
      />
      <MoveCategoryDialog
        isOpen={!!categoryToMove}
        onClose={() => setCategoryToMove(null)}
        categoryNode={categoryToMove}
        allCategoryPaths={allCategoryPaths}
        onConfirmMove={handleConfirmMoveCategory}
        isSubmitting={isSubmitting}
      />
      <AddCategoryDialog
        isOpen={addCategoryParentPath !== null}
        onClose={handleCloseAddCategoryDialog}
        onConfirm={handleConfirmAddCategory}
        parentPath={addCategoryParentPath ?? ''}
      />
       <LoginDialog 
        isOpen={showLoginDialog}
        onClose={() => {
            setShowLoginDialog(false);
            setPendingAction(null);
        }}
        onSuccess={handleLoginSuccess}
       />
       <MemorialDialog 
        isOpen={showMemorialDialog}
        onClose={() => setShowMemorialDialog(false)}
        isAuthenticated={isAuthenticated}
       />
       <HealingDialog
        isOpen={showHealingDialog}
        onClose={() => setShowHealingDialog(false)}
        isAuthenticated={isAuthenticated}
        />
       <EditCategoryDialog
        isOpen={!!categoryToEdit}
        onClose={() => setCategoryToEdit(null)}
        onConfirm={handleConfirmEditCategory}
        categoryNode={categoryToEdit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
