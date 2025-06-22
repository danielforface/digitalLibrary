
'use server';

import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import type { ArchiveItem } from '@/lib/types';

const jsonPath = path.resolve(process.cwd(), 'archive-data.json');
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
      await writeData([]); // Create the file if it doesn't exist
      return [];
    }
    console.error("Error reading data:", error);
    throw new Error('Failed to read archive data.');
  }
}

async function writeData(data: ArchiveItem[]): Promise<void> {
  await fs.writeFile(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getArchiveItems(): Promise<ArchiveItem[]> {
    return await readData();
}

export async function createArchiveItem(formData: FormData) {
  try {
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

    if (file && file.size > 0) {
      await fs.mkdir(uploadsPath, { recursive: true });
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${uniqueSuffix}-${sanitizedName}`;
      await fs.writeFile(path.join(uploadsPath, filename), fileBuffer);
      itemUrl = `/uploads/${filename}`;
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

    revalidatePath('/');
    return { success: true, item: newItem };
  } catch (error) {
    console.error('[ACTION_CREATE_ITEM]', error);
    return { success: false, message: 'An unexpected error occurred while creating the item.' };
  }
}


export async function updateArchiveItem(id: string, formData: FormData) {
    try {
        const data = await readData();
        const itemIndex = data.findIndex(item => item.id === id);

        if (itemIndex === -1) {
            return { success: false, message: 'Item not found' };
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

        if (file && file.size > 0) {
            if (currentItem.url && currentItem.url.startsWith('/uploads/')) {
                try {
                    await fs.unlink(path.join(process.cwd(), 'public', currentItem.url));
                } catch (err) {
                    console.error(`Failed to delete old file: ${currentItem.url}`, err);
                }
            }
            
            await fs.mkdir(uploadsPath, { recursive: true });
            const fileBuffer = Buffer.from(await file.arrayBuffer());
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const filename = `${uniqueSuffix}-${sanitizedName}`;
            await fs.writeFile(path.join(uploadsPath, filename), fileBuffer);
            itemUrl = `/uploads/${filename}`;
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
        
        revalidatePath('/');
        return { success: true, item: updatedItem };

    } catch (error) {
        console.error('[ACTION_UPDATE_ITEM]', error);
        return { success: false, message: 'An unexpected error occurred while updating the item.' };
    }
}


export async function deleteArchiveItem(id: string) {
    try {
        const data = await readData();
        const itemIndex = data.findIndex(item => item.id === id);

        if (itemIndex === -1) {
            return { success: false, message: 'Item not found' };
        }

        const itemToDelete = data[itemIndex];

        if (itemToDelete.url && itemToDelete.url.startsWith('/uploads/')) {
            try {
                const filePath = path.join(process.cwd(), 'public', itemToDelete.url);
                await fs.unlink(filePath);
            } catch (error) {
                console.error(`Failed to delete file: ${itemToDelete.url}`, error);
            }
        }

        data.splice(itemIndex, 1);
        await writeData(data);
        
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('[ACTION_DELETE_ITEM]', error);
        return { success: false, message: 'An unexpected error occurred while deleting the item.' };
    }
}
