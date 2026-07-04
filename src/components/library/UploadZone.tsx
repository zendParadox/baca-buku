'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, CloudUpload, Loader2 } from 'lucide-react';
import { gooeyToast } from 'goey-toast';
import { addBook } from '@/lib/db';
import type { Book } from '@/types';

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED = '.pdf,.epub';

interface Props {
  onUploadComplete?: (book: Book) => void;
}

export default function UploadZone({ onUploadComplete }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (file.size > MAX_SIZE) {
      gooeyToast.error('File terlalu besar', {
        description: 'Ukuran file melebihi 50MB.',
      });
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'epub') {
      gooeyToast.error('Format tidak didukung', {
        description: 'Gunakan file PDF atau EPUB.',
      });
      return;
    }

    setIsUploading(true);

    try {
      const format = ext === 'pdf' ? 'pdf' : 'epub';
      let title = file.name.replace(/\.[^.]+$/, '');
      let author = 'Unknown';
      let cover: string | null = null;
      let totalPages = 1;

      if (format === 'pdf') {
        try {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          totalPages = pdf.numPages;

          const metadata = await pdf.getMetadata();
          if (metadata?.info) {
            const info = metadata.info as Record<string, string>;
            if (info.Title) title = info.Title;
            if (info.Author) author = info.Author;
          }

          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 0.5 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (page as any).render({ canvasContext: ctx, viewport }).promise;
            cover = canvas.toDataURL('image/jpeg', 0.7);
          }
        } catch {
          console.warn('pdf.js not available, using defaults');
        }
      } else {
        try {
          const ePubModule = await import('epubjs');
          const ePub = ePubModule.default;
          const arrayBuffer = await file.arrayBuffer();
          const epubBlob = new Blob([arrayBuffer], { type: 'application/epub+zip' });
          const epubBook = ePub(epubBlob as any);
          await epubBook.ready;

          const metadata = await epubBook.loaded.metadata;
          if (metadata) {
            if (metadata.title) title = metadata.title;
            if (metadata.creator) author = metadata.creator;
          }

          const coverUrl = await epubBook.coverUrl();
          if (coverUrl) cover = coverUrl;

          const spine = await epubBook.loaded.spine;
          if (Array.isArray(spine)) {
            totalPages = spine.length;
          }

          epubBook.destroy();
        } catch {
          console.warn('epub.js not available, using defaults');
        }
      }

      const fileBuffer = await file.arrayBuffer();

      const book: Book = {
        id: crypto.randomUUID(),
        title,
        author,
        format,
        cover,
        file: fileBuffer,
        totalPages,
        addedAt: Date.now(),
        lastReadAt: null,
      };

      await addBook(book);

      gooeyToast.success('Buku ditambahkan!', {
        description: `"${title}" sudah ada di perpustakaan.`,
      });

      onUploadComplete?.(book);
    } catch (err) {
      console.error('Upload error:', err);
      gooeyToast.error('Gagal memproses file', {
        description: 'Terjadi kesalahan saat membaca file.',
      });
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all duration-200 ${
          isDragActive
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
            : 'border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={onFileChange}
          className="hidden"
        />

        {isUploading ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            <p className="text-sm text-stone-600 dark:text-zinc-300">Memproses file...</p>
          </>
        ) : (
          <>
            {isDragActive ? (
              <CloudUpload className="h-10 w-10 text-emerald-500" />
            ) : (
              <Upload className="h-10 w-10 text-stone-400 dark:text-zinc-500" />
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-stone-700 dark:text-zinc-300">
                {isDragActive ? 'Lepaskan file di sini' : 'Seret & lepas buku ke sini'}
              </p>
              <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">
                atau klik untuk memilih file · PDF, EPUB · Maks 50MB
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
