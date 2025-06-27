
'use server';

import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import type { ArchiveItem } from '@/lib/types';
import { cookies } from 'next/headers';

const dataPath = path.resolve(process.cwd(), 'data');
const jsonPath = path.join(dataPath, 'archive-data.json');
const categoriesJsonPath = path.join(dataPath, 'categories.json');
const uploadsPath = path.resolve(process.cwd(), 'public/uploads');

async function verifyAuth() {
  const cookieStore = cookies();
  const isAdmin = cookieStore.get('is_admin_authed')?.value === 'true';
  if (!isAdmin) {
    throw new Error('Not authorized to perform this action.');
  }
}

// Helper to ensure data directory exists
async function ensureDataDirectory() {
    await fs.mkdir(dataPath, { recursive: true });
}

async function readData(): Promise<ArchiveItem[]> {
  try {
    const fileContent = await fs.readFile(jsonPath, 'utf-8');
    if (fileContent.trim() === '') {
      return [];
    }
    const data = JSON.parse(fileContent);
    if (!Array.isArray(data)) {
        console.error(`Data in ${jsonPath} is not an array. Returning empty array.`);
        return [];
    }
    return data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      try {
        await writeData([]);
      } catch (writeError) {
        console.error(`Failed to create new archive data file at ${jsonPath}:`, writeError);
      }
      return [];
    }
    console.error(`Error reading or parsing archive data from ${jsonPath}:`, error);
    return [];
  }
}

async function writeData(data: ArchiveItem[]): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper function to save a file and return its URL
async function saveFile(file: File): Promise<string> {
    await fs.mkdir(uploadsPath, { recursive: true });
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${uniqueSuffix}-${sanitizedName}`;
    await fs.writeFile(path.join(uploadsPath, filename), fileBuffer);
    return `/uploads/${filename}`;
}

// Helper function to delete a file
async function deleteFile(url: string | undefined): Promise<void> {
    if (url && url.startsWith('/uploads/')) {
        try {
            await fs.unlink(path.join(process.cwd(), 'public', url));
        } catch (err) {
            console.error(`Failed to delete file: ${url}`, err);
        }
    }
}


// New functions for categories persistence
async function readCategories(): Promise<string[]> {
  try {
    const fileContent = await fs.readFile(categoriesJsonPath, 'utf-8');
    if (fileContent.trim() === '') {
      return [];
    }
    const data = JSON.parse(fileContent);
    if (!Array.isArray(data)) {
        console.error(`Data in ${categoriesJsonPath} is not an array. Returning empty array.`);
        return [];
    }
    return data;
  } catch (error) {
     if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      try {
        await writeCategories([]);
      } catch (writeError) {
        console.error(`Could not create categories data file at ${categoriesJsonPath}:`, writeError);
      }
      return [];
    }
    console.error(`Error reading or parsing categories data from ${categoriesJsonPath}:`, error);
    return [];
  }
}

async function writeCategories(paths: string[]): Promise<void> {
  await ensureDataDirectory();
  const uniqueSortedPaths = [...new Set(paths)].sort();
  await fs.writeFile(categoriesJsonPath, JSON.stringify(uniqueSortedPaths, null, 2), 'utf-8');
}

export async function getCategoryPaths(): Promise<string[]> {
    // This function is now safe because readCategories will not throw
    return readCategories();
}

export async function addCategoryPath(newPath: string): Promise<void> {
    await verifyAuth();
    try {
        const paths = await readCategories();
        if (!paths.includes(newPath)) {
            paths.push(newPath);
            await writeCategories(paths);
            revalidatePath('/');
        }
    } catch (error) {
        console.error('[ACTION_ADD_CATEGORY]', error);
        if (error instanceof Error) throw error;
        throw new Error('An unexpected error occurred while adding the category.');
    }
}

export async function deleteEmptyCategory(pathToDelete: string): Promise<void> {
    await verifyAuth();
    try {
        const allCatPaths = await readCategories();
        const remainingCatPaths = allCatPaths.filter(p => p !== pathToDelete && !p.startsWith(`${pathToDelete}/`));
        if(allCatPaths.length !== remainingCatPaths.length) {
            await writeCategories(remainingCatPaths);
            revalidatePath('/');
        }
    } catch (error) {
        console.error('[ACTION_DELETE_EMPTY_CATEGORY]', error);
        if (error instanceof Error) throw error;
        throw new Error('An unexpected error occurred while deleting the category.');
    }
}

export async function getArchiveItems(): Promise<ArchiveItem[]> {
    // This function is now safe because readData will not throw
    return readData();
}

export async function createArchiveItem(formData: FormData): Promise<ArchiveItem> {
  await verifyAuth();
  try {
    const data = await readData();

    const title = formData.get('title') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as ArchiveItem['type'];
    const tagsString = formData.get('tags') as string;
    const content = formData.get('content') as string | undefined;
    const file = formData.get('file') as File | null;
    const coverImage = formData.get('coverImage') as File | null;
    
    if (!title || !category || !description || !type) {
        throw new Error("Missing required fields: title, category, description, type.");
    }
    
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    let itemUrl: string | undefined = undefined;
    if (file && file.size > 0) {
      itemUrl = await saveFile(file);
    }
    
    let coverImageUrl: string | undefined = undefined;
    if (coverImage && coverImage.size > 0) {
        coverImageUrl = await saveFile(coverImage);
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
      coverImageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.unshift(newItem);
    await writeData(data);

    revalidatePath('/');
    return newItem;
  } catch (error) {
    console.error('[ACTION_CREATE_ITEM]', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while creating the item.');
  }
}


export async function updateArchiveItem(id: string, formData: FormData): Promise<ArchiveItem> {
    await verifyAuth();
    try {
        const data = await readData();
        const itemIndex = data.findIndex(item => item.id === id);

        if (itemIndex === -1) {
            throw new Error('Item not found');
        }

        const currentItem = data[itemIndex];

        const title = formData.get('title') as string;
        const category = formData.get('category') as string;
        const description = formData.get('description') as string;
        const type = formData.get('type') as ArchiveItem['type'];
        const tagsString = formData.get('tags') as string;
        const content = formData.get('content') as string | undefined;
        const file = formData.get('file') as File | null;
        const coverImage = formData.get('coverImage') as File | null;
        const removeCoverImage = formData.get('removeCoverImage') === 'true';

        const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean) : [];
        
        let itemUrl = currentItem.url;
        if (file && file.size > 0) {
            await deleteFile(currentItem.url);
            itemUrl = await saveFile(file);
        }

        let coverImageUrl = currentItem.coverImageUrl;
        if (removeCoverImage) {
            await deleteFile(currentItem.coverImageUrl);
            coverImageUrl = undefined;
        } else if (coverImage && coverImage.size > 0) {
            await deleteFile(currentItem.coverImageUrl);
            coverImageUrl = await saveFile(coverImage);
        }

        const updatedItem: ArchiveItem = {
            ...currentItem,
            title: title || currentItem.title,
            category: category || currentItem.category,
            description: description || currentItem.description,
            type: type || currentItem.type,
            tags,
            content: content !== undefined ? content : currentItem.content,
            url: itemUrl,
            coverImageUrl: coverImageUrl,
            updatedAt: new Date().toISOString(),
        };

        data[itemIndex] = updatedItem;
        await writeData(data);
        
        revalidatePath('/');
        revalidatePath('/[...slug]');
        return updatedItem;

    } catch (error) {
        console.error('[ACTION_UPDATE_ITEM]', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unexpected error occurred while updating the item.');
    }
}


export async function deleteArchiveItem(id: string): Promise<void> {
    await verifyAuth();
    try {
        const data = await readData();
        const itemIndex = data.findIndex(item => item.id === id);

        if (itemIndex === -1) {
            throw new Error('Item not found');
        }

        const itemToDelete = data[itemIndex];
        
        await deleteFile(itemToDelete.url);
        await deleteFile(itemToDelete.coverImageUrl);

        data.splice(itemIndex, 1);
        await writeData(data);
        
        revalidatePath('/');
    } catch (error) {
        console.error('[ACTION_DELETE_ITEM]', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unexpected error occurred while deleting the item.');
    }
}

export async function handleCategoryAction(
  categoryToDelete: string,
  migrationPath?: string
): Promise<{ moved: number; deleted: number }> {
    await verifyAuth();
    const data = await readData();
    const allCatPaths = await readCategories();
    let movedCount = 0;
    let deletedCount = 0;
    
    const itemsToProcess = data.filter(item => 
        item.category === categoryToDelete || item.category.startsWith(`${categoryToDelete}/`)
    );

    if (migrationPath !== undefined) { // This includes empty string "" for root
        // Move items
        const updatedData = data.map(item => {
            if (item.category === categoryToDelete || item.category.startsWith(`${categoryToDelete}/`)) {
                const remainingPath = item.category.substring(categoryToDelete.length).replace(/^\//, '');
                const newPath = [migrationPath, remainingPath].filter(Boolean).join('/');
                movedCount++;
                return { ...item, category: newPath, updatedAt: new Date().toISOString() };
            }
            return item;
        });
        await writeData(updatedData);

        // Move category paths in categories.json
        const updatedCatPaths = allCatPaths.map(p => {
            if (p === categoryToDelete || p.startsWith(`${categoryToDelete}/`)) {
                const remainingPath = p.substring(categoryToDelete.length).replace(/^\//, '');
                return [migrationPath, remainingPath].filter(Boolean).join('/');
            }
            return p;
        });
        await writeCategories(updatedCatPaths);

    } else { // Delete items and category paths
        const idsToDelete = new Set(itemsToProcess.map(item => item.id));
        
        const filesToDelete = itemsToProcess
            .flatMap(item => [item.url, item.coverImageUrl])
            .filter((url): url is string => !!url && url.startsWith('/uploads/'));
        
        const remainingData = data.filter(item => !idsToDelete.has(item.id));
        deletedCount = data.length - remainingData.length;
        
        await writeData(remainingData);

        // Delete category paths from categories.json
        const remainingCatPaths = allCatPaths.filter(p => p !== categoryToDelete && !p.startsWith(`${categoryToDelete}/`));
        await writeCategories(remainingCatPaths);

        for (const url of filesToDelete) {
            await deleteFile(url);
        }
    }
    
    revalidatePath('/');
    return { moved: movedCount, deleted: deletedCount };
}
