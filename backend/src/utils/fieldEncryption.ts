import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export function isPayoutFieldEncryptionConfigured(): boolean {
  return Boolean(process.env.PAYOUT_FIELD_ENCRYPTION_KEY?.trim());
}

function getEncryptionKey(): Buffer {
  const secret = process.env.PAYOUT_FIELD_ENCRYPTION_KEY?.trim();
  if (!secret) {
    throw new Error(
      "PAYOUT_FIELD_ENCRYPTION_KEY is required to protect banking data",
    );
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSensitiveField(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptSensitiveField(ciphertext: string): string {
  const buffer = Buffer.from(ciphertext, "base64");
  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
}

export function maskIban(iban: string): string {
  const normalized = iban.replace(/\s+/g, "").toUpperCase();
  if (normalized.length <= 8) return "****";
  return `${normalized.slice(0, 4)}****${normalized.slice(-4)}`;
}
