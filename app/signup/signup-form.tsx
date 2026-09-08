"use client";

import { useState } from "react";
import { Building2, User, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { signUp } from "./actions";

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

export function SignupForm({ errorMessage }: { errorMessage: string | null }) {
  const [showPw, setShowPw] = useState(false);
  // See app/login/login-form.tsx's identical submitting state for why
  // this is a plain onSubmit flag rather than useFormStatus.
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      action={signUp}
      onSubmit={() => setSubmitting(true)}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div>
        <label style={labelStyle} htmlFor="sf-company">Company / management name</label>
        <div style={{ position: "relative" }}>
          <Building2 size={14} style={iconStyle} />
          <input
            id="sf-company"
            name="companyName"
            required
            style={inputStyle}
            placeholder="e.g. Oak & Co."
          />
        </div>
      </div>

      <div>
        <label style={labelStyle} htmlFor="sf-name">Your name</label>
        <div style={{ position: "relative" }}>
          <User size={14} style={iconStyle} />
          <input
            id="sf-name"
            name="name"
            required
            style={inputStyle}
            placeholder="e.g. Kwame Asare"
          />
        </div>
      </div>

      <div>
        <label style={labelStyle} htmlFor="sf-email">Email</label>
        <div style={{ position: "relative" }}>
          <Mail size={14} style={iconStyle} />
          <input
            id="sf-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            style={inputStyle}
            placeholder="kwame@example.com"
          />
        </div>
      </div>

      <div>
        <label style={labelStyle} htmlFor="sf-password">Password</label>
        <div style={{ position: "relative" }}>
          <Lock size={14} style={iconStyle} />
          <input
            id="sf-password"
            name="password"
            type={showPw ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            style={{ ...inputStyle, paddingRight: 36 }}
            placeholder="At least 8 characters"
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

      <div>
        <label style={labelStyle} htmlFor="sf-confirm">Confirm password</label>
        <div style={{ position: "relative" }}>
          <Lock size={14} style={iconStyle} />
          <input
            id="sf-confirm"
            name="confirmPassword"
            type={showPw ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            style={inputStyle}
            placeholder="Retype your password"
          />
        </div>
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
        {submitting ? "Creating workspace…" : "Create workspace"}
      </button>

      <p style={{ fontSize: "0.78rem", textAlign: "center", color: "var(--at-t2, #3D6663)", lineHeight: 1.55 }}>
        A team member reviews every new workspace before it goes live — you&apos;ll get access as soon as it&apos;s approved.
      </p>
    </form>
  );
}
