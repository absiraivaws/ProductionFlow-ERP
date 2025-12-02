import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastStore {
    toasts: Toast[];
    addToast: (message: string, type?: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
}

export const useToast = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (message: string, type: ToastType = 'info', duration: number = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => ({
            toasts: [...state.toasts, { id, message, type, duration }],
        }));

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                }));
            }, duration);
        }
    },
    removeToast: (id: string) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        }));
    },
}));

// Convenience functions
export const toast = {
    success: (message: string, duration?: number) => useToast.getState().addToast(message, 'success', duration),
    error: (message: string, duration?: number) => useToast.getState().addToast(message, 'error', duration),
    info: (message: string, duration?: number) => useToast.getState().addToast(message, 'info', duration),
    warning: (message: string, duration?: number) => useToast.getState().addToast(message, 'warning', duration),
};
