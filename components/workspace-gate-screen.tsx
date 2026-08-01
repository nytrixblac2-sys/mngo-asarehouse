import { Clock, XCircle } from "lucide-react";
import { C } from "@/lib/colors";
import { Card } from "@/components/primitives";
import { signOut } from "@/app/(app)/actions";

/** Shown instead of the app shell for a workspace that isn't ACTIVE yet —
 * see WorkspaceStatus doc comment in prisma/schema.prisma. */
export function WorkspaceGateScreen({ status }: { status: "PENDING" | "REJECTED" }) {
  const rejected = status === "REJECTED";
  return (
    <div className="flex w-full items-center justify-center" style={{ background: C.bg, minHeight: "100vh" }}>
      <div className="w-full max-w-sm">
        <Card>
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: rejected ? "rgba(220,38,38,0.1)" : C.amberSoft }}
            >
              {rejected ? (
                <XCircle size={24} style={{ color: "#DC2626" }} />
              ) : (
                <Clock size={24} style={{ color: C.amber }} />
              )}
            </div>
            <p className="text-base font-bold" style={{ color: C.text }}>
              {rejected ? "This workspace wasn't approved" : "Your workspace is pending approval"}
            </p>
            <p className="text-sm" style={{ color: C.muted }}>
              {rejected
                ? "Get in touch if you think this is a mistake."
                : "We review every new workspace before it goes live. You'll get access as soon as it's approved — no need to sign up again."}
            </p>
            <form action={signOut} className="w-full mt-2">
              <button
                type="submit"
                className="w-full text-sm font-semibold py-3 rounded-xl"
                style={{ background: C.bg, color: C.muted }}
              >
                Sign out
              </button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
