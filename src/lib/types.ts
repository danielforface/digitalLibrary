export type FileType = "text" | "image" | "audio" | "video" | "pdf" | "word";

export type ArchiveItem = {
  id: string;
  title: string;
  type: FileType;
  category: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  content?: string;
  url?: string;
  tags?: string[];
};

export type CategoryNode = {
  name: string;
  path: string;
  children: CategoryNode[];
  itemCount: number;
};
