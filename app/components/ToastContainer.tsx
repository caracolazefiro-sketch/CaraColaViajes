import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { Toast as ToastType } from '../hooks/useToast';

interface ToastContainerProps {
    toasts: ToastType[];
    onDismiss: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    const getIcon = (type: ToastType['type']) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} className="text-green-600" />;
            case 'error':
                return <XCircle size={20} className="text-red-600" />;
            case 'warning':
                return <AlertCircle size={20} className="text-yellow-600" />;
            case 'info':
            default:
                return <Info size={20} className="text-blue-600" />;
        }
    };

    const getBackgroundColor = (type: ToastType['type']) => {
        switch (type) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200';
            case 'info':
            default:
                return 'bg-blue-50 border-blue-200';
        }
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[10000] space-y-2 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`${getBackgroundColor(toast.type)} border rounded-lg shadow-lg p-4 flex items-start gap-3 min-w-[300px] max-w-[400px] pointer-events-auto animate-slideIn`}
                >
                    <div className="flex-shrink-0 mt-0.5">
                        {getIcon(toast.type)}
                    </div>
                    <p className="flex-1 text-sm text-gray-800 leading-snug">
                        {toast.message}
                    </p>
                    <button
                        onClick={() => onDismiss(toast.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
