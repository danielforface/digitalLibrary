
'use client';

import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { MoreVertical, Edit, Trash2, Download, Move, Eye } from 'lucide-react';
import type { ArchiveItem } from '@/lib/types';
import FileIcon from './file-icon';
import { formatDistanceToNow } from 'date-fns';
import { enUS, he } from 'date-fns/locale';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useEffect, useState } from 'react';

type ArchiveCardProps = {
  item: ArchiveItem;
  onView: () => void;
  onEdit: () => void;
  onMove: () => void;
  onDeleteRequest: () => void;
  isAuthenticated: boolean;
};

export default function ArchiveCard({ item, onView, onEdit, onMove, onDeleteRequest, isAuthenticated }: ArchiveCardProps) {
  const { t, lang, dir } = useLanguage();
  const [dateLocale, setDateLocale] = useState(enUS);

  useEffect(() => {
    if (lang === 'he') {
      setDateLocale(he);
    } else {
      setDateLocale(enUS);
    }
  }, [lang]);

  return (
    <Card className="relative group overflow-hidden flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
      {item.coverImageUrl && (
          <>
              <Image
                  src={item.coverImageUrl}
                  alt={`${item.title} cover photo`}
                  fill
                  className="object-cover transition-all duration-300 group-hover:scale-105"
                  data-ai-hint="background pattern"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
              <Button asChild variant="secondary" size="icon" className="absolute top-3 right-3 z-10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={item.coverImageUrl} target="_blank" rel="noopener noreferrer" aria-label="View cover photo">
                      <Eye className="h-4 w-4" />
                  </a>
              </Button>
          </>
      )}
      <div className="relative flex flex-col justify-between flex-grow">
        <div className="flex-grow">
            <button onClick={onView} className={cn("w-full h-full flex flex-col", dir === 'rtl' ? 'text-right' : 'text-left')}>
                <CardHeader className={cn("flex-row items-start gap-4 space-y-0 pb-4", dir === 'rtl' && 'flex-row-reverse')}>
                    <div className={cn("p-3 rounded-lg", item.coverImageUrl ? "bg-white/20" : "bg-primary/10")}>
                        <FileIcon type={item.type} className={cn("w-6 h-6", item.coverImageUrl ? "text-white" : "text-primary")} />
                    </div>
                    <div className="flex-1">
                        <CardTitle className={cn("text-lg font-headline leading-tight", item.coverImageUrl && "text-white")}>{item.title}</CardTitle>
                        <CardDescription className={cn(item.coverImageUrl && "text-neutral-200")}>{item.description}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                {item.type === 'text' && (
                    <p className={cn("text-sm line-clamp-3", item.coverImageUrl ? "text-neutral-300" : "text-muted-foreground")}>
                    {item.content}
                    </p>
                )}
                {item.tags && item.tags.length > 0 && (
                    <div className={cn("mt-4 flex flex-wrap gap-2", dir === 'rtl' && 'justify-end')}>
                    {item.tags.map(tag => (
                        <Badge key={tag} variant={item.coverImageUrl ? "default" : "secondary"}>{tag}</Badge>
                    ))}
                    </div>
                )}
                </CardContent>
            </button>
        </div>
        <CardFooter className="flex justify-between items-center pt-4">
            <p className={cn("text-xs", item.coverImageUrl ? "text-neutral-300" : "text-muted-foreground")}>
                {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true, locale: dateLocale })}
            </p>
            {isAuthenticated && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant={item.coverImageUrl ? "secondary" : "ghost"} size="icon" className="w-8 h-8">
                        <MoreVertical className="w-4 h-4" />
                        <span className="sr-only">{t('more_options')}</span>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'}>
                    <DropdownMenuItem onClick={onEdit}>
                        <Edit className={cn('h-4 w-4', dir === 'rtl' ? 'ml-2' : 'mr-2')} />
                        <span>{t('edit')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onMove}>
                        <Move className={cn('h-4 w-4', dir === 'rtl' ? 'ml-2' : 'mr-2')} />
                        <span>{t('move')}</span>
                    </DropdownMenuItem>
                    {item.url && (
                        <DropdownMenuItem asChild className="cursor-pointer">
                        <a href={item.url} download={item.title}>
                            <Download className={cn('h-4 w-4', dir === 'rtl' ? 'ml-2' : 'mr-2')} />
                            <span>{t('download')}</span>
                        </a>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onSelect={() => {
                          // Let the dropdown close, then open the dialog to prevent focus conflicts.
                          setTimeout(() => {
                            onDeleteRequest();
                          }, 50);
                        }}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                      >
                        <Trash2 className={cn('h-4 w-4', dir === 'rtl' ? 'ml-2' : 'mr-2')} />
                        <span>{t('delete')}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </CardFooter>
      </div>
    </Card>
  );
}
