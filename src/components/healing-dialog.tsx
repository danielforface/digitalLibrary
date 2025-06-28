
'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useLanguage } from '@/context/language-context';

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
      <DialogContent className="text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">{t('healing_title')}</DialogTitle>
          <DialogDescription>
            {t('healing_desc')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
            {names.map((name, index) => (
                <p key={index} className="text-lg">{name}</p>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
