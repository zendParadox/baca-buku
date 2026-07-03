'use client';

import { Book } from '@/types';
import { Book as BookIcon, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface BookListProps {
  book: Book;
  progress: number;
  onDelete?: (id: string) => void;
}

export default function BookList({ book, progress, onDelete }: BookListProps) {
  const formatBadge =
    book.format === 'pdf'
      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
    >
      <Link
        href={`/book/${book.id}`}
        className="flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      >
        {/* Cover thumbnail */}
        <div className="relative h-[60px] w-[40px] shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
          {book.cover ? (
            <Image
              src={book.cover}
              alt={book.title}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40">
              <BookIcon className="h-4 w-4 text-emerald-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {book.title}
          </p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {book.author}
          </p>
        </div>

        {/* Format badge */}
        <span
          className={`hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase sm:inline-block ${formatBadge}`}
        >
          {book.format}
        </span>

        {/* Progress */}
        <div className="hidden w-20 shrink-0 sm:block">
          <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-0.5 text-right text-[10px] text-zinc-400">
            {progress}%
          </p>
        </div>

        {/* Last read */}
        <p className="hidden w-24 shrink-0 text-right text-xs text-zinc-400 lg:block">
          {book.lastReadAt
            ? new Date(book.lastReadAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </p>

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (window.confirm(`Hapus "${book.title}"?`)) {
                onDelete(book.id);
              }
            }}
            className="shrink-0 rounded p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
            title="Hapus buku"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </Link>
    </motion.div>
  );
}
