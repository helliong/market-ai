import { useState } from "react";
import type { FormEvent } from "react";
import { SellerAuthFooter } from "../register/SellerAuthFooter";
import "../register/SellerRegisterPage.css";

type SellerLoginPageProps = {
  onSubmit: (seller: { email: string }) => void;
};

type FormErrors = {
  email?: string;
  password?: string;
};

export function SellerLoginPage({ onSubmit }: SellerLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      nextErrors.email = "Enter email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email";
    }

    if (!trimmedPassword) {
      nextErrors.password = "Enter password";
    } else if (trimmedPassword.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({ email: trimmedEmail });
  }

  return (
    <main className="seller-register-page">
      <div className="seller-register-brand">
        <a className="seller-register-logo" href="#">
          Market<span>AI</span>
        </a>
      </div>

      <section className="seller-register-shell">
        <div className="seller-register-copy">
          <p className="seller-register-eyebrow">MarketAI sellers</p>
          <h1>Sign in to seller workspace</h1>
          <p>
            Continue managing your storefront, product cards, and order flow in
            the MarketAI admin workspace.
          </p>

          <div className="seller-register-benefits">
            <div>Storefront control</div>
            <div>Inventory updates</div>
            <div>Orders dashboard</div>
          </div>
        </div>

        <form className="seller-register-form" onSubmit={handleSubmit}>
          <div>
            <h2>Login</h2>
            <p>Enter the email and password for your seller account.</p>
          </div>

          <label>
            Email
            <input
              className={errors.email ? "is-invalid" : ""}
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((current) => ({ ...current, email: undefined }));
              }}
              placeholder="seller@example.com"
            />
            {errors.email && (
              <span className="seller-register-error">{errors.email}</span>
            )}
          </label>

          <label>
            Password
            <input
              className={errors.password ? "is-invalid" : ""}
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((current) => ({ ...current, password: undefined }));
              }}
              placeholder="Enter password"
            />
            {errors.password && (
              <span className="seller-register-error">{errors.password}</span>
            )}
          </label>

          <button type="submit">Sign in</button>

          <p className="seller-register-switch">
            No seller account yet? <a href="/register">Create one</a>
          </p>
        </form>
      </section>

      <SellerAuthFooter />
    </main>
  );
}
