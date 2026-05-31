import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  X,
} from "lucide-react";
import {
  approveModerationSeller,
  getModerationSellers,
  rejectModerationSeller,
} from "./auth-api";
import type { ModerationSeller } from "./auth-api";
import "./App.css";

const MODERATION_KEY_STORAGE = "marketai-moderation-key";

function App() {
  const [adminKey, setAdminKey] = useState(
    () => localStorage.getItem(MODERATION_KEY_STORAGE) ?? "",
  );
  const [sellers, setSellers] = useState<ModerationSeller[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rejectingSeller, setRejectingSeller] =
    useState<ModerationSeller | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  const reviewCount = useMemo(
    () => sellers.filter((seller) => seller.status === "UNDER_REVIEW").length,
    [sellers],
  );

  useEffect(() => {
    if (adminKey.trim()) {
      localStorage.setItem(MODERATION_KEY_STORAGE, adminKey);
    }
  }, [adminKey]);

  async function loadSellers() {
    const key = adminKey.trim();
    if (!key) {
      setError("Введите ключ модератора.");
      return;
    }

    setIsLoading(true);
    setError("");
    setNotice("");
    try {
      const reviewSellers = await getModerationSellers(key);
      setSellers(reviewSellers);
      if (reviewSellers.length === 0) {
        setNotice("Заявок на проверку сейчас нет.");
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  async function approveSeller(seller: ModerationSeller) {
    setError("");
    setNotice("");
    try {
      await approveModerationSeller(adminKey.trim(), seller.id);
      setSellers((current) => current.filter((item) => item.id !== seller.id));
      setNotice(`Магазин "${seller.storeName}" одобрен.`);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function rejectSeller() {
    if (!rejectingSeller) return;

    const comment = rejectComment.trim();
    if (!comment) {
      setError("Напишите, что продавцу нужно исправить.");
      return;
    }

    setError("");
    setNotice("");
    try {
      await rejectModerationSeller(adminKey.trim(), rejectingSeller.id, comment);
      setSellers((current) =>
        current.filter((item) => item.id !== rejectingSeller.id),
      );
      setNotice(`Магазин "${rejectingSeller.storeName}" отклонен.`);
      closeRejectModal();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  function closeRejectModal() {
    setRejectingSeller(null);
    setRejectComment("");
  }

  return (
    <main className="moderation-shell">
      <aside className="moderation-sidebar">
        <div className="brand">
          <span>M</span>
          <div>
            <strong>MarketAI</strong>
            <small>Moderation</small>
          </div>
        </div>

        <nav>
          <button type="button" className="active">
            <ShieldCheck aria-hidden="true" />
            Проверка магазинов
          </button>
        </nav>

        <div className="sidebar-stat">
          <Clock3 aria-hidden="true" />
          <div>
            <strong>{reviewCount}</strong>
            <span>на проверке</span>
          </div>
        </div>
      </aside>

      <section className="moderation-content">
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

        <section className="key-panel">
          <ShieldCheck aria-hidden="true" />
          <label>
            Ключ модератора
            <input
              type="password"
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder="MODERATION_ADMIN_KEY"
            />
          </label>
          <button type="button" className="secondary-button" onClick={loadSellers}>
            <Search aria-hidden="true" />
            Показать заявки
          </button>
        </section>

        {error && <p className="notice error">{error}</p>}
        {notice && <p className="notice success">{notice}</p>}

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
                    <p>{seller.ownerName || "Имя владельца не заполнено"}</p>
                  </div>
                </div>
                <span className="status-badge">{seller.status}</span>
              </div>

              <dl className="seller-details">
                <Detail label="Почта" value={seller.ownerEmail || seller.account.email} />
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
                  value={seller.submittedAt ? formatDate(seller.submittedAt) : undefined}
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
                    setError("");
                  }}
                >
                  <X aria-hidden="true" />
                  Отклонить
                </button>
              </div>
            </article>
          ))}

          {!isLoading && sellers.length === 0 && (
            <div className="empty-state">Заявки появятся здесь после отправки Legal data.</div>
          )}
        </section>
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

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "-"}</dd>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Не удалось выполнить действие.";
}

export default App;
