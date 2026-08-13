// Deliberately does NOT include a full script-src/style-src Content-Security-Policy
// yet — this app uses React Suspense (app/(app)/issues/page.tsx's useSearchParams
// boundary) which relies on Next.js's inline streaming-hydration scripts, and this
// app's styling leans heavily on inline `style={{...}}` props. Locking either down
// needs a nonce-based CSP (middleware-generated per request) plus a real
// browser click-through to confirm nothing breaks — not something to ship blind.
// frame-ancestors below is the one CSP directive that's unambiguously safe to
// enforce today: it doesn't touch script/style loading at all.
const securityHeaders = [
  // Legacy fallback for browsers that don't honor frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none';" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
