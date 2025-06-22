import type { ArchiveItem } from './types';

export const initialData: ArchiveItem[] = [
  {
    id: '1',
    title: 'Reflections on Modern Art',
    type: 'text',
    category: 'Writings',
    description: 'Art History',
    createdAt: new Date('2023-05-20T14:48:00.000Z').toISOString(),
    updatedAt: new Date('2023-05-20T14:48:00.000Z').toISOString(),
    content: 'Modern art represents an evolving set of ideas among a number of painters, sculptors, photographers, performers, and writers who - both individually and collectively - sought new approaches to art making. This text explores the nuances of this transformative period.'
  },
  {
    id: '2',
    title: 'Architectural Sketch I',
    type: 'image',
    category: 'Media',
    description: 'Architecture',
    createdAt: new Date('2023-08-15T09:21:00.000Z').toISOString(),
    updatedAt: new Date('2023-08-15T09:21:00.000Z').toISOString(),
    url: 'https://placehold.co/600x400.png',
    content: 'architecture sketch'
  },
  {
    id: '3',
    title: 'Classical Piano Melody',
    type: 'audio',
    category: 'Media',
    description: 'Music',
    createdAt: new Date('2023-10-02T18:30:00.000Z').toISOString(),
    updatedAt: new Date('2023-10-02T18:30:00.000Z').toISOString(),
    url: 'https://storage.googleapis.com/studioprompt/s-5HJd3yrkfr.mp3',
  },
  {
    id: '4',
    title: 'The Art of Cinematography',
    type: 'video',
    category: 'Media',
    description: 'Film',
    createdAt: new Date('2024-01-11T11:05:00.000Z').toISOString(),
    updatedAt: new Date('2024-01-11T11:05:00.000Z').toISOString(),
    url: 'https://storage.googleapis.com/studioprompt/v-d3d5182987.mp4',
  },
  {
    id: '5',
    title: 'Research Paper on AI Ethics',
    type: 'pdf',
    category: 'Documents',
    description: 'Technology',
    createdAt: new Date('2024-02-28T16:00:00.000Z').toISOString(),
    updatedAt: new Date('2024-02-28T16:00:00.000Z').toISOString(),
    url: '#',
  },
  {
    id: '6',
    title: 'Project Proposal Draft',
    type: 'word',
    category: 'Documents',
    description: 'Work',
    createdAt: new Date('2024-03-10T13:45:00.000Z').toISOString(),
    updatedAt: new Date('2024-03-10T13:45:00.000Z').toISOString(),
    url: '#',
  },
  {
    id: '7',
    title: 'Abstract Landscape',
    type: 'image',
    category: 'Media',
    description: 'Photography',
    createdAt: new Date('2023-11-05T12:10:00.000Z').toISOString(),
    updatedAt: new Date('2023-11-05T12:10:00.000Z').toISOString(),
    url: 'https://placehold.co/600x401.png',
    content: 'abstract landscape'
  },
  {
    id: '8',
    title: 'A Short Story',
    type: 'text',
    category: 'Writings',
    description: 'Fiction',
    createdAt: new Date('2022-12-30T20:00:00.000Z').toISOString(),
    updatedAt: new Date('2022-12-30T20:00:00.000Z').toISOString(),
    content: 'The old house stood on a hill overlooking the town. Its windows were like vacant eyes, staring out at a world that had long since moved on. But for a curious few, it held secrets of a time gone by, waiting to be rediscovered.'
  },
  {
    id: '9',
    title: 'Holiday Greetings',
    type: 'text',
    category: 'Holiday',
    description: 'Seasonal Message',
    createdAt: new Date('2024-07-04T10:00:00.000Z').toISOString(),
    updatedAt: new Date('2024-07-04T10:00:00.000Z').toISOString(),
    content: 'Wishing everyone a happy and safe holiday season, full of joy and celebration.'
  }
];
