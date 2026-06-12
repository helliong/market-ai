import { useLanguage } from "../../hooks/useLanguage";

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

// Универсальное подтверждающее окно для опасных или важных действий в ЛК.
export function AdminDialog({ dialog, onClose }: AdminDialogProps) {
  const { t } = useLanguage();
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

        <div className="dialog-content">
          <h2>{dialog.title}</h2>
          <p>{dialog.message}</p>
        </div>

        <div className="dialog-actions">
          {dialog.onConfirm && (
            <button type="button" className="secondary-button" onClick={onClose}>
              {dialog.cancelLabel ?? t("cancel")}
            </button>
          )}
          <button
            type="button"
            className={isDanger ? "danger-button" : "primary-button"}
            onClick={dialog.onConfirm ? handleConfirm : onClose}
          >
            {dialog.confirmLabel ?? t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
