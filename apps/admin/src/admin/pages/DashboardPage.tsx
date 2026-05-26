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
  const hasActivity =
    stats.products > 0 || stats.orders > 0 || stats.users > 0 || stats.revenue > 0;

  return (
    <section>
      <div className="cards">
        <StatCard title="Товары" value={String(stats.products)} />
        <StatCard title="Заказы" value={String(stats.orders)} />
        <StatCard title="Пользователи" value={String(stats.users)} />
        <StatCard title="Выручка" value={formatCurrency(stats.revenue)} />
      </div>

      {!hasActivity && (
        <div className="panel">
          <h2>Обзор</h2>
          <p>
            Данных пока нет. Добавьте первый товар или дождитесь первого заказа,
            чтобы здесь появилась статистика магазина.
          </p>
        </div>
      )}
    </section>
  );
}
