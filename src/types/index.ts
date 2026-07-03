// ============================================
// Book Types
// ============================================

export type BookFormat = 'pdf' | 'epub';

export interface Book {
  id: string;
  title: string;
  author: string;
  format: BookFormat;
  cover: string | null;
  file: ArrayBuffer;
  totalPages: number;
  addedAt: number;
  lastReadAt: number | null;
}

// ============================================
// Reading Progress Types
// ============================================

export interface ReadingProgress {
  bookId: string;
  currentPage: number;
  percentage: number;
  lastPosition: number;
  updatedAt: number;
}

// ============================================
// Bookmark Types
// ============================================

export interface Bookmark {
  id: string;
  bookId: string;
  page: number;
  position: number;
  label: string;
  createdAt: number;
}

// ============================================
// Highlight Types
// ============================================

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

export interface Highlight {
  id: string;
  bookId: string;
  page: number;
  text: string;
  color: HighlightColor;
  note: string;
  createdAt: number;
}

// ============================================
// Reader Settings Types
// ============================================

export type FontFamily = 'literata' | 'merriweather' | 'lora' | 'source-serif';
export type ThemeMode = 'light' | 'dark' | 'sepia';

export interface ReaderSettings {
  fontSize: number;       // 14-28, default 18
  lineHeight: number;     // 1.5-2.2, default 1.8
  fontFamily: FontFamily;
  theme: ThemeMode;
  margins: number;        // 5-25, default 15
}

// ============================================
// Library Types
// ============================================

export type LibraryView = 'grid' | 'list';
export type LibrarySort = 'title' | 'progress' | 'recently' | 'added';
