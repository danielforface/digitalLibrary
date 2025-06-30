
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useLanguage } from '@/context/language-context';
import MemorialCandleIcon from "./memorial-candle-icon";
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPeople, addPerson, updatePerson, deletePerson } from '@/app/actions';
import type { Person } from '@/lib/types';
import EditPersonDialog from './edit-person-dialog';
import DeletePersonDialog from './delete-person-dialog';
import { Skeleton } from './ui/skeleton';

type MemorialDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
};

export default function MemorialDialog({ isOpen, onClose, isAuthenticated }: MemorialDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [names, setNames] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [dialogState, setDialogState] = useState<{
    editOpen: boolean;
    deleteOpen: boolean;
    selectedPerson: Person | null;
  }>({ editOpen: false, deleteOpen: false, selectedPerson: null });

  const fetchNames = useCallback(async () => {
    setIsLoading(true);
    try {
        const peopleData = await getPeople();
        setNames(peopleData.memorial);
    } catch (error) {
        toast({ variant: 'destructive', title: t('error'), description: (error as Error).message });
    } finally {
        setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    if (isOpen) {
      fetchNames();
    }
  }, [isOpen, fetchNames]);

  const handleAdd = async (name: string) => {
    try {
        await addPerson('memorial', name);
        toast({ title: t('success'), description: `'${name}' ${t('added_successfully')}.`});
        fetchNames();
        setDialogState({ ...dialogState, editOpen: false, selectedPerson: null });
    } catch (error) {
        toast({ variant: 'destructive', title: t('error'), description: (error as Error).message });
    }
  };

  const handleUpdate = async (name: string) => {
    if (!dialogState.selectedPerson) return;
    try {
        await updatePerson('memorial', dialogState.selectedPerson.id, name);
        toast({ title: t('success'), description: `'${name}' ${t('updated_successfully')}.`});
        fetchNames();
        setDialogState({ ...dialogState, editOpen: false, selectedPerson: null });
    } catch (error) {
        toast({ variant: 'destructive', title: t('error'), description: (error as Error).message });
    }
  };

  const handleDelete = async () => {
    if (!dialogState.selectedPerson) return;
    try {
        await deletePerson('memorial', dialogState.selectedPerson.id);
        toast({ variant: 'destructive', title: t('success'), description: `'${dialogState.selectedPerson.name}' ${t('deleted_successfully')}.`});
        fetchNames();
        setDialogState({ ...dialogState, deleteOpen: false, selectedPerson: null });
    } catch (error) {
        toast({ variant: 'destructive', title: t('error'), description: (error as Error).message });
    }
  };

  const openEditDialog = (person: Person | null = null) => {
    setDialogState({ ...dialogState, editOpen: true, selectedPerson: person });
  };

  const openDeleteDialog = (person: Person) => {
    setDialogState({ ...dialogState, deleteOpen: true, selectedPerson: person });
  };

  const closeAllSubDialogs = () => {
      setDialogState({ editOpen: false, deleteOpen: false, selectedPerson: null });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-h-[80dvh] flex flex-col">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-headline">{t('memorial_title')}</DialogTitle>
            <DialogDescription>{t('memorial_desc')}</DialogDescription>
          </DialogHeader>
          <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto">
              {isLoading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 rounded-lg border bg-card shadow-sm">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <Skeleton className="h-6 w-3/4" />
                      </div>
                  ))
              ) : (
                names.map((person) => (
                    <div key={person.id} className="group flex items-center gap-4 p-3 rounded-lg border bg-card shadow-sm">
                        <div className="w-10 h-10 flex-shrink-0 text-accent">
                          <MemorialCandleIcon />
                        </div>
                        <p className="text-lg font-medium flex-grow">{person.name}</p>
                        {isAuthenticated && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(person)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => openDeleteDialog(person)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                ))
              )}
          </div>
          {isAuthenticated && (
              <DialogFooter className="border-t pt-4">
                  <Button onClick={() => openEditDialog()}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('add_name')}
                  </Button>
              </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
      
      <EditPersonDialog
        isOpen={dialogState.editOpen}
        onClose={closeAllSubDialogs}
        onConfirm={dialogState.selectedPerson ? handleUpdate : handleAdd}
        personToEdit={dialogState.selectedPerson}
        title={dialogState.selectedPerson ? t('edit_name_title') : t('add_name_title')}
        description={dialogState.selectedPerson ? t('edit_name_desc') : t('add_memorial_desc')}
      />

      <DeletePersonDialog
        isOpen={dialogState.deleteOpen}
        onClose={closeAllSubDialogs}
        onConfirm={handleDelete}
        personName={dialogState.selectedPerson?.name}
      />
    </>
  );
}
