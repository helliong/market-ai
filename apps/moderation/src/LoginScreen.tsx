import { useState } from "react";
import { LogIn, Mail, Lock, Key } from "lucide-react";
import { loginModerationAdmin } from "./auth-api";
import "./App.css";

type LoginScreenProps = {
  onLogin: (adminKey: string) => void;
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim() || !adminKey.trim()) {
      setError("Заполните все поля");
      return;
    }

    setIsLoading(true);
    try {
      const data = await loginModerationAdmin(email, password, adminKey);
      onLogin(data.adminKey);
    } catch (err: any) {
      setError(err.message || "Ошибка авторизации");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <span>M</span>
          </div>
          <h1>MarketAI Moderation</h1>
          <p>Вход для сотрудников</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <label className="login-field">
            <Mail aria-hidden="true" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email администратора"
              required
            />
          </label>

          <label className="login-field">
            <Lock aria-hidden="true" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              required
            />
          </label>

          <label className="login-field">
            <Key aria-hidden="true" />
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Ключ модератора (MODERATION_ADMIN_KEY)"
              required
            />
          </label>

          <button
            type="submit"
            className="primary-button login-button"
            disabled={isLoading}
          >
            {isLoading ? "Вход..." : (
              <>
                <LogIn aria-hidden="true" />
                Войти
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
