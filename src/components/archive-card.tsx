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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from './ui/button';
import { MoreVertical, Edit, Trash2, Download, Move } from 'lucide-react';
import type { ArchiveItem } from '@/lib/types';
import FileIcon from './file-icon';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from './ui/badge';

type ArchiveCardProps = {
  item: ArchiveItem;
  onView: () => void;
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
};

export default function ArchiveCard({ item, onView, onEdit, onMove, onDelete }: ArchiveCardProps) {
  return (
    <Card className="flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
      <button onClick={onView} className="text-left w-full h-full flex flex-col">
        <CardHeader className="flex-row items-start gap-4 space-y-0 pb-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <FileIcon type={item.type} className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-headline leading-tight">{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          {item.type === 'text' && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {item.content}
            </p>
          )}
           {item.tags && item.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </button>
      <CardFooter className="flex justify-between items-center pt-4">
        <p className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
        </p>
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <MoreVertical className="w-4 h-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMove}>
                <Move className="mr-2 h-4 w-4" />
                <span>Move</span>
              </DropdownMenuItem>
              {item.url && (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <a href={item.url} download={item.title}>
                    <Download className="mr-2 h-4 w-4" />
                    <span>Download</span>
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the item
                from your archive.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
