"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const statusSchema = z.enum(["PENDING", "ACTIVE", "REJECTED"]);
const planSchema = z.enum(["FREE", "STARTER", "PRO", "ENTERPRISE"]);

export async function setWorkspaceStatus(formData: FormData) {
  await requireAdmin();
  const workspaceId = z.string().uuid().parse(formData.get("workspaceId"));
  const status = statusSchema.parse(formData.get("status"));
  await prisma.workspace.update({ where: { id: workspaceId }, data: { status } });
  revalidatePath("/admin");
}

/** Real, enforced plan tier — see Workspace.plan's schema doc comment.
 * Only STORE gates on this today (Free-tier limits: current-month
 * financials, no public storefront, no inventory tracking); RENTAL/
 * HOSTEL read it but nothing checks it yet. */
export async function setWorkspacePlan(formData: FormData) {
  await requireAdmin();
  const workspaceId = z.string().uuid().parse(formData.get("workspaceId"));
  const plan = planSchema.parse(formData.get("plan"));
  await prisma.workspace.update({ where: { id: workspaceId }, data: { plan } });
  revalidatePath("/admin");
}

export async function setWorkspacePaid(formData: FormData) {
  await requireAdmin();
  const workspaceId = z.string().uuid().parse(formData.get("workspaceId"));
  const paid = formData.get("paid") === "true";
  await prisma.workspace.update({ where: { id: workspaceId }, data: { paid } });
  revalidatePath("/admin");
}
