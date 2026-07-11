const NAME_WORD_PATTERN = /^[\p{L}\p{M}]+(?:['-][\p{L}\p{M}]+)*$/u;

export function normalizeAccountHolderName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidAccountHolderName(value: string): boolean {
  const normalized = normalizeAccountHolderName(value);
  if (!normalized || normalized.length > 100) return false;

  const words = normalized.split(" ");
  if (words.length < 2) return false;

  return words.every((word) => NAME_WORD_PATTERN.test(word));
}
