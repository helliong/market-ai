import { useLanguage } from "../../hooks/useLanguage";

export function StatCard({ title, value }: { title: string; value: string }) {
  const { t } = useLanguage();
  return (
    <div className="stat-card">
      <p>{t(title)}</p>
      <h3>{value}</h3>
    </div>
  );
}