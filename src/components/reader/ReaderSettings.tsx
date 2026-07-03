'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react';
import { useReaderStore } from '@/lib/store';
import type { FontFamily, ThemeMode } from '@/types';

interface ReaderSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const FONT_OPTIONS: { label: string; value: FontFamily; preview: string }[] = [
  { label: 'Literata', value: 'literata', preview: '"Literata", serif' },
  { label: 'Merriweather', value: 'merriweather', preview: '"Merriweather", serif' },
  { label: 'Lora', value: 'lora', preview: '"Lora", serif' },
  { label: 'Source Serif 4', value: 'source-serif', preview: '"Source Serif 4", serif' },
];

const THEME_OPTIONS: { label: string; value: ThemeMode; bg: string; fg: string }[] = [
  { label: 'Light', value: 'light', bg: '#ffffff', fg: '#1a1a1a' },
  { label: 'Dark', value: 'dark', bg: '#121212', fg: '#e0e0e0' },
  { label: 'Sepia', value: 'sepia', bg: '#f4ecd8', fg: '#5c4b37' },
];

export default function ReaderSettings({ isOpen, onClose }: ReaderSettingsProps) {
  const settings = useReaderStore();
  const setFontSize = useReaderStore((s) => s.setFontSize);
  const setLineHeight = useReaderStore((s) => s.setLineHeight);
  const setFontFamily = useReaderStore((s) => s.setFontFamily);
  const setTheme = useReaderStore((s) => s.setTheme);
  const setMargins = useReaderStore((s) => s.setMargins);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/30"
            onClick={onClose}
          />

          {/* Settings panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[70] w-[320px] max-w-[85vw]
                       bg-white dark:bg-zinc-900 shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-base font-semibold">Pengaturan</h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full
                           hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Tutup pengaturan"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-7">
              {/* Font Size */}
              <section>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 block">
                  Ukuran Font
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFontSize(Math.max(14, settings.fontSize - 1))}
                    className="flex items-center justify-center w-8 h-8 rounded-lg
                               bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200
                               dark:hover:bg-zinc-700 transition-colors text-sm font-bold"
                    aria-label="Kecilkan font"
                  >
                    <Minus size={14} />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min={14}
                      max={28}
                      step={1}
                      value={settings.fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer
                                 bg-zinc-200 dark:bg-zinc-700 accent-indigo-500"
                    />
                  </div>
                  <button
                    onClick={() => setFontSize(Math.min(28, settings.fontSize + 1))}
                    className="flex items-center justify-center w-8 h-8 rounded-lg
                               bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200
                               dark:hover:bg-zinc-700 transition-colors text-sm font-bold"
                    aria-label="Perbesar font"
                  >
                    <Plus size={14} />
                  </button>
                  <span className="text-xs text-zinc-500 w-8 text-right tabular-nums">
                    {settings.fontSize}px
                  </span>
                </div>
                {/* Preview */}
                <div
                  className="mt-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-center"
                  style={{ fontSize: `${settings.fontSize}px` }}
                >
                  Contoh teks
                </div>
              </section>

              {/* Line Height */}
              <section>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 block">
                  Spasi Baris
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="range"
                      min={1.5}
                      max={2.2}
                      step={0.1}
                      value={settings.lineHeight}
                      onChange={(e) => setLineHeight(Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer
                                 bg-zinc-200 dark:bg-zinc-700 accent-indigo-500"
                    />
                  </div>
                  <span className="text-xs text-zinc-500 w-8 text-right tabular-nums">
                    {settings.lineHeight.toFixed(1)}
                  </span>
                </div>
              </section>

              {/* Margins / Content Width */}
              <section>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 block">
                  Lebar Konten
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="range"
                      min={400}
                      max={900}
                      step={10}
                      value={400 + (25 - settings.margins) * 20}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const margins = Math.round(25 - (val - 400) / 20);
                        setMargins(Math.max(5, Math.min(25, margins)));
                      }}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer
                                 bg-zinc-200 dark:bg-zinc-700 accent-indigo-500"
                    />
                  </div>
                  <span className="text-xs text-zinc-500 w-16 text-right tabular-nums">
                    {400 + (25 - settings.margins) * 20}px
                  </span>
                </div>
              </section>

              {/* Font Family */}
              <section>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 block">
                  Font Family
                </label>
                <div className="space-y-2">
                  {FONT_OPTIONS.map((font) => (
                    <label
                      key={font.value}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer
                                  transition-colors ${
                                    settings.fontFamily === font.value
                                      ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-300 dark:ring-indigo-700'
                                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                  }`}
                    >
                      <input
                        type="radio"
                        name="fontFamily"
                        value={font.value}
                        checked={settings.fontFamily === font.value}
                        onChange={() => setFontFamily(font.value)}
                        className="sr-only"
                      />
                      <div
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center
                                    transition-colors"
                        style={{
                          borderColor:
                            settings.fontFamily === font.value ? '#6366f1' : '#a1a1aa',
                        }}
                      >
                        {settings.fontFamily === font.value && (
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        )}
                      </div>
                      <span style={{ fontFamily: font.preview }} className="text-sm">
                        {font.label}
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Theme */}
              <section>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 block">
                  Tema
                </label>
                <div className="flex gap-3">
                  {THEME_OPTIONS.map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => setTheme(theme.value)}
                      className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg
                                  border-2 transition-colors ${
                                    settings.theme === theme.value
                                      ? 'border-indigo-500'
                                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                                  }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full shadow-inner border border-zinc-200/50"
                        style={{ backgroundColor: theme.bg }}
                      />
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {theme.label}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
