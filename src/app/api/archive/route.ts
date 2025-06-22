'use server';

import {NextRequest, NextResponse} from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { ArchiveItem } from '@/lib/types';

const jsonPath = path.resolve(process.cwd(), 'src/lib/archive-data.json');
const uploadsPath = path.resolve(process.cwd(), 'public/uploads');

async function readData(): Promise<ArchiveItem[]> {
  try {
    const fileContent = await fs.readFile(jsonPath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    // If the file doesn't exist, return an empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeData(data: ArchiveItem[]): Promise<void> {
  await fs.writeFile(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  const data = await readData();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const data = await readData();

  const title = formData.get('title') as string;
  const category = formData.get('category') as string;
  const description = formData.get('description') as string;
  const type = formData.get('type') as ArchiveItem['type'];
  const tagsString = formData.get('tags') as string;
  const content = formData.get('content') as string | undefined;
  const file = formData.get('file') as File | null;
  
  const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean) : [];

  let itemUrl: string | undefined = undefined;

  if (file) {
    try {
      await fs.mkdir(uploadsPath, { recursive: true });
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const filename = `${uniqueSuffix}-${file.name.replace(/\s+/g, '_')}`;
      await fs.writeFile(path.join(uploadsPath, filename), fileBuffer);
      itemUrl = `/uploads/${filename}`;
    } catch (error) {
        console.error("File upload failed:", error);
        return NextResponse.json({ message: 'File upload failed' }, { status: 500 });
    }
  }

  const newItem: ArchiveItem = {
    id: Date.now().toString(),
    title,
    category,
    description,
    type,
    tags,
    content: content || '',
    url: itemUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.unshift(newItem);
  await writeData(data);

  return NextResponse.json(newItem, { status: 201 });
}
