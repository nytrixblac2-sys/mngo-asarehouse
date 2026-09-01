"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
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

  return (
    <form action={signIn} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
        style={{
          width: "100%",
          fontSize: "0.875rem",
          fontWeight: 600,
          padding: "11px 0",
          borderRadius: 10,
          background: "var(--at-teal, #0D9488)",
          color: "#FFFFFF",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          marginTop: 4,
          transition: "background 0.18s",
        }}
      >
        Sign in
      </button>
    </form>
  );
}
