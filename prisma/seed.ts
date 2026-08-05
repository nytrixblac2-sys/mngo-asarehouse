import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createAdminClient } from "../lib/supabase/admin";

/**
 * Seeds the Asare House reference data from context/07-mockup.jsx's
 * INITIAL_* constants — see context/06-progress-tracker.md Session Notes:
 * "The mockup uses INITIAL_* constants for all seed data. These map
 * directly to seed SQL for the Supabase database."
 *
 * Run with: npx prisma db seed
 * Requires a live Supabase project (DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 * — creates real Supabase Auth users, so do not run against production.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SEED_USERS = [
  { name: "Kwame", email: "kwame@oakandco.example", role: "ACCOUNT_OWNER" as const },
  { name: "Cecilia", email: "cecilia@oakandco.example", role: "CO_MANAGER" as const },
  { name: "Prince", email: "prince@example.com", role: "PROPERTY_OWNER" as const },
  { name: "Pamela", email: "pamela@example.com", role: "PROPERTY_OWNER" as const },
];

async function ensureAuthUser(admin: ReturnType<typeof createAdminClient>, email: string, name: string) {
  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing?.users.find((u) => u.email === email);
  if (found) return found.id;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password: crypto.randomUUID(),
    user_metadata: { name },
  });
  if (error || !data.user) {
    throw new Error(`Failed to create auth user ${email}: ${error?.message}`);
  }
  return data.user.id;
}

async function main() {
  const admin = createAdminClient();

  // 1. Supabase Auth users (idempotent — skips ones that already exist).
  const authIdByEmail = new Map<string, string>();
  for (const u of SEED_USERS) {
    authIdByEmail.set(u.email, await ensureAuthUser(admin, u.email, u.name));
  }

  // 2. Workspace, bootstrapped without an owner (see schema.prisma comment
  // on Workspace.accountOwnerId), then the users, then backfill the owner.
  const workspace = await prisma.workspace.create({
    data: { name: "Oak & Co.", slug: "oak-co", status: "ACTIVE", paid: true },
  });

  const usersByName: Record<string, { id: string }> = {};
  for (const u of SEED_USERS) {
    usersByName[u.name] = await prisma.user.create({
      data: {
        authId: authIdByEmail.get(u.email)!,
        workspaceId: workspace.id,
        name: u.name,
        email: u.email,
        role: u.role,
      },
    });
  }

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { accountOwnerId: usersByName["Kwame"].id },
  });

  // Prince and Pamela are Property Owners scoped to Asare House once the
  // property exists (see UserProperty below).

  // 3. Property — INITIAL_PROPERTIES[0] ("asare").
  const property = await prisma.property.create({
    data: {
      workspaceId: workspace.id,
      name: "Asare House",
      color: "#111111",
      rooms: ["Master Bedroom", "Guest Bedroom"],
      facilities: ["WiFi", "Air Conditioning", "Kitchen", "Parking"],
      currencies: ["GHS", "EUR"],
      allocation: {
        GHS: { owners: 60, operations: 15, management: 25 },
        EUR: { owners: 60, operations: 15, management: 25 },
      },
      prevBalanceGhs: { owners: 9374.21, management: 4200 },
      prevBalanceEur: { owners: 0, management: 0 },
    },
  });

  await prisma.userProperty.createMany({
    data: [
      { userId: usersByName["Prince"].id, propertyId: property.id },
      { userId: usersByName["Pamela"].id, propertyId: property.id },
    ],
  });

  // 4. Bookings — INITIAL_BOOKINGS.
  await prisma.booking.createMany({
    data: [
      {
        workspaceId: workspace.id,
        propertyId: property.id,
        guest: "Michael K.",
        checkIn: new Date("2026-07-09"),
        checkOut: new Date("2026-07-11"),
        amount: 138.38,
        currency: "EUR",
        source: "AIRBNB",
        status: "CONFIRMED",
      },
      {
        workspaceId: workspace.id,
        propertyId: property.id,
        guest: "Ama T.",
        checkIn: new Date("2026-07-14"),
        checkOut: new Date("2026-07-16"),
        amount: 900,
        currency: "GHS",
        source: "LOCAL",
        status: "EXPECTED",
      },
      {
        workspaceId: workspace.id,
        propertyId: property.id,
        guest: "Sofia R.",
        checkIn: new Date("2026-07-20"),
        checkOut: new Date("2026-07-22"),
        amount: 310.5,
        currency: "EUR",
        source: "AIRBNB",
        status: "CONFIRMED",
      },
      {
        workspaceId: workspace.id,
        propertyId: property.id,
        guest: "Daniel O.",
        checkIn: new Date("2026-07-27"),
        checkOut: new Date("2026-07-30"),
        amount: 275,
        currency: "EUR",
        source: "AIRBNB",
        status: "EXPECTED",
      },
    ],
  });

  // 5. Expenses — INITIAL_EXPENSES ('oak_co' category -> MANAGEMENT, see
  // schema.prisma comment on ExpenseCategory).
  const seedExpenses = [
    { date: new Date("2026-07-02"), description: "ECG", amount: 300, category: "OPERATIONS", person: null },
    { date: new Date("2026-07-04"), description: "Internet", amount: 493.54, category: "OPERATIONS", person: null },
    { date: new Date("2026-07-06"), description: "Water", amount: 210, category: "OPERATIONS", person: null },
    { date: new Date("2026-07-01"), description: "Ironing board", amount: 700, category: "OWNERS", person: null },
    { date: new Date("2026-07-01"), description: "Caretaker duties", amount: 1200, category: "MANAGEMENT", person: "Collins" },
    { date: new Date("2026-07-05"), description: "Cleaning — turnover", amount: 350, category: "MANAGEMENT", person: "Cynthia" },
    { date: new Date("2026-07-03"), description: "Cleaning — turnover", amount: 300, category: "MANAGEMENT", person: "Sandra" },
    { date: new Date("2026-07-01"), description: "Property management", amount: 800, category: "MANAGEMENT", person: "Cecilia" },
  ] as const;

  await prisma.expense.createMany({
    data: seedExpenses.map((e) => ({
      workspaceId: workspace.id,
      propertyId: property.id,
      currency: "GHS" as const,
      ...e,
    })),
  });

  // 6. Schedules — INITIAL_SHIFTS.
  await prisma.schedule.createMany({
    data: [
      { date: new Date("2026-07-11"), assignedTo: "Sandra", note: "Turnover for Michael K." },
      { date: new Date("2026-07-21"), assignedTo: "Cynthia", note: "Turnover for Sofia R." },
      { date: new Date("2026-07-16"), assignedTo: "Sandra", note: "Turnover for Ama T." },
    ].map((s) => ({
      workspaceId: workspace.id,
      propertyId: property.id,
      type: "CLEANING" as const,
      ...s,
    })),
  });

  // 7. Issues — INITIAL_ISSUES, with its statusHistory entry.
  await prisma.issue.create({
    data: {
      workspaceId: workspace.id,
      propertyId: property.id,
      date: new Date("2026-07-10"),
      type: "GUEST_COMPLAINT",
      description: "Michael K. said the shower had low water pressure.",
      guest: "Michael K.",
      status: "OPEN",
      statusHistory: {
        create: [{ status: "OPEN", at: new Date("2026-07-10T09:14:00") }],
      },
    },
  });

  // 8. Team — INITIAL_TEAM. Independent of User; payment history is
  // derived from Expense rows (category MANAGEMENT, person = name).
  await prisma.teamMember.createMany({
    data: [
      { name: "Collins", role: "Caretaker" },
      { name: "Cynthia", role: "Cleaner" },
      { name: "Sandra", role: "Cleaner" },
      { name: "Cecilia", role: "Property Manager" },
    ].map((t) => ({ workspaceId: workspace.id, ...t })),
  });

  console.log(`Seeded workspace "${workspace.name}" (${workspace.id}) with property "${property.name}".`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
