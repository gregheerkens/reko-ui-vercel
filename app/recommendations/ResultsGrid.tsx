import React, { useEffect, useState } from 'react';
import { useWizard } from './WizardContext';
import { api } from '../lib/api';
import Link from 'next/link';

interface Book {
  _id: string;
  title: string;
  coverArtAssetIds: string[];
  authorIds: string[];
}

export const ResultsGrid: React.FC = () => {
  const { genomePattern, resetWizard } = useWizard();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const results = await api.post<Book[]>('/recommendations/match', {
          pattern: genomePattern
        });
        setBooks(results);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [genomePattern]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={resetWizard} className="text-blue-600 underline">
          Try again
        </button>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No perfect matches found</h2>
        <p className="text-gray-600 mb-8">
          Your request was very specific! Try relaxing some of your constraints or choosing "Don't Care" for more options.
        </p>
        <button 
          onClick={resetWizard}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Start Over
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          We found {books.length} match{books.length === 1 ? '' : 'es'}
        </h1>
        <button 
          onClick={resetWizard}
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          Start New Search
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {books.map((book) => (
          <Link href={`/books/${book._id}`} key={book._id} className="block group">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
              <div className="aspect-[2/3] bg-gray-100 relative">
                 <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                   No Cover
                 </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 truncate">
                  {book.title}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

