'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Upload } from 'lucide-react';
import { addBook as addBookToDb, getAllBooks, deleteBook, getProgress } from '@/lib/db';
import { useLibraryStore } from '@/lib/library-store';
import type { Book, LibraryView, LibrarySort } from '@/types';
import AppHeader from '@/components/layout/AppHeader';
import BookCard from '@/components/library/BookCard';
import BookList from '@/components/library/BookList';
import LibraryToolbar from '@/components/library/LibraryToolbar';
import UploadZone from '@/components/library/UploadZone';

type FilterValue = 'all' | 'reading' | 'finished' | 'unread';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<FilterValue>('all');

  const libraryView = useLibraryStore((s: LibraryStoreState) => s.libraryView);
  const librarySort = useLibraryStore((s: LibraryStoreState) => s.librarySort);
  const searchQuery = useLibraryStore((s: LibraryStoreState) => s.searchQuery);

  // Load books from IndexedDB on mount
  useEffect(() => {
    (async () => {
      try {
        const allBooks = await getAllBooks();
        setBooks(allBooks);
        // Load real progress from IndexedDB for each book
        const progressMap: Record<string, number> = {};
        await Promise.all(
          allBooks.map(async (b) => {
            const p = await getProgress(b.id);
            progressMap[b.id] = p?.percentage ?? 0;
          })
        );
        setProgress(progressMap);
      } catch {
        // IndexedDB not available
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const handleUploadComplete = useCallback((newBook: Book) => {
    setBooks((prev) => [newBook, ...prev]);
    setProgress((prev) => ({ ...prev, [newBook.id]: 0 }));
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteBook(id);
      setBooks((prev) => prev.filter((b) => b.id !== id));
      setProgress((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      console.error('Gagal menghapus buku:', err);
    }
  }, []);

  // Filter by search
  let filtered = books;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    );
  }

  // Filter by category
  if (filter !== 'all') {
    filtered = filtered.filter((b) => {
      const p = progress[b.id] ?? 0;
      switch (filter) {
        case 'reading':
          return p > 0 && p < 100;
        case 'finished':
          return p === 100;
        case 'unread':
          return p === 0;
        default:
          return true;
      }
    });
  }

  // Sort
  const sorted = [...filtered].sort((a: Book, b: Book) => {
    switch (librarySort) {
      case 'title':
        return a.title.localeCompare(b.title, 'id');
      case 'progress':
        return (progress[b.id] ?? 0) - (progress[a.id] ?? 0);
      case 'recently':
        return (b.lastReadAt ?? 0) - (a.lastReadAt ?? 0);
      case 'added':
      default:
        return b.addedAt - a.addedAt;
    }
  });

  // Continue reading: books with progress > 0, sorted by lastRead
  const continueReading = [...books]
    .filter((b: Book) => (progress[b.id] ?? 0) > 0)
    .sort((a: Book, b: Book) => (b.lastReadAt ?? 0) - (a.lastReadAt ?? 0))
    .slice(0, 3);

  const isEmpty = loaded && books.length === 0;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Welcome */}
        <section className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Selamat Datang, Rafli 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Lanjutkan membaca atau unggah buku baru untuk memulai.
          </p>
        </section>

        {!loaded ? (
          /* Loading skeleton */
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : isEmpty ? (
          /* Empty state */
          <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 py-20 dark:border-zinc-700">
            <BookOpen className="mb-4 h-16 w-16 text-zinc-300 dark:text-zinc-600" />
            <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
              Belum ada buku
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Unggah buku PDF atau EPUB pertamamu untuk mulai membaca.
            </p>
            <label className="mt-6 cursor-pointer rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
              <input
                type="file"
                accept=".pdf,.epub"
                className="hidden"
                onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const ext = file.name.split('.').pop()?.toLowerCase();
                  if (ext !== 'pdf' && ext !== 'epub') return;
                  const newBook: Book = {
                    id: crypto.randomUUID(),
                    title: file.name.replace(/\.[^.]+$/, ''),
                    author: 'Unknown',
                    format: ext as 'pdf' | 'epub',
                    cover: null,
                    file: await file.arrayBuffer(),
                    totalPages: 1,
                    addedAt: Date.now(),
                    lastReadAt: null,
                  };
                  await addBookToDb(newBook);
                  setBooks((prev: Book[]) => [newBook, ...prev]);
                  setProgress((prev) => ({ ...prev, [newBook.id]: 0 }));
                }}
              />
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Unggah Buku
              </span>
            </label>
          </section>
        ) : (
          <>
            {/* Continue Reading */}
            {continueReading.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                  Lanjutkan Membaca
                </h2>
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-2 gap-4 sm:grid-cols-3"
                >
                  {continueReading.map((book: Book) => (
                    <motion.div key={book.id} variants={itemVariant}>
                      <BookCard
                        book={book}
                        progress={progress[book.id] ?? 0}
                        onDelete={handleDelete}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            )}

            {/* Library */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                Perpustakaan
              </h2>
              <LibraryToolbar filter={filter} onFilterChange={setFilter} />

              {sorted.length === 0 ? (
                <p className="py-12 text-center text-sm text-zinc-400">
                  Tidak ada buku yang cocok.
                </p>
              ) : libraryView === 'grid' ? (
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
                >
                  {sorted.map((book: Book) => (
                    <motion.div key={book.id} variants={itemVariant}>
                      <BookCard
                        book={book}
                        progress={progress[book.id] ?? 0}
                        onDelete={handleDelete}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) :(
                <div className="mt-4 space-y-1">
                  {sorted.map((book: Book) => (
                    <BookList
                      key={book.id}
                      book={book}
                      progress={progress[book.id] ?? 0}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Upload Zone */}
        <section className="mt-12">
          <UploadZone onUploadComplete={handleUploadComplete} />
        </section>
      </main>
    </div>
  );
}

// Internal type for the store selector to avoid implicit any
interface LibraryStoreState {
  searchQuery: string;
  libraryView: LibraryView;
  librarySort: LibrarySort;
}
