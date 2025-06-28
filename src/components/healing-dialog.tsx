
'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useLanguage } from '@/context/language-context';
import { HeartPulse } from 'lucide-react';

type HealingDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function HealingDialog({ isOpen, onClose }: HealingDialogProps) {
  const { t } = useLanguage();

  const names = [
      "שרינה בת לאה",
      "רות בת לאה",
      "רחל מרים בת מיכל",
      "חנה בת מיכל"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80dvh] flex flex-col">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-headline">{t('healing_title')}</DialogTitle>
          <DialogDescription>
            {t('healing_desc')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto">
            {names.map((name, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg border bg-card shadow-sm">
                    <HeartPulse className="w-8 h-8 flex-shrink-0 text-destructive" />
                    <p className="text-lg font-medium">{name}</p>
                </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
