import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const config = {
  success: { icon: CheckCircle2, bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', iconColor: 'text-green-500' },
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', iconColor: 'text-blue-500' },
  warning: { icon: AlertTriangle, bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700', iconColor: 'text-orange-500' },
  error: { icon: XCircle, bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', iconColor: 'text-red-500' },
};

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map(t => {
          const c = config[t.type];
          const Icon = c.icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 ${c.bg} ${c.text} border-l-4 ${c.border} rounded-lg shadow-lg px-4 py-3 animate-slide-in-right`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${c.iconColor}`} />
              <span className="flex-1 text-sm font-medium">{t.message}</span>
              <button onClick={() => removeToast(t.id)} className="flex-shrink-0 hover:opacity-70 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
