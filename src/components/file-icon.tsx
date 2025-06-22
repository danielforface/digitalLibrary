import { FileText, FileImage, Music, Video, File, type LucideProps } from 'lucide-react';
import type { FileType } from '@/lib/types';

type FileIconProps = LucideProps & {
  type: FileType;
};

export default function FileIcon({ type, ...props }: FileIconProps) {
  switch (type) {
    case 'text':
      return <FileText {...props} />;
    case 'image':
      return <FileImage {...props} />;
    case 'audio':
      return <Music {...props} />;
    case 'video':
      return <Video {...props} />;
    case 'pdf':
    case 'word':
      return <File {...props} />;
    default:
      return <File {...props} />;
  }
}
