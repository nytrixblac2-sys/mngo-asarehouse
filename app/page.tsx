import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing-page";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (isPlatformAdmin(authUser?.email)) redirect("/admin");

  return <LandingPage />;
}
