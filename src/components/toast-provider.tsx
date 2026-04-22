import { ReactNode, useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toast, ToastContext } from '../toast-context';

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback(
    (message: string, tone: Toast['tone'] = 'default') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, tone }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2200);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="toast pointer-events-auto flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--ink)] shadow-[var(--shadow-md)] backdrop-blur-xl"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${t.tone === 'success' ? 'bg-[var(--accent)]' : 'bg-[var(--ink-muted)]'}`}
              />
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
