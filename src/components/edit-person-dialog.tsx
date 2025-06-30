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
import type { Person } from '@/lib/types';
import { Loader2 } from 'lucide-react';

type EditPersonDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void>;
  personToEdit?: Person | null;
  title: string;
  description: string;
};

export default function EditPersonDialog({ 
    isOpen, 
    onClose, 
    onConfirm, 
    personToEdit,
    title,
    description
}: EditPersonDialogProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(personToEdit?.name || '');
    }
  }, [isOpen, personToEdit]);

  const handleSubmit = async () => {
    if (name.trim()) {
        setIsSubmitting(true);
        await onConfirm(name.trim());
        setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 py-4">
            <Label htmlFor="person-name">{t('person_name')}</Label>
            <Input 
              id="person-name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('person_name_placeholder')}
              autoFocus
            />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !name.trim()}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
