"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { C } from "@/lib/colors";
import { changePassword } from "./actions";

export function ChangePasswordForm({ errorMessage }: { errorMessage: string | null }) {
  const [showPw, setShowPw] = useState(false);

  return (
    <form action={changePassword} className="flex flex-col gap-4">
      <p className="text-xs" style={{ color: C.muted }}>
        You&apos;re signed in with a one-time password. Choose your own to continue.
      </p>
      <div>
        <label className="text-xs font-semibold" style={{ color: C.muted }}>
          New password
        </label>
        <div className="relative mt-1">
          <Lock size={15} style={{ position: "absolute", left: 12, top: 12, color: C.muted }} />
          <input
            name="newPassword"
            type={showPw ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm"
            style={{ border: `1px solid ${C.border}` }}
            placeholder="At least 8 characters"
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
      <div>
        <label className="text-xs font-semibold" style={{ color: C.muted }}>
          Confirm new password
        </label>
        <div className="relative mt-1">
          <Lock size={15} style={{ position: "absolute", left: 12, top: 12, color: C.muted }} />
          <input
            name="confirmPassword"
            type={showPw ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm"
            style={{ border: `1px solid ${C.border}` }}
            placeholder="Retype your password"
          />
        </div>
      </div>
      {errorMessage && <p className="text-xs font-medium text-destructive">{errorMessage}</p>}
      <button
        type="submit"
        className="w-full text-sm font-semibold py-3 rounded-xl mt-1"
        style={{ background: C.text, color: "#fff" }}
      >
        Set password
      </button>
    </form>
  );
}
