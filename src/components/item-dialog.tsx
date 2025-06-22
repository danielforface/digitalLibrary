import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import type { ArchiveItem } from '@/lib/types';
import UploadForm, { type UploadFormData } from './upload-form';
import ItemViewer from './item-viewer';
import { cn } from '@/lib/utils';

type DialogState = {
  open: boolean;
  mode: 'view' | 'edit' | 'new';
  item?: ArchiveItem;
};

type ItemDialogProps = {
  dialogState: DialogState;
  onClose: () => void;
  onSubmit: (data: UploadFormData) => void;
  allCategories: string[];
};

export default function ItemDialog({ dialogState, onClose, onSubmit, allCategories }: ItemDialogProps) {
  const { open, mode, item } = dialogState;

  const isDocument = mode === 'view' && (item?.type === 'word');
  const title = mode === 'new' ? 'Upload Content' : mode === 'edit' ? 'Edit Item' : item?.title || 'View Item';
  const description = mode === 'new' ? 'Add a new file to your digital archive.' : mode === 'edit' ? 'Update the details for this item.' : item?.description || '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn(
        "w-[95vw] max-w-sm sm:max-w-xl md:max-w-3xl max-h-[90dvh] overflow-y-auto",
        isDocument && "md:max-w-4xl lg:max-w-6xl"
      )}>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {mode === 'view' && item ? (
          <ItemViewer item={item} />
        ) : (
          <UploadForm
            onSubmit={onSubmit}
            itemToEdit={mode === 'edit' ? item : undefined}
            allCategories={allCategories}
            onDone={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
