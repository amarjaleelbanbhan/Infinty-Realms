import { useUIStore } from '@stores/useUIStore';

export function ToastSystem() {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  const typeIcon: Record<string, string> = {
    success: '✅', error: '❌', info: 'ℹ️', gold: '💰',
  };

  return (
    <div className="toast">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item ${toast.type} flex items-center gap-2 cursor-pointer`}
          onClick={() => removeToast(toast.id)}
        >
          <span>{typeIcon[toast.type]}</span>
          <span className="font-ui">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
