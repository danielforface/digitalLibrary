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
    if (fileContent.trim() === '') {
      return [];
    }
    return JSON.parse(fileContent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeData(data: ArchiveItem[]): Promise<void> {
  await fs.writeFile(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const formData = await request.formData();
    const data = await readData();

    const itemIndex = data.findIndex(item => item.id === id);

    if (itemIndex === -1) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    const currentItem = data[itemIndex];

    const title = formData.get('title') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as ArchiveItem['type'];
    const tagsString = formData.get('tags') as string;
    const content = formData.get('content') as string | undefined;
    const file = formData.get('file') as File | null;

    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    
    let itemUrl = currentItem.url;

    if (file) {
      // Delete old file if it exists and is a local upload
      if (currentItem.url && currentItem.url.startsWith('/uploads/')) {
        try {
          await fs.unlink(path.join(process.cwd(), 'public', currentItem.url));
        } catch (err) {
          console.error(`Failed to delete old file: ${currentItem.url}`, err);
        }
      }
      // Upload new file
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

    const updatedItem: ArchiveItem = {
      ...currentItem,
      title,
      category,
      description,
      type,
      tags,
      content: content || currentItem.content,
      url: itemUrl,
      updatedAt: new Date().toISOString(),
    };

    data[itemIndex] = updatedItem;
    await writeData(data);

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('[API_ARCHIVE_PUT]', error);
    return NextResponse.json({ message: 'An unexpected error occurred while updating the item.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const data = await readData();

    const itemIndex = data.findIndex(item => item.id === id);

    if (itemIndex === -1) {
        return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    const itemToDelete = data[itemIndex];

    // Delete associated file if it exists and is a local upload
    if (itemToDelete.url && itemToDelete.url.startsWith('/uploads/')) {
        try {
            const filePath = path.join(process.cwd(), 'public', itemToDelete.url);
            await fs.unlink(filePath);
        } catch (error) {
            // Log error but don't block deletion of metadata
            console.error(`Failed to delete file: ${itemToDelete.url}`, error);
        }
    }

    data.splice(itemIndex, 1);
    await writeData(data);

    return NextResponse.json({ message: 'Item deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('[API_ARCHIVE_DELETE]', error);
    return NextResponse.json({ message: 'An unexpected error occurred while deleting the item.' }, { status: 500 });
  }
}
