export function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="stat-card">
      <p>{title}</p>
      <h3>{value}</h3>
    </div>
  );
}
