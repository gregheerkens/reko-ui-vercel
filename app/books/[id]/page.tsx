'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Layout from '../../components/Layout';
import { api } from '../../lib/api';
import Link from 'next/link';
import {
  loadDictionary,
  parseGenome,
  getTrait,
  getExpression,
  TraitDefinition,
} from '../../lib/genome-dictionary';

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
  subtitle?: string;
  authors: Author[];
  authorIds: string[];
  genomeId: string;
  genome?: string;
  publicationYear?: number;
  isbn10?: string;
  isbn13?: string;
  abstract?: string;
  language?: string;
  coverArtAssetIds: string[];
  tagsGlobal: string[];
  createdAt: string;
  updatedAt: string;
}

export default function BookDetailPage() {
  const params = useParams();
  const bookId = params.id as string;
  const [book, setBook] = useState<Book | null>(null);
  const [cover, setCover] = useState<Cover | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dictionaryLoaded, setDictionaryLoaded] = useState(false);

  useEffect(() => {
    if (bookId) {
      loadBook();
      loadDictionary().then(() => setDictionaryLoaded(true));
    }
  }, [bookId]);

  const loadBook = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Book>(`/books/${bookId}`);
      setBook(data);
      
      // Fetch cover if book has coverArtAssetIds
      if (data.coverArtAssetIds && data.coverArtAssetIds.length > 0) {
        try {
          const coverData = await api.get<{ covers: Cover[]; primaryCover: Cover | null }>(`/books/${bookId}/cover`);
          setCover(coverData.primaryCover);
        } catch (coverErr) {
          console.error('Failed to load cover:', coverErr);
          // Don't fail the whole page if cover fails
        }
      }
    } catch (err: any) {
      console.error('Failed to load book:', err);
      setError(err.message || 'Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">Loading book...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
          <Link href="/books" className="text-blue-600 hover:underline">
            ← Back to Books
          </Link>
        </div>
      </Layout>
    );
  }

  if (!book) {
    return (
      <Layout>
        <div className="px-4 py-8">
          <p>Book not found</p>
          <Link href="/books" className="text-blue-600 hover:underline">
            ← Back to Books
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-8 max-w-4xl mx-auto">
        <Link href="/books" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Books
        </Link>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
              {book.subtitle && (
                <h2 className="text-xl text-gray-600 mb-4">{book.subtitle}</h2>
              )}
              
              <div className="mb-4">
                <p className="text-gray-700">
                  <span className="font-semibold">Authors:</span>{' '}
                  {book.authors && book.authors.length > 0
                    ? book.authors.map((author) => author.name).join(', ')
                    : 'Unknown'}
                </p>
              </div>

              {book.publicationYear && (
                <p className="text-gray-600 mb-2">
                  <span className="font-semibold">Published:</span> {book.publicationYear}
                </p>
              )}

              {book.isbn10 && (
                <p className="text-gray-600 mb-2">
                  <span className="font-semibold">ISBN-10:</span> {book.isbn10}
                </p>
              )}

              {book.isbn13 && (
                <p className="text-gray-600 mb-2">
                  <span className="font-semibold">ISBN-13:</span> {book.isbn13}
                </p>
              )}

              <div className="mt-4">
                  {book.abstract && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-700">{book.abstract}</p>
                  </div>
                )}

                <div className="mt-4 text-sm text-gray-500">
                  <p>Genome ID: {book.genomeId}</p>
                  <p>Language: {book.language || 'en'}</p>
                </div>
              </div>
            </div>
            {cover?.imageUrl ? (
              <div className="relative w-full md:w-64 h-96 md:h-96 rounded overflow-hidden flex shrink-0">
                <Image
                  src={cover.imageUrl}
                  alt={`Cover for ${book.title}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 256px"
                />
              </div>
            ) : (
              <div className="w-full md:w-64 h-96 bg-gray-200 rounded flex items-center justify-center shrink-0">
                <span className="text-gray-400 text-sm">No cover available</span>
              </div>
            )}
          </div>

          {book.genome && dictionaryLoaded && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-4">Genome Traits</h3>
              <div className="mb-2">
                <p className="text-sm text-gray-600 font-mono">{book.genome}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mt-4">
                {parseGenome(book.genome).map(({ traitIndex, expression }) => {
                  const trait = getTrait(traitIndex);
                  const expr = getExpression(traitIndex, expression);
                  if (!trait || !expr) return null;

                  return (
                    <div
                      key={traitIndex}
                      className="border rounded p-2 text-xs"
                      style={{ backgroundColor: expr.color + '20' }}
                      title={`${trait.name}: ${expr.description}\n\n${expr.context}`}
                    >
                      <div className="font-semibold text-xs mb-1">
                        {traitIndex}. {trait.name}
                      </div>
                      <div
                        className="inline-block px-2 py-1 rounded text-white font-bold text-xs"
                        style={{ backgroundColor: expr.color }}
                      >
                        {expression}
                      </div>
                      <div className="mt-1 text-gray-700 text-xs">
                        {expr.short}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

