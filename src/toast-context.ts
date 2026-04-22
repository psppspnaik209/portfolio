import { createContext, useContext } from 'react';

export type Toast = {
  id: number;
  message: string;
  tone?: 'default' | 'success';
};

export type ToastContextValue = {
  push: (message: string, tone?: Toast['tone']) => void;
};

export const ToastContext = createContext<ToastContextValue>({
  push: () => {},
});

export const useToast = () => useContext(ToastContext);
