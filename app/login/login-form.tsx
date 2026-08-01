"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { C } from "@/lib/colors";
import { signIn } from "./actions";

export function LoginForm({ errorMessage }: { errorMessage: string | null }) {
  const [showPw, setShowPw] = useState(false);

  return (
    <form action={signIn} className="flex flex-col gap-4">
      <div>
        <label className="text-xs font-semibold" style={{ color: C.muted }}>
          Email
        </label>
        <div className="relative mt-1">
          <Mail size={15} style={{ position: "absolute", left: 12, top: 12, color: C.muted }} />
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm"
            style={{ border: `1px solid ${C.border}` }}
            placeholder="cecilia@example.com"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold" style={{ color: C.muted }}>
          Password
        </label>
        <div className="relative mt-1">
          <Lock size={15} style={{ position: "absolute", left: 12, top: 12, color: C.muted }} />
          <input
            name="password"
            type={showPw ? "text" : "password"}
            required
            autoComplete="current-password"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm"
            style={{ border: `1px solid ${C.border}` }}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            style={{ position: "absolute", right: 12, top: 12, color: C.muted }}
          >
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>
      <div className="flex justify-end">
        <span className="text-xs font-medium" style={{ color: C.text }}>
          Forgot password?
        </span>
      </div>
      {errorMessage && (
        <p className="text-xs font-medium text-destructive">{errorMessage}</p>
      )}
      <button
        type="submit"
        className="w-full text-sm font-semibold py-3 rounded-xl mt-1"
        style={{ background: C.text, color: "#fff" }}
      >
        Sign in
      </button>
    </form>
  );
}
