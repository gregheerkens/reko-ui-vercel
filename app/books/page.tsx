'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import Link from 'next/link';

interface Author {
  id: string;
  name: string;
  isGhost: boolean;
}

interface Cover {
  id: string;
  imageUrl: string;
  source?: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

interface Book {
  _id: string;
  title: string;
  isbn10?: string;
  isbn13?: string;
  authors: Author[];
  authorIds: string[];
  genomeId: string;
  coverArtAssetIds?: string[];
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [covers, setCovers] = useState<Record<string, Cover | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const data = await api.get<Book[]>('/books');
      console.log('Books loaded:', data.length);
      console.log('Sample book:', data[0] ? { 
        title: data[0].title, 
        coverArtAssetIds: data[0].coverArtAssetIds,
        isbn10: data[0].isbn10,
        isbn13: data[0].isbn13
      } : 'No books');
      setBooks(data);
      
      // Batch fetch covers for all books that have coverArtAssetIds
      const booksWithCovers = data.filter(book => book.coverArtAssetIds && book.coverArtAssetIds.length > 0);
      console.log(`Books with coverArtAssetIds: ${booksWithCovers.length} out of ${data.length}`);
      
      if (booksWithCovers.length > 0) {
        try {
          const bookIds = booksWithCovers.map(book => book._id);
          console.log('Fetching covers for book IDs:', bookIds);
          const batchCoverData = await api.post<{ covers: Record<string, { primaryCover: Cover | null }> }>('/books/covers/batch', { bookIds });
          console.log('Batch cover data received:', batchCoverData);
          
          const coversMap: Record<string, Cover | null> = {};
          Object.entries(batchCoverData.covers).forEach(([bookId, coverData]) => {
            coversMap[bookId] = coverData.primaryCover;
          });
          console.log('Covers map:', coversMap);
          setCovers(coversMap);
        } catch (error) {
          console.error('Failed to batch load covers:', error);
          // Fallback: set empty covers map
          setCovers({});
        }
      } else {
        console.log('No books with coverArtAssetIds, checking for ISBNs to fetch covers...');
        // Check if books have ISBNs but no covers - we could fetch them
        const booksWithIsbn = data.filter(book => (book.isbn10 || book.isbn13) && (!book.coverArtAssetIds || book.coverArtAssetIds.length === 0));
        console.log(`Books with ISBN but no covers: ${booksWithIsbn.length}`);
        setCovers({});
      }
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">Loading books...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-8 text-gray-700">
        <h1 className="text-3xl font-bold mb-6">Books</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <Link
              key={book._id}
              href={`/books/${book._id}`}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow flex flex-col"
            >
              {covers[book._id]?.imageUrl ? (
                <div className="relative w-full h-64 mb-4 rounded overflow-hidden">
                  <Image
                    src={covers[book._id]!.imageUrl}
                    alt={`Cover for ${book.title}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="w-full h-64 mb-4 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-gray-400 text-sm">No cover available</span>
                </div>
              )}
              <h2 className="text-xl font-semibold mb-2">{book.title}</h2>
              <p className="text-gray-600">
                By {book.authors && book.authors.length > 0
                  ? book.authors.map((author) => author.name).join(', ')
                  : 'Unknown'}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}

