'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Book, ReaderSettings } from '@/types';
import { useReaderStore } from '@/lib/store';
import EpubReader from './EpubReader';

interface ReaderViewProps {
  book: Book;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number, percentage: number) => void;
  onReady?: (totalPages: number) => void;
  showUI: boolean;
}

// Theme color maps
const themeColors: Record<string, { bg: string; fg: string; accent: string }> = {
  light: { bg: '#ffffff', fg: '#1a1a1a', accent: '#6366f1' },
  dark: { bg: '#121212', fg: '#e0e0e0', accent: '#818cf8' },
  sepia: { bg: '#f4ecd8', fg: '#5c4b37', accent: '#a07850' },
};

const fontFamilyMap: Record<string, string> = {
  literata: '"Literata", serif',
  merriweather: '"Merriweather", serif',
  lora: '"Lora", serif',
  'source-serif': '"Source Serif 4", serif',
};

function PdfReader({
  book,
  settings,
  currentPage,
  totalPages,
  onReady,
}: {
  book: Book;
  settings: ReaderSettings;
  currentPage: number;
  totalPages: number;
  onReady?: (totalPages: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load PDF document once
  useEffect(() => {
    if (!book.file) return;

    let cancelled = false;

    async function loadPdf() {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const pdf = await pdfjsLib.getDocument({ data: book.file }).promise;

        if (cancelled) return;

        pdfDocRef.current = pdf;

        // Report total pages back to parent
        if (onReady) {
          onReady(pdf.numPages);
        }

        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error('PDF load error:', err);
          setError('Gagal memuat PDF');
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
      // Cancel any in-progress render
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
      pdfDocRef.current = null;
    };
  }, [book]);

  // Render specific page when currentPage or PDF doc changes
  useEffect(() => {
    const pdf = pdfDocRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!pdf || !canvas || !container) return;

    let cancelled = false;

    async function renderPage() {
      // Re-check refs inside async (they may have changed)
      const currentCanvas = canvasRef.current;
      const currentContainer = containerRef.current;
      if (!currentCanvas || !currentContainer) return;

      // Cancel any previous render task
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      try {
        const page = await pdf.getPage(currentPage);

        if (cancelled) return;

        // Calculate scale based on container width
        const containerWidth = currentContainer.clientWidth;
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(
          (containerWidth - 32) / unscaledViewport.width, // 32px for padding
          2.0 // max scale to avoid oversized renders
        );
        const viewport = page.getViewport({ scale });

        const ctx = currentCanvas.getContext('2d');
        if (!ctx) return;

        // Clear previous content
        ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);

        // Set canvas dimensions to match viewport
        currentCanvas.width = viewport.width;
        currentCanvas.height = viewport.height;

        const renderTask = page.render({
          canvasContext: ctx,
          viewport,
        });

        renderTaskRef.current = renderTask;

        await renderTask.promise;

        if (!cancelled) {
          renderTaskRef.current = null;
        }
      } catch (err: any) {
        if (!cancelled && err?.name !== 'RenderingCancelledException') {
          console.error('PDF page render error:', err);
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [currentPage, loading]);

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center h-full w-full overflow-hidden">
      {loading && (
        <div className="text-center p-8">
          <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm opacity-60">Memuat PDF...</p>
        </div>
      )}
      {error && (
        <div className="text-center p-8">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain"
        style={{ display: !loading && !error ? 'block' : 'none' }}
      />
    </div>
  );
}



// Plain text fallback for unknown formats or when rendering fails
function PlainTextReader({ content, settings }: { content: string; settings: ReaderSettings }) {
  const colors = themeColors[settings.theme] || themeColors.light;
  const fontFamily = fontFamilyMap[settings.fontFamily] || '"Literata", serif';

  return (
    <div
      className="mx-auto px-4 py-8"
      style={{
        maxWidth: `${400 + (25 - settings.margins) * 20}px`,
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
        fontFamily,
        color: colors.fg,
      }}
    >
      {content.split('\n').map((paragraph, i) => (
        <p key={i} className="mb-4">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export default function ReaderView({
  book,
  currentPage,
  totalPages,
  onPageChange,
  onReady,
  showUI,
}: ReaderViewProps) {
  const settings = useReaderStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  // Theme colors
  const colors = themeColors[settings.theme] || themeColors.light;

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (currentPage < totalPages) {
          onPageChange(currentPage + 1, ((currentPage) / totalPages) * 100);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentPage > 1) {
          onPageChange(currentPage - 1, ((currentPage - 2) / totalPages) * 100);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, onPageChange]);

  // Touch swipe navigation
  useEffect(() => {
    function handleTouchStart(e: TouchEvent) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }

    function handleTouchEnd(e: TouchEvent) {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;

      // Only count horizontal swipes (more horizontal than vertical)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX < 0 && currentPage < totalPages) {
          // Swipe left → next page
          onPageChange(currentPage + 1, ((currentPage) / totalPages) * 100);
        } else if (deltaX > 0 && currentPage > 1) {
          // Swipe right → previous page
          onPageChange(currentPage - 1, ((currentPage - 2) / totalPages) * 100);
        }
      }
    }

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [currentPage, totalPages, onPageChange]);

  const fontFamily = fontFamilyMap[settings.fontFamily] || '"Literata", serif';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        backgroundColor: colors.bg,
        color: colors.fg,
        paddingTop: showUI ? '60px' : '0',
        paddingBottom: showUI ? '60px' : '0',
        transition: 'padding 0.3s ease',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full flex flex-col items-center justify-center"
          style={{ fontFamily, fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight }}
        >
          {book.format === 'pdf' ? (
            <PdfReader
              book={book}
              settings={settings}
              currentPage={currentPage}
              totalPages={totalPages}
              onReady={onReady}
            />
          ) : book.format === 'epub' ? (
            <EpubReader
              book={book}
              settings={settings}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              onReady={onReady}
            />
          ) : (
            <div className="p-8 text-center opacity-60">
              <p>Format buku tidak didukung: {book.format}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Page indicator overlay when UI is hidden */}
      {!showUI && (
        <div className="absolute bottom-4 right-4 text-xs opacity-30 pointer-events-none">
          {currentPage}/{totalPages}
        </div>
      )}
    </div>
  );
}
