
'use client';

import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="p-2 space-y-2">
       <Label className="px-2 text-xs font-semibold text-muted-foreground flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('language')}
        </Label>
      <div className="flex items-center gap-2">
        <Button
          variant={lang === 'en' ? 'secondary' : 'ghost'}
          onClick={() => setLang('en')}
          className="w-full"
        >
          English
        </Button>
        <Button
          variant={lang === 'he' ? 'secondary' : 'ghost'}
          onClick={() => setLang('he')}
          className="w-full"
        >
          עברית
        </Button>
      </div>
    </div>
  );
}
