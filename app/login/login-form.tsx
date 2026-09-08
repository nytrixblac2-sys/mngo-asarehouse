"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "./actions";

const inputStyle: React.CSSProperties = {
  width: "100%",
  paddingLeft: 36,
  paddingRight: 12,
  paddingTop: 10,
  paddingBottom: 10,
  borderRadius: 10,
  fontSize: "0.875rem",
  border: "1px solid var(--at-border, #CCE8E5)",
  background: "var(--at-input-bg, #F0FAFB)",
  color: "var(--at-t1, #0C1A1A)",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.18s, box-shadow 0.18s",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "var(--at-t2, #3D6663)",
  marginBottom: 5,
  display: "block",
};

const iconStyle: React.CSSProperties = {
  position: "absolute",
  left: 11,
  top: "50%",
  transform: "translateY(-50%)",
  color: "var(--at-t2, #3D6663)",
  pointerEvents: "none",
};

export function LoginForm({ errorMessage }: { errorMessage: string | null }) {
  const [showPw, setShowPw] = useState(false);
  // Purely cosmetic click feedback for the Server Action submit below —
  // no useFormStatus here, this React/Next version doesn't export it (see
  // Architecture Decision log, 2026-09-08). Setting this in onSubmit
  // (never preventDefault'd) doesn't interfere with the real form action
  // dispatch; a failed sign-in redirects to /login?error=... — a real
  // navigation, so this component remounts fresh and the state resets on
  // its own without needing an explicit reset effect.
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      action={signIn}
      onSubmit={() => setSubmitting(true)}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div>
        <label style={labelStyle} htmlFor="lf-email">Email</label>
        <div style={{ position: "relative" }}>
          <Mail size={14} style={iconStyle} />
          <input
            id="lf-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            style={inputStyle}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label style={labelStyle} htmlFor="lf-password">Password</label>
        <div style={{ position: "relative" }}>
          <Lock size={14} style={iconStyle} />
          <input
            id="lf-password"
            name="password"
            type={showPw ? "text" : "password"}
            required
            autoComplete="current-password"
            style={{ ...inputStyle, paddingRight: 36 }}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "var(--at-t2, #3D6663)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <a href="/forgot-password" style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--at-teal, #0D9488)", textDecoration: "none" }}>
          Forgot password?
        </a>
      </div>

      {errorMessage && (
        <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "#EF4444" }}>{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          width: "100%",
          fontSize: "0.875rem",
          fontWeight: 600,
          padding: "11px 0",
          borderRadius: 10,
          background: "var(--at-teal, #0D9488)",
          color: "#FFFFFF",
          border: "none",
          cursor: submitting ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          marginTop: 4,
          transition: "background 0.18s, opacity 0.18s",
          opacity: submitting ? 0.75 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {submitting && <Loader2 size={15} className="animate-spin" />}
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
