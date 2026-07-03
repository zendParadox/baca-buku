import { create } from 'zustand';
import type { ReaderSettings, ThemeMode } from '../types';

const defaultSettings: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: 'literata',
  theme: 'light',
  margins: 15,
};

interface ReaderStore extends ReaderSettings {
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setFontFamily: (family: ReaderSettings['fontFamily']) => void;
  setTheme: (theme: ThemeMode) => void;
  setMargins: (margins: number) => void;
  updateSettings: (settings: Partial<ReaderSettings>) => void;
  loadSettings: (settings: ReaderSettings) => void;
}

export const useReaderStore = create<ReaderStore>()((set) => ({
  ...defaultSettings,
  setFontSize: (fontSize) => set({ fontSize }),
  setLineHeight: (lineHeight) => set({ lineHeight }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setTheme: (theme) => set({ theme }),
  setMargins: (margins) => set({ margins }),
  updateSettings: (settings) => set(settings),
  loadSettings: (settings) => set(settings),
}));
