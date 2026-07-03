'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen } from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  page: number;
}

interface ChapterNavProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  currentPage: number;
  onChapterSelect: (page: number) => void;
}

export default function ChapterNav({
  isOpen,
  onClose,
  chapters,
  currentPage,
  onChapterSelect,
}: ChapterNavProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Scroll active chapter into view
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [isOpen]);

  // Find current chapter (the one whose page is <= currentPage)
  const currentChapterIndex = chapters.findIndex((ch, i) => {
    const nextChapter = chapters[i + 1];
    return currentPage >= ch.page && (!nextChapter || currentPage < nextChapter.page);
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/30"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 z-[70] w-[300px] max-w-[80vw]
                       bg-white dark:bg-zinc-900 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-indigo-500" />
                <h2 className="text-base font-semibold">Daftar Bab</h2>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full
                           hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Tutup daftar bab"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chapter list */}
            <div ref={listRef} className="overflow-y-auto h-full pb-20">
              {chapters.length === 0 ? (
                <div className="p-6 text-center text-sm text-zinc-500">
                  Tidak ada bab tersedia
                </div>
              ) : (
                <div className="py-2">
                  {chapters.map((chapter, index) => {
                    const isActive = index === currentChapterIndex;
                    return (
                      <button
                        key={chapter.id}
                        ref={isActive ? activeRef : undefined}
                        onClick={() => {
                          onChapterSelect(chapter.page);
                          onClose();
                        }}
                        className={`w-full text-left px-5 py-3 flex items-start gap-3
                                    transition-colors ${
                                      isActive
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-r-2 border-indigo-500'
                                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                    }`}
                      >
                        <span
                          className={`text-xs mt-0.5 tabular-nums ${
                            isActive
                              ? 'text-indigo-500 font-semibold'
                              : 'text-zinc-400'
                          }`}
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm truncate ${
                              isActive
                                ? 'font-medium text-indigo-700 dark:text-indigo-300'
                                : 'text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {chapter.title}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Hal. {chapter.page}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
