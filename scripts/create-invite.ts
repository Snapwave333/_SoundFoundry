#!/usr/bin/env tsx
/**
 * Create invite token for developer/admin roles
 * 
 * Usage: npx tsx scripts/create-invite.ts <role> [expiresInDays]
 * 
 * Example:
 *   npx tsx scripts/create-invite.ts developer
 *   npx tsx scripts/create-invite.ts admin 14
 */

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const db = new PrismaClient();

async function main() {
  const roleName = process.argv[2];
  const expiresInDays = parseInt(process.argv[3] || "7", 10);

  if (!roleName || !["developer", "admin"].includes(roleName)) {
    console.error("Usage: npx tsx scripts/create-invite.ts <developer|admin> [expiresInDays]");
    process.exit(1);
  }

  try {
    // Get role
    const role = await db.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      console.error(`Role '${roleName}' not found. Creating it...`);
      const newRole = await db.role.create({
        data: { name: roleName },
      });
      console.log(`Created role '${roleName}'`);
      
      // Use new role
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      
      const token = randomUUID();
      
      await db.invite.create({
        data: {
          token,
          roleId: newRole.id,
          expiresAt,
        },
      });

      const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://promptbloom.app";
      const redeemUrl = `${siteUrl}/auth/invite/${token}`;

      console.log("\n✅ Invite created successfully!");
      console.log(`\nRole: ${roleName}`);
      console.log(`Token: ${token}`);
      console.log(`Expires: ${expiresAt.toISOString()}`);
      console.log(`\nRedeem URL: ${redeemUrl}\n`);
    } else {
      // Create invite
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      
      const token = randomUUID();
      
      await db.invite.create({
        data: {
          token,
          roleId: role.id,
          expiresAt,
        },
      });

      const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://promptbloom.app";
      const redeemUrl = `${siteUrl}/auth/invite/${token}`;

      console.log("\n✅ Invite created successfully!");
      console.log(`\nRole: ${roleName}`);
      console.log(`Token: ${token}`);
      console.log(`Expires: ${expiresAt.toISOString()}`);
      console.log(`\nRedeem URL: ${redeemUrl}\n`);
    }
  } catch (error) {
    console.error("Error creating invite:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();

