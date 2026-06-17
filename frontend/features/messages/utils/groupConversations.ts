import type { ConversationListItem } from "../types";

export type ParticipantInboxGroup = {
  participantId: number;
  participantName: string;
  conversations: ConversationListItem[];
  lastMessage: string | null;
  lastMessageAt: string;
};

export function groupConversationsByParticipant(
  list: ConversationListItem[],
): ParticipantInboxGroup[] {
  const byParticipant = new Map<number, ConversationListItem[]>();

  for (const conv of list) {
    const existing = byParticipant.get(conv.participantId) ?? [];
    existing.push(conv);
    byParticipant.set(conv.participantId, existing);
  }

  return Array.from(byParticipant.entries())
    .map(([participantId, conversations]) => {
      const sorted = [...conversations].sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime(),
      );
      const latest = sorted[0];
      return {
        participantId,
        participantName: latest.participantName,
        conversations: sorted,
        lastMessage: latest.lastMessage,
        lastMessageAt: latest.lastMessageAt,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime(),
    );
}
