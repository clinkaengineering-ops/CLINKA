import { resolvePublicUploadUrl } from "../config/upload";

type JsonValue =
  | string
  | number
  | boolean
  | null
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
    const record = value as Record<string, unknown>;
    const next: Record<string, JsonValue> = {};

    for (const [key, nestedValue] of Object.entries(record)) {
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
