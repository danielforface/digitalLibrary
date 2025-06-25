
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

type AddCategoryDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (categoryName: string) => void;
  parentPath: string;
};

export default function AddCategoryDialog({ isOpen, onClose, onConfirm, parentPath }: AddCategoryDialogProps) {
  const { t } = useLanguage();
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCategoryName('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (categoryName.trim()) {
      onConfirm(categoryName.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const parentDisplayName = parentPath === '' ? t('root_category') : parentPath.split('/').pop();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('add_new_category')}</DialogTitle>
          <DialogDescription>
            {t('add_category_desc', { parentName: parentDisplayName })}
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
          <Button variant="ghost" onClick={onClose}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!categoryName.trim()}>
            {t('add_category')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
