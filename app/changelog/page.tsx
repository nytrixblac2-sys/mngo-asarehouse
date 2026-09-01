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

const RELEASES = [
  {
    version: "v1.0.8.4",
    date: "September 2026",
    tag: "Improvement",
    title: "Full mobile optimization",
    items: [
      "Sidebar converted to a full-screen overlay on mobile — tap the backdrop or any nav link to close it",
      "Top-bar menu now works on touch devices (was hover-only, unusable on phones)",
      "Calendar views fixed for portrait mode — grid now scrolls horizontally instead of compressing",
      "Month view weekday headers abbreviated (Mo/Tu/We…) to fit small screens",
      "Dark mode works correctly on all screens including the invite form and calendar",
      "Page body can no longer scroll sideways on mobile",
    ],
  },
  {
    version: "v1.0.8.2",
    date: "September 2026",
    tag: "Feature",
    title: "Shop feature + pricing page",
    items: [
      "RENTAL workspaces can now enable a guest-facing Shop — guests scan a QR code, browse products, and place orders",
      "Admins manage shop products (name, price, category, image) and track order status from the Shop tab",
      "New /pricing page with full plan comparison and FAQ",
      "Issues & Schedules screen now has month navigation — filter by month",
      "Orders screen now has month navigation",
      "Deleted bookings log is collapsible and month-scoped",
      "Dashboard now shows upcoming stays card below the finance chart",
    ],
  },
  {
    version: "v1.0.7.7",
    date: "August 2026",
    tag: "Security",
    title: "Finance visibility controls for Co-Managers",
    items: [
      "Co-Managers can no longer view team payment amounts or the internal financials tab on any workspace type",
      "Co-Managers are locked to the current month on Financials — no historical navigation",
      "Finance card on Dashboard hidden for Co-Managers",
      "Generate report modal no longer exposes internal figures to Co-Managers",
      "Server-side enforcement: the API now filters management-category expenses for non-owners",
    ],
  },
  {
    version: "v1.0.7.4",
    date: "August 2026",
    tag: "Security",
    title: "Security hardening pass",
    items: [
      "Signup no longer reveals whether an email address already exists on the platform",
      "Workspace action PIN locks for 15 minutes after 5 consecutive wrong guesses",
      "Rate limiting added on login, signup, and the guest track endpoint",
      "Forced password change for newly invited staff — one-time passwords must be updated on first login",
      "Security response headers added to every request (X-Frame-Options, HSTS, CSP, etc.)",
      "Guest session signing key decoupled from the main service key",
    ],
  },
  {
    version: "v1.0.7.3",
    date: "August 2026",
    tag: "Improvement",
    title: "Unified Orders nav",
    items: [
      "Kitchen, Bar, Shop, and Experiences are now a single Orders nav item with a tab switcher",
      "Food Menu tab renamed to make it distinct from the new Orders destination",
      "Cleaner sidebar for HOSTEL workspaces",
    ],
  },
  {
    version: "v1.0.7.x",
    date: "August 2026",
    tag: "Fix",
    title: "Live-usage fixes",
    items: [
      "Orders from a deleted booking no longer get stuck on the active board",
      "Deleting a booking now cascade-removes its open orders",
      "Expense entries are now editable from the Financials screen",
      "CSV import now correctly shows the number of rows imported on the success screen",
    ],
  },
  {
    version: "v1.0.8.0 – v1.0.8.1",
    date: "August 2026",
    tag: "Improvement",
    title: "Dark mode & auth page redesign",
    items: [
      "Full dark/light mode toggle across the entire app — top bar, sidebar, modals, forms, calendars",
      "Theme preference persisted across sessions and page navigations",
      "Login and signup pages redesigned with teal gradient card matching the landing page",
      "Dark mode flash eliminated — theme applies before first paint so there's no flicker",
      "Landing page pricing copy updated: One property? Free forever.",
    ],
  },
  {
    version: "v1.0.7.8 – v1.0.7.9",
    date: "August 2026",
    tag: "Feature",
    title: "Public landing page",
    items: [
      "MNGO now has a public marketing site at the root URL",
      "Features, Workspaces, Pricing, Contact sections",
      "Animated hero with teal gradient orbs and dark/light mode toggle",
      "White + teal design system consistent across landing and app",
    ],
  },
  {
    version: "v1.0.2.x",
    date: "August 2026",
    tag: "Fix",
    title: "Post-launch fixes",
    items: [
      "Property list now updates instantly after create/edit/delete without a page reload",
      "Active property remembered across page refreshes",
      "Property creation immediately opens the profile editor for color/currency/room setup",
      "Today's date now highlighted on all calendar views (teal ring, distinct from the selected day)",
      "Sidebar open/closed state persisted across refreshes",
    ],
  },
  {
    version: "v1.0.1.6 – v1.0.1.9",
    date: "July–August 2026",
    tag: "Feature",
    title: "Team management & workspace signup",
    items: [
      "Anyone can sign up for a MNGO workspace — approved by the dotAI team before access is granted",
      "Invite Co-Managers and Property Owners with a manager-generated one-time password",
      "Property Owners see only their assigned properties; Co-Managers see everything",
      "Owner preview mode — managers can preview the exact view any property owner sees",
      "CSV import for historical bookings — any column format, manual field mapping",
    ],
  },
  {
    version: "v1.0.0.0 – v1.0.1.5",
    date: "July 2026",
    tag: "Launch",
    title: "MNGO launches",
    items: [
      "Booking management with month, week, day, and per-stay calendar views",
      "Financials with owner reports, expense tracking, and multi-currency support (GHS + EUR)",
      "Team management with role-based access: Account Owner, Co-Manager, Property Owner",
      "Issues & Schedules with status lifecycle and history timeline",
      "Menu, orders, and kitchen fulfilment for HOSTEL workspaces",
      "Full HOSTEL workspace type: priced rooms, public guest booking page, stay-tracking portal, checkout receipts",
      "PDF monthly report generation",
      "Deployed to Vercel, backed by Supabase PostgreSQL",
    ],
  },
];

const TAG_COLOR: Record<string, { bg: string; color: string }> = {
  Feature: { bg: "rgba(13,148,136,0.12)", color: "var(--lp-teal)" },
  Improvement: { bg: "rgba(56,189,248,0.12)", color: "#38BDF8" },
  Security: { bg: "rgba(239,68,68,0.1)", color: "#EF4444" },
  Fix: { bg: "rgba(251,191,36,0.12)", color: "#D97706" },
  Launch: { bg: "rgba(168,85,247,0.12)", color: "#A855F7" },
};

export default function ChangelogPage() {
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

      <section className={s.sec} style={{ paddingTop: 72, paddingBottom: 56 }}>
        <div className={s.secInner} style={{ maxWidth: 720, margin: "0 auto" }}>
          <div className={s.secLabel}>What&apos;s new</div>
          <h1 className={s.secH2} style={{ marginTop: 12, marginBottom: 12 }}>Changelog</h1>
          <p className={s.secSub}>Every improvement, feature, and fix — newest first.</p>
        </div>
      </section>

      <section className={s.sec} style={{ paddingTop: 0, paddingBottom: 96 }}>
        <div className={s.secInner} style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {RELEASES.map((r, i) => {
              const tc = TAG_COLOR[r.tag] ?? TAG_COLOR.Fix;
              return (
                <div key={r.version} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 32, paddingBottom: 52, position: "relative" }}>
                  {/* timeline line */}
                  {i < RELEASES.length - 1 && (
                    <div style={{ position: "absolute", left: 119, top: 28, bottom: 0, width: 1, background: "var(--lp-bdr)" }} />
                  )}

                  {/* left: date + version */}
                  <div style={{ textAlign: "right", paddingTop: 4 }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--lp-t3)", marginBottom: 4 }}>{r.date}</div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--lp-t2)", fontFamily: "monospace" }}>{r.version}</div>
                  </div>

                  {/* dot */}
                  <div style={{ position: "absolute", left: 112, top: 8, width: 14, height: 14, borderRadius: "50%", background: "var(--lp-teal)", border: "2px solid var(--lp-bg)", zIndex: 1 }} />

                  {/* right: content */}
                  <div style={{ paddingLeft: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 100, background: tc.bg, color: tc.color }}>
                        {r.tag}
                      </span>
                    </div>
                    <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--lp-t1)", marginBottom: 14, lineHeight: 1.3 }}>{r.title}</h2>
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                      {r.items.map((item) => (
                        <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.875rem", color: "var(--lp-t2)", lineHeight: 1.6 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--lp-teal)", flexShrink: 0, marginTop: 8 }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
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
