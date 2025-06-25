
'use client';

import { useState } from 'react';
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
import { login } from '@/app/auth-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

type LoginDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function LoginDialog({ isOpen, onClose, onSuccess }: LoginDialogProps) {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!password.trim()) {
        toast({ variant: 'destructive', title: t('error'), description: t('password_empty') });
        return;
    }
    setIsLoading(true);
    try {
        const result = await login(password);
        if (result.success) {
            onSuccess();
        } else {
            toast({ variant: 'destructive', title: t('login_failed'), description: result.message });
        }
    } catch (error) {
        console.error("Login error:", error);
        toast({ variant: 'destructive', title: t('error'), description: t('unexpected_error') });
    } finally {
        setIsLoading(false);
        setPassword('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            onClose();
            setPassword('');
        }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin_access_required')}</DialogTitle>
          <DialogDescription>
            {t('admin_access_desc')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 py-4">
            <Label htmlFor="password">{t('password')}</Label>
            <Input 
              id="password" 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('password_placeholder')}
              autoFocus
            />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={isLoading || !password.trim()}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('login')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
