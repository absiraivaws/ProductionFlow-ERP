"use client";

import { useToast } from "@/lib/stores/useToast";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

export default function ToastContainer() {
    const { toasts, removeToast } = useToast();

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle size={20} />;
            case 'error': return <XCircle size={20} />;
            case 'warning': return <AlertTriangle size={20} />;
            default: return <Info size={20} />;
        }
    };

    const getStyles = (type: string) => {
        switch (type) {
            case 'success': return 'bg-green-50 border-green-200 text-green-800';
            case 'error': return 'bg-red-50 border-red-200 text-red-800';
            case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800';
            default: return 'bg-blue-50 border-blue-200 text-blue-800';
        }
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] max-w-md animate-slide-in ${getStyles(toast.type)}`}
                >
                    <div className="flex-shrink-0">
                        {getIcon(toast.type)}
                    </div>
                    <div className="flex-1 text-sm font-medium">
                        {toast.message}
                    </div>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="flex-shrink-0 hover:opacity-70"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
}
