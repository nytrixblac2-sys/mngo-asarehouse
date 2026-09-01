"use client";

import { useEffect, useRef, useState } from "react";
import s from "./landing-page.module.css";

export function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [formSending, setFormSending] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const themeRef = useRef<"light" | "dark">("light");

  // Read stored/system theme on mount and apply
  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem("mngo-theme"); } catch {}
    const initial = (stored === "dark" || stored === "light")
      ? (stored as "light" | "dark")
      : "light";
    themeRef.current = initial;
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    themeRef.current = next;
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("mngo-theme", next); } catch {}
  }

  // Canvas orbs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const orbs = [
      { cx: 0.15, cy: 0.25, r: 0.55, rgb: [13, 148, 136], s: 0.00010, ph: 0.0 },
      { cx: 0.80, cy: 0.60, r: 0.50, rgb: [56, 189, 248], s: 0.00007, ph: 1.8 },
      { cx: 0.48, cy: 0.95, r: 0.44, rgb: [94, 234, 212], s: 0.00009, ph: 3.3 },
    ];

    let raf = 0;
    let t = 0;

    function resize() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function draw() {
      const w = canvas!.width; const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);
      const isDark = themeRef.current === "dark";
      const alpha = isDark ? 0.14 : 0.18;
      for (const o of orbs) {
        const x = (o.cx + 0.07 * Math.sin(t * o.s + o.ph)) * w;
        const y = (o.cy + 0.07 * Math.cos(t * o.s * 0.9 + o.ph)) * h;
        const rad = o.r * Math.max(w, h) * 0.55;
        const g = ctx!.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, `rgba(${o.rgb},${alpha})`);
        g.addColorStop(1, `rgba(${o.rgb},0)`);
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, w, h);
      }
      t++;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  // Scroll listener
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 18); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fade-up observer
  useEffect(() => {
    const els = document.querySelectorAll(`.${s.fu}`);
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add(s.fuIn); obs.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormSending(true);
    await new Promise((r) => setTimeout(r, 900));
    setFormSending(false);
    setFormSent(true);
  }

  return (
    <div className={s.wrapper}>
      {/* ── NAV ── */}
      <nav className={`${s.nav} ${scrolled ? s.navScrolled : ""}`}>
        <div className={s.navInner}>
          <a href="/" className={s.logo}>MN<span className={s.logoG}>GO</span></a>
          <div className={s.navLinks}>
            <a href="#features" className={s.navA}>Features</a>
            <a href="#workspaces" className={s.navA}>Workspaces</a>
            <a href="#pricing" className={s.navA}>Pricing</a>
            <a href="#contact" className={s.navA}>Contact</a>
          </div>
          <div className={s.navCtas}>
            <button
              className={s.themeBtn}
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className={s.themeIcon} style={{ opacity: theme === "dark" ? 1 : 0 }}>
                {/* Sun icon — shown in dark mode */}
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              </span>
              <span className={s.themeIcon} style={{ opacity: theme === "dark" ? 0 : 1 }}>
                {/* Moon icon — shown in light mode */}
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              </span>
            </button>
            <a href="/login" className={`${s.btn} ${s.btnOutline}`}>Sign in</a>
            <a href="/signup" className={`${s.btn} ${s.btnPrimary}`}>Get started</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={s.hero}>
        <canvas ref={canvasRef} className={s.heroCanvas} />
        <div className={s.heroContent}>
          <div className={s.eyebrow}>
            <span className={s.eyebrowDot} />
            Management on the Go
          </div>
          <h1 className={s.heroH1}>
            Run your property<br />
            <span className={s.shine}>from anywhere.</span>
          </h1>
          <p className={s.heroSub}>
            MNGO brings bookings, financials, team management, and daily operations into one
            workspace, built for co-working spaces, hotels, short-lets, event centres, restaurants.
          </p>
          <div className={s.heroCtas}>
            <a href="/signup" className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`}>
              Start free trial
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="#features" className={`${s.btn} ${s.btnGhost} ${s.btnLg}`}>See how it works</a>
          </div>
        </div>
        <div className={s.heroScroll}>
          <div className={s.scrollRing}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
          </div>
          scroll
        </div>
      </section>

      {/* ── STATS ── */}
      <div className={s.statsBand}>
        <div className={s.statsGrid}>
          {[
            { n: "11", u: "+", l: "Properties managed\nacross Africa" },
            { n: "98", u: "%", l: "Uptime SLA\nguaranteed" },
            { n: "3", u: "min", l: "Average setup time\nper workspace" },
          ].map(({ n, u, l }) => (
            <div key={n} className={`${s.statCell} ${s.fu}`}>
              <div className={s.statN}>{n}<span className={s.statU}>{u}</span></div>
              <div className={s.statL} style={{ whiteSpace: "pre-line" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" className={`${s.sec} ${s.featuresSec}`}>
        <div className={s.secInner}>
          <div className={`${s.featuresHd} ${s.fu}`}>
            <div className={s.secLabel}>Features</div>
            <h2 className={s.secH2}>Everything a managed space needs</h2>
            <p className={s.secSub}>From the first booking to end-of-month reports, MNGO handles the operational layer so you can focus on hospitality.</p>
          </div>
          <div className={s.featuresGrid}>
            {/* Wide featured card */}
            <div className={`${s.fCard} ${s.fCardWide} ${s.fu}`}>
              <div>
                <div className={s.fIcon}>
                  <svg className={s.fIconSvg} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </div>
                <h3 className={s.fTitle}>Smart Booking Engine</h3>
                <p className={s.fDesc}>Real-time availability, custom pricing rules, and instant confirmation for desks, rooms, event halls, or entire buildings. Handle walk-ins and online reservations from one place.</p>
              </div>
              <div className={s.bookingPreview}>
                {[
                  { dot: s.bDotG, name: "Ama Owusu", amt: "GH₵ 480", status: "Confirmed", pend: false },
                  { dot: s.bDotA, name: "Kofi Asante", amt: "GH₵ 1,200", status: "Pending", pend: true },
                  { dot: s.bDotB, name: "Nana Boateng", amt: "GH₵ 350", status: "Confirmed", pend: false },
                ].map((r) => (
                  <div key={r.name} className={s.bRow}>
                    <span className={`${s.bDot} ${r.dot}`} />
                    <span className={s.bName}>{r.name}</span>
                    <span className={s.bAmt}>{r.amt}</span>
                    <span className={`${s.bStatus} ${r.pend ? s.bStatusPend : ""}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {[
              {
                icon: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></>,
                title: "Financials & Expenses",
                desc: "Track revenue by space type, log operating costs, and export clean reports for your accountant. P&L at a glance, every month.",
              },
              {
                icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
                title: "Multi-role Team Access",
                desc: "Grant the right permissions to managers, receptionists, and finance staff. Co-Manager, Analyst, Staff: each role sees exactly what they need.",
              },
              {
                icon: <><path d="M3 3h18v18H3zM3 9h18M9 3v18"/></>,
                title: "Menu & Orders",
                desc: "Restaurant, bar, kitchen, or shop. Manage your product catalogue, take orders, and track fulfilment without switching apps.",
              },
              {
                icon: <><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></>,
                title: "Live Occupancy View",
                desc: "See which rooms, desks, or halls are active right now. Real-time status updates mean no double-booking and faster check-in.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className={`${s.fCard} ${s.fu}`}>
                <div className={s.fIcon}>
                  <svg className={s.fIconSvg} viewBox="0 0 24 24">{icon}</svg>
                </div>
                <h3 className={s.fTitle}>{title}</h3>
                <p className={s.fDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKSPACES ── */}
      <section id="workspaces" className={`${s.sec} ${s.wsSec}`}>
        <div className={s.secInner}>
          <div className={`${s.wsHd} ${s.fu}`}>
            <div className={s.secLabel}>Built for your space</div>
            <h2 className={s.secH2}>One platform, every property type</h2>
            <p className={s.secSub}>MNGO adapts to how your property actually runs, not the other way around.</p>
          </div>
          <div className={s.wsGrid}>
            {[
              {
                type: "Hospitality",
                name: "Hotels & Short-lets",
                desc: "Front-desk check-in, room assignment, per-night billing, and housekeeping status. All managed without paper.",
                checks: ["Room availability calendar", "Per-night & hourly rates", "Guest check-in / check-out", "Housekeeping status board"],
              },
              {
                type: "Flexible Work",
                name: "Co-working Spaces",
                desc: "Sell hot desks, private offices, and meeting rooms by the hour or month. Track membership plans and recurring revenue with ease.",
                checks: ["Hot desk & office booking", "Hourly / monthly plans", "Member access tracking", "Revenue by space type"],
              },
              {
                type: "Events",
                name: "Event Centres",
                desc: "Manage hall bookings, catering orders, and vendor coordination for weddings, conferences, and corporate events.",
                checks: ["Hall booking with layout", "Catering & bar orders", "Deposit & balance tracking", "Event-day occupancy view"],
              },
              {
                type: "Food & Retail",
                name: "Restaurants & Shops",
                desc: "Take dine-in, takeaway, or delivery orders, manage your menu live, and close shifts with one-click sales reports.",
                checks: ["Live menu management", "Table & takeaway orders", "Shift sales reporting", "Kitchen fulfilment queue"],
              },
            ].map(({ type, name, desc, checks }) => (
              <div key={name} className={`${s.wsCard} ${s.fu}`}>
                <div className={s.wsType}>{type}</div>
                <h3 className={s.wsName}>{name}</h3>
                <p className={s.wsDesc}>{desc}</p>
                <ul className={s.checkList}>
                  {checks.map((c) => (
                    <li key={c}>
                      <span className={s.chk}>
                        <svg className={s.chkSvg} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className={`${s.sec} ${s.pricingSec}`}>
        <div className={s.secInner}>
          <div className={`${s.pricingHd} ${s.fu}`} style={{ textAlign: "center", maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div className={s.secLabel}>Pricing</div>
            <h2 className={s.secH2}>One property? Free forever.</h2>
            <p className={s.secSub}>Single-property managers pay nothing. When you grow to multiple sites or need advanced team features, upgrade to Pro. No per-user fees, ever.</p>
            <a href="/pricing" className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`}>
              See plans
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className={`${s.sec} ${s.contactSec}`}>
        <div className={s.secInner}>
          <div className={s.contactInner}>
            <div className={s.fu}>
              <div className={s.secLabel}>Contact</div>
              <h2 className={s.secH2}>Get in touch</h2>
              <p className={s.secSub} style={{ marginBottom: 36 }}>
                Questions about MNGO, custom pricing, or onboarding your team? We&apos;re here.
              </p>
              {[
                {
                  icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
                  title: "Email us",
                  sub: "kwame@dotdwgstudio.com\nReply within one business day.",
                },
                {
                  icon: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.85 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></>,
                  title: "Call or WhatsApp",
                  sub: "0540885406\nMon – Fri, 8 am – 6 pm GMT",
                },
                {
                  icon: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
                  title: "Headquarters",
                  sub: "Accra, Ghana\nServing properties across West Africa",
                },
              ].map(({ icon, title, sub }) => (
                <div key={title} className={s.cMethod}>
                  <div className={s.cIco}>
                    <svg className={s.cIcoSvg} viewBox="0 0 24 24">{icon}</svg>
                  </div>
                  <div>
                    <div className={s.cMt}>{title}</div>
                    <div className={s.cMs} style={{ whiteSpace: "pre-line" }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <form className={`${s.cForm} ${s.fu}`} onSubmit={handleSubmit}>
              <div className={s.fRow}>
                <div className={s.field}>
                  <label className={s.fieldLabel} htmlFor="cf-name">Name</label>
                  <input id="cf-name" className={s.fieldInput} type="text" placeholder="Your name" required />
                </div>
                <div className={s.field}>
                  <label className={s.fieldLabel} htmlFor="cf-email">Email</label>
                  <input id="cf-email" className={s.fieldInput} type="email" placeholder="you@example.com" required />
                </div>
              </div>
              <div className={s.field}>
                <label className={s.fieldLabel} htmlFor="cf-company">Property / Company</label>
                <input id="cf-company" className={s.fieldInput} type="text" placeholder="Acme Hotel" />
              </div>
              <div className={s.field}>
                <label className={s.fieldLabel} htmlFor="cf-msg">Message</label>
                <textarea id="cf-msg" className={s.fieldTextarea} placeholder="Tell us about your property and what you need..." required />
              </div>
              {formSent ? (
                <p className={s.formMsg} style={{ display: "block" }}>
                  Message sent! We&apos;ll be in touch shortly.
                </p>
              ) : (
                <button type="submit" className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`} disabled={formSending}>
                  {formSending ? "Sending…" : "Send message"}
                </button>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.footerTop}>
            <div>
              <div className={s.logo} style={{ marginBottom: 14 }}>MN<span className={s.logoG}>GO</span></div>
              <div className={s.ftTag}>Management on the Go. The property management platform built for African operators.</div>
            </div>
            {[
              {
                heading: "Product",
                links: [["Features", "/#features"], ["Workspaces", "/#workspaces"], ["Pricing", "/pricing"], ["Changelog", "/changelog"]],
              },
              {
                heading: "Company",
                links: [["About", "/about"], ["Contact", "/contact"], ["Privacy", "/privacy"], ["Terms", "/terms"]],
              },
              {
                heading: "Account",
                links: [["Sign in", "/login"], ["Sign up", "/signup"], ["Dashboard", "/dashboard"], ["Support", "/contact"]],
              },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <div className={s.ftColH}>{heading}</div>
                <ul className={s.ftLinks}>
                  {links.map(([label, href]) => (
                    <li key={label}><a href={href}>{label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className={s.footerBot}>
            <div className={s.ftCopy}>© {new Date().getFullYear()} MNGO. All rights reserved.</div>
            <div className={s.ftDotai}>
              Designed by <strong className={s.ftDotaiStrong}>dotAI</strong> 2026
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
