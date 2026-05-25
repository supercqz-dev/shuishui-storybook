import { promises as fs } from 'fs';
import path from 'path';
import type { Book } from './types';

const BOOKS_DIR = path.join(process.cwd(), 'data', 'books');

export async function listBooks(): Promise<Book[]> {
  try {
    const files = await fs.readdir(BOOKS_DIR);
    const jsons = files.filter((f) => f.endsWith('.json'));
    const books = await Promise.all(
      jsons.map(async (f) => {
        const raw = await fs.readFile(path.join(BOOKS_DIR, f), 'utf-8');
        return JSON.parse(raw) as Book;
      })
    );
    return books.sort((a, b) => b.created_at.localeCompare(a.created_at));
  } catch {
    return [];
  }
}

export async function getBook(id: string): Promise<Book | null> {
  try {
    const raw = await fs.readFile(path.join(BOOKS_DIR, `${id}.json`), 'utf-8');
    return JSON.parse(raw) as Book;
  } catch {
    return null;
  }
}
