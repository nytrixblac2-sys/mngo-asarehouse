import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ ok: false }, { status: 401 });

  const user = await prisma.user.findFirst({ where: { authId: authUser.id }, select: { id: true } });
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
  return NextResponse.json({ ok: true });
}
