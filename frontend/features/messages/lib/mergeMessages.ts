import type { ChatMessage } from "../types";

/**
 * Merge two message lists: no duplicates (by id), always sorted oldest -> newest.
 * Later lists win when the same id appears twice.
 */
export function mergeMessages(
  existing: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const byId = new Map<number, ChatMessage>();
  for (const m of existing) byId.set(m.id, m);
  for (const m of incoming) byId.set(m.id, m);
  return Array.from(byId.values()).sort((a, b) => a.id - b.id);
}
