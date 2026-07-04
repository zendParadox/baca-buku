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

      // ── Resolve images inside <picture> elements ──
      // Many EPUBs have <picture><source.../><img/></picture> — browser renders both.
      // Flatten: keep only the best <img>, remove <source> tags.
      const pictures = doc.querySelectorAll('picture');
      for (const picture of Array.from(pictures)) {
        const imgs = picture.querySelectorAll('img');
        if (imgs.length > 1) {
          // Keep only the last (usually highest-res) img, remove others
          for (let i = 0; i < imgs.length - 1; i++) {
            imgs[i].remove();
          }
        }
        // Unwrap <picture> → keep just the <img>
        const img = picture.querySelector('img');
        if (img) {
          picture.parentNode?.replaceChild(img, picture);
        }
      }

      // ── Deduplicate images inside <figure> ──
      // Some EPUBs put both a hero image and thumbnail in <figure>
      const figures = doc.querySelectorAll('figure');
      for (const figure of Array.from(figures)) {
        const imgs = figure.querySelectorAll('img');
        if (imgs.length > 1) {
          // Keep only the largest (by attribute hints or first one)
          for (let i = 1; i < imgs.length; i++) {
            imgs[i].remove();
          }
        }
      }

      // ── Resolve remaining images from ZIP ──
      const allImgs = doc.querySelectorAll('img');
      for (const img of Array.from(allImgs)) {
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

      // ── Apply reader styles (BEFORE EPUB content so EPUB CSS overrides) ──
      // Only override user-facing settings, preserve book's layout/spacing
      const style = document.createElement('style');
      style.textContent = `
        /* Reader overrides — only user-configurable settings */
        body {
          font-family: ${fontFamilyMap[settings.fontFamily] || '"Literata", serif'} !important;
          font-size: ${settings.fontSize}px !important;
          line-height: ${settings.lineHeight} !important;
          color: ${themeFgMap[settings.theme] || '#1a1a1a'};
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        /* Preserve book's paragraph styling — only add base spacing if none exists */
        p { min-height: 1em; }
        /* Images: responsive, centered, with breathing room */
        img { max-width: 100%; height: auto; display: block; margin: 0.5em auto; }
        /* SVGs: scale to container */
        svg { max-width: 100%; height: auto; }
        /* Tables: readable */
        table { max-width: 100%; border-collapse: collapse; margin: 0.5em 0; }
        td, th { padding: 0.2em 0.5em; }
        /* Links: brand color */
        a { color: #059669; }
        /* Figures: proper layout */
        figure { margin: 1em 0; text-align: center; }
        figcaption { font-size: 0.85em; opacity: 0.7; margin-top: 0.3em; }
        /* Blockquotes: styled */
        blockquote { border-left: 3px solid #059669; padding-left: 1em; margin: 0.5em 0; opacity: 0.8; }
        /* Lists: spacing */
        ul, ol { padding-left: 1.5em; margin: 0.5em 0; }
      `;

      // Clear previous content
      contentRef.current!.innerHTML = '';

      // Build wrapper: styles FIRST (EPUB CSS overrides ours), then content
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
