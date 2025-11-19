export interface OpenLibraryBook {
  title?: string;
  authors?: Array<{ name?: string; key?: string }>;
  publish_date?: string;
  publishers?: string[];
  description?: string | { value?: string; type?: string };
  covers?: number[];
  isbn_10?: string[];
  isbn_13?: string[];
  works?: Array<{ key: string }>;
  languages?: Array<{ key: string }>;
}

export interface BookMetadata {
  title: string;
  authors: string[];
  subtitle?: string;
  description?: string;
  publicationYear?: number;
  publishers?: string[];
  isbn10?: string;
  isbn13?: string;
  coverUrl?: string;
  language?: string;
}

export interface TraitSelection {
  [traitIndex: number]: string; // trait index -> expression letter
}

