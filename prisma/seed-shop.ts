/**
 * Seeds Asare House shop products.
 * Run with: npx tsx prisma/seed-shop.ts
 * Requires DATABASE_URL in .env — finds the first workspace and adds the
 * 12 standard shop items if they don't already exist.
 */
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SHOP_ITEMS = [
  { name: "Socks", category: "Clothing", price: 10.00 },
  { name: "Singlet", category: "Clothing", price: 25.00 },
  { name: "Shirt", category: "Clothing", price: 45.00 },
  { name: "Shaving Sticks", category: "Toiletries", price: 8.00 },
  { name: "Toothbrush", category: "Toiletries", price: 12.00 },
  { name: "Slippers", category: "Footwear", price: 30.00 },
  { name: "Coca-Cola", category: "Beverages", price: 7.00 },
  { name: "Fanta", category: "Beverages", price: 7.00 },
  { name: "Water", category: "Beverages", price: 5.00 },
  { name: "Beer", category: "Beverages", price: 15.00 },
  { name: "Chocolate", category: "Snacks", price: 18.00 },
  { name: "African Beads", category: "Souvenirs", price: 35.00 },
] as const;

async function main() {
  // Find the first workspace (or specify by slug)
  const workspace = await prisma.workspace.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!workspace) throw new Error("No workspace found — run the main seed first");

  console.log(`Adding shop items to workspace "${workspace.name}" (${workspace.id})`);

  // Enable shop
  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { hasShop: true },
  });

  let created = 0;
  for (const item of SHOP_ITEMS) {
    const existing = await prisma.menuItem.findFirst({
      where: { workspaceId: workspace.id, name: item.name, station: "SHOP" },
    });
    if (existing) {
      console.log(`  ✓ ${item.name} already exists, skipping`);
      continue;
    }
    await prisma.menuItem.create({
      data: {
        workspaceId: workspace.id,
        name: item.name,
        category: item.category,
        price: item.price,
        currency: "GHS",
        station: "SHOP",
        alwaysAvailable: true,
      },
    });
    console.log(`  + ${item.name} (GH₵ ${item.price})`);
    created++;
  }

  console.log(`\nDone. Created ${created} new shop item(s). Shop enabled ✓`);
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
