'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import ISBNLookupBar from '../components/add-book/ISBNLookupBar';
import TraitSelectorGrid from '../components/add-book/TraitSelectorGrid';
import ManualJsonEntryPanel from '../components/add-book/ManualJsonEntryPanel';
import { api } from '../lib/api';
import { loadDictionary, TraitDefinition } from '../lib/genome-dictionary';
import { BookMetadata, TraitSelection } from '../components/add-book/types';

export default function AddBookPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [bookMetadata, setBookMetadata] = useState<BookMetadata | null>(null);
  const [traitSelections, setTraitSelections] = useState<TraitSelection>({});
  const [traits, setTraits] = useState<TraitDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualJson, setShowManualJson] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTraits();
    }
  }, [isAuthenticated]);

  const loadTraits = async () => {
    try {
      const loadedTraits = await loadDictionary();
      setTraits(loadedTraits);
    } catch (err: any) {
      setError(`Failed to load trait definitions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleISBNLookup = (metadata: BookMetadata) => {
    setBookMetadata(metadata);
    setError(null);
  };

  const handleTraitSelection = (traitIndex: number, expression: string) => {
    setTraitSelections((prev) => ({
      ...prev,
      [traitIndex]: expression,
    }));
  };

  const buildGenomeSequence = (): string => {
    let sequence = '';
    for (let i = 1; i <= 50; i++) {
      sequence += traitSelections[i] || '';
    }
    return sequence;
  };

  const validateForm = (): string | null => {
    if (!bookMetadata?.title) {
      return 'Title is required';
    }
    if (!bookMetadata?.authors || bookMetadata.authors.length === 0) {
      return 'At least one author is required';
    }
    
    // Check all 50 traits are selected
    for (let i = 1; i <= 50; i++) {
      if (!traitSelections[i]) {
        return `Trait ${i} (${traits.find(t => t.index === i)?.name || 'Unknown'}) must have an expression selected`;
      }
    }

    const sequence = buildGenomeSequence();
    if (sequence.length !== 50) {
      return 'All 50 traits must be selected';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      // Step 1: Create genome
      const sequence = buildGenomeSequence();
      const genomeResponse = await api.post<{ _id: string }>('/genomes', {
        sequence,
      });
      const genomeId = genomeResponse._id;

      // Step 2: Create book
      const bookData = {
        title: bookMetadata!.title,
        subtitle: bookMetadata!.subtitle,
        authors: bookMetadata!.authors,
        publicationYear: bookMetadata!.publicationYear,
        isbn10: bookMetadata!.isbn10,
        isbn13: bookMetadata!.isbn13,
        abstract: bookMetadata!.description,
        language: bookMetadata!.language || 'en',
        genomeId,
      };

      const bookResponse = await api.post<{ _id: string }>('/books', bookData);
      
      // Redirect to book page
      router.push(`/books/${bookResponse._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create book');
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="text-center py-8">Loading...</div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Add Book</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Book Information</h2>
            
            <ISBNLookupBar
              onLookup={handleISBNLookup}
              initialMetadata={bookMetadata}
              onMetadataChange={setBookMetadata}
            />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Trait Expressions</h2>
            <p className="text-sm text-gray-800 mb-4">
              Select one expression for each of the 50 traits. All traits must be selected before submission.
            </p>
            
            {traits.length > 0 ? (
              <TraitSelectorGrid
                traits={traits}
                selections={traitSelections}
                onSelectionChange={handleTraitSelection}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                Loading trait definitions...
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating Book...' : 'Create Book'}
            </button>
            
            <button
              type="button"
              onClick={() => setShowManualJson(!showManualJson)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              {showManualJson ? 'Hide' : 'Show'} Advanced JSON Entry
            </button>
          </div>
        </form>

        {showManualJson && (
          <div className="mt-6">
            <ManualJsonEntryPanel
              onSuccess={(bookId) => router.push(`/books/${bookId}`)}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}

