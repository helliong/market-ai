import { useState } from "react";
import type { FormEvent } from "react";
import { SellerAuthFooter } from "./SellerAuthFooter";
import "./SellerRegisterPage.css";

type SellerRegisterPageProps = {
  onSubmit: (seller: { name: string; email: string }) => void;
};

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  agreement?: string;
};

export function SellerRegisterPage({ onSubmit }: SellerRegisterPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName) {
      nextErrors.name = "Enter the store name";
    }

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

    if (!isAgreementAccepted) {
      nextErrors.agreement = "Accept the user agreement";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({ name: trimmedName, email: trimmedEmail });
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
          <h1>Create a seller account</h1>
          <p>
            Register your store to prepare products, manage orders, and open the
            admin workspace for marketplace operations.
          </p>

          <div className="seller-register-benefits">
            <div>Storefront setup</div>
            <div>Product cards</div>
            <div>Orders in work</div>
          </div>
        </div>

        <form className="seller-register-form" onSubmit={handleSubmit}>
          <div>
            <h2>Registration</h2>
            <p>Fill in the store details to create a seller profile.</p>
          </div>

          <label>
            Store name
            <input
              className={errors.name ? "is-invalid" : ""}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrors((current) => ({ ...current, name: undefined }));
              }}
              placeholder="Market store"
            />
            {errors.name && (
              <span className="seller-register-error">{errors.name}</span>
            )}
          </label>

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

          <label className="seller-register-agreement">
            <span
              className={`seller-register-checkbox ${
                isAgreementAccepted ? "is-checked" : ""
              }`}
              aria-hidden="true"
            >
              {isAgreementAccepted ? "✓" : ""}
            </span>
            <input
              type="checkbox"
              checked={isAgreementAccepted}
              onChange={(event) => {
                setIsAgreementAccepted(event.target.checked);
                setErrors((current) => ({
                  ...current,
                  agreement: undefined,
                }));
              }}
            />
            <span>
              I accept the{" "}
              <a href="/agreement" target="_blank" rel="noopener noreferrer">
                user agreement
              </a>
            </span>
          </label>
          {errors.agreement && (
            <span className="seller-register-error seller-register-agreement-error">
              {errors.agreement}
            </span>
          )}

          <button type="submit">Create seller account</button>

          <p className="seller-register-switch">
            Already have a seller account? <a href="/login">Sign in</a>
          </p>
        </form>
      </section>

      <SellerAuthFooter />
    </main>
  );
}
