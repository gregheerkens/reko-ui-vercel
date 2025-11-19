'use client';

import { useState } from 'react';
import { api } from '../../lib/api';

interface ManualJsonEntryPanelProps {
  onSuccess: (bookId: string) => void;
}

const EXAMPLE_JSON = {
  title: 'Example Book Title',
  subtitle: 'Optional Subtitle',
  authors: ['Author Name'],
  seriesName: 'Optional Series Name',
  seriesOrder: 1,
  publicationYear: 2024,
  isbn10: '0123456789',
  isbn13: '9780123456789',
  abstract: 'Book description or abstract',
  language: 'en',
  genomeSequence: 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', // 50 characters - one expression per trait
  coverArtAssetIds: [],
  tagsGlobal: [],
};

function sanitizeString(value: any): any {
  if (typeof value === 'string') {
    // Remove script tags and other potentially dangerous HTML tags
    // We don't escape HTML entities since we're sending JSON, not HTML
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers like onclick=
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeString);
  }
  if (value && typeof value === 'object') {
    const sanitized: any = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeString(val);
    }
    return sanitized;
  }
  return value;
}

function validateBookJson(data: any): string | null {
  // Check required fields
  if (!data.title || typeof data.title !== 'string') {
    return 'Title is required and must be a string';
  }

  if (!data.authors || !Array.isArray(data.authors) || data.authors.length === 0) {
    return 'Authors is required and must be a non-empty array';
  }

  if (!data.genomeSequence || typeof data.genomeSequence !== 'string') {
    return 'genomeSequence is required and must be a string';
  }

  if (data.genomeSequence.length !== 50) {
    return 'genomeSequence must be exactly 50 characters (one expression per trait)';
  }

  // Validate optional fields
  if (data.subtitle !== undefined && typeof data.subtitle !== 'string') {
    return 'subtitle must be a string if provided';
  }

  if (data.seriesOrder !== undefined && (!data.seriesName || typeof data.seriesName !== 'string')) {
    return 'seriesOrder cannot be present without seriesName';
  }

  if (data.seriesOrder !== undefined && (typeof data.seriesOrder !== 'number' || data.seriesOrder < 1)) {
    return 'seriesOrder must be a number >= 1 if provided';
  }

  if (data.publicationYear !== undefined && typeof data.publicationYear !== 'number') {
    return 'publicationYear must be a number if provided';
  }

  if (data.isbn10 !== undefined && typeof data.isbn10 !== 'string') {
    return 'isbn10 must be a string if provided';
  }

  if (data.isbn13 !== undefined && typeof data.isbn13 !== 'string') {
    return 'isbn13 must be a string if provided';
  }

  if (data.abstract !== undefined && typeof data.abstract !== 'string') {
    return 'abstract must be a string if provided';
  }

  if (data.language !== undefined && typeof data.language !== 'string') {
    return 'language must be a string if provided';
  }

  if (data.coverArtAssetIds !== undefined && !Array.isArray(data.coverArtAssetIds)) {
    return 'coverArtAssetIds must be an array if provided';
  }

  if (data.tagsGlobal !== undefined && !Array.isArray(data.tagsGlobal)) {
    return 'tagsGlobal must be an array if provided';
  }

  // Check for additional properties (whitelist validation)
  const allowedKeys = [
    'title',
    'subtitle',
    'authors',
    'seriesName',
    'seriesOrder',
    'publicationYear',
    'isbn10',
    'isbn13',
    'abstract',
    'language',
    'genomeSequence',
    'coverArtAssetIds',
    'tagsGlobal',
    'addedByUserId',
  ];

  const dataKeys = Object.keys(data);
  const invalidKeys = dataKeys.filter((key) => !allowedKeys.includes(key));
  if (invalidKeys.length > 0) {
    return `Invalid properties: ${invalidKeys.join(', ')}. Only allowed properties are: ${allowedKeys.join(', ')}`;
  }

  return null;
}

export default function ManualJsonEntryPanel({ onSuccess }: ManualJsonEntryPanelProps) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!jsonText.trim()) {
      setError('Please enter JSON data');
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err: any) {
      setError(`Invalid JSON: ${err.message}`);
      return;
    }

    // Validate structure
    const validationError = validateBookJson(parsed);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Sanitize the data
    const sanitized = sanitizeString(parsed);

    setSubmitting(true);

    try {
      // Use the endpoint that creates genome on the fly
      const response = await api.post<{ _id: string }>('/books/with-genome-sequence', sanitized);
      onSuccess(response._id);
    } catch (err: any) {
      setError(err.message || 'Failed to create book');
      setSubmitting(false);
    }
  };

  const handleLoadExample = () => {
    setJsonText(JSON.stringify(EXAMPLE_JSON, null, 2));
    setError(null);
  };

  return (
    <div className="bg-gray-50 border border-gray-800 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Advanced JSON Entry
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          For advanced users: Enter book data directly as JSON. The genomeSequence must be exactly 50 characters (one expression per trait, in order 1-50). All fields will be validated and sanitized.
        </p>
        <button
          type="button"
          onClick={handleLoadExample}
          className="text-sm text-blue-600 hover:text-blue-800 mb-4"
        >
          Load Example JSON
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
          {error}
        </div>
      )}

      <textarea
        value={jsonText}
        onChange={(e) => {
          setJsonText(e.target.value);
          setError(null);
        }}
        placeholder="Enter JSON data here..."
        className="w-full h-64 px-3 py-2 border border-gray-300 text-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        spellCheck={false}
      />

      <div className="mt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !jsonText.trim()}
          className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creating Book...' : 'Create Book from JSON'}
        </button>
      </div>
    </div>
  );
}

