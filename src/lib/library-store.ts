'use client';

import { create } from 'zustand';
import type { LibraryView, LibrarySort } from '@/types';

interface LibraryStore {
  searchQuery: string;
  libraryView: LibraryView;
  librarySort: LibrarySort;
  setSearch: (query: string) => void;
  setView: (view: LibraryView) => void;
  setSort: (sort: LibrarySort) => void;
}

export const useLibraryStore = create<LibraryStore>()((set) => ({
  searchQuery: '',
  libraryView: 'grid',
  librarySort: 'added',
  setSearch: (query) => set({ searchQuery: query }),
  setView: (view) => set({ libraryView: view }),
  setSort: (sort) => set({ librarySort: sort }),
}));
