#!/usr/bin/env tsx
/**
 * Seed default roles (user, creator, developer, admin)
 * Run this after Prisma migrations
 * 
 * Usage: npx tsx scripts/seed-roles.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const roles = ["user", "creator", "developer", "admin"];

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
  console.log("\nRoles:");
  console.log("  - user: Normal dashboard use (default)");
  console.log("  - creator: Create AI models / pipelines (invite-only)");
  console.log("  - developer: Internal ops, debugging tools (invite-only)");
  console.log("  - admin: Manage roles, billing, bans, logs (invite-only)");
}

main()
  .catch((error) => {
    console.error("Error seeding roles:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
