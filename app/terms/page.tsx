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

export default function TermsPage() {
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
          <h1 className={s.secH2} style={{ marginTop: 12, marginBottom: 8 }}>Terms of Service</h1>
          <p style={{ fontSize: "0.84rem", color: "var(--lp-t3)" }}>Last updated: September 2026</p>
        </div>
      </section>

      <section className={s.sec} style={{ paddingTop: 0, paddingBottom: 96 }}>
        <div className={s.secInner} style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ padding: "20px 24px", background: "var(--lp-surf)", border: "1px solid var(--lp-bdr)", borderRadius: 12, marginBottom: 40 }}>
            <p style={{ ...prose, marginBottom: 0, fontSize: "0.84rem" }}>
              These Terms of Service govern your use of the MNGO property management platform, operated by dotAI (Accra, Ghana). By creating a workspace or using MNGO in any capacity, you agree to these terms. If you do not agree, do not use the service.
            </p>
          </div>

          <h2 style={h2style}>1. The service</h2>
          <p style={prose}>MNGO is a software-as-a-service (SaaS) platform that provides property management tools including booking management, financial tracking, team management, menu and order management, and related operational features. The service is provided as described on our website and may be updated from time to time.</p>
          <p style={prose}>Access to MNGO requires approval from the dotAI team after you submit a workspace signup. Approved workspaces gain access to the full platform features described by their plan.</p>

          <h2 style={h2style}>2. Your account</h2>
          <p style={prose}>You are responsible for maintaining the confidentiality of your account credentials. You must not share your login details with anyone outside your authorised team. If you believe your account has been compromised, contact us immediately.</p>
          <p style={prose}>You are responsible for all activity that occurs under your workspace, including actions taken by Co-Managers and Property Owners you have invited. Invite only people you trust and who need access to your property data.</p>
          <p style={prose}>You must provide accurate information when creating your account. Using false information to create a workspace is grounds for immediate termination.</p>

          <h2 style={h2style}>3. Acceptable use</h2>
          <p style={prose}>You may use MNGO only for legitimate property and business management purposes. You must not:</p>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            {[
              "Use MNGO to store data you are not legally authorised to collect or process",
              "Attempt to access another workspace's data without authorisation",
              "Reverse-engineer, scrape, or extract data from the platform by automated means",
              "Upload malicious code or attempt to interfere with MNGO's infrastructure",
              "Resell or sublicense access to MNGO to third parties without our written consent",
              "Use the platform in a way that violates any applicable local, national, or international law",
            ].map((item) => (
              <li key={item} style={{ fontSize: "0.88rem", color: "var(--lp-t2)", lineHeight: 1.7, marginBottom: 6 }}>{item}</li>
            ))}
          </ul>

          <h2 style={h2style}>4. Plans and payment</h2>
          <p style={prose}>MNGO offers a free Starter plan for single-property workspaces. Paid plans (Pro, Enterprise) are subject to pricing as published on our website at the time of agreement.</p>
          <p style={prose}>Billing for paid plans is currently managed manually by the dotAI team. We do not process card payments through MNGO — payment arrangements are made directly between you and dotAI. Paid access is activated when we confirm receipt of payment.</p>
          <p style={prose}>Prices may change. We will give you at least 30 days&apos; notice before any price increase that affects your current plan. Continued use of the service after the notice period constitutes acceptance of the new pricing.</p>

          <h2 style={h2style}>5. Data ownership</h2>
          <p style={prose}>Your workspace data belongs to you. MNGO does not claim any ownership over the operational data you create, including bookings, financial records, guest information, and property details.</p>
          <p style={prose}>You grant MNGO a limited licence to store and process your data solely for the purpose of providing the service to you. We do not use your data for any other purpose, including advertising or resale.</p>
          <p style={prose}>You may request a full export or deletion of your data at any time by contacting us. See our Privacy Policy for details on how we handle your data.</p>

          <h2 style={h2style}>6. Service availability</h2>
          <p style={prose}>We aim to maintain 98% uptime for the MNGO platform. Scheduled maintenance will be communicated in advance where possible. We are not liable for downtime caused by factors outside our reasonable control, including third-party infrastructure failures, natural disasters, or network outages.</p>
          <p style={prose}>The service is provided &quot;as is&quot; and &quot;as available.&quot; We make no warranties, express or implied, beyond what is stated in these terms.</p>

          <h2 style={h2style}>7. Limitation of liability</h2>
          <p style={prose}>To the fullest extent permitted by applicable law, dotAI shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of MNGO, including but not limited to loss of revenue, loss of data, or business interruption.</p>
          <p style={prose}>Our total liability to you for any claim arising out of or related to these terms or the MNGO service shall not exceed the amount you paid to us in the three months preceding the claim.</p>

          <h2 style={h2style}>8. Termination</h2>
          <p style={prose}>You may close your MNGO workspace at any time by contacting us. We will delete your workspace data within 30 days of a confirmed closure request.</p>
          <p style={prose}>We reserve the right to suspend or terminate your workspace if you violate these Terms of Service, if your account is used in a way that poses a security risk to other users, or if required by applicable law. In non-emergency cases, we will give you reasonable notice before termination.</p>

          <h2 style={h2style}>9. Changes to these terms</h2>
          <p style={prose}>We may update these Terms of Service from time to time. Material changes will be communicated by updating the &quot;Last updated&quot; date and, where appropriate, by direct communication to your registered email address. Continued use of MNGO after changes take effect constitutes acceptance of the updated terms.</p>

          <h2 style={h2style}>10. Governing law</h2>
          <p style={prose}>These terms are governed by the laws of the Republic of Ghana. Any disputes arising from these terms or your use of MNGO shall be subject to the exclusive jurisdiction of the courts of Ghana.</p>

          <h2 style={h2style}>11. Contact</h2>
          <p style={prose}>For any questions about these terms, contact us at:</p>
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
