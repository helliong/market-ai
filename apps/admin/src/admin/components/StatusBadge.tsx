import { useLanguage } from "../../hooks/useLanguage";

export function StatusBadge({ label }: { label: string }) {
  const { t } = useLanguage();
  return <span className="status-badge">{t(label)}</span>;
}