
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
import { useLanguage } from '@/context/language-context';

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
  isSubmitting: boolean;
};

export default function ItemDialog({ dialogState, onClose, onSubmit, allCategories, isSubmitting }: ItemDialogProps) {
  const { t } = useLanguage();
  const { open, mode, item } = dialogState;

  const isViewMode = mode === 'view' && item;
  const isTextDocument = isViewMode && item.type === 'text';
  const isWordDocument = isViewMode && item.type === 'word';
  const isFullHeightDocument = isTextDocument || isWordDocument;
  
  const title = mode === 'new' 
    ? t('upload_content_title') 
    : mode === 'edit' 
    ? t('edit_item_title') 
    : item?.title || t('view_item_title');
    
  const description = mode === 'new' 
    ? t('add_new_file_desc')
    : mode === 'edit' 
    ? t('update_item_desc')
    : item?.description || '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn(
        "w-[95vw] max-w-sm sm:max-w-xl md:max-w-3xl max-h-[90dvh]",
        isFullHeightDocument ? 'flex flex-col' : 'overflow-y-auto',
        isFullHeightDocument && "md:max-w-4xl lg:max-w-6xl"
      )}>
        <DialogHeader className={cn(isFullHeightDocument && "flex-shrink-0")}>
          <DialogTitle className="font-headline text-2xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {mode === 'view' && item ? (
           <div className={cn(isFullHeightDocument && 'flex-grow min-h-0')}>
            <ItemViewer item={item} />
          </div>
        ) : (
          <UploadForm
            onSubmit={onSubmit}
            itemToEdit={mode === 'edit' ? item : undefined}
            allCategories={allCategories}
            onDone={onClose}
            isSubmitting={isSubmitting}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
