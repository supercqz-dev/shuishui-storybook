import { notFound } from 'next/navigation';
import { getBook, listBooks } from '@/lib/books';
import BookReader from '@/components/BookReader';

export async function generateStaticParams() {
  const books = await listBooks();
  return books.map((b) => ({ id: b.id }));
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) notFound();
  return <BookReader book={book} />;
}
