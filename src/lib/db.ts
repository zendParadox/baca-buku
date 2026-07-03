import { openDB, type IDBPDatabase } from 'idb';
import type {
  Book,
  ReadingProgress,
  Bookmark,
  Highlight,
} from '@/types';

// ============================================
// Database Configuration
// ============================================

const DB_NAME = 'baca-buku-db';
const DB_VERSION = 1;

interface BacaBukuDB {
  books: {
    key: string;
    value: Book;
    indexes: {
      'by-title': string;
      'by-author': string;
      'by-addedAt': number;
    };
  };
  progress: {
    key: string;
    value: ReadingProgress;
    indexes: {
      'by-bookId': string;
    };
  };
  bookmarks: {
    key: string;
    value: Bookmark;
    indexes: {
      'by-bookId': string;
    };
  };
  highlights: {
    key: string;
    value: Highlight;
    indexes: {
      'by-bookId': string;
    };
  };
}

// ============================================
// Database Initialization
// ============================================

let dbPromise: Promise<IDBPDatabase<BacaBukuDB>> | null = null;

function getDB(): Promise<IDBPDatabase<BacaBukuDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BacaBukuDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Books store
        if (!db.objectStoreNames.contains('books')) {
          const bookStore = db.createObjectStore('books', { keyPath: 'id' });
          bookStore.createIndex('by-title', 'title');
          bookStore.createIndex('by-author', 'author');
          bookStore.createIndex('by-addedAt', 'addedAt');
        }

        // Progress store
        if (!db.objectStoreNames.contains('progress')) {
          const progressStore = db.createObjectStore('progress', {
            keyPath: 'bookId',
          });
          progressStore.createIndex('by-bookId', 'bookId');
        }

        // Bookmarks store
        if (!db.objectStoreNames.contains('bookmarks')) {
          const bookmarkStore = db.createObjectStore('bookmarks', {
            keyPath: 'id',
          });
          bookmarkStore.createIndex('by-bookId', 'bookId');
        }

        // Highlights store
        if (!db.objectStoreNames.contains('highlights')) {
          const highlightStore = db.createObjectStore('highlights', {
            keyPath: 'id',
          });
          highlightStore.createIndex('by-bookId', 'bookId');
        }
      },
    });
  }
  return dbPromise;
}

// ============================================
// Book CRUD Operations
// ============================================

export async function addBook(book: Book): Promise<void> {
  const db = await getDB();
  await db.put('books', book);
}

export async function getBook(id: string): Promise<Book | undefined> {
  const db = await getDB();
  return db.get('books', id);
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await getDB();
  return db.getAll('books');
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['books', 'progress', 'bookmarks', 'highlights'], 'readwrite');

  // Delete the book
  await tx.objectStore('books').delete(id);

  // Delete associated progress
  await tx.objectStore('progress').delete(id);

  // Delete associated bookmarks
  const bookmarkIndex = tx.objectStore('bookmarks').index('by-bookId');
  const bookmarkCursor = await bookmarkIndex.openCursor(IDBKeyRange.only(id));
  if (bookmarkCursor) {
    let cursor: typeof bookmarkCursor | null = bookmarkCursor;
    while (cursor) {
      cursor.delete();
      cursor = await cursor.continue();
    }
  }

  // Delete associated highlights
  const highlightIndex = tx.objectStore('highlights').index('by-bookId');
  const highlightCursor = await highlightIndex.openCursor(IDBKeyRange.only(id));
  if (highlightCursor) {
    let cursor: typeof highlightCursor | null = highlightCursor;
    while (cursor) {
      cursor.delete();
      cursor = await cursor.continue();
    }
  }

  await tx.done;
}

// ============================================
// Reading Progress Operations
// ============================================

export async function saveProgress(progress: ReadingProgress): Promise<void> {
  const db = await getDB();
  await db.put('progress', progress);
}

export async function getProgress(
  bookId: string
): Promise<ReadingProgress | undefined> {
  const db = await getDB();
  return db.get('progress', bookId);
}

// ============================================
// Bookmark Operations
// ============================================

export async function addBookmark(bookmark: Bookmark): Promise<void> {
  const db = await getDB();
  await db.put('bookmarks', bookmark);
}

export async function getBookmarks(bookId: string): Promise<Bookmark[]> {
  const db = await getDB();
  return db.getAllFromIndex('bookmarks', 'by-bookId', bookId);
}

export async function deleteBookmark(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('bookmarks', id);
}

// ============================================
// Highlight Operations
// ============================================

export async function addHighlight(highlight: Highlight): Promise<void> {
  const db = await getDB();
  await db.put('highlights', highlight);
}

export async function getHighlights(bookId: string): Promise<Highlight[]> {
  const db = await getDB();
  return db.getAllFromIndex('highlights', 'by-bookId', bookId);
}

export async function deleteHighlight(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('highlights', id);
}

// ============================================
// Library Export / Import
// ============================================

export async function exportLibrary(): Promise<string> {
  const db = await getDB();

  const books = await db.getAll('books');
  const progress = await db.getAll('progress');
  const bookmarks = await db.getAll('bookmarks');
  const highlights = await db.getAll('highlights');

  // Convert Blobs to base64 for serialization
  const serializedBooks = await Promise.all(
    books.map(async (book) => {
      const arrayBuffer = book.file instanceof ArrayBuffer ? book.file : await book.file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );
      return {
        ...book,
        file: base64,
        _isSerializedBlob: true,
      };
    })
  );

  const exportData = {
    version: 1,
    exportedAt: Date.now(),
    data: {
      books: serializedBooks,
      progress,
      bookmarks,
      highlights,
    },
  };

  return JSON.stringify(exportData);
}

export async function importLibrary(jsonString: string): Promise<{
  books: number;
  progress: number;
  bookmarks: number;
  highlights: number;
}> {
  const importData = JSON.parse(jsonString);

  if (!importData.version || !importData.data) {
    throw new Error('Invalid library file format');
  }

  const { books, progress, bookmarks, highlights } = importData.data;

  const db = await getDB();
  const tx = db.transaction(
    ['books', 'progress', 'bookmarks', 'highlights'],
    'readwrite'
  );

  // Import books (convert base64 back to Blob)
  let bookCount = 0;
  for (const serializedBook of books) {
    const { file: base64, _isSerializedBlob, ...bookData } = serializedBook;
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/octet-stream' });

    await tx.objectStore('books').put({
      ...bookData,
      file: blob,
    });
    bookCount++;
  }

  // Import progress
  let progressCount = 0;
  for (const p of progress) {
    await tx.objectStore('progress').put(p);
    progressCount++;
  }

  // Import bookmarks
  let bookmarkCount = 0;
  for (const b of bookmarks) {
    await tx.objectStore('bookmarks').put(b);
    bookmarkCount++;
  }

  // Import highlights
  let highlightCount = 0;
  for (const h of highlights) {
    await tx.objectStore('highlights').put(h);
    highlightCount++;
  }

  await tx.done;

  return {
    books: bookCount,
    progress: progressCount,
    bookmarks: bookmarkCount,
    highlights: highlightCount,
  };
}
