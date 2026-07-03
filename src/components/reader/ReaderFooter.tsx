'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ReaderFooterProps {
  visible: boolean;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export default function ReaderFooter({
  visible,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
}: ReaderFooterProps) {
  const percentage = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.footer
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-50"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* Progress bar */}
          <div className="w-full h-[3px] bg-white/10">
            <motion.div
              className="h-full rounded-r-full"
              style={{ backgroundColor: '#818cf8' }}
              initial={false}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          {/* Footer content */}
          <div className="flex items-center justify-between px-4 h-[52px]">
            {/* Prev button */}
            <button
              onClick={onPrevPage}
              disabled={currentPage <= 1}
              className="flex items-center justify-center w-10 h-10 rounded-full
                         hover:bg-white/10 transition-colors text-white/90
                         disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft size={22} />
            </button>

            {/* Page info */}
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <span className="font-medium tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <span className="text-xs text-white/50">
                {percentage}%
              </span>
            </div>

            {/* Next button */}
            <button
              onClick={onNextPage}
              disabled={currentPage >= totalPages}
              className="flex items-center justify-center w-10 h-10 rounded-full
                         hover:bg-white/10 transition-colors text-white/90
                         disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </motion.footer>
      )}
    </AnimatePresence>
  );
}
