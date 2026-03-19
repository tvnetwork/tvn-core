import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-deep-brown/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-primary/10 overflow-hidden">
        {/* Header */}
        <div
          className={`px-6 py-5 flex items-start gap-4 border-b ${
            isDanger ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isDanger ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-600'
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="font-serif font-bold text-deep-brown text-base leading-tight">
              {title}
            </h3>
            <p className="text-sm text-taupe mt-1 leading-snug">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-black/5 rounded-full text-taupe shrink-0 transition-colors"
            aria-label="Cancel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex justify-end gap-3 bg-white">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-bold text-taupe hover:text-deep-brown border border-primary/10 rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-sm ${
              isDanger
                ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
