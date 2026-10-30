import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: (title: string, description?: string, type?: ToastType) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (title: string, description?: string, type: ToastType = 'info') => {
      const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      const newToast: ToastMessage = { id, type, title, description };
      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = useCallback((title: string, description?: string) => toast(title, description, 'success'), [toast]);
  const error = useCallback((title: string, description?: string) => toast(title, description, 'error'), [toast]);
  const warning = useCallback((title: string, description?: string) => toast(title, description, 'warning'), [toast]);
  const info = useCallback((title: string, description?: string) => toast(title, description, 'info'), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Toast Notification Floating Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className={clsx(
                'pointer-events-auto p-4 rounded-2xl border  flex items-start gap-3 relative overflow-hidden',
                t.type === 'success' && 'bg-muted/95 border-primary/50 text-foreground',
                t.type === 'error' && 'bg-muted/95 border-rose-500/50 text-foreground',
                t.type === 'warning' && 'bg-muted/95 border-amber-500/50 text-foreground',
                t.type === 'info' && 'bg-muted/95 border-sky-500/50 text-foreground'
              )}
            >
              {/* Type Icon */}
              <div className="shrink-0 mt-0.5">
                {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {t.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
              </div>

              {/* Toast Text */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-foreground">{t.title}</h4>
                {t.description && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{t.description}</p>}
              </div>

              {/* Close X Button */}
              <button
                onClick={() => removeToast(t.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
