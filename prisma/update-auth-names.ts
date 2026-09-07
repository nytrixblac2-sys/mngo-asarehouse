import "dotenv/config";
import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

const UPDATES = [
  { email: "kwame@dotdwgstudio.com", name: "Kwame" },
  { email: "akwasim@gmail.com",      name: "Akwasi" },
];

async function main() {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) { console.error(error.message); process.exit(1); }

  for (const { email, name } of UPDATES) {
    const user = data.users.find((u) => u.email === email);
    if (!user) { console.log(`Not found: ${email}`); continue; }

    const { error: err } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, name },
    });
    if (err) { console.error(`${email}: ${err.message}`); }
    else      { console.log(`${email} → "${name}" ✓`); }
  }
}

main().catch(console.error);
