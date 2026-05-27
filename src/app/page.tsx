import Link from 'next/link';
import { listBooks } from '@/lib/books';
import LibraryHome from '@/components/LibraryHome';

export default async function Home() {
  const books = await listBooks();
  return <LibraryHome books={books} />;
}
