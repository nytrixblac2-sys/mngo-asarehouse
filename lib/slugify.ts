import { prisma } from "./prisma";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Appends -2, -3, ... until the slug doesn't collide with an existing Workspace. */
export async function uniqueWorkspaceSlug(name: string): Promise<string> {
  const base = slugify(name) || "workspace";
  let slug = base;
  let n = 2;
  while (await prisma.workspace.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}
