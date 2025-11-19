'use client';

import { useState } from 'react';
import { BookMetadata, OpenLibraryBook } from './types';

interface ISBNLookupBarProps {
  onLookup: (metadata: BookMetadata) => void;
  initialMetadata?: BookMetadata | null;
  onMetadataChange: (metadata: BookMetadata | null) => void;
}

export function validateISBN(isbn: string): boolean {
  const normalized = isbn.replace(/[-\s]/g, '');
  return /^\d{10}$|^\d{13}$/.test(normalized);
}

export function normalizeISBN(isbn: string): string {
  return isbn.replace(/[-\s]/g, '');
}

export default function ISBNLookupBar({
  onLookup,
  initialMetadata,
  onMetadataChange,
}: ISBNLookupBarProps) {
  const [isbn, setIsbn] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<BookMetadata | null>(initialMetadata || null);

  const handleISBNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsbn(e.target.value);
    setLookupError(null);
  };

  const handleLookup = async () => {
    const normalized = normalizeISBN(isbn);
    
    if (!validateISBN(normalized)) {
      setLookupError('Invalid ISBN format. Please enter a valid ISBN-10 or ISBN-13.');
      return;
    }

    setLookingUp(true);
    setLookupError(null);

    try {
      const response = await fetch(`https://openlibrary.org/isbn/${normalized}.json`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setLookupError('Book not found for this ISBN. You can still enter the information manually.');
        } else {
          setLookupError('Failed to lookup ISBN. Please try again or enter information manually.');
        }
        setLookingUp(false);
        return;
      }

      const data: OpenLibraryBook = await response.json();

      // Extract authors - they may be in the root or need to be fetched from works
      const authors: string[] = [];
      
      // First, try authors in root (some responses have them directly)
      if (data.authors && Array.isArray(data.authors)) {
        for (const author of data.authors) {
          if (author.name) {
            authors.push(author.name);
          } else if (author.key) {
            // Try to fetch author name from key
            try {
              const authorResponse = await fetch(`https://openlibrary.org${author.key}.json`);
              if (authorResponse.ok) {
                const authorData = await authorResponse.json();
                if (authorData.name) {
                  authors.push(authorData.name);
                }
              }
            } catch {
              // Skip if author fetch fails
            }
          }
        }
      }
      
      // If no authors found and works array exists, fetch from work
      if (authors.length === 0 && data.works && data.works.length > 0) {
        try {
          const workKey = data.works[0].key;
          const workResponse = await fetch(`https://openlibrary.org${workKey}.json`);
          if (workResponse.ok) {
            const workData = await workResponse.json();
            if (workData.authors && Array.isArray(workData.authors)) {
              for (const authorRef of workData.authors) {
                if (authorRef.author && authorRef.author.key) {
                  try {
                    const authorResponse = await fetch(`https://openlibrary.org${authorRef.author.key}.json`);
                    if (authorResponse.ok) {
                      const authorData = await authorResponse.json();
                      if (authorData.name) {
                        authors.push(authorData.name);
                      }
                    }
                  } catch {
                    // Skip if author fetch fails
                  }
                }
              }
            }
          }
        } catch {
          // Skip if work fetch fails
        }
      }

      // Extract description
      let description: string | undefined;
      if (typeof data.description === 'string') {
        description = data.description;
      } else if (data.description?.value) {
        description = data.description.value;
      }

      // Extract publication year
      let publicationYear: number | undefined;
      if (data.publish_date) {
        const yearMatch = data.publish_date.match(/\d{4}/);
        if (yearMatch) {
          publicationYear = parseInt(yearMatch[0], 10);
        }
      }

      // Determine ISBN-10 and ISBN-13 (OpenLibrary returns arrays)
      const isbn10 = normalized.length === 10 ? normalized : (data.isbn_10 && data.isbn_10.length > 0 ? data.isbn_10[0] : undefined);
      const isbn13 = normalized.length === 13 ? normalized : (data.isbn_13 && data.isbn_13.length > 0 ? data.isbn_13[0] : undefined);

      // Build cover URL if covers array exists
      let coverUrl: string | undefined;
      if (data.covers && data.covers.length > 0) {
        coverUrl = `https://covers.openlibrary.org/b/id/${data.covers[0]}-M.jpg`;
      }

      const newMetadata: BookMetadata = {
        title: data.title || '',
        authors: authors.length > 0 ? authors : [''],
        description,
        publicationYear,
        publishers: data.publishers,
        isbn10,
        isbn13,
        coverUrl,
        language: data.languages && data.languages.length > 0 
          ? data.languages[0].key.replace('/languages/', '') || 'en'
          : 'en', // Extract language code from /languages/eng format
      };

      setMetadata(newMetadata);
      onLookup(newMetadata);
      onMetadataChange(newMetadata);
    } catch (err: any) {
      setLookupError('Failed to lookup ISBN. Please try again or enter information manually.');
      console.error('ISBN lookup error:', err);
    } finally {
      setLookingUp(false);
    }
  };

  const handleMetadataChange = (field: keyof BookMetadata, value: any) => {
    const updated = { ...metadata } as BookMetadata;
    (updated as any)[field] = value;
    setMetadata(updated);
    onMetadataChange(updated);
  };

  const handleAuthorsChange = (index: number, value: string) => {
    if (!metadata) return;
    const authors = [...metadata.authors];
    authors[index] = value;
    handleMetadataChange('authors', authors);
  };

  const addAuthor = () => {
    if (!metadata) return;
    handleMetadataChange('authors', [...metadata.authors, '']);
  };

  const removeAuthor = (index: number) => {
    if (!metadata || metadata.authors.length <= 1) return;
    const authors = metadata.authors.filter((_, i) => i !== index);
    handleMetadataChange('authors', authors);
  };

  return (
    <div className="space-y-4 text-zinc-800">
      <div>
        <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 mb-2">
          ISBN Lookup
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="isbn"
            value={isbn}
            onChange={handleISBNChange}
            placeholder="Enter ISBN-10 or ISBN-13"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={lookingUp}
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={lookingUp || !isbn.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {lookingUp ? 'Looking up...' : 'Lookup'}
          </button>
        </div>
        {lookupError && (
          <p className="mt-2 text-sm text-red-600">{lookupError}</p>
        )}
      </div>

      {metadata && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={metadata.title}
              onChange={(e) => handleMetadataChange('title', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-2">
              Subtitle
            </label>
            <input
              type="text"
              id="subtitle"
              value={metadata.subtitle || ''}
              onChange={(e) => handleMetadataChange('subtitle', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authors <span className="text-red-500">*</span>
            </label>
            {metadata.authors.map((author, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={author}
                  onChange={(e) => handleAuthorsChange(index, e.target.value)}
                  required
                  placeholder="Author name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {metadata.authors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAuthor(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addAuthor}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Author
            </button>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={metadata.description || ''}
              onChange={(e) => handleMetadataChange('description', e.target.value || undefined)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="publicationYear" className="block text-sm font-medium text-gray-700 mb-2">
                Publication Year
              </label>
              <input
                type="number"
                id="publicationYear"
                value={metadata.publicationYear || ''}
                onChange={(e) => handleMetadataChange('publicationYear', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <input
                type="text"
                id="language"
                value={metadata.language || 'en'}
                onChange={(e) => handleMetadataChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="isbn10" className="block text-sm font-medium text-gray-700 mb-2">
                ISBN-10
              </label>
              <input
                type="text"
                id="isbn10"
                value={metadata.isbn10 || ''}
                onChange={(e) => handleMetadataChange('isbn10', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="isbn13" className="block text-sm font-medium text-gray-700 mb-2">
                ISBN-13
              </label>
              <input
                type="text"
                id="isbn13"
                value={metadata.isbn13 || ''}
                onChange={(e) => handleMetadataChange('isbn13', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {metadata.coverUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image
              </label>
              <img
                src={metadata.coverUrl}
                alt="Book cover"
                className="max-w-xs h-auto border border-gray-300 rounded"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

