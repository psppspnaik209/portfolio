import { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Theme, useMagnetic, useScrollProgress, useTheme } from '../hooks';

/* -------------------------------------------------------------------------- */
/*                                  Magnetic                                  */
/* -------------------------------------------------------------------------- */

export const Magnetic = ({
  children,
  strength = 0.25,
  className = '',
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) => {
  const ref = useMagnetic(strength);
  return (
    <div
      ref={ref}
      className={`magnetic ${className}`}
      style={{
        display: 'inline-flex',
        transform: 'translate3d(var(--mx, 0), var(--my, 0), 0)',
        transition: 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                ScrollProgress                              */
/* -------------------------------------------------------------------------- */

export const ScrollProgress = () => {
  const progress = useScrollProgress();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] bg-transparent">
      <div
        className="h-full origin-left bg-[var(--accent)]"
        style={{
          transform: `scaleX(${progress})`,
          transition: 'transform 80ms linear',
        }}
      />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 ThemeToggle                                */
/* -------------------------------------------------------------------------- */

export const ThemeToggle = ({
  className = '',
  theme: controlledTheme,
  onToggle,
}: {
  className?: string;
  theme?: Theme;
  onToggle?: () => void;
}) => {
  const { theme: localTheme, toggle: localToggle } = useTheme();
  const theme = controlledTheme ?? localTheme;
  const toggle = onToggle ?? localToggle;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`theme-toggle relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
};

const SunIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

/* -------------------------------------------------------------------------- */
/*                                 HeroAurora                                 */
/* -------------------------------------------------------------------------- */

export const HeroAurora = () => {
  const reducedMotion = useReducedMotion();
  return (
    <div
      className="hero-aurora pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className={`aurora-blob a1 ${reducedMotion ? 'no-motion' : ''}`} />
      <div className={`aurora-blob a2 ${reducedMotion ? 'no-motion' : ''}`} />
      <div className={`aurora-blob a3 ${reducedMotion ? 'no-motion' : ''}`} />
      <div className="aurora-grain" />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              KeyboardHintBadge                             */
/* -------------------------------------------------------------------------- */

export const KeyboardHintBadge = ({
  keys,
  className = '',
}: {
  keys: string[];
  className?: string;
}) => (
  <span
    className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)] ${className}`}
  >
    {keys.map((k, i) => (
      <kbd
        key={`${k}-${i}`}
        className="rounded border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] leading-none text-[var(--ink)]"
      >
        {k}
      </kbd>
    ))}
  </span>
);
