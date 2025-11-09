#!/usr/bin/env tsx
/**
 * Seed default roles (user, developer, admin)
 * Run this after Prisma migrations
 * 
 * Usage: npx tsx scripts/seed-roles.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const roles = ["user", "developer", "admin"];

  for (const roleName of roles) {
    const existing = await db.role.findUnique({
      where: { name: roleName },
    });

    if (!existing) {
      await db.role.create({
        data: { name: roleName },
      });
      console.log(`✅ Created role: ${roleName}`);
    } else {
      console.log(`⏭️  Role already exists: ${roleName}`);
    }
  }

  console.log("\n✅ Role seeding complete!");
}

main()
  .catch((error) => {
    console.error("Error seeding roles:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

