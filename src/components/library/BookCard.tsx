'use client';

import { Book } from '@/types';
import { Book as BookIcon, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface BookCardProps {
  book: Book;
  progress: number;
  onDelete?: (id: string) => void;
}

export default function BookCard({ book, progress, onDelete }: BookCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <Link href={`/book/${book.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-zinc-100 shadow-sm transition-shadow duration-200 group-hover:shadow-md dark:bg-zinc-800">
          {book.cover ? (
            <Image
              src={book.cover}
              alt={book.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40">
              <BookIcon className="h-12 w-12 text-emerald-400 dark:text-emerald-500" />
            </div>
          )}

          {/* Format badge */}
          <span className="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white backdrop-blur-sm">
            {book.format}
          </span>

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
              className="absolute top-2 left-2 rounded bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600 backdrop-blur-sm"
              title="Hapus buku"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="mt-2 px-0.5">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">
            {book.title}
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {book.author}
          </p>

          {/* Progress bar */}
          <div className="mt-2">
            <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
              {progress}%
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
