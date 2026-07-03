'use client';

import { useCallback } from 'react';
import { ArrowLeft, Settings, Bookmark, List, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface ReaderHeaderProps {
  title: string;
  visible: boolean;
  onToggleSettings: () => void;
  onToggleChapterNav: () => void;
  onToggleSearch: () => void;
  onToggleBookmark: () => void;
  isBookmarked: boolean;
}

export default function ReaderHeader({
  title,
  visible,
  onToggleSettings,
  onToggleChapterNav,
  onToggleSearch,
  onToggleBookmark,
  isBookmarked,
}: ReaderHeaderProps) {
  const router = useRouter();

  const handleBack = useCallback(() => {
    router.push('/');
  }, [router]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.header
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-[60px]"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* Back button */}
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 rounded-full
                       hover:bg-white/10 transition-colors text-white/90"
            aria-label="Kembali"
          >
            <ArrowLeft size={22} />
          </button>

          {/* Book title */}
          <h1 className="flex-1 text-center text-sm font-medium text-white/90 truncate px-4">
            {title}
          </h1>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleSearch}
              className="flex items-center justify-center w-10 h-10 rounded-full
                         hover:bg-white/10 transition-colors text-white/90"
              aria-label="Cari dalam buku"
            >
              <Search size={20} />
            </button>
            <button
              onClick={onToggleChapterNav}
              className="flex items-center justify-center w-10 h-10 rounded-full
                         hover:bg-white/10 transition-colors text-white/90"
              aria-label="Daftar bab"
            >
              <List size={20} />
            </button>
            <button
              onClick={onToggleBookmark}
              className="flex items-center justify-center w-10 h-10 rounded-full
                         hover:bg-white/10 transition-colors text-white/90"
              aria-label={isBookmarked ? 'Hapus bookmark' : 'Tambah bookmark'}
            >
              <Bookmark
                size={20}
                fill={isBookmarked ? 'currentColor' : 'none'}
                className={isBookmarked ? 'text-yellow-400' : ''}
              />
            </button>
            <button
              onClick={onToggleSettings}
              className="flex items-center justify-center w-10 h-10 rounded-full
                         hover:bg-white/10 transition-colors text-white/90"
              aria-label="Pengaturan"
            >
              <Settings size={20} />
            </button>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
