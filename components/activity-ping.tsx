"use client";

import { useEffect } from "react";

/** Silently pings /api/me/ping on mount and every 5 minutes to keep lastSeenAt current. */
export function ActivityPing() {
  useEffect(() => {
    const ping = () => fetch("/api/me/ping", { method: "POST" }).catch(() => {});
    ping();
    const id = setInterval(ping, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return null;
}
