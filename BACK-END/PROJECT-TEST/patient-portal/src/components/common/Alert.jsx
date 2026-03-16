import { XCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const styles = {
    success: 'bg-green-900/50 border-green-500 text-green-300',
    error: 'bg-red-900/50 border-red-500 text-red-300',
    warning: 'bg-yellow-900/50 border-yellow-500 text-yellow-300',
    info: 'bg-blue-900/50 border-blue-500 text-blue-300',
};

export const Alert = ({ type = 'info', message, onClose }) => {
    const Icon = icons[type];

    return (
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${styles[type]} animate-fadeIn`}>
            <Icon className="w-5 h-5 flex-shrink-0" />
            <p className="flex-1 text-sm">{message}</p>
            {onClose && (
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                    <XCircle className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};
