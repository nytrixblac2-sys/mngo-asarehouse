"use client";

import { useEffect, useState } from "react";
import s from "@/components/landing-page.module.css";

const SUN = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MOON = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const prose: React.CSSProperties = {
  fontSize: "0.9rem",
  color: "var(--lp-t2)",
  lineHeight: 1.8,
  marginBottom: 16,
};

const h2style: React.CSSProperties = {
  fontSize: "1.15rem",
  fontWeight: 700,
  color: "var(--lp-t1)",
  marginTop: 48,
  marginBottom: 12,
};

const h3style: React.CSSProperties = {
  fontSize: "0.95rem",
  fontWeight: 600,
  color: "var(--lp-t1)",
  marginTop: 24,
  marginBottom: 8,
};

export default function PrivacyPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem("mngo-theme"); } catch {}
    const t = (stored === "dark" || stored === "light") ? (stored as "light" | "dark") : "light";
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("mngo-theme", next); } catch {}
  }

  return (
    <div className={s.wrapper}>
      <nav className={s.nav} style={{ position: "sticky", top: 0, background: "var(--lp-nav-bg)", borderBottom: "1px solid var(--lp-nav-bdr)", backdropFilter: "blur(18px)" }}>
        <div className={s.navInner}>
          <a href="/" className={s.logo}>MN<span className={s.logoG}>GO</span></a>
          <div className={s.navLinks}>
            <a href="/#features" className={s.navA}>Features</a>
            <a href="/pricing" className={s.navA}>Pricing</a>
            <a href="/contact" className={s.navA}>Contact</a>
          </div>
          <div className={s.navCtas}>
            <button className={s.themeBtn} onClick={toggleTheme} aria-label="Toggle theme">
              <span className={s.themeIcon} style={{ opacity: theme === "dark" ? 1 : 0 }}>{SUN}</span>
              <span className={s.themeIcon} style={{ opacity: theme === "dark" ? 0 : 1 }}>{MOON}</span>
            </button>
            <a href="/login" className={`${s.btn} ${s.btnOutline}`}>Sign in</a>
            <a href="/signup" className={`${s.btn} ${s.btnPrimary}`}>Get started</a>
          </div>
        </div>
      </nav>

      <section className={s.sec} style={{ paddingTop: 72, paddingBottom: 32 }}>
        <div className={s.secInner} style={{ maxWidth: 720, margin: "0 auto" }}>
          <div className={s.secLabel}>Legal</div>
          <h1 className={s.secH2} style={{ marginTop: 12, marginBottom: 8 }}>Privacy Policy</h1>
          <p style={{ fontSize: "0.84rem", color: "var(--lp-t3)" }}>Last updated: September 2026</p>
        </div>
      </section>

      <section className={s.sec} style={{ paddingTop: 0, paddingBottom: 96 }}>
        <div className={s.secInner} style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ padding: "20px 24px", background: "var(--lp-surf)", border: "1px solid var(--lp-bdr)", borderRadius: 12, marginBottom: 40 }}>
            <p style={{ ...prose, marginBottom: 0, fontSize: "0.84rem" }}>
              This policy describes how MNGO (operated by dotAI, Accra, Ghana) collects, stores, and uses information when you use the MNGO property management platform. By creating an account or using our services, you agree to the practices described here.
            </p>
          </div>

          <h2 style={h2style}>1. Information we collect</h2>

          <h3 style={h3style}>Account information</h3>
          <p style={prose}>When you sign up for MNGO, we collect your name, email address, and a hashed version of your password. Your password is never stored in readable form — it is secured by Supabase Auth, which uses industry-standard bcrypt hashing.</p>

          <h3 style={h3style}>Workspace and property data</h3>
          <p style={prose}>We store the information you enter to describe and manage your property: property names, room details, pricing rules, currencies, allocation percentages, and facilities. This is operational data you create and fully control.</p>

          <h3 style={h3style}>Booking and guest data</h3>
          <p style={prose}>When you record a guest booking, we store the guest&apos;s name, phone number, optional email address, check-in and check-out dates, booking amounts, payment status, and any optional identification number you choose to enter. You are the data controller for your guests&apos; personal information. MNGO processes it on your behalf as a data processor.</p>

          <h3 style={h3style}>Financial data</h3>
          <p style={prose}>We store expense records (amounts, categories, dates, notes) and manual income entries that you or your team create. This data belongs to your workspace and is not shared with any other party.</p>

          <h3 style={h3style}>Team and staff data</h3>
          <p style={prose}>If you invite Co-Managers or Property Owners to your workspace, we store their names and email addresses to create their login accounts. Staff names may appear on schedule and shift records.</p>

          <h3 style={h3style}>Order and menu data</h3>
          <p style={prose}>For workspaces that use the Menu, Orders, or Shop features, we store order items, quantities, guest names, and phone numbers provided at checkout. No payment card numbers are stored — MNGO does not process card payments.</p>

          <h2 style={h2style}>2. How we store your data</h2>
          <p style={prose}>All MNGO data is stored in a PostgreSQL database hosted by Supabase, a trusted cloud infrastructure provider. Supabase infrastructure is hosted on Amazon Web Services (AWS) and is located outside Ghana. By using MNGO, you consent to your data being stored on international cloud servers operated by Supabase.</p>
          <p style={prose}>Every connection to our database and API is encrypted in transit using HTTPS/TLS. Row-level security is enabled on all database tables. Your workspace&apos;s data is logically separated from other workspaces at the application layer.</p>

          <h2 style={h2style}>3. Data security</h2>
          <p style={prose}>We implement the following security measures to protect your data:</p>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            {[
              "HTTPS/TLS encryption on all data in transit",
              "Bcrypt password hashing via Supabase Auth",
              "Rate limiting on login, signup, and public endpoints (IP-based, Postgres-backed)",
              "Account PIN lockout after repeated failed attempts",
              "HMAC-signed session tokens for guest-facing features",
              "Row-level security enabled on all database tables",
              "Security response headers on every HTTP response (X-Frame-Options, HSTS, CSP, and more)",
            ].map((item) => (
              <li key={item} style={{ fontSize: "0.88rem", color: "var(--lp-t2)", lineHeight: 1.7, marginBottom: 6 }}>{item}</li>
            ))}
          </ul>
          <p style={prose}>No system is completely secure. If you believe there has been a security incident, please contact us immediately at kwame@dotdwgstudio.com.</p>

          <h2 style={h2style}>4. How we use your data</h2>
          <p style={prose}>We use the data we collect exclusively to provide and improve the MNGO service:</p>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            {[
              "Authenticating your account and maintaining your session",
              "Displaying your workspace's properties, bookings, financials, and team information",
              "Generating reports and financial summaries from your own entered data",
              "Communicating with you about your account (currently by email when you contact us directly)",
            ].map((item) => (
              <li key={item} style={{ fontSize: "0.88rem", color: "var(--lp-t2)", lineHeight: 1.7, marginBottom: 6 }}>{item}</li>
            ))}
          </ul>
          <p style={prose}>We do not use your data for advertising, profiling, or sale to third parties.</p>

          <h2 style={h2style}>5. Data sharing and third parties</h2>
          <p style={prose}>We do not sell your data. We do not share your data with advertising networks or marketing platforms. The only third party that has access to your data is Supabase, which acts as our infrastructure provider and data processor under a data processing agreement.</p>
          <p style={prose}>We do not use Google Analytics, Meta Pixel, Mixpanel, or any other behavioural tracking or analytics service that profiles individual users.</p>

          <h2 style={h2style}>6. Cookies and local storage</h2>
          <p style={prose}>MNGO uses browser cookies for authentication sessions — these are set by Supabase Auth and are necessary for you to stay logged in. We also use browser <code style={{ fontFamily: "monospace", fontSize: "0.85em", background: "var(--lp-surf)", padding: "1px 5px", borderRadius: 4 }}>localStorage</code> to remember your light/dark mode preference. We do not use tracking cookies.</p>

          <h2 style={h2style}>7. Your rights</h2>
          <p style={prose}>You have the right to access, correct, or delete the personal data we hold about you. To exercise any of these rights, email us at kwame@dotdwgstudio.com with your account email address. We will respond within 14 days.</p>
          <p style={prose}>If you close your MNGO workspace and request data deletion, we will permanently delete your workspace data from our database within 30 days.</p>

          <h2 style={h2style}>8. Guest data and your responsibilities</h2>
          <p style={prose}>When you record personal information about your guests (names, phone numbers, identification numbers) in MNGO, you are the data controller for that information under applicable data protection law, including the Ghana Data Protection Act, 2012 (Act 843). MNGO acts as your data processor. You are responsible for ensuring you have the right to collect and store your guests&apos; personal information and that your guests are aware of how their information is used.</p>

          <h2 style={h2style}>9. Data retention</h2>
          <p style={prose}>We retain your data for as long as your workspace is active. If you request account deletion, we will delete your data within 30 days. We may retain anonymised, aggregated usage statistics that cannot identify you or your guests.</p>

          <h2 style={h2style}>10. Changes to this policy</h2>
          <p style={prose}>We may update this Privacy Policy from time to time. Material changes will be communicated by updating the &quot;Last updated&quot; date at the top of this page. Continued use of MNGO after an update constitutes acceptance of the revised policy.</p>

          <h2 style={h2style}>11. Contact</h2>
          <p style={prose}>For any privacy-related questions, requests, or concerns, contact us at:</p>
          <div style={{ padding: "20px 24px", background: "var(--lp-surf)", border: "1px solid var(--lp-bdr)", borderRadius: 12 }}>
            <p style={{ ...prose, marginBottom: 4 }}><strong style={{ color: "var(--lp-t1)" }}>dotAI / MNGO</strong></p>
            <p style={{ ...prose, marginBottom: 4 }}>Email: kwame@dotdwgstudio.com</p>
            <p style={{ ...prose, marginBottom: 4 }}>WhatsApp / Phone: 0540885406</p>
            <p style={{ ...prose, marginBottom: 0 }}>Accra, Ghana</p>
          </div>
        </div>
      </section>

      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.footerBot} style={{ borderTop: "none", paddingTop: 0 }}>
            <div className={s.ftCopy}>© {new Date().getFullYear()} MNGO. All rights reserved.</div>
            <div className={s.ftDotai}>Created by <strong className={s.ftDotaiStrong}>dotAI</strong> 2026</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
