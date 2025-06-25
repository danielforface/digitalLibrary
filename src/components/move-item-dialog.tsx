
'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ArchiveItem } from '@/lib/types';
import { useLanguage } from '@/context/language-context';

type MoveItemDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  item: ArchiveItem | null;
  allCategoryPaths: string[];
  onConfirmMove: (itemId: string, newCategory: string) => void;
  isSubmitting: boolean;
};

export default function MoveItemDialog({ isOpen, onClose, item, allCategoryPaths, onConfirmMove, isSubmitting }: MoveItemDialogProps) {
  const { t } = useLanguage();
  const [newCategory, setNewCategory] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Reset state when dialog opens for a new item
    if (isOpen) {
      setNewCategory(undefined);
    }
  }, [isOpen]);

  if (!item) return null;

  const potentialMigrationPaths = allCategoryPaths.filter(p => p !== item.category);

  const handleSubmit = () => {
    if (newCategory !== undefined) {
        const finalNewCategory = newCategory === '__root__' ? '' : newCategory;
        onConfirmMove(item.id, finalNewCategory);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('move_item_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('move_item_desc', { title: item.title })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-2 py-4">
            <Label htmlFor="migration-path">{t('new_category')}</Label>
            <Select onValueChange={setNewCategory} value={newCategory}>
                <SelectTrigger id="migration-path" className="w-full mt-1">
                    <SelectValue placeholder={t('select_a_destination')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="__root__">{t('root_category')}</SelectItem>
                    {potentialMigrationPaths.map(path => (
                        <SelectItem key={path} value={path}>{path}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isSubmitting}>{t('cancel')}</AlertDialogCancel>
          <Button onClick={handleSubmit} disabled={isSubmitting || newCategory === undefined}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : t('move_item_btn')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
