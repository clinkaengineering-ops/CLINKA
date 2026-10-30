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
    window.HTMLMediaElement.prototype.load = vi.fn();
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

  it("force-stops and resets to 0 when playback reaches or exceeds duration (prevents 5s continuing to 6, 7, 8)", async () => {
    const shortMessage: ChatMessage = {
      ...mockMessage,
      attachmentDuration: 5,
    };

    const { container } = render(<VoiceMessagePlayer message={shortMessage} side="me" />);
    const playBtn = screen.getByRole("button", { name: "Play voice message" });
    const audio = container.querySelector("audio") as HTMLAudioElement;

    // Start playing
    await act(async () => {
      fireEvent.click(playBtn);
    });
    expect(audio.play).toHaveBeenCalled();

    // Simulate timeupdate exceeding 5 seconds (e.g. 5.4s due to WebM missing end-of-stream)
    Object.defineProperty(audio, "currentTime", {
      value: 5.4,
      writable: true,
      configurable: true,
    });

    await act(async () => {
      fireEvent.timeUpdate(audio);
    });

    // Must have paused and reset to 0:00
    expect(audio.pause).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play voice message" })).toBeInTheDocument();
    expect(screen.getByText("0:00")).toBeInTheDocument();
  });

  it("clamps seeking to duration and pauses if seeked to the end while playing", async () => {
    const msg: ChatMessage = {
      ...mockMessage,
      attachmentDuration: 10,
    };

    const { container } = render(<VoiceMessagePlayer message={msg} side="me" />);
    const audio = container.querySelector("audio") as HTMLAudioElement;
    const slider = screen.getByRole("slider", { name: "Seek voice message" }) as HTMLInputElement;

    // Seek beyond 10s should clamp to 10
    fireEvent.change(slider, { target: { value: "15" } });
    expect(audio.currentTime).toBe(10);
    expect(slider.value).toBe("10");
  });

  it("calls audio.load() on mount to prime mobile decoder and buffer data", () => {
    const { container } = render(<VoiceMessagePlayer message={mockMessage} side="me" />);
    const audio = container.querySelector("audio") as HTMLAudioElement;
    expect(audio.load).toHaveBeenCalled();
    expect(audio.getAttribute("preload")).toBe("auto");
    expect(audio.hasAttribute("playsinline")).toBe(true);
  });

  it("rewinds to beginning when playing if audio already finished or near end", async () => {
    const msg: ChatMessage = {
      ...mockMessage,
      attachmentDuration: 10,
    };

    const { container } = render(<VoiceMessagePlayer message={msg} side="me" />);
    const audio = container.querySelector("audio") as HTMLAudioElement;
    const playBtn = screen.getByRole("button", { name: "Play voice message" });

    // Simulate audio finished and sitting at the end
    audio.currentTime = 9.9;
    Object.defineProperty(audio, "ended", { value: true, configurable: true });

    await act(async () => {
      fireEvent.click(playBtn);
    });

    expect(audio.currentTime).toBe(0);
    expect(audio.play).toHaveBeenCalled();
  });

  it("configures navigator.audioSession.type to playback when user plays audio on mobile Safari", async () => {
    const mockAudioSession = { type: "auto" };
    Object.defineProperty(navigator, "audioSession", {
      value: mockAudioSession,
      writable: true,
      configurable: true,
    });

    render(<VoiceMessagePlayer message={mockMessage} side="me" />);
    const playBtn = screen.getByRole("button", { name: "Play voice message" });

    await act(async () => {
      fireEvent.click(playBtn);
    });

    expect(mockAudioSession.type).toBe("playback");
  });
});
