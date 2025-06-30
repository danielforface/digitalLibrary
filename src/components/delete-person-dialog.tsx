'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useLanguage } from "@/context/language-context";

type DeletePersonDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    personName: string | undefined;
};

export default function DeletePersonDialog({ isOpen, onClose, onConfirm, personName }: DeletePersonDialogProps) {
    const { t } = useLanguage();

    if (!personName) {
        return null;
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('delete_person_confirm', { name: personName })}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        {t('delete')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
