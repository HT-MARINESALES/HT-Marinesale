// Single source of truth for the toast store lives in Toast.tsx (where ToastContainer
// subscribes). Importing addToast from there ensures every caller writes to the same
// store that ToastContainer is actually listening to.
export type { Toast } from '@/components/ui/Toast';
export { addToast, removeToast } from '@/components/ui/Toast';

import { addToast } from '@/components/ui/Toast';

export function useToast() {
  return {
    toast: addToast,
    success: (title: string, description?: string) =>
      addToast({ type: 'success', title, description }),
    error: (title: string, description?: string) =>
      addToast({ type: 'error', title, description }),
    warning: (title: string, description?: string) =>
      addToast({ type: 'warning', title, description }),
    info: (title: string, description?: string) =>
      addToast({ type: 'info', title, description }),
  };
}
