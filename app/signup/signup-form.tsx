"use client";

import { useState } from "react";
import { Building2, User, Mail, Lock, Eye, EyeOff, Loader2, Home, Store, Check, MapPin, Banknote } from "lucide-react";
import { signUp } from "./actions";
import { COUNTRY_CURRENCY, CURRENCY_ENUM_VALUES } from "@/lib/currencies";

type WorkspaceType = "RENTAL" | "STORE";

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

const TYPE_OPTIONS: {
  value: WorkspaceType;
  label: string;
  description: string;
  icon: typeof Home;
  features: string[];
}[] = [
  {
    value: "RENTAL",
    label: "Rental property",
    // Anything with a booking/appointment belongs here, not Shop/store —
    // a barbershop takes bookings just like a guesthouse takes stays, so
    // it needs the real booking calendar RENTAL has and STORE doesn't.
    // Reclassified 2026-09-15 after the user caught barbershop miscategorized
    // under Shop/store, which has zero booking support by design.
    description: "Airbnb, guesthouse, salons, barbershops — anything with bookings",
    icon: Home,
    features: [
      "Booking calendar & guest tracking",
      "Owner / operations / management income splits",
      "Optional in-stay shop for guests",
      "Monthly PDF owner reports",
      "Invite co-managers and property owners",
    ],
  },
  {
    value: "STORE",
    label: "Shop / store",
    description: "Retail and product-based stores — no bookings",
    icon: Store,
    features: [
      "Product catalog with inventory tracking",
      "Shareable storefront link — customers order & pay at checkout",
      "Sales and income reports",
      "Staff accounts",
      "No booking calendar — built for walk-in / sale-based businesses",
    ],
  },
];

type Currency = (typeof CURRENCY_ENUM_VALUES)[number];

export function SignupForm({ errorMessage }: { errorMessage: string | null }) {
  const [showPw, setShowPw] = useState(false);
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>("RENTAL");
  // Country drives the default currency — real gap reported 2026-09-15: a
  // friend signing up a Nigeria-based shop had no way to get NGN, only
  // GHS/EUR. Picking a country pre-selects its currency below; the
  // currency picker stays editable so e.g. a Ghana-based Airbnb host can
  // still add EUR alongside GHS for Airbnb payouts (same as the real Oak &
  // Co. workspace).
  const [country, setCountry] = useState(COUNTRY_CURRENCY[0].country);
  const [currencies, setCurrencies] = useState<Currency[]>([COUNTRY_CURRENCY[0].currency]);
  // See app/login/login-form.tsx's identical submitting state for why
  // this is a plain onSubmit flag rather than useFormStatus.
  const [submitting, setSubmitting] = useState(false);

  const handleCountryChange = (nextCountry: string) => {
    setCountry(nextCountry);
    const match = COUNTRY_CURRENCY.find((c) => c.country === nextCountry);
    if (match) setCurrencies([match.currency]);
  };

  return (
    <form
      action={signUp}
      onSubmit={() => setSubmitting(true)}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <input type="hidden" name="workspaceType" value={workspaceType} />

      <div>
        <label style={labelStyle}>What are you managing?</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {TYPE_OPTIONS.map(({ value, label, description, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setWorkspaceType(value)}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${workspaceType === value ? "var(--at-teal, #0D9488)" : "var(--at-border, #CCE8E5)"}`,
                background: workspaceType === value ? "var(--at-teal-soft, #E6F7F5)" : "var(--at-input-bg, #F0FAFB)",
                cursor: "pointer",
                fontFamily: "inherit",
                // Explicit column flex, top-anchored — without this the
                // grid row (both buttons stretched to the taller one's
                // height) let the shorter-description button's content
                // drift vertically, so the two icons didn't line up.
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-start",
              }}
            >
              <Icon size={16} style={{ color: "var(--at-teal, #0D9488)" }} />
              <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--at-t1, #0C1A1A)", marginTop: 6 }}>{label}</p>
              <p style={{ fontSize: "0.7rem", color: "var(--at-t2, #3D6663)", marginTop: 2 }}>{description}</p>
            </button>
          ))}
        </div>
        <div
          style={{
            marginTop: 8,
            padding: "10px 12px",
            borderRadius: 10,
            background: "var(--at-teal-soft, #E6F7F5)",
            border: "1px solid var(--at-border, #CCE8E5)",
          }}
        >
          <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--at-t2, #3D6663)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.02em" }}>
            What you&apos;ll get
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {TYPE_OPTIONS.find((t) => t.value === workspaceType)?.features.map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                <Check size={12} style={{ color: "var(--at-teal, #0D9488)", marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: "0.75rem", color: "var(--at-t1, #0C1A1A)", lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
        <label style={labelStyle} htmlFor="sf-property">
          {workspaceType === "STORE" ? "Shop name" : "Property name"}
        </label>
        <div style={{ position: "relative" }}>
          {workspaceType === "STORE" ? <Store size={14} style={iconStyle} /> : <Home size={14} style={iconStyle} />}
          <input
            id="sf-property"
            name="propertyName"
            required
            style={inputStyle}
            placeholder={workspaceType === "STORE" ? "e.g. Kwame's Phone Shop" : "e.g. Osu Loft or Kwame's Barbershop"}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle} htmlFor="sf-country">Where is it located?</label>
        <div style={{ position: "relative" }}>
          <MapPin size={14} style={iconStyle} />
          <select
            id="sf-country"
            value={country}
            onChange={(e) => handleCountryChange(e.target.value)}
            style={{ ...inputStyle, appearance: "none" }}
          >
            {COUNTRY_CURRENCY.map(({ country: c, currency }) => (
              <option key={c} value={c}>{c} ({currency})</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle} htmlFor="sf-currency">Currency</label>
        <div style={{ position: "relative" }}>
          <Banknote size={14} style={iconStyle} />
          <select
            id="sf-currency"
            name="currencies"
            value={currencies[0]}
            onChange={(e) => setCurrencies([e.target.value as Currency])}
            style={{ ...inputStyle, appearance: "none" }}
          >
            {CURRENCY_ENUM_VALUES.map((cur) => (
              <option key={cur} value={cur}>{cur}</option>
            ))}
          </select>
        </div>
        <p style={{ fontSize: "0.72rem", color: "var(--at-t2, #3D6663)", marginTop: 5 }}>
          Pre-selected from your country above — you can add more currencies (e.g. EUR for Airbnb payouts) later from your property settings.
        </p>
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

      <p style={{ fontSize: "0.78rem", textAlign: "center", color: "var(--at-t2, #3D6663)", lineHeight: 1.55 }}>
        Starts free, no card required.{" "}
        <a href="/pricing" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: "var(--at-teal, #0D9488)", textDecoration: "none" }}>
          See what&apos;s on each plan
        </a>
        .
      </p>
    </form>
  );
}
