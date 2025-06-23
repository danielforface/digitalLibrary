
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

type LoginDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function LoginDialog({ isOpen, onClose, onSuccess }: LoginDialogProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!password.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Password cannot be empty.' });
        return;
    }
    setIsLoading(true);
    try {
        const result = await login(password);
        if (result.success) {
            toast({ title: 'Success', description: 'You are now logged in.' });
            onSuccess();
        } else {
            toast({ variant: 'destructive', title: 'Login Failed', description: result.message });
        }
    } catch (error) {
        console.error("Login error:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
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
          <DialogTitle>Admin Access Required</DialogTitle>
          <DialogDescription>
            Please enter the admin password to proceed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 py-4">
            <Label htmlFor="password">Password:</Label>
            <Input 
              id="password" 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter admin password"
              autoFocus
            />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading || !password.trim()}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
