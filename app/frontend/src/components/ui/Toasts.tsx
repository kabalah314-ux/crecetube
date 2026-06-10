import { CheckCircle2, Info, AlertCircle, X } from "lucide-react";
import { useStore } from "../../store/useStore";

const ICONS = { success: CheckCircle2, info: Info, error: AlertCircle } as const;

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.tipo];
        return (
          <div key={t.id} className={`toast toast-${t.tipo}`} data-testid={`toast-${t.tipo}`}>
            <Icon size={16} />
            <span style={{ flex: 1 }}>{t.texto}</span>
            {t.accion && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  t.accion!.fn();
                  dismiss(t.id);
                }}
              >
                {t.accion.label}
              </button>
            )}
            <button className="btn btn-ghost btn-sm" aria-label="Cerrar aviso" onClick={() => dismiss(t.id)}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
