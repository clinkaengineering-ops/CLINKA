import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendMessageWithAttachment } from "./messages.api";
import api from "@/lib/axios";

vi.mock("@/lib/axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

describe("sendMessageWithAttachment API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("appends attachmentDuration to FormData only when a finite integer 1..300 is provided", async () => {
    (api.post as any).mockResolvedValue({
      data: {
        success: true,
        data: { id: 1, content: "" },
      },
    });

    const file = new File(["audio dummy"], "voice.webm", { type: "audio/webm" });
    await sendMessageWithAttachment(42, file, "caption", 75);

    expect(api.post).toHaveBeenCalledTimes(1);
    const [url, formData] = (api.post as any).mock.calls[0];
    expect(url).toBe("/messages/conversations/42");
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("attachmentDuration")).toBe("75");
    expect(formData.get("content")).toBe("caption");
    expect(formData.get("file")).toBe(file);
  });

  it("does not extract duration from filename and ignores undefined duration", async () => {
    (api.post as any).mockResolvedValue({
      data: {
        success: true,
        data: { id: 2, content: "" },
      },
    });

    const fileWithDurInName = new File(["audio bytes"], "recording-dur120.webm", {
      type: "audio/webm",
    });
    await sendMessageWithAttachment(42, fileWithDurInName);

    const [, formData] = (api.post as any).mock.calls[0];
    expect(formData.get("attachmentDuration")).toBeNull();
  });

  it("omits attachmentDuration if out of 1..300 range or not finite", async () => {
    (api.post as any).mockResolvedValue({
      data: {
        success: true,
        data: { id: 3, content: "" },
      },
    });

    const file = new File(["audio bytes"], "voice.webm", { type: "audio/webm" });

    // Out of range: 0
    await sendMessageWithAttachment(42, file, undefined, 0);
    expect((api.post as any).mock.calls[0][1].get("attachmentDuration")).toBeNull();

    // Out of range: 301
    await sendMessageWithAttachment(42, file, undefined, 301);
    expect((api.post as any).mock.calls[1][1].get("attachmentDuration")).toBeNull();

    // Infinity
    await sendMessageWithAttachment(42, file, undefined, Infinity);
    expect((api.post as any).mock.calls[2][1].get("attachmentDuration")).toBeNull();

    // NaN
    await sendMessageWithAttachment(42, file, undefined, NaN);
    expect((api.post as any).mock.calls[3][1].get("attachmentDuration")).toBeNull();
  });
});
