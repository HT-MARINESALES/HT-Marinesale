import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}

type ToastType = Toast;

let toastStore: {
  toasts: ToastType[];
  listeners: Set<() => void>;
} = { toasts: [], listeners: new Set() };

function notify() {
  toastStore.listeners.forEach(l => l());
}

export function addToast(toast: Omit<ToastType, 'id'>) {
  const id = Math.random().toString(36).substr(2, 9);
  toastStore.toasts = [...toastStore.toasts, { ...toast, id }];
  notify();
  setTimeout(() => removeToast(id), 5000);
}

export function removeToast(id: string) {
  toastStore.toasts = toastStore.toasts.filter(t => t.id !== id);
  notify();
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

const iconStyles = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

function ToastItem({ toast, onRemove }: { toast: ToastType; onRemove: (id: string) => void }) {
  const Icon = icons[toast.type];
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all',
        'animate-in slide-in-from-right-full',
        styles[toast.type]
      )}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconStyles[toast.type])} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.title}</p>
        {toast.description && (
          <p className="text-sm opacity-80 mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastType[]>(toastStore.toasts);

  useEffect(() => {
    const listener = () => setToasts([...toastStore.toasts]);
    toastStore.listeners.add(listener);
    return () => {
      toastStore.listeners.delete(listener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
