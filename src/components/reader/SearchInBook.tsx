'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchInBookProps {
  isOpen: boolean;
  onClose: () => void;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export default function SearchInBook({ isOpen, onClose, contentRef }: SearchInBookProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<NodeListOf<Element> | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [totalMatches, setTotalMatches] = useState(0);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search through content
  const search = useCallback(
    (searchQuery: string) => {
      // Clear previous marks
      clearHighlights();

      if (!searchQuery.trim() || !contentRef.current) {
        setMatches(null);
        setTotalMatches(0);
        setCurrentIndex(-1);
        return;
      }

      const container = contentRef.current;

      // Search all text nodes in the reader area
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode: (node: Text) => {
          // Skip hidden elements
          const parent = node.parentElement;
          if (parent) {
            const style = window.getComputedStyle(parent);
            if (style.display === 'none' || style.visibility === 'hidden') {
              return NodeFilter.FILTER_REJECT;
            }
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const textNodes: Text[] = [];
      let node: Text | null;
      while ((node = walker.nextNode() as Text | null)) {
        if (node) textNodes.push(node);
      }

      const lowerQuery = searchQuery.toLowerCase();

      for (const textNode of textNodes) {
        const text = textNode.textContent || '';
        const lowerText = text.toLowerCase();
        const idx = lowerText.indexOf(lowerQuery);

        if (idx >= 0) {
          const range = document.createRange();
          range.setStart(textNode, idx);
          range.setEnd(textNode, idx + searchQuery.length);

          const mark = document.createElement('mark');
          mark.className = 'search-highlight bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0.5';
          range.surroundContents(mark);
        }
      }

      const marks = container.querySelectorAll('mark.search-highlight');
      setMatches(marks);
      setTotalMatches(marks.length);
      setCurrentIndex(marks.length > 0 ? 0 : -1);

      if (marks.length > 0) {
        scrollToMatch(0);
      }
    },
    [contentRef]
  );

  // Scroll to match
  const scrollToMatch = useCallback(
    (index: number) => {
      if (!matches || index < 0 || index >= matches.length) return;
      const mark = matches[index];

      // Find the nearest scrollable parent and scroll it
      let scrollParent: HTMLElement | null = mark.parentElement;
      while (scrollParent) {
        if (scrollParent.scrollHeight > scrollParent.clientHeight &&
            (getComputedStyle(scrollParent).overflowY === 'auto' ||
             getComputedStyle(scrollParent).overflowY === 'scroll')) {
          break;
        }
        scrollParent = scrollParent.parentElement;
      }

      if (scrollParent) {
        const markRect = mark.getBoundingClientRect();
        const parentRect = scrollParent.getBoundingClientRect();
        const scrollTop = scrollParent.scrollTop + markRect.top - parentRect.top - parentRect.height / 2;
        scrollParent.scrollTo({ top: scrollTop, behavior: 'smooth' });
      } else {
        mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Flash highlight
      mark.classList.add('ring-2', 'ring-indigo-400');
      setTimeout(() => {
        mark.classList.remove('ring-2', 'ring-indigo-400');
      }, 1500);
    },
    [matches]
  );

  // Clear all highlights
  const clearHighlights = useCallback(() => {
    if (!contentRef.current) return;
    const marks = contentRef.current.querySelectorAll('mark.search-highlight');
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
      }
      parent?.normalize();
    });
  }, [contentRef]);

  // Navigate to next/prev
  const goToNext = useCallback(() => {
    if (totalMatches === 0) return;
    const next = (currentIndex + 1) % totalMatches;
    setCurrentIndex(next);
    scrollToMatch(next);
  }, [currentIndex, totalMatches, scrollToMatch]);

  const goToPrev = useCallback(() => {
    if (totalMatches === 0) return;
    const prev = (currentIndex - 1 + totalMatches) % totalMatches;
    setCurrentIndex(prev);
    scrollToMatch(prev);
  }, [currentIndex, totalMatches, scrollToMatch]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search]);

  // Clean up on close
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      clearHighlights();
      setMatches(null);
      setTotalMatches(0);
      setCurrentIndex(-1);
    }
  }, [isOpen, clearHighlights]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-[60px] left-0 right-0 z-50 px-4"
        >
          <div className="mx-auto max-w-md bg-white dark:bg-zinc-800 shadow-lg rounded-xl
                          border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2">
              <Search size={16} className="text-zinc-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari dalam buku..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400
                           dark:text-zinc-200"
              />

              {totalMatches > 0 && (
                <span className="text-xs text-zinc-500 tabular-nums whitespace-nowrap">
                  {currentIndex + 1} dari {totalMatches}
                </span>
              )}

              {totalMatches > 0 && (
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={goToPrev}
                    className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    aria-label="Cocokan sebelumnya"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={goToNext}
                    className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    aria-label="Cocokan berikutnya"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              )}

              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                aria-label="Tutup pencarian"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
