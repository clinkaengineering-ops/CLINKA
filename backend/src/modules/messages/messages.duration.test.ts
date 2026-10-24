import { sendMessageSchema } from "./messages.validation";
import { sendMessageController } from "./messages.controller";
import { sendMessage, formatLastMessagePreview } from "./messages.service";
import { getConversationMessages } from "../admin/admin.service";
import db from "../../config/db";
import ApiError from "../../utils/ApiError";
import * as socketModule from "../../socket";

jest.mock("../../config/db", () => ({
  __esModule: true,
  default: {
    conversation: {
      findUnique: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    ban: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../socket", () => ({
  broadcastNewMessage: jest.fn(),
}));

jest.mock("../../utils/notifications", () => ({
  createNotification: jest.fn().mockResolvedValue(true),
}));

describe("Message Attachment Duration", () => {
  describe("sendMessageSchema validation", () => {
    it("accepts valid integer durations within 1..300 as numbers or coerced strings", () => {
      const parsedNum = sendMessageSchema.parse({
        content: "Voice note",
        attachmentDuration: 45,
      });
      expect(parsedNum.attachmentDuration).toBe(45);

      const parsedStr = sendMessageSchema.parse({
        content: "Voice note",
        attachmentDuration: "120",
      });
      expect(parsedStr.attachmentDuration).toBe(120);

      const parsedMin = sendMessageSchema.parse({
        attachmentDuration: 1,
      });
      expect(parsedMin.attachmentDuration).toBe(1);

      const parsedMax = sendMessageSchema.parse({
        attachmentDuration: 300,
      });
      expect(parsedMax.attachmentDuration).toBe(300);
    });

    it("accepts omitted attachmentDuration and empty string", () => {
      const omitted = sendMessageSchema.parse({ content: "Just text" });
      expect(omitted.attachmentDuration).toBeUndefined();

      const emptyStr = sendMessageSchema.parse({
        content: "Just text",
        attachmentDuration: "",
      });
      expect(emptyStr.attachmentDuration).toBeUndefined();

      const nullVal = sendMessageSchema.parse({
        content: "Just text",
        attachmentDuration: null,
      });
      expect(nullVal.attachmentDuration).toBeNull();
    });

    it("rejects durations below 1", () => {
      expect(() =>
        sendMessageSchema.parse({ attachmentDuration: 0 }),
      ).toThrow();
      expect(() =>
        sendMessageSchema.parse({ attachmentDuration: -10 }),
      ).toThrow();
      expect(() =>
        sendMessageSchema.parse({ attachmentDuration: "0" }),
      ).toThrow();
    });

    it("rejects durations above 300", () => {
      expect(() =>
        sendMessageSchema.parse({ attachmentDuration: 301 }),
      ).toThrow();
      expect(() =>
        sendMessageSchema.parse({ attachmentDuration: "350" }),
      ).toThrow();
    });

    it("rejects non-integer durations", () => {
      expect(() =>
        sendMessageSchema.parse({ attachmentDuration: 15.5 }),
      ).toThrow();
      expect(() =>
        sendMessageSchema.parse({ attachmentDuration: "42.7" }),
      ).toThrow();
    });

    it("rejects non-numeric strings", () => {
      expect(() =>
        sendMessageSchema.parse({ attachmentDuration: "invalid" }),
      ).toThrow();
    });
  });

  describe("sendMessageController", () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: any;

    beforeEach(() => {
      jest.clearAllMocks();

      mockReq = {
        params: { id: "10" },
        user: { userId: "user-123" },
        body: {},
        file: undefined,
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      mockNext = jest.fn();

      (db.conversation.findUnique as jest.Mock).mockResolvedValue({
        id: 10,
        clientId: "user-123",
        engineerId: "engineer-456",
        projectId: null,
      });

      (db.ban.findUnique as jest.Mock).mockResolvedValue(null);
    });

    it("requires duration when uploaded file is audio and responds 400 if missing", async () => {
      mockReq.file = {
        mimetype: "audio/webm",
        originalname: "voice.webm",
        path: "https://res.cloudinary.com/demo/raw/upload/voice.webm",
        size: 1024,
      };
      mockReq.body = {};

      await sendMessageController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = mockNext.mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain("Duration is required for audio attachments");
    });

    it("stores duration and returns message with attachmentDuration for audio upload", async () => {
      mockReq.file = {
        mimetype: "audio/webm",
        originalname: "voice.webm",
        path: "https://res.cloudinary.com/demo/raw/upload/voice.webm",
        size: 1024,
      };
      mockReq.body = {
        attachmentDuration: "42",
      };

      const createdMessage = {
        id: 101,
        conversationId: 10,
        senderId: "user-123",
        content: "",
        attachmentUrl: "https://res.cloudinary.com/demo/raw/upload/voice.webm",
        attachmentName: "voice.webm",
        attachmentMime: "audio/webm",
        attachmentDuration: 42,
        createdAt: new Date(),
        sender: { id: "user-123", name: "Alice", role: "CLIENT" },
      };

      (db.message.create as jest.Mock).mockResolvedValue(createdMessage);

      await sendMessageController(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            attachmentDuration: 42,
          }),
        }),
      );
      expect(socketModule.broadcastNewMessage).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ attachmentDuration: 42 }),
      );
    });

    it("ignores duration when uploaded file is not audio", async () => {
      mockReq.file = {
        mimetype: "application/pdf",
        originalname: "spec.pdf",
        path: "https://res.cloudinary.com/demo/raw/upload/spec.pdf",
        size: 2048,
      };
      mockReq.body = {
        attachmentDuration: "60",
      };

      const createdMessage = {
        id: 102,
        conversationId: 10,
        senderId: "user-123",
        content: "",
        attachmentUrl: "https://res.cloudinary.com/demo/raw/upload/spec.pdf",
        attachmentName: "spec.pdf",
        attachmentMime: "application/pdf",
        attachmentDuration: null,
        createdAt: new Date(),
        sender: { id: "user-123", name: "Alice", role: "CLIENT" },
      };

      (db.message.create as jest.Mock).mockResolvedValue(createdMessage);

      await sendMessageController(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(db.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            attachmentDuration: null,
          }),
        }),
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            attachmentDuration: null,
          }),
        }),
      );
    });

    it("ignores duration when no file is uploaded (text message)", async () => {
      mockReq.body = {
        content: "Hello world",
        attachmentDuration: "30",
      };

      const createdMessage = {
        id: 103,
        conversationId: 10,
        senderId: "user-123",
        content: "Hello world",
        attachmentUrl: null,
        attachmentName: null,
        attachmentMime: null,
        attachmentDuration: null,
        createdAt: new Date(),
        sender: { id: "user-123", name: "Alice", role: "CLIENT" },
      };

      (db.message.create as jest.Mock).mockResolvedValue(createdMessage);

      await sendMessageController(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(db.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            attachmentDuration: 30,
          }),
        }),
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            attachmentDuration: null,
          }),
        }),
      );
    });
  });

  describe("sendMessage service", () => {
    beforeEach(() => {
      jest.clearAllMocks();

      (db.conversation.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        clientId: "u1",
        engineerId: "u2",
        projectId: null,
      });

      (db.ban.findUnique as jest.Mock).mockResolvedValue(null);
    });

    it("stores attachmentDuration when attachmentMime starts with audio/", async () => {
      const mockResult = {
        id: 1,
        conversationId: 1,
        senderId: "u1",
        content: "",
        attachmentUrl: "https://res.cloudinary.com/audio.mp3",
        attachmentName: "audio.mp3",
        attachmentMime: "audio/mpeg",
        attachmentDuration: 75,
        createdAt: new Date(),
        sender: { id: "u1", name: "User 1", role: "CLIENT" },
      };
      (db.message.create as jest.Mock).mockResolvedValue(mockResult);

      const res = await sendMessage(1, "u1", {
        content: "",
        attachmentUrl: "https://res.cloudinary.com/audio.mp3",
        attachmentName: "audio.mp3",
        attachmentMime: "audio/mpeg",
        attachmentDuration: 75,
      });

      expect(db.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            attachmentDuration: 75,
          }),
        }),
      );
      expect(res.attachmentDuration).toBe(75);
    });

    it("throws 400 when attachmentMime starts with audio/ but attachmentDuration is missing", async () => {
      await expect(
        sendMessage(1, "u1", {
          content: "",
          attachmentUrl: "https://res.cloudinary.com/audio.ogg",
          attachmentName: "audio.ogg",
          attachmentMime: "audio/ogg",
        }),
      ).rejects.toThrow(ApiError);
    });

    it("sets attachmentDuration to null when attachmentMime does not start with audio/", async () => {
      const mockResult = {
        id: 2,
        conversationId: 1,
        senderId: "u1",
        content: "",
        attachmentUrl: "https://res.cloudinary.com/doc.pdf",
        attachmentName: "doc.pdf",
        attachmentMime: "application/pdf",
        attachmentDuration: null,
        createdAt: new Date(),
        sender: { id: "u1", name: "User 1", role: "CLIENT" },
      };
      (db.message.create as jest.Mock).mockResolvedValue(mockResult);

      const res = await sendMessage(1, "u1", {
        content: "",
        attachmentUrl: "https://res.cloudinary.com/doc.pdf",
        attachmentName: "doc.pdf",
        attachmentMime: "application/pdf",
        attachmentDuration: 50,
      });

      expect(db.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            attachmentDuration: null,
          }),
        }),
      );
      expect(res.attachmentDuration).toBeNull();
    });

    it("keeps old messages valid with null attachmentDuration", async () => {
      const oldMessage = {
        id: 99,
        conversationId: 1,
        senderId: "u1",
        content: "Old message",
        attachmentUrl: null,
        attachmentName: null,
        attachmentMime: null,
        attachmentDuration: null,
        createdAt: new Date("2025-01-01"),
        sender: { id: "u1", name: "User 1", role: "CLIENT" },
      };
      (db.message.create as jest.Mock).mockResolvedValue(oldMessage);

      const res = await sendMessage(1, "u1", {
        content: "Old message",
      });

      expect(res.attachmentDuration).toBeNull();
    });
  });

  describe("formatLastMessagePreview", () => {
    it("returns message content if text is not empty", () => {
      expect(
        formatLastMessagePreview({
          content: "Hello there",
          attachmentUrl: null,
          attachmentName: null,
        }),
      ).toBe("Hello there");

      expect(
        formatLastMessagePreview({
          content: "Text with attachment",
          attachmentUrl: "https://example.com/audio.webm",
          attachmentName: "audio.webm",
          attachmentMime: "audio/webm",
          attachmentDuration: 30,
        }),
      ).toBe("Text with attachment");
    });

    it("returns '🎤 Voice message (m:ss)' when attachmentMime starts with audio/ and duration is available", () => {
      expect(
        formatLastMessagePreview({
          content: "",
          attachmentUrl: "https://example.com/audio.webm",
          attachmentName: "voice.webm",
          attachmentMime: "audio/webm",
          attachmentDuration: 45,
        }),
      ).toBe("🎤 Voice message (0:45)");

      expect(
        formatLastMessagePreview({
          content: "",
          attachmentUrl: "https://example.com/audio.mp3",
          attachmentName: "voice.mp3",
          attachmentMime: "audio/mpeg",
          attachmentDuration: 65,
        }),
      ).toBe("🎤 Voice message (1:05)");

      expect(
        formatLastMessagePreview({
          content: "",
          attachmentUrl: "https://example.com/audio.ogg",
          attachmentName: "voice.ogg",
          attachmentMime: "audio/ogg; codecs=opus",
          attachmentDuration: 120,
        }),
      ).toBe("🎤 Voice message (2:00)");

      expect(
        formatLastMessagePreview({
          content: "",
          attachmentUrl: "https://example.com/audio.m4a",
          attachmentName: "voice.m4a",
          attachmentMime: "audio/mp4",
          attachmentDuration: 5,
        }),
      ).toBe("🎤 Voice message (0:05)");

      expect(
        formatLastMessagePreview({
          content: "",
          attachmentUrl: "https://example.com/audio.webm",
          attachmentName: "voice.webm",
          attachmentMime: "audio/webm",
          attachmentDuration: 0,
        }),
      ).toBe("🎤 Voice message (0:00)");
    });

    it("returns '🎤 Voice message' when attachmentMime starts with audio/ and duration is null or undefined", () => {
      expect(
        formatLastMessagePreview({
          content: "",
          attachmentUrl: "https://example.com/audio.webm",
          attachmentName: "voice.webm",
          attachmentMime: "audio/webm",
          attachmentDuration: null,
        }),
      ).toBe("🎤 Voice message");

      expect(
        formatLastMessagePreview({
          content: "",
          attachmentUrl: "https://example.com/audio.webm",
          attachmentName: "voice.webm",
          attachmentMime: "audio/webm",
        }),
      ).toBe("🎤 Voice message");
    });

    it("returns '📎 filename' or '📎 Attachment' for non-audio attachments", () => {
      expect(
        formatLastMessagePreview({
          content: "",
          attachmentUrl: "https://example.com/doc.pdf",
          attachmentName: "blueprint.pdf",
          attachmentMime: "application/pdf",
          attachmentDuration: 10,
        }),
      ).toBe("📎 blueprint.pdf");

      expect(
        formatLastMessagePreview({
          content: "",
          attachmentUrl: "https://example.com/photo.png",
          attachmentName: null,
          attachmentMime: "image/png",
        }),
      ).toBe("📎 Attachment");
    });

    it("returns null when message has no text and no attachment", () => {
      expect(
        formatLastMessagePreview({
          content: "",
          attachmentUrl: null,
          attachmentName: null,
        }),
      ).toBeNull();
    });
  });

  describe("admin getConversationMessages", () => {
    it("includes attachmentDuration in the returned messages for admin viewer", async () => {
      (db.conversation.findUnique as jest.Mock).mockResolvedValue({
        id: 10,
        projectId: "proj-1",
        clientId: "u1",
        engineerId: "u2",
      });

      const mockMessages = [
        {
          id: 1,
          conversationId: 10,
          senderId: "u1",
          content: "",
          attachmentUrl: "https://res.cloudinary.com/audio.webm",
          attachmentName: "voice.webm",
          attachmentMime: "audio/webm",
          attachmentDuration: 45,
          createdAt: new Date(),
          sender: { id: "u1", name: "Client", role: "CLIENT" },
        },
        {
          id: 2,
          conversationId: 10,
          senderId: "u2",
          content: "Hello",
          attachmentUrl: null,
          attachmentName: null,
          attachmentMime: null,
          attachmentDuration: null,
          createdAt: new Date(),
          sender: { id: "u2", name: "Engineer", role: "ENGINEER" },
        },
      ];

      (db.message.findMany as jest.Mock).mockResolvedValue(mockMessages);
      (db.message.count as jest.Mock).mockResolvedValue(2);

      const result = await getConversationMessages(10, 1, 50);

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].attachmentDuration).toBe(45);
      expect(result.messages[1].attachmentDuration).toBeNull();
    });
  });
});
