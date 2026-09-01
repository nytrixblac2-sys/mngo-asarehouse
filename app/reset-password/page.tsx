"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth-layout";

const inputStyle: React.CSSProperties = {
  width: "100%",
  paddingLeft: 36,
  paddingRight: 36,
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

const iconStyle: React.CSSProperties = {
  position: "absolute",
  left: 11,
  top: "50%",
  transform: "translateY(-50%)",
  color: "var(--at-t2, #3D6663)",
  pointerEvents: "none",
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady]     = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [showCf, setShowCf]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Supabase's hash-based recovery flow (#access_token=...&type=recovery)
    // fires PASSWORD_RECOVERY on the auth state change listener.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    // PKCE / server-side confirm flow: session already set before this page loaded.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    // If neither fires within 4 s the link is invalid/expired.
    const timeout = setTimeout(() => {
      setInvalid((prev) => { if (!prev) return true; return prev; });
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Clear the invalid timeout once session arrives
  useEffect(() => {
    if (ready) setInvalid(false);
  }, [ready]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  return (
    <AuthLayout
      subtitle="Enter a new password for your account"
      footerContent={
        <a href="/login" style={{ color: "var(--at-teal, #0D9488)", textDecoration: "none", fontWeight: 500 }}>
          Back to sign in
        </a>
      }
    >
      {done ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 0" }}>
          <CheckCircle size={36} style={{ color: "var(--at-teal, #0D9488)" }} />
          <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--at-t1, #0C1A1A)", textAlign: "center" }}>
            Password updated
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--at-t2, #3D6663)", textAlign: "center" }}>
            Redirecting you to sign in...
          </p>
        </div>
      ) : invalid && !ready ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#EF4444", textAlign: "center" }}>
            This reset link has expired or is invalid.
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--at-t2, #3D6663)", textAlign: "center" }}>
            Request a new password reset from the sign in page.
          </p>
          <a
            href="/login"
            style={{
              display: "block",
              textAlign: "center",
              padding: "11px 0",
              borderRadius: 10,
              background: "var(--at-teal, #0D9488)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.875rem",
              textDecoration: "none",
              marginTop: 4,
            }}
          >
            Back to sign in
          </a>
        </div>
      ) : !ready ? (
        <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--at-t2, #3D6663)", padding: "12px 0" }}>
          Verifying reset link...
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle} htmlFor="rp-password">New password</label>
            <div style={{ position: "relative" }}>
              <Lock size={14} style={iconStyle} />
              <input
                id="rp-password"
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
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
            <label style={labelStyle} htmlFor="rp-confirm">Confirm new password</label>
            <div style={{ position: "relative" }}>
              <Lock size={14} style={iconStyle} />
              <input
                id="rp-confirm"
                type={showCf ? "text" : "password"}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={inputStyle}
                placeholder="Same password again"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowCf((v) => !v)}
                style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "var(--at-t2, #3D6663)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                aria-label={showCf ? "Hide password" : "Show password"}
              >
                {showCf ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
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
            {loading ? "Updating password..." : "Set new password"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
