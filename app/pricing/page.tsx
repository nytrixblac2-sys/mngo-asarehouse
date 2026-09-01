"use client";

import { useEffect, useState } from "react";
import s from "@/components/landing-page.module.css";

const PLANS = [
  {
    name: "Starter",
    tag: "Get started at no cost. One property, core tools, no credit card required.",
    price: "Free",
    per: "forever",
    pop: false,
    feats: [
      "1 property",
      "Up to 20 rooms / desks",
      "Booking management",
      "Basic financials",
      "2 staff accounts",
      "Email support",
    ],
    cta: "Start for free",
    href: "/signup",
  },
  {
    name: "Pro",
    tag: "For growing properties that need more control and visibility.",
    price: "29",
    per: "/ month · billed annually",
    pop: true,
    feats: [
      "Up to 5 properties",
      "Unlimited rooms / desks",
      "Full financials & reporting",
      "Menu & orders module",
      "10 staff accounts",
      "Priority support",
    ],
    cta: "Get started",
    href: "/signup",
  },
  {
    name: "Enterprise",
    tag: "Multi-site operations with custom needs and dedicated support.",
    price: "Custom",
    per: "Talk to us",
    pop: false,
    feats: [
      "Unlimited properties",
      "Unlimited staff",
      "Custom roles & permissions",
      "Shop module for RENTAL",
      "API access",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    cta: "Contact sales",
    href: "#contact",
  },
];

export default function PricingPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem("mngo-theme"); } catch {}
    const initial = (stored === "dark" || stored === "light") ? (stored as "light" | "dark") : "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("mngo-theme", next); } catch {}
  }

  return (
    <div className={s.wrapper}>
      {/* NAV */}
      <nav className={s.nav} style={{ position: "sticky", top: 0 }}>
        <div className={s.navInner}>
          <a href="/" className={s.logo}>MN<span className={s.logoG}>GO</span></a>
          <div className={s.navLinks}>
            <a href="/#features" className={s.navA}>Features</a>
            <a href="/#workspaces" className={s.navA}>Workspaces</a>
            <a href="/pricing" className={s.navA} style={{ fontWeight: 700 }}>Pricing</a>
            <a href="/#contact" className={s.navA}>Contact</a>
          </div>
          <div className={s.navCtas}>
            <button
              className={s.themeBtn}
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className={s.themeIcon} style={{ opacity: theme === "dark" ? 1 : 0 }}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              </span>
              <span className={s.themeIcon} style={{ opacity: theme === "dark" ? 0 : 1 }}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              </span>
            </button>
            <a href="/login" className={`${s.btn} ${s.btnOutline}`}>Sign in</a>
            <a href="/signup" className={`${s.btn} ${s.btnPrimary}`}>Get started</a>
          </div>
        </div>
      </nav>

      {/* HEADER */}
      <section className={s.sec} style={{ paddingTop: 72, paddingBottom: 0 }}>
        <div className={s.secInner}>
          <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
            <div className={s.secLabel}>Pricing</div>
            <h1 className={s.secH2} style={{ marginTop: 12 }}>Transparent, property-first pricing</h1>
            <p className={s.secSub}>No per-user fees. Pay for the plan that matches your operation size.</p>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section className={`${s.sec} ${s.pricingSec}`}>
        <div className={s.secInner}>
          <div className={s.pricingGrid}>
            {PLANS.map(({ name, tag, price, per, pop, feats, cta, href }) => (
              <div key={name} className={`${s.pCard} ${pop ? s.pCardPop : ""}`}>
                {pop && <div className={s.popBadge}>Most popular</div>}
                <div className={s.pName}>{name}</div>
                <div className={s.pTag}>{tag}</div>
                <div className={s.pPrice}>
                  {price !== "Custom" && price !== "Free" && <span className={s.pCur}>$</span>}
                  <span className={s.pAmt}>{price}</span>
                </div>
                <div className={s.pPer}>{per}</div>
                <div className={s.pDiv} />
                <ul className={s.pFeats}>
                  {feats.map((f) => (
                    <li key={f}>
                      <span className={s.chk}>
                        <svg className={s.chkSvg} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={href} className={`${s.btn} ${pop ? s.btnPrimary : s.btnOutline} ${s.btnFull}`}>
                  {cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ strip */}
      <section className={s.sec} style={{ paddingTop: 0 }}>
        <div className={s.secInner}>
          <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
            {[
              { q: "Can I switch plans later?", a: "Yes. Upgrade or downgrade at any time. Changes take effect on your next billing cycle." },
              { q: "Is there a free trial for the Pro plan?", a: "The Starter plan is free forever and covers most needs for a single property. If you need Pro features, contact us and we can arrange a trial." },
              { q: "What counts as a property?", a: "A property is one physical location or managed unit, such as a short-let apartment, hotel branch, or co-working floor. Sub-units like individual rooms do not count." },
              { q: "What is the Enterprise shop module?", a: "RENTAL and short-let properties on the Enterprise plan can enable an optional shop where guests scan a QR code to browse and order items, paying at checkout." },
            ].map(({ q, a }) => (
              <div key={q} style={{ borderBottom: "1px solid var(--lp-bdr)" }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: "var(--lp-t1)", marginBottom: 6 }}>{q}</p>
                <p style={{ fontSize: 14, color: "var(--lp-t2)", marginBottom: 20, lineHeight: 1.7 }}>{a}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <p style={{ fontSize: 14, color: "var(--lp-t2)", marginBottom: 16 }}>Still have questions?</p>
            <a href="/#contact" className={`${s.btn} ${s.btnOutline}`}>Contact us</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.footerBot} style={{ borderTop: "none", paddingTop: 0 }}>
            <div className={s.ftCopy}>© {new Date().getFullYear()} MNGO. All rights reserved.</div>
            <div className={s.ftDotai}>Designed by <strong className={s.ftDotaiStrong}>dotAI</strong> 2026</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
