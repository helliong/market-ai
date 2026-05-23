import { SellerAuthFooter } from "../register/SellerAuthFooter";
import "../register/SellerRegisterPage.css";

const sections = [
  {
    title: "1. General Terms",
    text: "This agreement describes the basic rules for using the MarketAI seller workspace, including storefront setup, product management, and order operations.",
  },
  {
    title: "2. Seller Account",
    text: "The seller is responsible for the accuracy of account data, store information, product descriptions, prices, and order processing details.",
  },
  {
    title: "3. Product Information",
    text: "Product cards should contain correct names, categories, prices, stock values, and status information. Demo data can be replaced when backend services are connected.",
  },
  {
    title: "4. Admin Tools",
    text: "The admin workspace provides interface tools for marketplace operations. Final business rules, moderation, payments, and delivery flows can be expanded later.",
  },
  {
    title: "5. Updates",
    text: "MarketAI may update these terms as the seller product develops, backend services are added, and new operational features become available.",
  },
];

export function SellerAgreementPage() {
  return (
    <main className="seller-agreement-page">
      <div className="seller-register-brand">
        <a className="seller-register-logo" href="/">
          Market<span>AI</span>
        </a>
      </div>

      <section className="seller-agreement-shell">
        <div className="seller-agreement-card">
          <p className="seller-register-eyebrow">MarketAI sellers</p>
          <h1>User agreement</h1>
          <p>
            Terms for sellers using the MarketAI admin workspace. This is a
            frontend version of the agreement and can be expanded with backend
            rules later.
          </p>

          <div className="seller-agreement-sections">
            {sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                <p>{section.text}</p>
              </section>
            ))}
          </div>
        </div>
      </section>

      <SellerAuthFooter />
    </main>
  );
}
