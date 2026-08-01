"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const statusSchema = z.enum(["PENDING", "ACTIVE", "REJECTED"]);

export async function setWorkspaceStatus(formData: FormData) {
  await requireAdmin();
  const workspaceId = z.string().uuid().parse(formData.get("workspaceId"));
  const status = statusSchema.parse(formData.get("status"));
  await prisma.workspace.update({ where: { id: workspaceId }, data: { status } });
  revalidatePath("/admin");
}

export async function setWorkspacePaid(formData: FormData) {
  await requireAdmin();
  const workspaceId = z.string().uuid().parse(formData.get("workspaceId"));
  const paid = formData.get("paid") === "true";
  await prisma.workspace.update({ where: { id: workspaceId }, data: { paid } });
  revalidatePath("/admin");
}
