const footerLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/register", label: "Register" },
  { href: "/login", label: "Login" },
  { href: "/agreement", label: "Agreement" },
];

export function SellerAuthFooter() {
  return (
    <footer className="seller-auth-footer">
      <div className="seller-auth-footer-main">
        <div>
          <a className="seller-auth-footer-logo" href="/">
            Market<span>AI</span>
          </a>
          <p>
            Seller workspace for storefront setup, catalog operations, and order
            management.
          </p>
        </div>

        <div>
          <h3>Navigation</h3>
          <nav>
            {footerLinks.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div>
          <h3>Contacts</h3>
          <div className="seller-auth-footer-contacts">
            <span>+7 900 000-00-00</span>
            <span>seller@marketai.local</span>
            <span>Ekaterinburg</span>
          </div>
        </div>
      </div>

      <div className="seller-auth-footer-bottom">
        <span>© 2026 MarketAI</span>
        <span>Seller tools for marketplace operations</span>
      </div>
    </footer>
  );
}
