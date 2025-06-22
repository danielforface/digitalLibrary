
'use server';

import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import type { ArchiveItem } from '@/lib/types';
import { remark } from 'remark';
import strip from 'strip-markdown';

const jsonPath = path.resolve(process.cwd(), 'archive-data.json');
const categoriesJsonPath = path.resolve(process.cwd(), 'categories.json');
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

// New functions for categories persistence
async function readCategories(): Promise<string[]> {
  try {
    // Ensure the file exists before reading
    await fs.access(categoriesJsonPath).catch(async () => {
        await fs.writeFile(categoriesJsonPath, JSON.stringify([], null, 2), 'utf-8');
    });
    const fileContent = await fs.readFile(categoriesJsonPath, 'utf-8');
    if (fileContent.trim() === '') return [];
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Error reading categories:", error);
    throw new Error('Failed to read category data.');
  }
}

async function writeCategories(paths: string[]): Promise<void> {
  const uniqueSortedPaths = [...new Set(paths)].sort();
  await fs.writeFile(categoriesJsonPath, JSON.stringify(uniqueSortedPaths, null, 2), 'utf-8');
}

export async function getCategoryPaths(): Promise<string[]> {
    try {
        return await readCategories();
    } catch (error) {
        console.error("[ACTION_GET_CATEGORIES]", error);
        return [];
    }
}

export async function addCategoryPath(newPath: string): Promise<void> {
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
    try {
        return await readData();
    } catch (error) {
        console.error("[ACTION_GET_ITEMS]", error);
        return [];
    }
}

export async function createArchiveItem(formData: FormData): Promise<ArchiveItem> {
  try {
    const data = await readData();

    const title = formData.get('title') as string;
    const category = formData.get('category') as string;
    let description = formData.get('description') as string;
    const type = formData.get('type') as ArchiveItem['type'];
    const tagsString = formData.get('tags') as string;
    const content = formData.get('content') as string | undefined;
    const file = formData.get('file') as File | null;
    
    if (!title || !category || !description || !type) {
        throw new Error("Missing required fields: title, category, description, type.");
    }

    if (type === 'text' && content) {
        const processed = await remark().use(strip).process(content);
        const plainText = String(processed).trim();
        description = plainText.substring(0, 150) || description;
    }
    
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
    try {
        const data = await readData();
        const itemIndex = data.findIndex(item => item.id === id);

        if (itemIndex === -1) {
            throw new Error('Item not found');
        }

        const currentItem = data[itemIndex];

        const title = formData.get('title') as string;
        const category = formData.get('category') as string;
        let description = formData.get('description') as string;
        const type = formData.get('type') as ArchiveItem['type'];
        const tagsString = formData.get('tags') as string;
        const content = formData.get('content') as string | undefined;
        const file = formData.get('file') as File | null;

        if (type === 'text' && content) {
            const processed = await remark().use(strip).process(content);
            const plainText = String(processed).trim();
            description = plainText.substring(0, 150) || description;
        }

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
            title: title || currentItem.title,
            category: category || currentItem.category,
            description: description || currentItem.description,
            type: type || currentItem.type,
            tags,
            content: content !== undefined ? content : currentItem.content,
            url: itemUrl,
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
    try {
        const data = await readData();
        const itemIndex = data.findIndex(item => item.id === id);

        if (itemIndex === -1) {
            throw new Error('Item not found');
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
            .map(item => item.url)
            .filter((url): url is string => !!url && url.startsWith('/uploads/'));
        
        const remainingData = data.filter(item => !idsToDelete.has(item.id));
        deletedCount = data.length - remainingData.length;
        
        await writeData(remainingData);

        // Delete category paths from categories.json
        const remainingCatPaths = allCatPaths.filter(p => p !== categoryToDelete && !p.startsWith(`${categoryToDelete}/`));
        await writeCategories(remainingCatPaths);

        for (const url of filesToDelete) {
            try {
                await fs.unlink(path.join(process.cwd(), 'public', url));
            } catch (err) {
                console.error(`Failed to delete file: ${url}`, err);
            }
        }
    }
    
    revalidatePath('/');
    return { moved: movedCount, deleted: deletedCount };
}
