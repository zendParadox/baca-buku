'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, CloudUpload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { addBook } from '@/lib/db';
import type { Book } from '@/types';

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED = '.pdf,.epub';

interface UploadStatus {
  state: 'idle' | 'uploading' | 'done' | 'error';
  message: string;
  fileName?: string;
}

interface Props {
  onUploadComplete?: (book: Book) => void;
}

export default function UploadZone({ onUploadComplete }: Props) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [status, setStatus] = useState<UploadStatus>({ state: 'idle', message: '' });
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (file.size > MAX_SIZE) {
      setStatus({ state: 'error', message: 'Ukuran file melebihi 50MB' });
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'epub') {
      setStatus({ state: 'error', message: 'Format file tidak didukung. Gunakan PDF atau EPUB.' });
      return;
    }

    setStatus({ state: 'uploading', message: 'Memproses file...', fileName: file.name });

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

          // Try to extract metadata
          const metadata = await pdf.getMetadata();
          if (metadata?.info) {
            const info = metadata.info as Record<string, string>;
            if (info.Title) title = info.Title;
            if (info.Author) author = info.Author;
          }

          // Render first page as cover
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
          // pdf.js might not be installed, proceed with defaults
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

          // Get cover
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

      // Convert File to ArrayBuffer for reliable storage/retrieval
      // This ensures epub.js and pdf.js receive raw ArrayBuffers
      // without Blob→ArrayBuffer conversion issues in IndexedDB
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
      setStatus({ state: 'done', message: 'Buku berhasil ditambahkan!', fileName: file.name });
      onUploadComplete?.(book);

      // Reset after delay
      setTimeout(() => setStatus({ state: 'idle', message: '' }), 3000);
    } catch (err) {
      console.error('Upload error:', err);
      setStatus({ state: 'error', message: 'Gagal memproses file' });
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
        onClick={() => inputRef.current?.click()}
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

        {status.state === 'uploading' ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{status.message}</p>
            {status.fileName && (
              <p className="max-w-full truncate text-xs text-stone-500 dark:text-zinc-400">{status.fileName}</p>
            )}
          </>
        ) : status.state === 'done' ? (
          <>
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {status.message}
            </p>
          </>
        ) : status.state === 'error' ? (
          <>
            <AlertCircle className="h-10 w-10 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">{status.message}</p>
            <p className="text-xs text-stone-500 dark:text-zinc-400">Klik untuk mencoba lagi</p>
          </>
        ) : (
          <>
            {isDragActive ? (
              <CloudUpload className="h-10 w-10 text-emerald-500" />
            ) : (
              <Upload className="h-10 w-10 text-stone-400 dark:text-zinc-500" />
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
