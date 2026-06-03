import { useLanguage } from "../../hooks/useLanguage";

// Небольшой бейдж статуса для таблиц товаров, заказов и пользователей.
export function StatusBadge({ label }: { label: string }) {
  const { t } = useLanguage();
  return <span className="status-badge">{t(label)}</span>;
}
