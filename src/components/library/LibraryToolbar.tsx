'use client';

import { Search, LayoutGrid, List } from 'lucide-react';
import { useLibraryStore } from '@/lib/library-store';
import type { LibrarySort, LibraryView } from '@/types';

const SORT_OPTIONS: { value: LibrarySort; label: string }[] = [
  { value: 'added', label: 'Tanggal Ditambah' },
  { value: 'title', label: 'Judul' },
  { value: 'progress', label: 'Progres' },
  { value: 'recently', label: 'Terakhir Dibaca' },
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'Semua' },
  { value: 'reading', label: 'Sedang Dibaca' },
  { value: 'finished', label: 'Selesai' },
  { value: 'unread', label: 'Belum Dibaca' },
] as const;

type FilterValue = (typeof FILTER_OPTIONS)[number]['value'];

interface Props {
  filter: FilterValue;
  onFilterChange: (f: FilterValue) => void;
}

// Typed selector state
interface LibState {
  searchQuery: string;
  setSearch: (query: string) => void;
  librarySort: LibrarySort;
  setSort: (sort: LibrarySort) => void;
  libraryView: LibraryView;
  setView: (view: LibraryView) => void;
}

export default function LibraryToolbar({ filter, onFilterChange }: Props) {
  const searchQuery = useLibraryStore((s: LibState) => s.searchQuery);
  const setSearch = useLibraryStore((s: LibState) => s.setSearch);
  const librarySort = useLibraryStore((s: LibState) => s.librarySort);
  const setSort = useLibraryStore((s: LibState) => s.setSort);
  const libraryView = useLibraryStore((s: LibState) => s.libraryView);
  const setView = useLibraryStore((s: LibState) => s.setView);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: search + filter */}
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari buku..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFilterChange(opt.value)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === opt.value
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: sort + view toggle */}
      <div className="flex items-center gap-2">
        <select
          value={librarySort}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setSort(e.target.value as LibrarySort)
          }
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setView('grid' as LibraryView)}
            className={`rounded-l-lg p-1.5 transition-colors ${
              libraryView === 'grid'
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-600'
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('list' as LibraryView)}
            className={`rounded-r-lg p-1.5 transition-colors ${
              libraryView === 'list'
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-600'
            }`}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
