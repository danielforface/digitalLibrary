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
  coverImageUrl?: string;
};

export type CategoryNode = {
  name: string;
  path: string;
  children: CategoryNode[];
  itemCount: number;
};

export type Person = {
  id: string;
  name: string;
};

export type PeopleData = {
  memorial: Person[];
  healing: Person[];
};

export type PersonType = keyof PeopleData;
