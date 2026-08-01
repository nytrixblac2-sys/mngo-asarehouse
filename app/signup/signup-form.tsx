"use client";

import { useState } from "react";
import { Building2, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { C } from "@/lib/colors";
import { signUp } from "./actions";

export function SignupForm({ errorMessage }: { errorMessage: string | null }) {
  const [showPw, setShowPw] = useState(false);

  return (
    <form action={signUp} className="flex flex-col gap-4">
      <div>
        <label className="text-xs font-semibold" style={{ color: C.muted }}>
          Company / management name
        </label>
        <div className="relative mt-1">
          <Building2 size={15} style={{ position: "absolute", left: 12, top: 12, color: C.muted }} />
          <input
            name="companyName"
            required
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm"
            style={{ border: `1px solid ${C.border}` }}
            placeholder="e.g. Oak & Co."
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold" style={{ color: C.muted }}>
          Your name
        </label>
        <div className="relative mt-1">
          <User size={15} style={{ position: "absolute", left: 12, top: 12, color: C.muted }} />
          <input
            name="name"
            required
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm"
            style={{ border: `1px solid ${C.border}` }}
            placeholder="e.g. Kwame Asare"
          />
        </div>
      </div>
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
            placeholder="kwame@example.com"
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
          Confirm password
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
        Create workspace
      </button>
      <p className="text-xs text-center" style={{ color: C.muted }}>
        A team member reviews every new workspace before it goes live — you&apos;ll get access as soon as it&apos;s approved.
      </p>
    </form>
  );
}
