import { useState } from "react";
import "./App.css";

type Page = "dashboard" | "products" | "orders" | "users";

const products = [
  { id: 1, name: "iPhone 15 Pro", category: "Смартфоны", price: "129 990 ₽", stock: 12 },
  { id: 2, name: "MacBook Air M2", category: "Ноутбуки", price: "109 990 ₽", stock: 7 },
  { id: 3, name: "AirPods Pro", category: "Аксессуары", price: "24 990 ₽", stock: 21 },
];

const orders = [
  { id: "#1001", customer: "Иван Петров", total: "129 990 ₽", status: "Новый" },
  { id: "#1002", customer: "Анна Смирнова", total: "24 990 ₽", status: "В обработке" },
  { id: "#1003", customer: "Максим Орлов", total: "109 990 ₽", status: "Завершен" },
];

const users = [
  { id: 1, name: "Admin", email: "admin@marketai.ru", role: "admin" },
  { id: 2, name: "Seller", email: "seller@marketai.ru", role: "seller" },
  { id: 3, name: "User", email: "user@marketai.ru", role: "user" },
];

function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="logo">Market<span>AI</span></div>

        <nav>
          <button className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>
            Dashboard
          </button>
          <button className={page === "products" ? "active" : ""} onClick={() => setPage("products")}>
            Products
          </button>
          <button className={page === "orders" ? "active" : ""} onClick={() => setPage("orders")}>
            Orders
          </button>
          <button className={page === "users" ? "active" : ""} onClick={() => setPage("users")}>
            Users
          </button>
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <h1>Admin Panel</h1>
            <p>Управление маркетплейсом MarketAI</p>
          </div>
          <button className="profile-button">Admin</button>
        </header>

        {page === "dashboard" && <Dashboard />}
        {page === "products" && <ProductsPage />}
        {page === "orders" && <OrdersPage />}
        {page === "users" && <UsersPage />}
      </main>
    </div>
  );
}

function Dashboard() {
  return (
    <section>
      <div className="cards">
        <StatCard title="Товары" value="128" />
        <StatCard title="Заказы" value="34" />
        <StatCard title="Пользователи" value="512" />
        <StatCard title="Выручка" value="1.2M ₽" />
      </div>

      <div className="panel">
        <h2>Обзор</h2>
        <p>
          Здесь будет аналитика: продажи, активные пользователи, заказы и работа AI-рекомендаций.
        </p>
      </div>
    </section>
  );
}

function ProductsPage() {
  return (
    <section className="panel">
      <div className="section-header">
        <h2>Products management</h2>
        <button className="primary-button">Добавить товар</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Название</th>
            <th>Категория</th>
            <th>Цена</th>
            <th>Остаток</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.category}</td>
              <td>{product.price}</td>
              <td>{product.stock}</td>
              <td>
                <button className="table-button">Edit</button>
                <button className="table-button danger">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function OrdersPage() {
  return (
    <section className="panel">
      <h2>Orders management</h2>

      <table>
        <thead>
          <tr>
            <th>Заказ</th>
            <th>Клиент</th>
            <th>Сумма</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customer}</td>
              <td>{order.total}</td>
              <td>{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function UsersPage() {
  return (
    <section className="panel">
      <h2>Users management</h2>

      <table>
        <thead>
          <tr>
            <th>Имя</th>
            <th>Email</th>
            <th>Роль</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="stat-card">
      <p>{title}</p>
      <h3>{value}</h3>
    </div>
  );
}

export default App;