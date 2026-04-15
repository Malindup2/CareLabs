interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmTone?: "primary" | "danger";
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  confirmTone = "primary",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmClass =
    confirmTone === "danger"
      ? "bg-rose-600 hover:bg-rose-700"
      : "bg-blue-600 hover:bg-blue-700";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-white text-sm font-semibold ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
