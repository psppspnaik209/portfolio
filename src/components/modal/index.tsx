import { useEffect, useState } from 'react';
import Portal from '../portal';

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
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Match transition duration
  };

  if (!isOpen && !isVisible) {
    return null; // Don't render anything if not open and not visible (after fade-out)
  }

  return (
    <Portal wrapperId="modal-portal-wrapper">
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center transition-opacity duration-300 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      >
        <div
          className={`bg-base-100 p-5 rounded-lg max-w-2xl w-full transform transition-transform duration-300 ease-in-out ${
            isVisible ? 'scale-100' : 'scale-95'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && <h3 className="font-semibold text-lg mb-4">{title}</h3>}
          {children}
          <div className="modal-action mt-4">
            <button onClick={handleClose} className="btn">
              Close
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default Modal;
