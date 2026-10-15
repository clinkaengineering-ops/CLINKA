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

  it("removes duplicates", () => {
    const result = mergeMessages([make(1), make(2)], [make(2), make(3)]);
    expect(result.map((m) => m.id)).toEqual([1, 2, 3]);
  });

  it("keeps live messages that arrived before the history fetch finished", () => {
    const live = [make(5)];
    const history = [make(3), make(4)];
    expect(mergeMessages(live, history).map((m) => m.id)).toEqual([3, 4, 5]);
  });
});
