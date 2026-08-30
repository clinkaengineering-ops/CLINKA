import { resolvePublicUploadUrl } from "../config/upload";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | Date
  | JsonValue[]
  | { [key: string]: JsonValue };

const MEDIA_FIELD_NAMES = new Set([
  "avatarUrl",
  "coverImageUrl",
  "coverBannerUrl",
  "imageUrl",
  "attachmentUrl",
  "receiptUrl",
  "fileUrl",
  "collegeIdUrl",
  "certificateUrl",
  "syndicateCardUrl",
  "url",
]);

function isPlainObject(value: object): value is Record<string, unknown> {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function serializeMediaUrls<T>(value: T): T {
  return transformMediaUrls(value) as T;
}

function transformMediaUrls(value: unknown): JsonValue {
  if (value == null) return value as null;

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => transformMediaUrls(item));
  }

  if (typeof value === "object") {
    if (value instanceof Date) {
      return value;
    }

    // Prisma Decimal, Buffer, and other class instances must stay intact so
    // JSON serialization can use toJSON() instead of { s, e, d } / {}.
    if (!isPlainObject(value)) {
      return value as JsonValue;
    }

    const next: Record<string, JsonValue> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      if (
        typeof nestedValue === "string" &&
        MEDIA_FIELD_NAMES.has(key) &&
        !/^https?:\/\//i.test(nestedValue)
      ) {
        next[key] = resolvePublicUploadUrl(nestedValue) ?? nestedValue;
      } else {
        next[key] = transformMediaUrls(nestedValue);
      }
    }

    return next;
  }

  return value as JsonValue;
}
