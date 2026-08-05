"use client";

import { useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";
import { C } from "@/lib/colors";

/** Lets Janet copy the public guest-booking link (app/book/[slug]) to
 * share however she likes — a WhatsApp message, the property's website,
 * a QR code, etc. MNGO doesn't host that distribution itself. */
export function CopyBookingLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full"
      style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}` }}
    >
      {copied ? <Check size={16} /> : <LinkIcon size={16} />} {copied ? "Copied!" : "Copy booking link"}
    </button>
  );
}
