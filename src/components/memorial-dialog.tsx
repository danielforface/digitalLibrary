
'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useLanguage } from '@/context/language-context';

type MemorialDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function MemorialDialog({ isOpen, onClose }: MemorialDialogProps) {
  const { t } = useLanguage();

  const names = [
      "סבא דניאל",
      "סבא עמרם",
      "סבתה לאה",
      "יפעת חסין",
      "סבא יוסף",
      "יעקב חסין",
      "ישי חסין",
      "שושנה בת ויולט"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">{t('memorial_title')}</DialogTitle>
          <DialogDescription>
            {t('memorial_desc')}
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
