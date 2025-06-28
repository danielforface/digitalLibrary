
'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useLanguage } from '@/context/language-context';
import MemorialCandleIcon from "./memorial-candle-icon";

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
      <DialogContent className="max-h-[80dvh] flex flex-col">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-headline">{t('memorial_title')}</DialogTitle>
          <DialogDescription>
            {t('memorial_desc')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto">
            {names.map((name, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg border bg-card shadow-sm">
                    <div className="w-10 h-10 flex-shrink-0 text-accent">
                      <MemorialCandleIcon />
                    </div>
                    <p className="text-lg font-medium">{name}</p>
                </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
