import { StatCard } from "../components/StatCard";
import { formatCurrency } from "../formatters";
import { useLanguage } from "../../hooks/useLanguage";

type DashboardPageProps = {
  stats: {
    products: number;
    orders: number;
    users: number;
    revenue: number;
  };
};

// Главная страница ЛК продавца со сводной статистикой магазина.
export function DashboardPage({ stats }: DashboardPageProps) {
  const { t } = useLanguage();
  const hasActivity =
    stats.products > 0 || stats.orders > 0 || stats.users > 0 || stats.revenue > 0;

  return (
    <section>
      <div className="cards">
        <StatCard title="products" value={String(stats.products)} />
        <StatCard title="orders" value={String(stats.orders)} />
        <StatCard title="users" value={String(stats.users)} />
        <StatCard title="revenue" value={formatCurrency(stats.revenue)} />
      </div>

      {!hasActivity && (
        <div className="panel">
          <h2>{t("noDataYet")}</h2>
          <p>{t("noDataMessage")}</p>
        </div>
      )}
    </section>
  );
}
