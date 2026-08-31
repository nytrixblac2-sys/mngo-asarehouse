"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import s from "./landing-page.module.css";

function Chk() {
  return (
    <span className={s.chk}>
      <svg className={s.chkSvg} viewBox="0 0 10 10">
        <polyline points="1.5,5.5 4,8 8.5,2" />
      </svg>
    </span>
  );
}

export function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [formSending, setFormSending] = useState(false);

  // Nav scroll state
  useEffect(() => {
    const hero = document.querySelector(`.${s.hero}`) as HTMLElement | null;
    function onScroll() {
      const y = window.scrollY;
      setScrolled(y > 40);
      setPastHero(hero ? y > hero.offsetHeight - 80 : false);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Intersection observer for fade-up
  useEffect(() => {
    const els = document.querySelectorAll(`.${s.fu}`);
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(s.fuIn);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Canvas ambient orbs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const orbs = [
      { cx: 0.18, cy: 0.3, r: 0.5, rgb: [245, 158, 11] as [number,number,number], s: 0.00011, ph: 0 },
      { cx: 0.78, cy: 0.55, r: 0.55, rgb: [96, 165, 250] as [number,number,number], s: 0.00007, ph: 1.7 },
      { cx: 0.5, cy: 0.9, r: 0.42, rgb: [167, 139, 250] as [number,number,number], s: 0.00009, ph: 3.2 },
    ];
    let t = 0;
    let raf: number;

    function draw() {
      if (!canvas || !ctx) return;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      orbs.forEach((o) => {
        const x = (o.cx + Math.sin(t * o.s + o.ph) * 0.1) * W;
        const y = (o.cy + Math.cos(t * o.s * 1.4 + o.ph) * 0.07) * H;
        const r = o.r * Math.min(W, H);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${o.rgb.join(",")},0.13)`);
        g.addColorStop(1, `rgba(${o.rgb.join(",")},0)`);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });
      t++;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const navCls = [
    s.nav,
    scrolled ? s.navScrolled : "",
    pastHero ? s.navPastHero : "",
  ]
    .filter(Boolean)
    .join(" ");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormSending(true);
    setTimeout(() => {
      setFormSending(false);
      setFormSent(true);
    }, 900);
  }

  return (
    <div ref={wrapperRef} className={s.wrapper}>
      {/* NAV */}
      <nav className={navCls}>
        <div className={s.navInner}>
          <Link href="/" className={s.logo}>
            MN<span className={s.logoG}>G</span>O
          </Link>
          <div className={s.navLinks}>
            <a href="#features" className={s.navA}>Product</a>
            <a href="#pricing" className={s.navA}>Pricing</a>
            <a href="#contact" className={s.navA}>Contact</a>
          </div>
          <div className={s.navCtas}>
            <Link href="/login" className={`${s.btn} ${s.btnGhost}`}>Log in</Link>
            <Link href="/signup" className={`${s.btn} ${s.btnPrimary}`}>Get started</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className={s.hero}>
        <canvas ref={canvasRef} className={s.heroCanvas} />
        <div className={s.heroContent}>
          <div className={s.eyebrow}>
            <span className={s.eyebrowDot} />
            Management on the go
          </div>
          <h1 className={s.heroH1}>
            Run your property<br />from{" "}
            <span className={s.shine}>anywhere.</span>
          </h1>
          <p className={s.heroSub}>
            MNGO brings bookings, financials, team management, and daily
            operations into one workspace — built for rentals and hostels.
          </p>
          <div className={s.heroCtas}>
            <Link href="/signup" className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`}>
              Get started free
            </Link>
            <a href="#features" className={`${s.btn} ${s.btnGhost} ${s.btnLg}`}>
              See how it works
            </a>
          </div>
        </div>
        <div className={s.heroScroll}>
          <span>Scroll</span>
          <div className={s.scrollRing}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3.5 5 6.5 8 3.5" />
            </svg>
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <section className={s.statsBand}>
        <div className={s.statsGrid}>
          <div className={`${s.statCell} ${s.fu}`}>
            <div className={s.statN}>2<span className={s.statU}> types</span></div>
            <div className={s.statL}>Rental &amp; Hostel workspaces,<br />built differently for each</div>
          </div>
          <div className={`${s.statCell} ${s.fu}`} style={{ transitionDelay: "0.1s" }}>
            <div className={s.statN}>5<span className={s.statU}> modules</span></div>
            <div className={s.statL}>Bookings, Financials, Team,<br />Issues &amp; Schedules, Orders</div>
          </div>
          <div className={`${s.statCell} ${s.fu}`} style={{ transitionDelay: "0.2s" }}>
            <div className={s.statN}>3<span className={s.statU}> roles</span></div>
            <div className={s.statL}>Account Owner, Co-Manager,<br />Property Owner — all scoped</div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className={`${s.sec} ${s.featuresSec}`} id="features">
        <div className={s.secInner}>
          <div className={`${s.featuresHd} ${s.fu}`}>
            <div className={s.secLabel}>Platform</div>
            <h2 className={s.secH2}>Everything your property needs.<br />Nothing it doesn&apos;t.</h2>
            <p className={s.secSub}>Each module is built to work alone and together — no duct tape, no workarounds.</p>
          </div>
          <div className={s.featuresGrid}>
            {/* Wide featured card */}
            <div className={`${s.fCard} ${s.fCardWide} ${s.fu}`}>
              <div>
                <div className={s.fIcon}>
                  <svg className={s.fIconSvg} viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div className={s.fTitle}>Bookings</div>
                <div className={s.fDesc}>Month, week, day, and per-stay views in one calendar. Confirm payouts, track guest status, and import historical data via CSV — no manual re-entry.</div>
              </div>
              <div className={s.bookingPreview}>
                <div className={s.bRow}>
                  <span className={`${s.bDot} ${s.bDotG}`} />
                  <span className={s.bName}>Anna Mensah</span>
                  <span className={s.bAmt}>GH₵ 840</span>
                  <span className={s.bStatus}>Confirmed</span>
                </div>
                <div className={s.bRow}>
                  <span className={`${s.bDot} ${s.bDotA}`} />
                  <span className={s.bName}>James Osei</span>
                  <span className={s.bAmt}>€ 220</span>
                  <span className={`${s.bStatus} ${s.bStatusPend}`}>Pending</span>
                </div>
                <div className={s.bRow}>
                  <span className={`${s.bDot} ${s.bDotB}`} />
                  <span className={s.bName}>Sarah Aidoo</span>
                  <span className={s.bAmt}>GH₵ 560</span>
                  <span className={s.bStatus}>Confirmed</span>
                </div>
              </div>
            </div>

            <div className={`${s.fCard} ${s.fu}`} style={{ transitionDelay: "0.08s" }}>
              <div className={s.fIcon}>
                <svg className={s.fIconSvg} viewBox="0 0 24 24">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className={s.fTitle}>Financials</div>
              <div className={s.fDesc}>Split income across owner, operations, and management funds. Track GHS and EUR as separate accounts. Generate PDF monthly reports per property.</div>
            </div>

            <div className={`${s.fCard} ${s.fu}`} style={{ transitionDelay: "0.13s" }}>
              <div className={s.fIcon}>
                <svg className={s.fIconSvg} viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className={s.fTitle}>Team</div>
              <div className={s.fDesc}>Invite co-managers and property owners with one-click credentials. Role-based access means each person sees exactly what they should — nothing more.</div>
            </div>

            <div className={`${s.fCard} ${s.fu}`} style={{ transitionDelay: "0.18s" }}>
              <div className={s.fIcon}>
                <svg className={s.fIconSvg} viewBox="0 0 24 24">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className={s.fTitle}>Issues &amp; Schedules</div>
              <div className={s.fDesc}>Log guest complaints and maintenance issues. Assign cleaning, repair, and training shifts with full status history and timestamped notes.</div>
            </div>

            <div className={`${s.fCard} ${s.fu}`} style={{ transitionDelay: "0.23s" }}>
              <div className={s.fIcon}>
                <svg className={s.fIconSvg} viewBox="0 0 24 24">
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div className={s.fTitle}>Orders</div>
              <div className={s.fDesc}>Kitchen, bar, shop, and experiences — all in one fulfilment board. Guests and staff place orders that flow live to whoever&apos;s handling them.</div>
            </div>
          </div>
        </div>
      </section>

      {/* WORKSPACE TYPES */}
      <section className={`${s.sec} ${s.wsSec}`}>
        <div className={s.secInner}>
          <div className={`${s.wsHd} ${s.fu}`}>
            <div className={s.secLabel}>Workspace types</div>
            <h2 className={s.secH2}>One platform, two ways to run it.</h2>
            <p className={s.secSub}>MNGO adapts to how you actually operate — whether you manage short-term rentals or run a hostel.</p>
          </div>
          <div className={s.wsGrid}>
            <div className={`${s.wsCard} ${s.fu}`} style={{ transitionDelay: "0.08s" }}>
              <div className={s.wsType}>Rental</div>
              <div className={s.wsName}>Short-term rentals</div>
              <div className={s.wsDesc}>For property managers handling Airbnb, direct bookings, and long-term stays. Split revenue between owners and management with full financial transparency.</div>
              <ul className={s.checkList}>
                <li><Chk />Multi-property management</li>
                <li><Chk />Owner and co-manager roles</li>
                <li><Chk />Dual-currency financials (GHS &amp; EUR)</li>
                <li><Chk />Monthly PDF reports per property</li>
                <li><Chk />Historical CSV import</li>
              </ul>
            </div>
            <div className={`${s.wsCard} ${s.fu}`} style={{ transitionDelay: "0.16s" }}>
              <div className={s.wsType}>Hostel</div>
              <div className={s.wsName}>Hostels &amp; guesthouses</div>
              <div className={s.wsDesc}>For hostel operators managing rooms, food service, and guest experiences. From public guest booking to kitchen order fulfilment — all in one place.</div>
              <ul className={s.checkList}>
                <li><Chk />Priced rooms with nightly totals</li>
                <li><Chk />Public guest booking page</li>
                <li><Chk />Kitchen, bar &amp; shop orders</li>
                <li><Chk />Self-service stay tracking portal</li>
                <li><Chk />Checkout receipts &amp; PDF invoices</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className={`${s.sec} ${s.pricingSec}`} id="pricing">
        <div className={s.secInner}>
          <div className={`${s.pricingHd} ${s.fu}`}>
            <div className={s.secLabel}>Pricing</div>
            <h2 className={s.secH2}>Simple, honest pricing.</h2>
            <p className={s.secSub}>Start free. Upgrade when you grow. No per-seat fees, no surprises.</p>
          </div>
          <div className={s.pricingGrid}>
            <div className={`${s.pCard} ${s.fu}`} style={{ transitionDelay: "0.05s" }}>
              <div className={s.pName}>Starter</div>
              <div className={s.pTag}>Get started with one property, no commitment.</div>
              <div className={s.pPrice}><span className={s.pCur}>$</span><span className={s.pAmt}>0</span></div>
              <div className={s.pPer}>Free forever</div>
              <Link href="/signup" className={`${s.btn} ${s.btnOutline} ${s.btnFull}`}>Get started</Link>
              <div className={s.pDiv} />
              <ul className={s.pFeats}>
                <li><Chk />1 property</li>
                <li><Chk />Bookings &amp; financials</li>
                <li><Chk />Up to 3 team members</li>
                <li><Chk />Issues &amp; schedules</li>
              </ul>
            </div>

            <div className={`${s.pCard} ${s.pCardPop} ${s.fu}`} style={{ transitionDelay: "0.1s" }}>
              <div className={s.popBadge}>Most popular</div>
              <div className={s.pName}>Pro</div>
              <div className={s.pTag}>For growing portfolios and small management companies.</div>
              <div className={s.pPrice}><span className={s.pCur}>$</span><span className={s.pAmt}>29</span></div>
              <div className={s.pPer}>per month</div>
              <Link href="/signup" className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`}>Get started</Link>
              <div className={s.pDiv} />
              <ul className={s.pFeats}>
                <li><Chk />Up to 5 properties</li>
                <li><Chk />All modules included</li>
                <li><Chk />Unlimited team members</li>
                <li><Chk />Monthly PDF reports</li>
                <li><Chk />CSV historical import</li>
                <li><Chk />Email support</li>
              </ul>
            </div>

            <div className={`${s.pCard} ${s.fu}`} style={{ transitionDelay: "0.15s" }}>
              <div className={s.pName}>Business</div>
              <div className={s.pTag}>For established operators running multiple locations.</div>
              <div className={s.pPrice}><span className={s.pCur}>$</span><span className={s.pAmt}>79</span></div>
              <div className={s.pPer}>per month</div>
              <a href="#contact" className={`${s.btn} ${s.btnOutline} ${s.btnFull}`}>Contact us</a>
              <div className={s.pDiv} />
              <ul className={s.pFeats}>
                <li><Chk />Unlimited properties</li>
                <li><Chk />All Pro features</li>
                <li><Chk />Priority support</li>
                <li><Chk />Custom onboarding session</li>
                <li><Chk />SLA &amp; dedicated contact</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className={`${s.sec} ${s.contactSec}`} id="contact">
        <div className={s.secInner}>
          <div className={s.contactInner}>
            <div className={s.fu}>
              <div className={s.secLabel}>Contact</div>
              <h2 className={s.secH2}>Get in touch.</h2>
              <p className={s.secSub} style={{ marginBottom: 36 }}>Questions about MNGO? Interested in a custom plan? We&apos;d love to hear from you.</p>
              <div>
                <div className={s.cMethod}>
                  <div className={s.cIco}>
                    <svg className={s.cIcoSvg} viewBox="0 0 24 24">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div>
                    <div className={s.cMt}>Email us</div>
                    <div className={s.cMs}>hello@mngo.app — we reply within one business day.</div>
                  </div>
                </div>
                <div className={s.cMethod}>
                  <div className={s.cIco}>
                    <svg className={s.cIcoSvg} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div>
                    <div className={s.cMt}>Need help inside the app?</div>
                    <div className={s.cMs}>Sign in to access documentation and support from your dashboard.</div>
                  </div>
                </div>
              </div>
            </div>

            <form className={`${s.cForm} ${s.fu}`} style={{ transitionDelay: "0.12s" }} onSubmit={handleSubmit}>
              <div className={s.fRow}>
                <div className={s.field}>
                  <label className={s.fieldLabel}>First name</label>
                  <input className={s.fieldInput} type="text" placeholder="Kwame" autoComplete="given-name" />
                </div>
                <div className={s.field}>
                  <label className={s.fieldLabel}>Last name</label>
                  <input className={s.fieldInput} type="text" placeholder="Asare" autoComplete="family-name" />
                </div>
              </div>
              <div className={s.field}>
                <label className={s.fieldLabel}>Work email</label>
                <input className={s.fieldInput} type="email" placeholder="you@company.com" autoComplete="email" />
              </div>
              <div className={s.field}>
                <label className={s.fieldLabel}>Message</label>
                <textarea className={s.fieldTextarea} placeholder="Tell us about your property or what you'd like to know…" />
              </div>
              {!formSent ? (
                <button
                  type="submit"
                  disabled={formSending}
                  className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`}
                  style={{ padding: "13px" }}
                >
                  {formSending ? "Sending…" : "Send message"}
                </button>
              ) : (
                <div className={s.formMsg} style={{ display: "block" }}>
                  Message sent — we&apos;ll be in touch soon.
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.footerTop}>
            <div>
              <Link href="/" className={`${s.logo}`} style={{ display: "block", marginBottom: 13 }}>
                MN<span className={s.logoG}>G</span>O
              </Link>
              <p className={s.ftTag}>Management on the go. One workspace for bookings, team, financials, and daily operations.</p>
            </div>
            <div>
              <div className={s.ftColH}>Product</div>
              <ul className={s.ftLinks}>
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><Link href="/signup">Sign up</Link></li>
                <li><Link href="/login">Log in</Link></li>
              </ul>
            </div>
            <div>
              <div className={s.ftColH}>Workspace</div>
              <ul className={s.ftLinks}>
                <li><a href="#features">Rental</a></li>
                <li><a href="#features">Hostel</a></li>
                <li><a href="#features">Bookings</a></li>
                <li><a href="#features">Financials</a></li>
              </ul>
            </div>
            <div>
              <div className={s.ftColH}>Company</div>
              <ul className={s.ftLinks}>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#">Privacy</a></li>
                <li><a href="#">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className={s.footerBot}>
            <div className={s.ftCopy}>© 2026 MNGO. All rights reserved.</div>
            <div className={s.ftDotai}>
              Designed by <span className={s.ftDotaiStrong}>dotAI</span> 2026
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
