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

export default function ContactPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [formSent, setFormSent] = useState(false);
  const [formSending, setFormSending] = useState(false);

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormSending(true);
    await new Promise((r) => setTimeout(r, 900));
    setFormSending(false);
    setFormSent(true);
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
            <a href="/contact" className={s.navA} style={{ fontWeight: 700 }}>Contact</a>
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

      <section className={s.sec} style={{ paddingTop: 72, paddingBottom: 0 }}>
        <div className={s.secInner} style={{ textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
          <div className={s.secLabel}>Contact</div>
          <h1 className={s.secH2} style={{ marginTop: 12 }}>Get in touch</h1>
          <p className={s.secSub} style={{ margin: "0 auto" }}>Questions about MNGO, custom pricing, or onboarding your team? We&apos;re here.</p>
        </div>
      </section>

      <section className={`${s.sec} ${s.contactSec}`} style={{ paddingTop: 56 }}>
        <div className={s.secInner}>
          <div className={s.contactInner}>
            <div>
              {[
                {
                  icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
                  title: "Email us",
                  sub: "kwame@dotdwgstudio.com\nReply within one business day.",
                  href: "mailto:kwame@dotdwgstudio.com",
                },
                {
                  icon: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.85 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></>,
                  title: "Call or WhatsApp",
                  sub: "0540885406\nMon – Fri, 8 am – 6 pm GMT",
                  href: "tel:0540885406",
                },
                {
                  icon: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
                  title: "Headquarters",
                  sub: "Accra, Ghana\nServing properties across West Africa",
                  href: null,
                },
              ].map(({ icon, title, sub, href }) => (
                <div key={title} className={s.cMethod}>
                  <div className={s.cIco}>
                    <svg className={s.cIcoSvg} viewBox="0 0 24 24">{icon}</svg>
                  </div>
                  <div>
                    <div className={s.cMt}>{title}</div>
                    {href ? (
                      <a href={href} className={s.cMs} style={{ display: "block", whiteSpace: "pre-line", textDecoration: "none", color: "var(--lp-t2)" }}>{sub}</a>
                    ) : (
                      <div className={s.cMs} style={{ whiteSpace: "pre-line" }}>{sub}</div>
                    )}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 40, padding: "24px 28px", background: "var(--lp-surf)", border: "1px solid var(--lp-bdr)", borderRadius: 16 }}>
                <p style={{ fontSize: "0.84rem", fontWeight: 600, color: "var(--lp-t1)", marginBottom: 6 }}>Response times</p>
                <p style={{ fontSize: "0.82rem", color: "var(--lp-t2)", lineHeight: 1.65 }}>
                  Email replies within one business day. WhatsApp messages during business hours get a same-day response. For urgent production issues, WhatsApp is fastest.
                </p>
              </div>
            </div>

            <form className={s.cForm} onSubmit={handleSubmit}>
              <div className={s.fRow}>
                <div className={s.field}>
                  <label className={s.fieldLabel} htmlFor="cf-name">Name</label>
                  <input id="cf-name" className={s.fieldInput} type="text" placeholder="Your name" required />
                </div>
                <div className={s.field}>
                  <label className={s.fieldLabel} htmlFor="cf-email">Email</label>
                  <input id="cf-email" className={s.fieldInput} type="email" placeholder="you@example.com" required />
                </div>
              </div>
              <div className={s.field}>
                <label className={s.fieldLabel} htmlFor="cf-company">Property / Company</label>
                <input id="cf-company" className={s.fieldInput} type="text" placeholder="Asare House" />
              </div>
              <div className={s.field}>
                <label className={s.fieldLabel} htmlFor="cf-subject">Subject</label>
                <select id="cf-subject" className={s.fieldInput}>
                  <option value="">General enquiry</option>
                  <option value="pricing">Pricing & plans</option>
                  <option value="onboarding">Help getting started</option>
                  <option value="enterprise">Enterprise / custom</option>
                  <option value="bug">Report a problem</option>
                </select>
              </div>
              <div className={s.field}>
                <label className={s.fieldLabel} htmlFor="cf-msg">Message</label>
                <textarea id="cf-msg" className={s.fieldTextarea} placeholder="Tell us about your property and what you need..." required />
              </div>
              {formSent ? (
                <p className={s.formMsg} style={{ display: "block" }}>
                  Message sent! We&apos;ll be in touch shortly.
                </p>
              ) : (
                <button type="submit" className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`} disabled={formSending}>
                  {formSending ? "Sending…" : "Send message"}
                </button>
              )}
            </form>
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
