import type { ChatMessage } from "../types";

function compareIds(
  a: number | string | undefined,
  b: number | string | undefined,
): number {
  if (a === b) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  const numA = Number(a);
  const numB = Number(b);
  if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
    return numA - numB;
  }
  return String(a).localeCompare(String(b));
}

/**
 * Merge two message lists: no duplicates (by id), strictly sorted oldest -> newest
 * by chronological timestamp or ID (ascending).
 * Later lists win when the same id appears twice.
 */
export function mergeMessages(
  existing: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const byId = new Map<number | string, ChatMessage>();

  for (const m of existing) {
    if (m && m.id !== undefined && m.id !== null) {
      byId.set(m.id, m);
    }
  }
  for (const m of incoming) {
    if (m && m.id !== undefined && m.id !== null) {
      byId.set(m.id, m);
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : NaN;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : NaN;

    const validA = !Number.isNaN(timeA);
    const validB = !Number.isNaN(timeB);

    if (validA && validB && timeA !== timeB) {
      return timeA - timeB;
    }
    if (validA && !validB) return -1;
    if (!validA && validB) return 1;

    return compareIds(a.id, b.id);
  });
}

