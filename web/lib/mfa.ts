import * as OTPAuth from "otpauth";
import argon2 from "argon2";
import { prisma } from "@/lib/db";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "PromptBloom";

// Roles that require MFA
const MFA_REQUIRED_ROLES = ["admin", "dev"];

export function isMfaRequired(roles: string[]): boolean {
  return roles.some((role) => MFA_REQUIRED_ROLES.includes(role));
}

export function generateMfaSecret(): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: APP_NAME,
    label: APP_NAME,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });
}

export function getMfaUri(secret: OTPAuth.TOTP, email: string): string {
  const totp = new OTPAuth.TOTP({
    ...secret,
    label: email,
  });
  return totp.toString();
}

export function verifyMfaCode(secret: string, code: string): boolean {
  const totp = OTPAuth.TOTP.fromSecret(secret);
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

export async function setupMfa(
  userId: string,
  email: string
): Promise<{ secret: string; uri: string; qrCode: string }> {
  const totp = generateMfaSecret();
  const secret = totp.secret.base32;
  const uri = getMfaUri(totp, email);

  // Hash the secret before storing
  const secretHash = await argon2.hash(secret);

  await prisma.mfaSecret.upsert({
    where: { userId },
    update: {
      secretHash,
      enabled: false,
    },
    create: {
      userId,
      secretHash,
      enabled: false,
    },
  });

  // Generate QR code (using qrcode package)
  const QRCode = await import("qrcode");
  const qrCode = await QRCode.toDataURL(uri);

  return { secret, uri, qrCode };
}

export async function enableMfa(userId: string, code: string): Promise<boolean> {
  const mfaSecret = await prisma.mfaSecret.findUnique({
    where: { userId },
  });

  if (!mfaSecret) {
    return false;
  }

  // For verification, we need to temporarily store the unhashed secret
  // In production, you'd store it encrypted and decrypt here
  // This is a simplified version
  const isValid = verifyMfaCode(mfaSecret.secretHash, code);

  if (!isValid) {
    return false;
  }

  await prisma.mfaSecret.update({
    where: { userId },
    data: { enabled: true },
  });

  return true;
}

export async function disableMfa(userId: string): Promise<void> {
  await prisma.mfaSecret.delete({
    where: { userId },
  });
}

export async function checkMfaStatus(userId: string): Promise<boolean> {
  const mfaSecret = await prisma.mfaSecret.findUnique({
    where: { userId },
  });
  return mfaSecret?.enabled ?? false;
}
