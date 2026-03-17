import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Portal from '../portal';
import { BorderBeam } from '../ui/border-beam';

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const Modal: React.FC<ModalProps> = ({ children, isOpen, onClose, title }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key closes modal
  useEffect(() => {
    if (!isVisible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  if (!isOpen && !isVisible) {
    return null;
  }

  return (
    <Portal wrapperId="modal-portal-wrapper">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed inset-0 z-50 flex justify-center items-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={handleClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal Content */}
            <motion.div
              className="relative w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl rounded-xl border border-white/10 bg-[#0a0f1a]/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <BorderBeam
                size={180}
                duration={10}
                colorFrom="#38bdf8"
                colorTo="#0ea5e9"
              />

              {/* Header */}
              {title && (
                <div className="px-6 lg:px-8 pt-6 lg:pt-8 pb-0">
                  <h3 className="font-bold text-xl lg:text-2xl text-white tracking-tight">
                    {title}
                  </h3>
                  <div className="h-px bg-gradient-to-r from-[#38bdf8]/40 via-white/10 to-transparent mt-4" />
                </div>
              )}

              {/* Body */}
              <div className="px-6 lg:px-8 py-5 lg:py-6 max-h-[75vh] overflow-y-auto scrollbar-thin">
                {children}
              </div>

              {/* Footer */}
              <div className="px-6 lg:px-8 pb-5 lg:pb-6 pt-0 flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-5 py-2 text-sm font-medium rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-white/25 hover:bg-white/5 transition-all duration-150 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
};

export default Modal;
