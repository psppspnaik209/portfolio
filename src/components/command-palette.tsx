import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export type CommandItem = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  keywords?: string[];
  perform: () => void;
  icon?: string;
};

type Props = {
  items: CommandItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const fuzzyScore = (needle: string, haystack: string): number => {
  const n = needle.toLowerCase();
  const h = haystack.toLowerCase();
  if (!n) return 1;
  if (h.includes(n)) return 2;

  let ni = 0;
  for (let i = 0; i < h.length && ni < n.length; i++) {
    if (h[i] === n[ni]) ni++;
  }
  return ni === n.length ? 1 : 0;
};

export const CommandPalette = ({ items, open, onOpenChange }: Props) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  // Track whether the last active-index change came from the keyboard so we
  // only auto-scroll for keyboard nav (mouse already controls its own view).
  const lastInputRef = useRef<'mouse' | 'keyboard'>('keyboard');

  // Global keyboard shortcut
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onOpenChange]);

  // Reset + focus when opening
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const scored = items
      .map((item) => {
        const bag = [item.label, item.group, ...(item.keywords || [])].join(
          ' ',
        );
        return { item, score: fuzzyScore(query, bag) };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.map(({ item }) => item);
  }, [items, query]);

  // Group while preserving filtered order
  const grouped = useMemo(() => {
    const groups: { group: string; items: CommandItem[] }[] = [];
    const map = new Map<string, CommandItem[]>();
    for (const it of filtered) {
      if (!map.has(it.group)) map.set(it.group, []);
      map.get(it.group)!.push(it);
    }
    for (const [group, groupItems] of map) {
      groups.push({ group, items: groupItems });
    }
    return groups;
  }, [filtered]);

  // Flat index for arrow navigation
  const flatItems = filtered;

  const runItem = useCallback(
    (item: CommandItem) => {
      item.perform();
      onOpenChange(false);
    },
    [onOpenChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      lastInputRef.current = 'keyboard';
      setActiveIndex((i) =>
        flatItems.length ? (i + 1) % flatItems.length : 0,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      lastInputRef.current = 'keyboard';
      setActiveIndex((i) =>
        flatItems.length ? (i - 1 + flatItems.length) % flatItems.length : 0,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flatItems[activeIndex];
      if (item) runItem(item);
    }
  };

  // Keep active item in view only when the keyboard is driving the change —
  // doing this on every mouse hover causes visible jank.
  useEffect(() => {
    if (lastInputRef.current !== 'keyboard') return;
    const el = listRef.current?.querySelector<HTMLElement>(
      '[data-active="true"]',
    );
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, query]);

  // Reset active index whenever filtered changes length
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  let runningIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="palette-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[70] flex items-start justify-center bg-[var(--overlay)] px-4 pt-[12vh] backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            key="palette"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="command-palette w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-strong)] shadow-[var(--shadow-lg)] backdrop-blur-2xl"
            role="dialog"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--ink-muted)]"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type to search — navigate, copy email, switch theme…"
                className="w-full bg-transparent text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none"
              />
              <kbd className="rounded border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                Esc
              </kbd>
            </div>

            <div
              ref={listRef}
              className="max-h-[50vh] overflow-y-auto px-2 py-2"
            >
              {grouped.length === 0 ? (
                <div className="px-3 py-6 text-center font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  No matches.
                </div>
              ) : (
                grouped.map(({ group, items: groupItems }) => (
                  <div key={group} className="mb-2 last:mb-0">
                    <p className="px-3 pb-1 pt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                      {group}
                    </p>
                    <ul>
                      {groupItems.map((item) => {
                        runningIndex += 1;
                        const isActive = runningIndex === activeIndex;
                        const index = runningIndex;
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              data-active={isActive}
                              onMouseEnter={() => {
                                lastInputRef.current = 'mouse';
                                setActiveIndex(index);
                              }}
                              onClick={() => runItem(item)}
                              className={`command-item flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] ${
                                isActive
                                  ? 'bg-[var(--accent-soft)] text-[var(--ink)]'
                                  : 'text-[var(--ink)]'
                              }`}
                            >
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border border-[var(--line)] bg-[var(--surface)] font-mono text-[11px] ${isActive ? 'text-[var(--accent)]' : 'text-[var(--ink-muted)]'}`}
                                aria-hidden="true"
                              >
                                {item.icon || '›'}
                              </span>
                              <span className="flex-1 truncate">
                                {item.label}
                              </span>
                              {item.hint ? (
                                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                                  {item.hint}
                                </span>
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--line)] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] text-[var(--ink)]">
                    ↑↓
                  </kbd>{' '}
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] text-[var(--ink)]">
                    ↵
                  </kbd>{' '}
                  Select
                </span>
              </div>
              <span>{flatItems.length} commands</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
