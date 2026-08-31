"use client";

import { useEffect, useState, type ReactNode } from "react";

const L = {
  bg: "#FFFFFF",
  card: "#FFFFFF",
  border: "#CCE8E5",
  t1: "#0C1A1A",
  t2: "#3D6663",
  teal: "#0D9488",
  tealDk: "#0F766E",
  tealBg: "rgba(13,148,136,0.08)",
  tealRing: "rgba(13,148,136,0.22)",
  inputBg: "#F0FAFB",
  shadow: "0 4px 24px rgba(13,70,65,0.10)",
};

const D = {
  bg: "#030D0C",
  card: "#0D1E1C",
  border: "#123330",
  t1: "#E8F5F4",
  t2: "#6BA8A3",
  teal: "#2DD4BF",
  tealDk: "#14B8A6",
  tealBg: "rgba(45,212,191,0.10)",
  tealRing: "rgba(45,212,191,0.25)",
  inputBg: "#091412",
  shadow: "0 4px 24px rgba(0,0,0,0.55)",
};

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
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const t = theme === "dark" ? D : L;

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
    // CSS custom properties that form children can consume via var()
    "--at-teal": t.teal,
    "--at-teal-dk": t.tealDk,
    "--at-teal-bg": t.tealBg,
    "--at-teal-ring": t.tealRing,
    "--at-border": t.border,
    "--at-t1": t.t1,
    "--at-t2": t.t2,
    "--at-input-bg": t.inputBg,
    // layout
    minHeight: "100vh",
    background:
      theme === "light"
        ? `radial-gradient(ellipse 90% 55% at 50% -5%, rgba(13,148,136,0.09) 0%, transparent 70%), ${t.bg}`
        : t.bg,
    color: t.t1,
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
    background: t.tealBg,
    border: `1px solid ${t.tealRing}`,
    color: t.teal,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.18s, transform 0.15s",
    flexShrink: 0,
    zIndex: 50,
  };

  return (
    <div style={wrapStyle}>
      {/* theme toggle */}
      <button onClick={toggle} style={toggleStyle} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* logo */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <p style={{ fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.04em", color: t.t1, lineHeight: 1 }}>
            MN<span style={{ color: t.teal }}>GO</span>
          </p>
        </a>
        <p style={{ fontSize: "0.8rem", color: t.t2, marginTop: 6, lineHeight: 1.5 }}>{subtitle}</p>
      </div>

      {/* card */}
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        padding: "28px 28px",
        boxShadow: t.shadow,
        transition: "background 0.25s ease, border-color 0.25s ease",
      }}>
        {children}
      </div>

      {footerContent && (
        <div style={{ marginTop: 18, fontSize: "0.8rem", color: t.t2, textAlign: "center" }}>
          {footerContent}
        </div>
      )}
    </div>
  );
}
