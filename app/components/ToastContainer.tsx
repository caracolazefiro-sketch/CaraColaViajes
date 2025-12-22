import React from 'react';
import { IconCheckCircle, IconXCircle, IconAlertCircle, IconInfo, IconX } from '../lib/svgIcons';
import { Toast as ToastType } from '../hooks/useToast';

interface ToastContainerProps {
    toasts: ToastType[];
    onDismiss: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    const getIcon = (type: ToastType['type']) => {
        switch (type) {
            case 'success':
                return <IconCheckCircle size={20} className="text-green-600" />;
            case 'error':
                return <IconXCircle size={20} className="text-red-600" />;
            case 'warning':
                return <IconAlertCircle size={20} className="text-yellow-600" />;
            case 'info':
            default:
                return <IconInfo size={20} className="text-blue-600" />;
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
        <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none">
            <div className="w-full max-w-2xl space-y-3 px-4">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`${getBackgroundColor(toast.type)} border rounded-xl shadow-lg p-5 flex items-start gap-3 w-full pointer-events-auto`}
                >
                    <div className="flex-shrink-0 mt-0.5">
                        {getIcon(toast.type)}
                    </div>
                    <p className="flex-1 text-base text-gray-900 leading-snug font-semibold">
                        {toast.message}
                    </p>
                    <button
                        onClick={() => onDismiss(toast.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Cerrar"
                    >
                        <IconX size={18} />
                    </button>
                </div>
            ))}
            </div>
        </div>
    );
};

export default ToastContainer;
