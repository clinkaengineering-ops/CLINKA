import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import type { ChatMessage } from "../types";

describe("VoiceMessagePlayer", () => {
  const mockMessage: ChatMessage = {
    id: 99,
    conversationId: 5,
    senderId: "u-1",
    content: "",
    attachmentUrl: "/uploads/documents/sample-voice.webm",
    attachmentName: "voice-message-12345.webm",
    attachmentMime: "audio/webm",
    attachmentDuration: 45,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(function (this: HTMLMediaElement) {
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
    });
    window.HTMLMediaElement.prototype.pause = vi.fn().mockImplementation(function (this: HTMLMediaElement) {
      this.dispatchEvent(new Event("pause"));
    });
  });

  it("renders voice player with play button, time display, and 1x speed badge", () => {
    render(<VoiceMessagePlayer message={mockMessage} side="me" />);

    expect(screen.getByTestId("voice-message-player")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play voice message" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Seek voice message" })).toBeInTheDocument();
    expect(screen.getByText("0:45")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Playback speed 1x" })).toBeInTheDocument();
  });

  it("toggles play and pause on click", async () => {
    const { container } = render(<VoiceMessagePlayer message={mockMessage} side="them" />);
    const playBtn = screen.getByRole("button", { name: "Play voice message" });
    const audio = container.querySelector("audio") as HTMLAudioElement;

    await act(async () => {
      fireEvent.click(playBtn);
    });

    expect(audio.play).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Pause voice message" })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Pause voice message" }));
    });

    expect(audio.pause).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play voice message" })).toBeInTheDocument();
  });

  it("cycles playback speed through 1x -> 1.5x -> 2x -> 1x", () => {
    const { container } = render(<VoiceMessagePlayer message={mockMessage} side="me" />);
    const audio = container.querySelector("audio") as HTMLAudioElement;
    const speedBtn = screen.getByRole("button", { name: "Playback speed 1x" });

    // 1x -> 1.5x
    fireEvent.click(speedBtn);
    expect(audio.playbackRate).toBe(1.5);
    expect(screen.getByRole("button", { name: "Playback speed 1.5x" })).toBeInTheDocument();

    // 1.5x -> 2x
    fireEvent.click(screen.getByRole("button", { name: "Playback speed 1.5x" }));
    expect(audio.playbackRate).toBe(2);
    expect(screen.getByRole("button", { name: "Playback speed 2x" })).toBeInTheDocument();

    // 2x -> 1x
    fireEvent.click(screen.getByRole("button", { name: "Playback speed 2x" }));
    expect(audio.playbackRate).toBe(1);
    expect(screen.getByRole("button", { name: "Playback speed 1x" })).toBeInTheDocument();
  });

  it("allows seeking by changing the range input", () => {
    const { container } = render(<VoiceMessagePlayer message={mockMessage} side="me" />);
    const slider = screen.getByRole("slider", { name: "Seek voice message" }) as HTMLInputElement;
    const audio = container.querySelector("audio") as HTMLAudioElement;

    fireEvent.change(slider, { target: { value: "20" } });
    expect(audio.currentTime).toBe(20);
    expect(slider.value).toBe("20");
  });

  it("pauses active player when another voice note starts playing", async () => {
    const msg2: ChatMessage = {
      ...mockMessage,
      id: 100,
      attachmentUrl: "/uploads/documents/sample-voice-2.webm",
    };

    const { container: c1 } = render(<VoiceMessagePlayer message={mockMessage} side="me" />);
    const { container: c2 } = render(<VoiceMessagePlayer message={msg2} side="them" />);

    const buttons = screen.getAllByRole("button", { name: "Play voice message" });
    const audio1 = c1.querySelector("audio") as HTMLAudioElement;
    const audio2 = c2.querySelector("audio") as HTMLAudioElement;

    // Start player 1
    await act(async () => {
      fireEvent.click(buttons[0]);
    });
    expect(audio1.play).toHaveBeenCalled();

    // Start player 2
    await act(async () => {
      fireEvent.click(buttons[1]);
    });
    expect(audio2.play).toHaveBeenCalled();

    // Player 1 must have been paused
    expect(audio1.pause).toHaveBeenCalled();
  });
});
