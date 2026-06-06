import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  X,
  XCircle,
  Users,
  ShoppingBag,
  LogOut,
} from "lucide-react";
import {
  approveModerationSeller,
  getModerationSellers,
  rejectModerationSeller,
  searchModerationSellers,
  searchModerationUsers,
} from "./auth-api";
import type { ModerationSeller, ModerationUser } from "./auth-api";
import { LoginScreen } from "./LoginScreen";
import "./App.css";

const MODERATION_KEY_STORAGE = "marketai-moderation-key";

type ToastState = {
  id: number;
  message: string;
  variant: "success" | "error";
};

type TabType = "review" | "users" | "stores";

// Главный экран модерации: загрузка заявок продавцов, одобрение и отклонение legal review.
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem(MODERATION_KEY_STORAGE),
  );
  const [activeTab, setActiveTab] = useState<TabType>("review");
  const [adminKey, setAdminKey] = useState(
    () => localStorage.getItem(MODERATION_KEY_STORAGE) ?? "",
  );
  
  // States for 'review' tab
  const [sellers, setSellers] = useState<ModerationSeller[]>([]);
  const [rejectingSeller, setRejectingSeller] = useState<ModerationSeller | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  // States for search tabs
  const [searchQuery, setSearchQuery] = useState("");
  const [foundUsers, setFoundUsers] = useState<ModerationUser[]>([]);
  const [foundSellers, setFoundSellers] = useState<ModerationSeller[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const reviewCount = useMemo(
    () => sellers.filter((seller) => seller.status === "UNDER_REVIEW").length,
    [sellers],
  );

  useEffect(() => {
    if (adminKey.trim()) {
      localStorage.setItem(MODERATION_KEY_STORAGE, adminKey);
    }
  }, [adminKey]);

  // Загружает список продавцов на проверке по введенному MODERATION_ADMIN_KEY.
  async function loadSellers() {
    const key = adminKey.trim();
    if (!key) {
      showToast("Введите ключ модератора.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const reviewSellers = await getModerationSellers(key);
      setSellers(reviewSellers);
      if (reviewSellers.length === 0) {
        showToast("Заявок на проверку сейчас нет.", "success");
      }
    } catch (requestError) {
      showToast(getErrorMessage(requestError), "error");
    } finally {
      setIsLoading(false);
    }
  }

  // Одобряет выбранного продавца и убирает его карточку из списка проверки.
  async function approveSeller(seller: ModerationSeller) {
    try {
      await approveModerationSeller(adminKey.trim(), seller.id);
      setSellers((current) => current.filter((item) => item.id !== seller.id));
      showToast(`Магазин "${seller.storeName}" одобрен.`, "success");
    } catch (requestError) {
      showToast(getErrorMessage(requestError), "error");
    }
  }

  // Отклоняет выбранного продавца с обязательным комментарием для исправлений.
  async function rejectSeller() {
    if (!rejectingSeller) return;

    const comment = rejectComment.trim();
    if (!comment) {
      showToast("Напишите, что продавцу нужно исправить.", "error");
      return;
    }

    try {
      await rejectModerationSeller(adminKey.trim(), rejectingSeller.id, comment);
      setSellers((current) =>
        current.filter((item) => item.id !== rejectingSeller.id),
      );
      showToast(`Магазин "${rejectingSeller.storeName}" отклонен.`, "error");
      closeRejectModal();
    } catch (requestError) {
      showToast(getErrorMessage(requestError), "error");
    }
  }

  // Закрывает модалку отклонения и очищает введенный комментарий.
  function closeRejectModal() {
    setRejectingSeller(null);
    setRejectComment("");
  }

  // Показывает временное toast-уведомление о результате действия модератора.
  function showToast(message: string, variant: ToastState["variant"]) {
    const id = Date.now();
    setToast({ id, message, variant });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4200);
  }

  async function searchUsers() {
    const key = adminKey.trim();
    if (!key) {
      showToast("Введите ключ модератора.", "error");
      return;
    }
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const users = await searchModerationUsers(key, searchQuery);
      setFoundUsers(users);
      if (users.length === 0) showToast("Пользователи не найдены.", "success");
    } catch (requestError) {
      showToast(getErrorMessage(requestError), "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function searchSellers() {
    const key = adminKey.trim();
    if (!key) {
      showToast("Введите ключ модератора.", "error");
      return;
    }
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const results = await searchModerationSellers(key, searchQuery);
      setFoundSellers(results);
      if (results.length === 0) showToast("Магазины не найдены.", "success");
    } catch (requestError) {
      showToast(getErrorMessage(requestError), "error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogin(key: string) {
    localStorage.setItem(MODERATION_KEY_STORAGE, key);
    setAdminKey(key);
    setIsAuthenticated(true);
  }

  function handleLogout() {
    localStorage.removeItem(MODERATION_KEY_STORAGE);
    setAdminKey("");
    setIsAuthenticated(false);
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <main className="moderation-shell">
      {toast && (
        <ToastNotification
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      <aside className="moderation-sidebar">
        <div className="brand">
          <span>M</span>
          <div>
            <strong>MarketAI</strong>
            <small>Moderation</small>
          </div>
        </div>

        <nav>
          <button 
            type="button" 
            className={activeTab === "review" ? "active" : ""}
            onClick={() => setActiveTab("review")}
          >
            <ShieldCheck aria-hidden="true" />
            Проверка магазинов
          </button>
          <button 
            type="button" 
            className={activeTab === "users" ? "active" : ""}
            onClick={() => { setActiveTab("users"); setFoundUsers([]); setSearchQuery(""); }}
          >
            <Users aria-hidden="true" />
            Поиск пользователей
          </button>
          <button 
            type="button" 
            className={activeTab === "stores" ? "active" : ""}
            onClick={() => { setActiveTab("stores"); setFoundSellers([]); setSearchQuery(""); }}
          >
            <ShoppingBag aria-hidden="true" />
            Поиск магазинов
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-stat">
            <Clock3 aria-hidden="true" />
            <div>
              <strong>{reviewCount}</strong>
              <span>на проверке</span>
            </div>
          </div>
          <button type="button" className="danger-button sidebar-logout" onClick={handleLogout}>
            <LogOut aria-hidden="true" />
            Выйти
          </button>
        </div>
      </aside>

      <section className="moderation-content">
        {activeTab === "review" && (
          <>
            <header className="topbar">
              <div>
                <p>Ручная модерация</p>
                <h1>Заявки продавцов</h1>
              </div>
              <button
                type="button"
                className="primary-button"
                disabled={isLoading}
                onClick={loadSellers}
              >
                <RefreshCw aria-hidden="true" />
                {isLoading ? "Загрузка" : "Обновить"}
              </button>
            </header>


          </>
        )}

        {activeTab === "users" && (
          <>
            <header className="topbar">
              <div>
                <p>Управление покупателями</p>
                <h1>Поиск пользователей</h1>
              </div>
            </header>

            <section className="key-panel">
              <Search aria-hidden="true" />
              <label>
                Поиск (email или телефон)
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                  placeholder="Введите данные для поиска..."
                />
              </label>
              <button type="button" className="secondary-button" onClick={searchUsers} disabled={isLoading}>
                <Search aria-hidden="true" />
                Найти
              </button>
            </section>
          </>
        )}

        {activeTab === "stores" && (
          <>
            <header className="topbar">
              <div>
                <p>Управление продавцами</p>
                <h1>Поиск магазинов</h1>
              </div>
            </header>

            <section className="key-panel">
              <Search aria-hidden="true" />
              <label>
                Поиск (Название, Email, ИНН, Юр.лицо)
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchSellers()}
                  placeholder="Введите данные для поиска..."
                />
              </label>
              <button type="button" className="secondary-button" onClick={searchSellers} disabled={isLoading}>
                <Search aria-hidden="true" />
                Найти
              </button>
            </section>
          </>
        )}

        {activeTab === "review" && (
          <section className="seller-list">
          {sellers.map((seller) => (
            <article className="seller-card" key={seller.id}>
              <div className="seller-card-header">
                <div className="seller-title">
                  <span>
                    <Store aria-hidden="true" />
                  </span>
                  <div>
                    <h2>{seller.storeName}</h2>
                    <p>
                      {seller.ownerName || "Имя владельца не заполнено"}
                    </p>
                  </div>
                </div>
                <span className="status-badge">{seller.status}</span>
              </div>

              <dl className="seller-details">
                <Detail
                  label="Почта"
                  value={seller.ownerEmail || seller.account.email}
                />
                <Detail
                  label="Тип бизнеса"
                  value={seller.legalProfile?.businessType}
                />
                <Detail label="ИНН / Tax ID" value={seller.legalProfile?.taxId} />
                <Detail
                  label="Юр. название"
                  value={seller.legalProfile?.legalName}
                />
                <Detail
                  label="Юр. адрес"
                  value={seller.legalProfile?.legalAddress}
                />
                <Detail label="Банк" value={seller.legalProfile?.bankName} />
                <Detail label="IBAN" value={seller.legalProfile?.iban} />
                <Detail
                  label="Отправлено"
                  value={
                    seller.submittedAt ? formatDate(seller.submittedAt) : undefined
                  }
                />
              </dl>

              <div className="seller-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => approveSeller(seller)}
                >
                  <CheckCircle2 aria-hidden="true" />
                  Одобрить
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => {
                    setRejectingSeller(seller);
                    setRejectComment("");
                  }}
                >
                  <X aria-hidden="true" />
                  Отклонить
                </button>
              </div>
            </article>
          ))}

          {!isLoading && sellers.length === 0 && (
            <div className="empty-state">
              Заявки появятся здесь после отправки Legal data.
            </div>
          )}
        </section>
        )}

        {activeTab === "users" && (
          <section className="seller-list">
            {foundUsers.map((user) => (
              <article className="seller-card" key={user.id}>
                <div className="seller-card-header">
                  <div className="seller-title">
                    <span>
                      <Users aria-hidden="true" />
                    </span>
                    <div>
                      <h2>{user.displayName}</h2>
                      <p>{user.email}</p>
                    </div>
                  </div>
                  <span className="status-badge" style={{ background: user.isEmailVerified ? '#dcfce7' : '#fef3c7', color: user.isEmailVerified ? '#166534' : '#92400e' }}>
                    {user.isEmailVerified ? "Подтвержден" : "Не подтвержден"}
                  </span>
                </div>
                <dl className="seller-details">
                  <Detail label="ID" value={user.id} />
                  <Detail label="Телефон" value={user.phone} />
                  <Detail label="Дата регистрации" value={formatDate(user.createdAt)} />
                </dl>
              </article>
            ))}
          </section>
        )}

        {activeTab === "stores" && (
          <section className="seller-list">
            {foundSellers.map((seller) => (
              <article className="seller-card" key={seller.id}>
                <div className="seller-card-header">
                  <div className="seller-title">
                    <span>
                      <Store aria-hidden="true" />
                    </span>
                    <div>
                      <h2>{seller.storeName}</h2>
                      <p>{seller.ownerName || "Имя владельца не заполнено"}</p>
                    </div>
                  </div>
                  <span className="status-badge">{seller.status}</span>
                </div>
                <dl className="seller-details">
                  <Detail label="Почта" value={seller.ownerEmail || seller.account.email} />
                  <Detail label="Тип бизнеса" value={seller.legalProfile?.businessType} />
                  <Detail label="ИНН / Tax ID" value={seller.legalProfile?.taxId} />
                  <Detail label="Юр. название" value={seller.legalProfile?.legalName} />
                  <Detail label="Юр. адрес" value={seller.legalProfile?.legalAddress} />
                  <Detail label="Банк" value={seller.legalProfile?.bankName} />
                  <Detail label="IBAN" value={seller.legalProfile?.iban} />
                  <Detail label="Создано" value={formatDate(seller.createdAt)} />
                </dl>
              </article>
            ))}
          </section>
        )}
      </section>

      {rejectingSeller && (
        <div className="modal-backdrop">
          <form
            className="modal-card"
            onSubmit={(event) => {
              event.preventDefault();
              void rejectSeller();
            }}
          >
            <div className="modal-header">
              <div>
                <h2>Отклонить заявку</h2>
                <p>{rejectingSeller.storeName}</p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Закрыть"
                onClick={closeRejectModal}
              >
                <X aria-hidden="true" />
              </button>
            </div>

            <label className="reject-field">
              Комментарий для продавца
              <textarea
                value={rejectComment}
                onChange={(event) => setRejectComment(event.target.value)}
                placeholder="Например: добавьте корректный ИНН и юридический адрес."
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeRejectModal}
              >
                Отмена
              </button>
              <button type="submit" className="danger-button">
                Отклонить
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

// Отображает одну пару "поле-значение" в карточке продавца.
function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "-"}</dd>
    </div>
  );
}

// Toast-уведомление для успешных и ошибочных действий модератора.
function ToastNotification({
  message,
  variant,
  onClose,
}: {
  message: string;
  variant: ToastState["variant"];
  onClose: () => void;
}) {
  const Icon = variant === "success" ? CheckCircle2 : XCircle;

  return (
    <div className={`toast-notification toast-notification-${variant}`}>
      <Icon aria-hidden="true" />
      <span>{message}</span>
      <button type="button" aria-label="Close notification" onClick={onClose}>
        <X aria-hidden="true" />
      </button>
    </div>
  );
}

// Форматирует дату отправки заявки в читаемый русский формат.
function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

// Достает текст ошибки из Error или возвращает общий fallback.
function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Не удалось выполнить действие.";
}

export default App;
