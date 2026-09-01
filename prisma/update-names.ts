import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createAdminClient } from "../lib/supabase/admin";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const supabase = createAdminClient();

async function main() {
  // 1. Oak & Co — rename ACCOUNT_OWNER to "Kwame"
  const oakWorkspace = await prisma.workspace.findFirst({
    where: { name: { contains: "Oak" } },
  });
  if (oakWorkspace) {
    const r = await prisma.user.updateMany({
      where: { workspaceId: oakWorkspace.id, role: "ACCOUNT_OWNER" },
      data: { name: "Kwame" },
    });
    console.log(`Oak & Co owner → "Kwame": ${r.count} row(s) updated`);
  } else {
    console.log("Oak & Co workspace not found");
  }

  // 2. Escape3Points — rename ACCOUNT_OWNER to "Akwasi"
  const escapeWorkspace = await prisma.workspace.findFirst({
    where: { name: { contains: "Escape" } },
  });
  if (escapeWorkspace) {
    const r = await prisma.user.updateMany({
      where: { workspaceId: escapeWorkspace.id, role: "ACCOUNT_OWNER" },
      data: { name: "Akwasi" },
    });
    console.log(`Escape3Points owner → "Akwasi": ${r.count} row(s) updated`);
  } else {
    console.log("Escape3Points workspace not found");
  }

  // 3. Platform admin — update Supabase Auth user_metadata name to "Kwame (Admin)"
  const adminEmail = process.env.PLATFORM_ADMIN_EMAIL!;
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    console.error("Could not list users:", error.message);
  } else {
    const adminUser = data.users.find((u) => u.email === adminEmail);
    if (adminUser) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(adminUser.id, {
        user_metadata: { ...adminUser.user_metadata, name: "Kwame (Admin)" },
      });
      if (updateError) {
        console.error("Admin metadata update failed:", updateError.message);
      } else {
        console.log(`Admin auth metadata → "Kwame (Admin)": done`);
      }
      // Also update the User row if one exists
      const appUser = await prisma.user.findFirst({ where: { email: adminEmail } });
      if (appUser) {
        await prisma.user.update({ where: { id: appUser.id }, data: { name: "Kwame (Admin)" } });
        console.log(`Admin User row also updated`);
      } else {
        console.log(`No User row for admin (expected — admin has no app row)`);
      }
    } else {
      console.log(`Admin user ${adminEmail} not found in Supabase Auth`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
