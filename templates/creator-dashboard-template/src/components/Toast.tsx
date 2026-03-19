import {
  createContext, useContext, useState, useCallback, useRef,
} from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

// ── Per-type styling ──────────────────────────────────────────────────────────
const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const CARD_STYLE: Record<ToastType, string> = {
  success: 'bg-emerald-50 border-emerald-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200',
  info: 'bg-blue-50 border-blue-200',
};

const ICON_STYLE: Record<ToastType, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

const TEXT_STYLE: Record<ToastType, string> = {
  success: 'text-emerald-900',
  error: 'text-red-900',
  warning: 'text-amber-900',
  info: 'text-blue-900',
};

// ── Single toast card ─────────────────────────────────────────────────────────
function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const Icon = ICONS[item.type];
  return (
    <div
      className={`flex items-start gap-3 pl-4 pr-3 py-3.5 rounded-2xl border shadow-xl max-w-sm w-full
        ${CARD_STYLE[item.type]}`}
    >
      <Icon size={18} className={`shrink-0 mt-0.5 ${ICON_STYLE[item.type]}`} />
      <p className={`flex-grow text-sm font-semibold leading-snug ${TEXT_STYLE[item.type]}`}>
        {item.message}
      </p>
      <button
        onClick={() => onDismiss(item.id)}
        className="shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors text-current opacity-50 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const t = timers.current.get(id);
    if (t) { clearTimeout(t); timers.current.delete(id); }
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    const duration = type === 'error' ? 6000 : 4000;
    timers.current.set(id, setTimeout(() => dismiss(id), duration));
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Fixed portal — always on top */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none"
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastCard item={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
