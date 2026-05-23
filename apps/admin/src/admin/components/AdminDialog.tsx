export type AdminDialogState = {
  title: string;
  message: string;
  variant?: "info" | "danger";
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
};

type AdminDialogProps = {
  dialog: AdminDialogState;
  onClose: () => void;
};

export function AdminDialog({ dialog, onClose }: AdminDialogProps) {
  const isDanger = dialog.variant === "danger";

  function handleConfirm() {
    dialog.onConfirm?.();
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <div className="dialog-card" role="dialog" aria-modal="true">
        <div className={`dialog-icon ${isDanger ? "danger" : ""}`}>
          {isDanger ? "!" : "i"}
        </div>

        <div>
          <h2>{dialog.title}</h2>
          <p>{dialog.message}</p>
        </div>

        <div className="dialog-actions">
          {dialog.onConfirm && (
            <button type="button" className="secondary-button" onClick={onClose}>
              {dialog.cancelLabel ?? "Отмена"}
            </button>
          )}
          <button
            type="button"
            className={isDanger ? "danger-button" : "primary-button"}
            onClick={dialog.onConfirm ? handleConfirm : onClose}
          >
            {dialog.confirmLabel ?? "Понятно"}
          </button>
        </div>
      </div>
    </div>
  );
}
