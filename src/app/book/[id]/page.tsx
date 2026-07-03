'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { getBook, getProgress, saveProgress } from '@/lib/db';
import { useReaderStore } from '@/lib/store';
import type { Book, ReadingProgress } from '@/types';
import ReaderView from '@/components/reader/ReaderView';
import ReaderHeader from '@/components/reader/ReaderHeader';
import ReaderFooter from '@/components/reader/ReaderFooter';
import ReaderSettings from '@/components/reader/ReaderSettings';
import ChapterNav from '@/components/reader/ChapterNav';
import SearchInBook from '@/components/reader/SearchInBook';

// Theme CSS maps
const THEME_CLASSES: Record<string, { bg: string; fg: string }> = {
  light: { bg: '#ffffff', fg: '#1a1a1a' },
  dark: { bg: '#121212', fg: '#e0e0e0' },
  sepia: { bg: '#f4ecd8', fg: '#5c4b37' },
};

export default function BookReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const settings = useReaderStore();

  // State
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUI, setShowUI] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chapterNavOpen, setChapterNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [realChapters, setRealChapters] = useState<{ id: string; title: string; page: number }[]>([]);

  const uiTimerRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-hide UI timer
  const resetUITimer = useCallback(() => {
    if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
    setShowUI(true);
    uiTimerRef.current = setTimeout(() => {
      if (!settingsOpen && !chapterNavOpen && !searchOpen) {
        setShowUI(false);
      }
    }, 3000);
  }, [settingsOpen, chapterNavOpen, searchOpen]);

  // Mouse/touch interaction to show UI
  useEffect(() => {
    function handleMouseMove() {
      resetUITimer();
    }

    function handleTouchStart() {
      resetUITimer();
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
    };
  }, [resetUITimer]);

  // Load book from DB
  useEffect(() => {
    async function loadBook() {
      try {
        const bookData = await getBook(id);
        if (!bookData) {
          router.replace('/');
          return;
        }
        setBook(bookData);

        // Set total pages from book metadata
        if (bookData.totalPages && bookData.totalPages > 1) {
          setTotalPages(bookData.totalPages);
        }

        // Load reading progress
        const progress = await getProgress(id);
        if (progress) {
          if (progress.currentPage && progress.currentPage > 1) {
            setCurrentPage(progress.currentPage);
          } else if (progress.percentage && progress.percentage > 0) {
            const total = bookData.totalPages || 1;
            setCurrentPage(Math.max(1, Math.round((progress.percentage / 100) * total)));
          }
        }
      } catch (err) {
        console.error('Failed to load book:', err);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    }

    loadBook();
  }, [id, router]);

  // Save progress to DB (debounced)
  const saveProgressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePageChange = useCallback(
    (page: number, percentage: number) => {
      setCurrentPage(page);

      if (saveProgressTimerRef.current) {
        clearTimeout(saveProgressTimerRef.current);
      }

      saveProgressTimerRef.current = setTimeout(() => {
        const progressData: ReadingProgress = {
          bookId: id,
          currentPage: page,
          percentage: Math.max(0, Math.min(100, percentage)),
          lastPosition: 0,
          updatedAt: Date.now(),
        };
        saveProgress(progressData).catch(console.error);
      }, 500);
    },
    [id]
  );

  // Handle PDF totalPages callback
  const handleReaderReady = useCallback((actualTotalPages: number) => {
    if (actualTotalPages > 0) {
      setTotalPages(actualTotalPages);
    }
  }, []);

  // Handle real chapters from EPUB/PDF outline
  const handleChaptersLoaded = useCallback((chapters: { id: string; title: string; page: number }[]) => {
    setRealChapters(chapters);
  }, []);

  // Save progress on unmount
  useEffect(() => {
    return () => {
      if (saveProgressTimerRef.current) {
        clearTimeout(saveProgressTimerRef.current);
      }
      // Save final progress
      if (book) {
        const percentage = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
        saveProgress({
          bookId: id,
          currentPage,
          percentage,
          lastPosition: 0,
          updatedAt: Date.now(),
        }).catch(console.error);
      }
    };
  }, [id, currentPage, totalPages, book]);

  // Apply theme to body
  useEffect(() => {
    const theme = THEME_CLASSES[settings.theme] || THEME_CLASSES.light;
    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.fg;

    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, [settings.theme]);

  // Navigation helpers
  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1, ((currentPage - 2) / totalPages) * 100);
    }
  }, [currentPage, totalPages, handlePageChange]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1, (currentPage / totalPages) * 100);
    }
  }, [currentPage, totalPages, handlePageChange]);

  // Use real chapters if available, otherwise generate from total pages
  const chapters = realChapters.length > 0
    ? realChapters
    : (() => {
        const chapterCount = Math.max(1, Math.min(20, Math.ceil(totalPages / 10)));
        return Array.from({ length: chapterCount }, (_, i) => ({
          id: `ch-${i}`,
          title: `Bab ${i + 1}`,
          page: Math.max(1, Math.floor((i / chapterCount) * totalPages) + 1),
        }));
      })();

  const handleChapterSelect = useCallback(
    (page: number) => {
      const percentage = totalPages > 0 ? ((page - 1) / totalPages) * 100 : 0;
      handlePageChange(page, percentage);
    },
    [totalPages, handlePageChange]
  );

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-stone-600 dark:text-zinc-400">Memuat buku...</p>
        </div>
      </div>
    );
  }

  // Book not found
  if (!book) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Buku tidak ditemukan</p>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-emerald-500 hover:underline"
          >
            Kembali ke perpustakaan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        backgroundColor: THEME_CLASSES[settings.theme]?.bg || '#ffffff',
        color: THEME_CLASSES[settings.theme]?.fg || '#1a1a1a',
      }}
    >
      {/* Content ref for search */}
      <div ref={contentRef} className="w-full h-full">
        <ReaderView
          book={book}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onReady={handleReaderReady}
          onChaptersLoaded={handleChaptersLoaded}
          showUI={showUI}
        />
      </div>

      {/* Header overlay */}
      <ReaderHeader
        title={book.title}
        visible={showUI && !settingsOpen && !chapterNavOpen}
        onToggleSettings={() => setSettingsOpen(!settingsOpen)}
        onToggleChapterNav={() => setChapterNavOpen(!chapterNavOpen)}
        onToggleSearch={() => setSearchOpen(!searchOpen)}
        onToggleBookmark={() => setIsBookmarked(!isBookmarked)}
        isBookmarked={isBookmarked}
      />

      {/* Footer overlay */}
      <ReaderFooter
        visible={showUI && !settingsOpen && !chapterNavOpen}
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
      />

      {/* Settings sidebar */}
      <ReaderSettings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Chapter navigation */}
      <ChapterNav
        isOpen={chapterNavOpen}
        onClose={() => setChapterNavOpen(false)}
        chapters={chapters}
        currentPage={currentPage}
        onChapterSelect={handleChapterSelect}
      />

      {/* Search overlay */}
      <SearchInBook
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        contentRef={contentRef}
      />
    </div>
  );
}
