
'use server';

import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';
import type { ArchiveItem, PeopleData, Person, PersonType } from '@/lib/types';

const dataPath = path.resolve(process.cwd(), 'data');
const jsonPath = path.join(dataPath, 'archive-data.json');
const categoriesJsonPath = path.join(dataPath, 'categories.json');
const uploadsPath = path.resolve(process.cwd(), 'public/uploads');

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

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    // Keep unicode characters in filename, but remove problematic ones
    const sanitizedName = file.name.replace(/[\\/:"*?<>|]/g, '_');
    const filename = `${uniqueSuffix}-${sanitizedName}`;
    const filePath = path.join(uploadsPath, filename);

    // Use streams to avoid loading the entire file into memory
    const readableStream = file.stream();
    const writableStream = createWriteStream(filePath);
    
    await pipeline(readableStream, writableStream);
    
    return `/uploads/${filename}`;
}

// Helper function to delete a file
async function deleteFile(url: string | undefined): Promise<void> {
    if (url && url.startsWith('/uploads/')) {
        try {
            const filePath = path.join(process.cwd(), 'public', url);
            await fs.unlink(filePath);
        } catch (err) {
            // It's possible the file doesn't exist, so we can ignore ENOENT errors.
            if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
              console.error(`Failed to delete file: ${url}`, err);
            }
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
    // This function is now safe because readData will not throw
    return readData();
}

export async function createArchiveItem(formData: FormData): Promise<ArchiveItem> {
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
    
    if (!title || !category || !type) {
        throw new Error("Missing required fields: title, category, type.");
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
            title: title ?? currentItem.title,
            category: category ?? currentItem.category,
            description: description !== undefined ? description : currentItem.description,
            type: type ?? currentItem.type,
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

export async function moveCategory(sourcePath: string, destinationPath: string): Promise<{ movedItemsCount: number; movedCategoriesCount: number }> {
  if (destinationPath === sourcePath || destinationPath.startsWith(`${sourcePath}/`)) {
    throw new Error('A category cannot be moved into itself or one of its own subcategories.');
  }

  const data = await readData();
  const allCatPaths = await readCategories();

  const sourceName = sourcePath.split('/').pop();
  if (!sourceName) {
      throw new Error('The root directory cannot be moved.');
  }

  const newBasePath = [destinationPath, sourceName].filter(Boolean).join('/');

  if (allCatPaths.includes(newBasePath)) {
      throw new Error(`A category with the name "${sourceName}" already exists in the destination.`);
  }

  let movedItemsCount = 0;
  const updatedData = data.map(item => {
    if (item.category.startsWith(sourcePath)) {
      const newCategoryPath = item.category.replace(sourcePath, newBasePath);
      movedItemsCount++;
      return { ...item, category: newCategoryPath, updatedAt: new Date().toISOString() };
    }
    return item;
  });
  
  let movedCategoriesCount = 0;
  const updatedCatPaths = allCatPaths.map(p => {
    if (p.startsWith(sourcePath)) {
      const newCategoryPath = p.replace(sourcePath, newBasePath);
      movedCategoriesCount++;
      return newCategoryPath;
    }
    return p;
  });

  await writeData(updatedData);
  await writeCategories(updatedCatPaths);

  revalidatePath('/');
  return { movedItemsCount, movedCategoriesCount };
}

const peopleJsonPath = path.join(dataPath, 'people.json');

// Helper functions for people data
async function readPeopleData(): Promise<PeopleData> {
  try {
    const fileContent = await fs.readFile(peopleJsonPath, 'utf-8');
    if (fileContent.trim() === '') return { memorial: [], healing: [] };
    return JSON.parse(fileContent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const defaultData = { memorial: [], healing: [] };
      await writePeopleData(defaultData);
      return defaultData;
    }
    console.error(`Error reading or parsing people data from ${peopleJsonPath}:`, error);
    return { memorial: [], healing: [] };
  }
}

async function writePeopleData(data: PeopleData): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(peopleJsonPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getPeople(): Promise<PeopleData> {
    return readPeopleData();
}

export async function addPerson(type: PersonType, name: string): Promise<Person> {
    const data = await readPeopleData();
    const newPerson: Person = {
        id: Date.now().toString(),
        name,
    };
    data[type].push(newPerson);
    await writePeopleData(data);
    revalidatePath('/'); // Revalidate to be safe, though not strictly necessary for dialogs
    return newPerson;
}

export async function updatePerson(type: PersonType, id: string, newName: string): Promise<Person> {
    const data = await readPeopleData();
    const personIndex = data[type].findIndex(p => p.id === id);
    if (personIndex === -1) {
        throw new Error('Person not found');
    }
    data[type][personIndex].name = newName;
    await writePeopleData(data);
    revalidatePath('/');
    return data[type][personIndex];
}

export async function deletePerson(type: PersonType, id: string): Promise<void> {
    const data = await readPeopleData();
    const initialLength = data[type].length;
    data[type] = data[type].filter(p => p.id !== id);
    if (data[type].length === initialLength) {
        throw new Error('Person not found');
    }
    await writePeopleData(data);
    revalidatePath('/');
}
