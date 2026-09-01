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

export default function AboutPage() {
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
            <a href="/#workspaces" className={s.navA}>Workspaces</a>
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

      {/* HERO */}
      <section className={s.sec} style={{ paddingTop: 80, paddingBottom: 80, background: "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(13,148,136,0.09) 0%, transparent 70%), var(--lp-bg)" }}>
        <div className={s.secInner} style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
          <div className={s.secLabel} style={{ marginBottom: 16 }}>About MNGO</div>
          <h1 className={s.secH2} style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)", marginBottom: 20 }}>
            Built for the operators<br />running Africa&apos;s spaces
          </h1>
          <p className={s.secSub} style={{ maxWidth: 520, margin: "0 auto" }}>
            MNGO is the property management platform designed from the ground up for hotels, short-lets, co-working spaces, event centres, and hospitality businesses across Africa.
          </p>
        </div>
      </section>

      {/* STORY */}
      <section className={s.sec} style={{ paddingTop: 0 }}>
        <div className={s.secInner}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", maxWidth: 900, margin: "0 auto" }}>
            <div>
              <div className={s.secLabel}>The problem</div>
              <h2 className={s.secH2} style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", marginBottom: 16 }}>Managing a property across five different apps</h2>
              <p style={{ fontSize: "0.95rem", color: "var(--lp-t2)", lineHeight: 1.75 }}>
                Property operators across West Africa were juggling WhatsApp for bookings, spreadsheets for financials, paper notebooks for issues, and phone calls for team coordination. There was no single tool built for the realities of African hospitality — offline-first needs, multi-currency operations, and mobile-first management.
              </p>
              <p style={{ fontSize: "0.95rem", color: "var(--lp-t2)", lineHeight: 1.75, marginTop: 16 }}>
                MNGO was built to change that. One workspace, one login, every operation under control — from the first booking to end-of-month reports.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { n: "11+", l: "Properties managed across Africa" },
                { n: "2", l: "Workspace types: RENTAL & HOSTEL" },
                { n: "GHS & EUR", l: "Multi-currency financials" },
              ].map(({ n, l }) => (
                <div key={n} style={{ padding: "24px 28px", background: "var(--lp-surf)", border: "1px solid var(--lp-bdr)", borderRadius: 16 }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--lp-t1)", fontVariantNumeric: "tabular-nums" }}>{n}</div>
                  <div style={{ fontSize: "0.84rem", color: "var(--lp-t2)", marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className={s.sec} style={{ background: "var(--lp-surf)" }}>
        <div className={s.secInner}>
          <div style={{ textAlign: "center", maxWidth: 520, margin: "0 auto 52px" }}>
            <div className={s.secLabel}>What we believe</div>
            <h2 className={s.secH2}>Simple tools, real results</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, maxWidth: 900, margin: "0 auto" }}>
            {[
              {
                title: "Mobile-first",
                desc: "Your property doesn't run from a desk. MNGO works on any phone, any screen, any network — because that's how African operators actually work."
              },
              {
                title: "No complexity tax",
                desc: "We strip out the enterprise bloat. If you can't find a feature in two taps, it's a design failure on our part, not a training problem on yours."
              },
              {
                title: "Built for Africa",
                desc: "Multi-currency, local payment methods, GHS and EUR side by side. MNGO understands the financial reality of operating here, not the one in a Silicon Valley whitepaper."
              },
            ].map(({ title, desc }) => (
              <div key={title} style={{ padding: "32px 28px", background: "var(--lp-bg)", border: "1px solid var(--lp-bdr)", borderRadius: 16 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--lp-teal)", marginBottom: 18 }} />
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--lp-t1)", marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--lp-t2)", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* dotAI */}
      <section className={s.sec}>
        <div className={s.secInner} style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            <div>
              <div className={s.secLabel}>The team</div>
              <h2 className={s.secH2} style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", marginBottom: 16 }}>Created by dotAI</h2>
              <p style={{ fontSize: "0.95rem", color: "var(--lp-t2)", lineHeight: 1.75, marginBottom: 16 }}>
                dotAI is a software studio based in Accra, Ghana, building practical digital tools for businesses across Africa. We design and build products that solve real operational problems — not theoretical ones.
              </p>
              <p style={{ fontSize: "0.95rem", color: "var(--lp-t2)", lineHeight: 1.75 }}>
                MNGO is dotAI&apos;s flagship product: a focused, opinionated property management tool for the operators who make Africa&apos;s hospitality industry run.
              </p>
            </div>
            <div style={{ padding: "36px", background: "var(--lp-surf)", border: "1px solid var(--lp-bdr)", borderRadius: 20, textAlign: "center" }}>
              <div style={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.06em", color: "var(--lp-t1)", marginBottom: 8 }}>
                dot<span style={{ color: "var(--lp-teal)" }}>AI</span>
              </div>
              <p style={{ fontSize: "0.84rem", color: "var(--lp-t2)", lineHeight: 1.6 }}>Software studio · Accra, Ghana</p>
              <div style={{ height: 1, background: "var(--lp-bdr)", margin: "20px 0" }} />
              <p style={{ fontSize: "0.82rem", color: "var(--lp-t3)", lineHeight: 1.6 }}>Designing tools that make African businesses run smarter.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={s.sec} style={{ background: "var(--lp-surf)", textAlign: "center" }}>
        <div className={s.secInner} style={{ maxWidth: 520, margin: "0 auto" }}>
          <div className={s.secLabel}>Get started</div>
          <h2 className={s.secH2} style={{ marginBottom: 16 }}>Ready to run your property from anywhere?</h2>
          <p className={s.secSub} style={{ margin: "0 auto 32px" }}>One property is free, forever. No credit card required.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/signup" className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`}>Start for free</a>
            <a href="/contact" className={`${s.btn} ${s.btnOutline} ${s.btnLg}`}>Talk to us</a>
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
