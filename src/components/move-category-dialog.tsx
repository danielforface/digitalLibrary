
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
import type { CategoryNode } from '@/lib/types';
import { useLanguage } from '@/context/language-context';

type MoveCategoryDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  categoryNode: CategoryNode | null;
  allCategoryPaths: string[];
  onConfirmMove: (sourcePath: string, destinationPath: string) => void;
  isSubmitting: boolean;
};

export default function MoveCategoryDialog({ isOpen, onClose, categoryNode, allCategoryPaths, onConfirmMove, isSubmitting }: MoveCategoryDialogProps) {
  const { t } = useLanguage();
  const [destinationPath, setDestinationPath] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      setDestinationPath(undefined);
    }
  }, [isOpen]);

  if (!categoryNode) return null;

  const potentialMigrationPaths = allCategoryPaths.filter(p => 
    p !== categoryNode.path && !p.startsWith(`${categoryNode.path}/`)
  );

  const handleSubmit = () => {
    if (destinationPath !== undefined) {
        const finalDestinationPath = destinationPath === '__root__' ? '' : destinationPath;
        onConfirmMove(categoryNode.path, finalDestinationPath);
    }
  };
  
  const categoryName = categoryNode.path.split('/').pop() || categoryNode.path;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('move_category_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('move_category_desc', { categoryName: categoryName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-2 py-4">
            <Label htmlFor="migration-path">{t('move_to')}</Label>
            <Select onValueChange={setDestinationPath} value={destinationPath}>
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
          <Button onClick={handleSubmit} disabled={isSubmitting || destinationPath === undefined}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : t('move_category_btn')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
