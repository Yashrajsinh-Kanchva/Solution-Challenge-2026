import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getAadhaarEncryptionKey(): Buffer {
  const rawKey = process.env.AADHAAR_ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error("Missing AADHAAR_ENCRYPTION_KEY env var");
  }

  const key = Buffer.from(rawKey, "base64");
  if (key.length !== 32) {
    throw new Error("AADHAAR_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  }

  return key;
}

export function maskAadhaar(aadhaarNumber: string): string {
  const clean = aadhaarNumber.replace(/\D/g, "");
  if (clean.length < 4) {
    throw new Error("Invalid aadhaarNumber");
  }
  return `${"X".repeat(Math.max(0, clean.length - 4))}${clean.slice(-4)}`;
}

export function encryptAadhaar(aadhaarNumber: string): string {
  const clean = aadhaarNumber.replace(/\D/g, "");
  if (clean.length !== 12) {
    throw new Error("aadhaarNumber must be 12 digits");
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getAadhaarEncryptionKey(), iv);

  const encrypted = Buffer.concat([cipher.update(clean, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `enc:v1:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}
