import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminChatViewer } from "./AdminChatViewer";
import * as adminApi from "../api/admin.api";

vi.mock("../api/admin.api", () => ({
  fetchAdminConversations: vi.fn(),
  fetchAdminConversationMessages: vi.fn(),
}));

describe("AdminChatViewer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(function (this: HTMLMediaElement) {
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
    });
    window.HTMLMediaElement.prototype.pause = vi.fn().mockImplementation(function (this: HTMLMediaElement) {
      this.dispatchEvent(new Event("pause"));
    });
  });

  it("renders voice messages with player and preserves attachmentDuration in admin view", async () => {
    const mockConversations = [
      {
        id: 1,
        clientId: "client-1",
        clientName: "Client Alice",
        engineerId: "engineer-2",
        engineerName: "Engineer Bob",
        projectId: "proj-1",
        projectTitle: "Villa Design",
        lastMessage: "Voice note",
        lastMessageAt: new Date().toISOString(),
        messageCount: 1,
      },
    ];

    const mockMessages = {
      messages: [
        {
          id: 501,
          conversationId: 1,
          senderId: "client-1",
          content: "",
          attachmentUrl: "/uploads/documents/voice.webm",
          attachmentName: "voice.webm",
          attachmentMime: "audio/webm",
          attachmentDuration: 85, // 1 min 25 sec
          createdAt: new Date().toISOString(),
          sender: {
            id: "client-1",
            name: "Client Alice",
            role: "CLIENT",
          },
        },
      ],
      total: 1,
      page: 1,
      limit: 50,
      totalPages: 1,
      conversation: {
        id: 1,
        projectId: "proj-1",
        clientId: "client-1",
        engineerId: "engineer-2",
      },
    };

    (adminApi.fetchAdminConversations as any).mockResolvedValue({
      conversations: mockConversations,
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    });

    (adminApi.fetchAdminConversationMessages as any).mockResolvedValue(mockMessages);

    render(<AdminChatViewer />);

    await waitFor(() => {
      expect(screen.getByTestId("voice-message-player")).toBeInTheDocument();
    });

    // Verify stored attachmentDuration is rendered as total time (85s -> 1:25)
    expect(screen.getByText("1:25")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play voice message" })).toBeInTheDocument();
  });
});
