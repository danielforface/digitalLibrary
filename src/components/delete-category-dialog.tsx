
'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CategoryNode } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { handleCategoryAction } from '@/app/actions';

type DeleteCategoryDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  categoryNode: CategoryNode | null;
  allCategoryPaths: string[];
};

type ActionType = 'move' | 'delete';

export default function DeleteCategoryDialog({ isOpen, onClose, categoryNode, allCategoryPaths }: DeleteCategoryDialogProps) {
  const [actionType, setActionType] = useState<ActionType>('move');
  const [migrationPath, setMigrationPath] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Reset state when dialog re-opens for a new category
    if (isOpen) {
      setActionType('move');
      setMigrationPath('');
    }
  }, [isOpen]);

  if (!categoryNode) return null;
  
  const categoryName = categoryNode.path.split('/').pop() || categoryNode.path;
  const potentialMigrationPaths = allCategoryPaths.filter(p => p !== categoryNode.path && !p.startsWith(`${categoryNode.path}/`));

  const handleSubmit = async () => {
    if (actionType === 'move' && !migrationPath && potentialMigrationPaths.length > 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a category to move items to.' });
        return;
    }

    setIsSubmitting(true);
    try {
        const result = await handleCategoryAction(
            categoryNode.path,
            actionType === 'move' ? migrationPath : undefined
        );
        
        if (actionType === 'move') {
            toast({ title: 'Success', description: `${result.moved} item(s) have been moved.` });
        } else {
            toast({ variant: 'destructive', title: 'Category Deleted', description: `${result.deleted} item(s) have been deleted.` });
        }
        onClose();
    } catch (error) {
        console.error("Error handling category action:", error);
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete category: "{categoryName}"</AlertDialogTitle>
          <AlertDialogDescription>
            This category and its subcategories contain {categoryNode.itemCount} item(s). What would you like to do with them?
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
            <RadioGroup value={actionType} onValueChange={(value) => setActionType(value as ActionType)}>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="move" id="move" />
                    <Label htmlFor="move">Move items to another category</Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delete" id="delete" />
                    <Label htmlFor="delete">Delete all items permanently</Label>
                </div>
            </RadioGroup>

            {actionType === 'move' && (
                <div className="pl-6 pt-2">
                    <Label htmlFor="migration-path">Move to:</Label>
                    {potentialMigrationPaths.length > 0 ? (
                        <Select onValueChange={setMigrationPath} value={migrationPath}>
                            <SelectTrigger id="migration-path" className="w-full mt-1">
                                <SelectValue placeholder="Select a destination" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">(Root Category)</SelectItem>
                                {potentialMigrationPaths.map(path => (
                                    <SelectItem key={path} value={path}>{path}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <p className="text-sm text-muted-foreground mt-2">No other categories available to move to.</p>
                    )}
                </div>
            )}
             {actionType === 'delete' && (
                <div className="pl-6 pt-2 flex items-start gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0"/>
                    <p className="text-sm">This action is irreversible. All items within "{categoryName}" and its subcategories will be permanently deleted.</p>
                </div>
            )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <Button onClick={handleSubmit} disabled={isSubmitting} variant={actionType === 'delete' ? 'destructive' : 'default'}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirm'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
