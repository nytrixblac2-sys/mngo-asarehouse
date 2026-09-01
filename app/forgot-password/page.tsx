"use client";

import { useState } from "react";
import { Mail, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth-layout";

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
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "var(--at-t2, #3D6663)",
  marginBottom: 5,
  display: "block",
};

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/reset-password`;

    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setLoading(false);

    if (err) { setError(err.message); return; }
    setSent(true);
  }

  return (
    <AuthLayout
      subtitle="We&apos;ll send a reset link to your email"
      footerContent={
        <a href="/login" style={{ color: "var(--at-teal, #0D9488)", textDecoration: "none", fontWeight: 500 }}>
          Back to sign in
        </a>
      }
    >
      {sent ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 0" }}>
          <CheckCircle size={36} style={{ color: "var(--at-teal, #0D9488)" }} />
          <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--at-t1, #0C1A1A)", textAlign: "center" }}>
            Check your email
          </p>
          <p style={{ fontSize: "0.82rem", color: "var(--at-t2, #3D6663)", textAlign: "center", lineHeight: 1.6 }}>
            We sent a password reset link to <strong>{email}</strong>. Click the link in the email to set a new password.
          </p>
          <p style={{ fontSize: "0.78rem", color: "var(--at-t2, #3D6663)", textAlign: "center", marginTop: 4 }}>
            Didn&apos;t get it? Check your spam folder or{" "}
            <button
              onClick={() => setSent(false)}
              style={{ background: "none", border: "none", color: "var(--at-teal, #0D9488)", cursor: "pointer", fontWeight: 600, fontSize: "inherit", padding: 0 }}
            >
              try again
            </button>
            .
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle} htmlFor="fp-email">Email address</label>
            <div style={{ position: "relative" }}>
              <Mail size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--at-t2, #3D6663)", pointerEvents: "none" }} />
              <input
                id="fp-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </div>

          {error && (
            <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "#EF4444" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              fontSize: "0.875rem",
              fontWeight: 600,
              padding: "11px 0",
              borderRadius: 10,
              background: loading ? "var(--at-teal-dk, #0F766E)" : "var(--at-teal, #0D9488)",
              color: "#FFFFFF",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              marginTop: 4,
              transition: "background 0.18s",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
