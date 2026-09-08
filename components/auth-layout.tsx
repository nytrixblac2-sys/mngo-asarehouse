"use client";

import { useEffect, useState, type ReactNode } from "react";

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export function AuthLayout({
  subtitle,
  footerContent,
  children,
}: {
  subtitle: string;
  footerContent?: ReactNode;
  children: ReactNode;
}) {
  // Only drives which icon (sun/moon) is shown — the actual colors below
  // are all var(--at-*) references resolved by the CSS in app/globals.css
  // (.auth-layout / [data-theme="dark"] .auth-layout), which the browser
  // applies correctly on the very first paint since app/layout.tsx's
  // blocking script already set data-theme before any of this rendered.
  // This state can only ever be right after hydration (no `document` at
  // SSR time), so the icon itself can flip once on mount — a one-glyph
  // discrepancy, not the whole-page color flash this used to cause.
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem("mngo-theme"); } catch {}
    const initial = (stored === "dark" || stored === "light") ? stored : "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("mngo-theme", next); } catch {}
  }

  const wrapStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "var(--at-bg-layers, #FFFFFF)",
    color: "var(--at-t1, #0C1A1A)",
    fontFamily: "var(--font-sans, system-ui, sans-serif)",
    WebkitFontSmoothing: "antialiased",
    transition: "background 0.25s ease, color 0.25s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    position: "relative",
  } as React.CSSProperties;

  const toggleStyle: React.CSSProperties = {
    position: "fixed",
    top: 18,
    right: 18,
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "var(--at-teal-bg, rgba(13,148,136,0.08))",
    border: "1px solid var(--at-teal-ring, rgba(13,148,136,0.22))",
    color: "var(--at-teal, #0D9488)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.18s, transform 0.15s",
    flexShrink: 0,
    zIndex: 50,
  };

  return (
    <div className="auth-layout" style={wrapStyle}>
      {/* theme toggle */}
      <button onClick={toggle} style={toggleStyle} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* logo */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <p style={{ fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--at-t1, #0C1A1A)", lineHeight: 1 }}>
            MN<span style={{ color: "var(--at-teal, #0D9488)" }}>GO</span>
          </p>
        </a>
        <p style={{ fontSize: "0.8rem", color: "var(--at-t2, #3D6663)", marginTop: 6, lineHeight: 1.5 }}>{subtitle}</p>
      </div>

      {/* card */}
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "var(--at-card, #FFFFFF)",
        border: "1px solid var(--at-border, #CCE8E5)",
        borderRadius: 16,
        padding: "28px 28px",
        boxShadow: "var(--at-shadow, 0 4px 24px rgba(13,70,65,0.10))",
        transition: "background 0.25s ease, border-color 0.25s ease",
      }}>
        {children}
      </div>

      {footerContent && (
        <div style={{ marginTop: 18, fontSize: "0.8rem", color: "var(--at-t2, #3D6663)", textAlign: "center" }}>
          {footerContent}
        </div>
      )}
    </div>
  );
}
