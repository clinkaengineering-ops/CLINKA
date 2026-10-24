import { describe, it, expect } from "vitest";
import { mergeMessages } from "./mergeMessages";
import type { ChatMessage } from "../types";

const make = (id: number, content = `m${id}`): ChatMessage => ({
  id,
  conversationId: 1,
  senderId: "u1",
  content,
  createdAt: new Date(2026, 0, 1, 0, 0, id).toISOString(),
  sender: { id: "u1", name: "A", role: "CLIENT" },
});

describe("mergeMessages", () => {
  it("sorts messages by id even if they arrive out of order", () => {
    const result = mergeMessages([make(3)], [make(1), make(2)]);
    expect(result.map((m) => m.id)).toEqual([1, 2, 3]);
  });

  it("removes duplicates and lets incoming messages update existing ones", () => {
    const original = make(2, "original");
    const updated = make(2, "updated");
    const result = mergeMessages([make(1), original], [updated, make(3)]);
    expect(result.map((m) => m.id)).toEqual([1, 2, 3]);
    expect(result.find((m) => m.id === 2)?.content).toBe("updated");
  });

  it("keeps live messages that arrived before the history fetch finished", () => {
    const live = [make(5)];
    const history = [make(3), make(4)];
    expect(mergeMessages(live, history).map((m) => m.id)).toEqual([3, 4, 5]);
  });

  it("strictly sorts messages by chronological timestamp ascending even when IDs are non-monotonic", () => {
    const msgOlder = {
      ...make(99),
      createdAt: "2026-01-01T10:00:00.000Z",
    };
    const msgNewer = {
      ...make(10),
      createdAt: "2026-01-01T10:05:00.000Z",
    };
    const result = mergeMessages([msgNewer], [msgOlder]);
    expect(result.map((m) => m.id)).toEqual([99, 10]);
  });

  it("breaks timestamp ties using ID ascending", () => {
    const sameTime = "2026-01-01T12:00:00.000Z";
    const msg1 = { ...make(5), createdAt: sameTime };
    const msg2 = { ...make(2), createdAt: sameTime };
    const msg3 = { ...make(8), createdAt: sameTime };

    const result = mergeMessages([msg1, msg3], [msg2]);
    expect(result.map((m) => m.id)).toEqual([2, 5, 8]);
  });

  it("prevents messages from jumping when socket message arrives during active pagination", () => {
    // Current visible messages from initial load
    const initialPage = [
      { ...make(10), createdAt: "2026-01-01T12:10:00.000Z" },
      { ...make(11), createdAt: "2026-01-01T12:11:00.000Z" },
    ];

    // Real-time socket message arrives while user is fetching older page
    const socketMsg = { ...make(12), createdAt: "2026-01-01T12:12:00.000Z" };
    const stateAfterSocket = mergeMessages(initialPage, [socketMsg]);

    // Older paginated page arrives with older messages
    const paginatedOlderPage = [
      { ...make(8), createdAt: "2026-01-01T12:08:00.000Z" },
      { ...make(9), createdAt: "2026-01-01T12:09:00.000Z" },
    ];
    const finalState = mergeMessages(stateAfterSocket, paginatedOlderPage);

    expect(finalState.map((m) => m.id)).toEqual([8, 9, 10, 11, 12]);
  });

  it("falls back to ID ascending when createdAt is missing or invalid", () => {
    const msgA = { ...make(2), createdAt: "" };
    const msgB = { ...make(1), createdAt: "invalid-date" };
    const result = mergeMessages([msgA], [msgB]);
    expect(result.map((m) => m.id)).toEqual([1, 2]);
  });

  it("handles empty arrays gracefully", () => {
    expect(mergeMessages([], [])).toEqual([]);
    expect(mergeMessages([make(1)], [])).toHaveLength(1);
    expect(mergeMessages([], [make(2)])).toHaveLength(1);
  });

  it("maintains strict ascending order across multi-step pagination and socket interleaving", () => {
    // Step 1: User opens chat, receives initial newest page (messages 20, 21, 22)
    let current = mergeMessages([], [
      { ...make(20), createdAt: "2026-01-01T14:20:00.000Z" },
      { ...make(21), createdAt: "2026-01-01T14:21:00.000Z" },
      { ...make(22), createdAt: "2026-01-01T14:22:00.000Z" },
    ]);

    // Step 2: Live socket message 23 arrives
    current = mergeMessages(current, [
      { ...make(23), createdAt: "2026-01-01T14:23:00.000Z" },
    ]);

    // Step 3: User scrolls up, pagination loads previous page (messages 17, 18, 19)
    current = mergeMessages(current, [
      { ...make(17), createdAt: "2026-01-01T14:17:00.000Z" },
      { ...make(18), createdAt: "2026-01-01T14:18:00.000Z" },
      { ...make(19), createdAt: "2026-01-01T14:19:00.000Z" },
    ]);

    // Step 4: Another live socket message 24 arrives
    current = mergeMessages(current, [
      { ...make(24), createdAt: "2026-01-01T14:24:00.000Z" },
    ]);

    // Step 5: Pagination loads even older page (messages 15, 16)
    current = mergeMessages(current, [
      { ...make(15), createdAt: "2026-01-01T14:15:00.000Z" },
      { ...make(16), createdAt: "2026-01-01T14:16:00.000Z" },
    ]);

    const ids = current.map((m) => m.id);
    expect(ids).toEqual([15, 16, 17, 18, 19, 20, 21, 22, 23, 24]);
  });

  it("preserves attachmentDuration on audio messages during merge", () => {
    const voiceMsg: ChatMessage = {
      ...make(50),
      attachmentUrl: "/uploads/documents/voice.webm",
      attachmentMime: "audio/webm",
      attachmentDuration: 45,
    };
    const result = mergeMessages([make(49)], [voiceMsg]);
    const mergedVoice = result.find((m) => m.id === 50);
    expect(mergedVoice?.attachmentDuration).toBe(45);
    expect(mergedVoice?.attachmentMime).toBe("audio/webm");
  });
});
