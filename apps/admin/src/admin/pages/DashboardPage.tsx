import { StatCard } from "../components/StatCard";
import { formatCurrency } from "../formatters";

type DashboardPageProps = {
  stats: {
    products: number;
    orders: number;
    users: number;
    revenue: number;
  };
};

export function DashboardPage({ stats }: DashboardPageProps) {
  return (
    <section>
      <div className="cards">
        <StatCard title="Товары" value={String(stats.products)} />
        <StatCard title="Заказы" value={String(stats.orders)} />
        <StatCard title="Пользователи" value={String(stats.users)} />
        <StatCard title="Выручка" value={formatCurrency(stats.revenue)} />
      </div>

      <div className="panel">
        <h2>Обзор</h2>
        <p>
          Здесь будет аналитика: продажи, активные пользователи, заказы и работа
          AI-рекомендаций.
        </p>
      </div>
    </section>
  );
}
