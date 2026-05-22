import { FormEvent, useMemo, useState } from "react";
import "./App.css";

type Page = "dashboard" | "products" | "orders" | "users";

type ProductStatus = "active" | "draft" | "archived";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
};

type OrderStatus = "new" | "processing" | "completed" | "cancelled";

type Order = {
  id: string;
  customer: string;
  total: number;
  status: OrderStatus;
};

type UserRole = "admin" | "seller" | "user";
type UserStatus = "active" | "blocked";

type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

type ProductForm = {
  name: string;
  category: string;
  price: string;
  stock: string;
  status: ProductStatus;
};

const initialProducts: Product[] = [
  {
    id: 1,
    name: "iPhone 15 Pro",
    category: "Смартфоны",
    price: 129990,
    stock: 12,
    status: "active",
  },
  {
    id: 2,
    name: "MacBook Air M2",
    category: "Ноутбуки",
    price: 109990,
    stock: 7,
    status: "active",
  },
  {
    id: 3,
    name: "AirPods Pro",
    category: "Аксессуары",
    price: 24990,
    stock: 21,
    status: "draft",
  },
];

const initialOrders: Order[] = [
  {
    id: "#1001",
    customer: "Иван Петров",
    total: 129990,
    status: "new",
  },
  {
    id: "#1002",
    customer: "Анна Смирнова",
    total: 24990,
    status: "processing",
  },
  {
    id: "#1003",
    customer: "Максим Орлов",
    total: 109990,
    status: "completed",
  },
];

const initialUsers: User[] = [
  {
    id: 1,
    name: "Admin",
    email: "admin@marketai.ru",
    role: "admin",
    status: "active",
  },
  {
    id: 2,
    name: "Seller",
    email: "seller@marketai.ru",
    role: "seller",
    status: "active",
  },
  {
    id: 3,
    name: "User",
    email: "user@marketai.ru",
    role: "user",
    status: "blocked",
  },
];

const emptyProductForm: ProductForm = {
  name: "",
  category: "",
  price: "",
  stock: "",
  status: "active",
};

const pageTitles: Record<Page, string> = {
  dashboard: "Dashboard",
  products: "Products",
  orders: "Orders",
  users: "Users",
};

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [users, setUsers] = useState<User[]>(initialUsers);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] =
    useState<ProductForm>(emptyProductForm);

  const dashboardStats = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== "cancelled");
    const revenue = activeOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      products: products.length,
      orders: orders.length,
      users: users.length,
      revenue,
    };
  }, [orders, products, users]);

  function openAddProductModal() {
    setEditingProduct(null);
    setProductForm(emptyProductForm);
    setIsProductModalOpen(true);
  }

  function openEditProductModal(product: Product) {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      status: product.status,
    });
    setIsProductModalOpen(true);
  }

  function closeProductModal() {
    setIsProductModalOpen(false);
    setEditingProduct(null);
    setProductForm(emptyProductForm);
  }

  function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = productForm.name.trim();
    const category = productForm.category.trim();
    const price = Number(productForm.price);
    const stock = Number(productForm.stock);

    if (!name || !category || price <= 0 || stock < 0) {
      alert("Заполните все поля корректно");
      return;
    }

    if (editingProduct) {
      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === editingProduct.id
            ? {
              ...product,
              name,
              category,
              price,
              stock,
              status: productForm.status,
            }
            : product,
        ),
      );
    } else {
      const newProduct: Product = {
        id: Date.now(),
        name,
        category,
        price,
        stock,
        status: productForm.status,
      };

      setProducts((currentProducts) => [newProduct, ...currentProducts]);
    }

    closeProductModal();
  }

  function deleteProduct(productId: number) {
    const isConfirmed = window.confirm("Удалить товар?");
    if (!isConfirmed) return;

    setProducts((currentProducts) =>
      currentProducts.filter((product) => product.id !== productId),
    );
  }

  function updateOrderStatus(orderId: string, status: OrderStatus) {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    );
  }

  function updateUserRole(userId: number, role: UserRole) {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId ? { ...user, role } : user,
      ),
    );
  }

  function updateUserStatus(userId: number, status: UserStatus) {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId ? { ...user, status } : user,
      ),
    );
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="logo">
          Market<span>AI</span>
        </div>

        <nav>
          {(Object.keys(pageTitles) as Page[]).map((item) => (
            <button
              key={item}
              className={page === item ? "active" : ""}
              onClick={() => setPage(item)}
            >
              {pageTitles[item]}
            </button>
          ))}
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

        {page === "dashboard" && <Dashboard stats={dashboardStats} />}
        {page === "products" && (
          <ProductsPage
            products={products}
            onAddProduct={openAddProductModal}
            onEditProduct={openEditProductModal}
            onDeleteProduct={deleteProduct}
          />
        )}
        {page === "orders" && (
          <OrdersPage orders={orders} onStatusChange={updateOrderStatus} />
        )}
        {page === "users" && (
          <UsersPage
            users={users}
            onRoleChange={updateUserRole}
            onStatusChange={updateUserStatus}
          />
        )}
      </main>

      {isProductModalOpen && (
        <ProductModal
          form={productForm}
          isEditing={Boolean(editingProduct)}
          onClose={closeProductModal}
          onChange={setProductForm}
          onSubmit={handleProductSubmit}
        />
      )}
    </div>
  );
}

function Dashboard({
  stats,
}: {
  stats: {
    products: number;
    orders: number;
    users: number;
    revenue: number;
  };
}) {
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

function ProductsPage({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}: {
  products: Product[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
}) {
  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <h2>Products management</h2>
          <p>Управление товарами, категориями, ценами и остатками</p>
        </div>
        <button className="primary-button" onClick={onAddProduct}>
          Добавить товар
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>Категория</th>
              <th>Цена</th>
              <th>Остаток</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>{formatCurrency(product.price)}</td>
                <td>{product.stock}</td>
                <td>
                  <StatusBadge label={productStatusLabel(product.status)} />
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="table-button"
                      onClick={() => onEditProduct(product)}
                    >
                      Edit
                    </button>
                    <button
                      className="table-button danger"
                      onClick={() => onDeleteProduct(product.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-cell">
                  Товары пока не добавлены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OrdersPage({
  orders,
  onStatusChange,
}: {
  orders: Order[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}) {
  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <h2>Orders management</h2>
          <p>Просмотр заказов и изменение статуса обработки</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Заказ</th>
              <th>Клиент</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Изменить статус</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customer}</td>
                <td>{formatCurrency(order.total)}</td>
                <td>
                  <StatusBadge label={orderStatusLabel(order.status)} />
                </td>
                <td>
                  <select
                    className="select-control"
                    value={order.status}
                    onChange={(event) =>
                      onStatusChange(order.id, event.target.value as OrderStatus)
                    }
                  >
                    <option value="new">Новый</option>
                    <option value="processing">В обработке</option>
                    <option value="completed">Завершен</option>
                    <option value="cancelled">Отменен</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function UsersPage({
  users,
  onRoleChange,
  onStatusChange,
}: {
  users: User[];
  onRoleChange: (userId: number, role: UserRole) => void;
  onStatusChange: (userId: number, status: UserStatus) => void;
}) {
  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <h2>Users management</h2>
          <p>Управление пользователями, ролями и статусом аккаунта</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Имя</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Управление</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <StatusBadge
                    label={user.status === "active" ? "Активен" : "Заблокирован"}
                  />
                </td>
                <td>
                  <div className="inline-controls">
                    <select
                      className="select-control"
                      value={user.role}
                      onChange={(event) =>
                        onRoleChange(user.id, event.target.value as UserRole)
                      }
                    >
                      <option value="admin">admin</option>
                      <option value="seller">seller</option>
                      <option value="user">user</option>
                    </select>

                    <select
                      className="select-control"
                      value={user.status}
                      onChange={(event) =>
                        onStatusChange(
                          user.id,
                          event.target.value as UserStatus,
                        )
                      }
                    >
                      <option value="active">active</option>
                      <option value="blocked">blocked</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ProductModal({
  form,
  isEditing,
  onClose,
  onChange,
  onSubmit,
}: {
  form: ProductForm;
  isEditing: boolean;
  onClose: () => void;
  onChange: (form: ProductForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h2>{isEditing ? "Редактировать товар" : "Добавить товар"}</h2>
            <p>
              Данные пока сохраняются локально. После готовности backend будут
              отправляться через API.
            </p>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="product-form" onSubmit={onSubmit}>
          <label>
            Название товара
            <input
              value={form.name}
              onChange={(event) =>
                onChange({ ...form, name: event.target.value })
              }
              placeholder="Например, iPhone 15"
            />
          </label>

          <label>
            Категория
            <input
              value={form.category}
              onChange={(event) =>
                onChange({ ...form, category: event.target.value })
              }
              placeholder="Например, Смартфоны"
            />
          </label>

          <label>
            Цена
            <input
              type="number"
              min="1"
              value={form.price}
              onChange={(event) =>
                onChange({ ...form, price: event.target.value })
              }
              placeholder="129990"
            />
          </label>

          <label>
            Остаток
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) =>
                onChange({ ...form, stock: event.target.value })
              }
              placeholder="12"
            />
          </label>

          <label>
            Статус
            <select
              value={form.status}
              onChange={(event) =>
                onChange({
                  ...form,
                  status: event.target.value as ProductStatus,
                })
              }
            >
              <option value="active">Активный</option>
              <option value="draft">Черновик</option>
              <option value="archived">Архив</option>
            </select>
          </label>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="primary-button">
              {isEditing ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </form>
      </div>
    </div>
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

function StatusBadge({ label }: { label: string }) {
  return <span className="status-badge">{label}</span>;
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

function productStatusLabel(status: ProductStatus) {
  const labels: Record<ProductStatus, string> = {
    active: "Активный",
    draft: "Черновик",
    archived: "Архив",
  };

  return labels[status];
}

function orderStatusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    new: "Новый",
    processing: "В обработке",
    completed: "Завершен",
    cancelled: "Отменен",
  };

  return labels[status];
}

export default App;