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

type AddCategoryDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (categoryName: string) => void;
  parentPath: string;
};

export default function AddCategoryDialog({ isOpen, onClose, onConfirm, parentPath }: AddCategoryDialogProps) {
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

  const parentDisplayName = parentPath === '' ? 'Root' : parentPath.split('/').pop();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Enter a name for the new category inside "{parentDisplayName}".
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 py-4">
            <Label htmlFor="category-name">Category Name:</Label>
            <Input 
              id="category-name" 
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Projects"
              autoFocus
            />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!categoryName.trim()}>
            Add Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
