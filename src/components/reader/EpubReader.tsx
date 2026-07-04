'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Book, ReaderSettings } from '@/types';
import { parseEpub, type ParsedEpub, type EpubChapter, resolveEpubPath } from '@/lib/epub-parser';
import type JSZip from 'jszip';

export interface ChapterInfo {
  id: string;
  title: string;
  page: number;
}

interface EpubReaderProps {
  book: Book;
  settings: ReaderSettings;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number, percentage: number) => void;
  onReady?: (totalPages: number) => void;
  onChaptersLoaded?: (chapters: ChapterInfo[]) => void;
}

const fontFamilyMap: Record<string, string> = {
  literata: '"Literata", serif',
  merriweather: '"Merriweather", serif',
  lora: '"Lora", serif',
  'source-serif': '"Source Serif 4", serif',
};

const themeBgMap: Record<string, string> = {
  light: '#ffffff',
  dark: '#121212',
  sepia: '#f4ecd8',
};

const themeFgMap: Record<string, string> = {
  light: '#1a1a1a',
  dark: '#e0e0e0',
  sepia: '#5c4b37',
};

export default function EpubReader({
  book,
  settings,
  currentPage,
  totalPages,
  onPageChange,
  onReady,
  onChaptersLoaded,
}: EpubReaderProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [epubData, setEpubData] = useState<ParsedEpub | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse EPUB on mount
  useEffect(() => {
    let cancelled = false;

    async function loadEpub() {
      try {
        if (typeof window === 'undefined') return;

        const arrayBuffer = book.file instanceof ArrayBuffer
          ? book.file
          : await (book.file as Blob).arrayBuffer();

        const data = await parseEpub(arrayBuffer);

        if (!cancelled) {
          setEpubData(data);
          setLoading(false);

          // Report total pages (chapters) back to parent
          if (onReady && data.chapters.length > 0) {
            onReady(data.chapters.length);
          }

          // Report actual chapter info to parent
          if (onChaptersLoaded) {
            onChaptersLoaded(data.chapters.map((ch, i) => ({
              id: ch.id,
              title: ch.title,
              page: i + 1,
            })));
          }
        }
      } catch (err) {
        console.error('[EPUB-PARSER] Error:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat EPUB');
          setLoading(false);
        }
      }
    }

    loadEpub();

    return () => {
      cancelled = true;
    };
  }, [book, onReady]);

  // Get current chapter based on page (1-indexed)
  const currentChapter: EpubChapter | undefined = epubData?.chapters[currentPage - 1];

  // Render chapter HTML into the content div
  useEffect(() => {
    if (!contentRef.current || !currentChapter || !epubData) return;

    let cancelled = false;

    async function renderChapter() {
      const { zip, opfDir } = epubData!;

      // Parse the chapter's XHTML content
      const doc = new DOMParser().parseFromString(
        currentChapter!.content,
        'application/xhtml+xml'
      );

      // ── Resolve images: <img src="..."> → blob URLs ──
      const imgs = doc.querySelectorAll('img');
      for (const img of Array.from(imgs)) {
        const src = img.getAttribute('src');
        if (!src || src.startsWith('data:') || src.startsWith('blob:')) continue;

        const fullPath = resolveEpubPath(opfDir + currentChapter!.href.replace(opfDir, ''), src);
        const file = zip.file(fullPath);
        if (file) {
          const blob = await file.async('blob');
          if (cancelled) return;
          img.setAttribute('src', URL.createObjectURL(blob));
        }
      }

      // ── Resolve inline stylesheets: <link rel="stylesheet"> → <style> ──
      const links = doc.querySelectorAll('link[rel="stylesheet"]');
      for (const link of Array.from(links)) {
        const href = link.getAttribute('href');
        if (!href) continue;

        const fullPath = resolveEpubPath(opfDir + currentChapter!.href.replace(opfDir, ''), href);
        const file = zip.file(fullPath);
        if (file) {
          const css = await file.async('text');
          if (cancelled) return;
          const style = doc.createElement('style');
          style.textContent = css;
          link.parentNode?.replaceChild(style, link);
        }
      }

      // ── Apply reader styles + rendered content ──
      const style = document.createElement('style');
      style.textContent = `
        body {
          margin: 0;
          padding: 0;
          font-family: ${fontFamilyMap[settings.fontFamily] || '"Literata", serif'};
          font-size: ${settings.fontSize}px;
          line-height: ${settings.lineHeight};
          color: ${themeFgMap[settings.theme] || '#1a1a1a'};
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        p { margin: 0 0 1em 0; text-align: justify; }
        h1, h2, h3, h4 { margin: 1em 0 0.5em 0; }
        img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
        a { color: #059669; }
        svg { max-width: 100%; height: auto; }
        table { max-width: 100%; border-collapse: collapse; margin: 1em 0; }
        td, th { border: 1px solid #ccc; padding: 0.3em 0.6em; }
      `;

      // Clear previous content
      contentRef.current!.innerHTML = '';

      // Inject styles and content
      const body = doc.querySelector('body');
      const content = body ? body.innerHTML : doc.documentElement.innerHTML;

      const wrapper = document.createElement('div');
      wrapper.appendChild(style);
      wrapper.innerHTML += content;
      contentRef.current!.appendChild(wrapper);
    }

    renderChapter();

    return () => {
      cancelled = true;
    };
  }, [currentChapter, settings, epubData]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full mb-4" />
        <p className="text-sm opacity-60">Memuat EPUB...</p>
      </div>
    );
  }

  // Error state
  if (error || !epubData) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-sm opacity-60 mb-2">Gagal memuat EPUB</p>
        <p className="text-xs opacity-40">{error || 'Data tidak ditemukan'}</p>
      </div>
    );
  }

  // Empty chapters
  if (epubData.chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-sm opacity-60">Tidak ada bab ditemukan</p>
      </div>
    );
  }

  // Chapter title for display
  const chapterTitle = currentChapter?.title || `Bab ${currentPage}`;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Chapter title */}
      <div
        className="px-4 py-2 text-xs font-medium opacity-40 border-b"
        style={{ borderColor: 'currentColor' }}
      >
        {chapterTitle}
      </div>

      {/* Chapter content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto epub-scroll-container px-4 py-6" 
        style={{
          maxWidth: `${400 + (25 - settings.margins) * 20}px`,
          margin: '0 auto',
          width: '100%',
        }}
      />
    </div>
  );
}
