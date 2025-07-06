
'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/context/language-context';
import type { CategoryNode } from '@/lib/types';
import { Loader2 } from 'lucide-react';

type EditCategoryDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  categoryNode: CategoryNode | null;
  isSubmitting: boolean;
};

export default function EditCategoryDialog({ isOpen, onClose, onConfirm, categoryNode, isSubmitting }: EditCategoryDialogProps) {
  const { t } = useLanguage();
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    if (isOpen && categoryNode) {
      setCategoryName(categoryNode.name);
    }
  }, [isOpen, categoryNode]);

  const handleSubmit = () => {
    if (categoryName.trim() && categoryName.trim() !== categoryNode?.name) {
      onConfirm(categoryName.trim());
    } else {
        onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };
  
  if (!categoryNode) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('edit_category_title')}</DialogTitle>
          <DialogDescription>
            {t('edit_category_desc', { categoryName: categoryNode.name })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 py-4">
            <Label htmlFor="category-name">{t('category_name')}</Label>
            <Input 
              id="category-name" 
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('category_name_placeholder')}
              autoFocus
            />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !categoryName.trim() || categoryName.trim() === categoryNode.name}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('save_changes')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
