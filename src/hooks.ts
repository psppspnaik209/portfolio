import { useCallback, useEffect, useRef, useState } from 'react';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'kng-theme';

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // ignore
  }
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(`theme-${theme}`);
    root.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggle };
};

export const useScrollSpy = (
  sectionIds: string[],
  offset = 120,
): string | null => {
  const [active, setActive] = useState<string | null>(sectionIds[0] ?? null);

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const handle = () => {
      // A viewport-relative probe keeps the final section active even when
      // there is not enough page height left to scroll its heading to the top.
      const scrollY =
        window.scrollY + Math.max(offset, window.innerHeight * 0.4);
      let current: string | null = null;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.offsetTop <= scrollY) {
          current = id;
        }
      }
      setActive(current ?? sectionIds[0] ?? null);
    };

    handle();
    window.addEventListener('scroll', handle, { passive: true });
    window.addEventListener('resize', handle);
    return () => {
      window.removeEventListener('scroll', handle);
      window.removeEventListener('resize', handle);
    };
  }, [sectionIds, offset]);

  return active;
};

export const useScrollProgress = (): number => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handle = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0);
    };

    handle();
    window.addEventListener('scroll', handle, { passive: true });
    window.addEventListener('resize', handle);
    return () => {
      window.removeEventListener('scroll', handle);
      window.removeEventListener('resize', handle);
    };
  }, []);

  return progress;
};

export const useMagnetic = (strength = 0.35) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: PointerEvent) => {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        el.style.setProperty('--mx', `${x * strength}px`);
        el.style.setProperty('--my', `${y * strength}px`);
      });
    };

    const handleLeave = () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      el.style.setProperty('--mx', `0px`);
      el.style.setProperty('--my', `0px`);
    };

    el.addEventListener('pointermove', handleMove);
    el.addEventListener('pointerleave', handleLeave);
    return () => {
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerleave', handleLeave);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [strength]);

  return ref;
};

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = () => setMatches(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

export const useIsMac = () => {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
  }, []);
  return isMac;
};
