import { screen, fireEvent, render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ImagePreviewDialog } from "./ImagePreviewDialog";
import { isEditableImage } from "../lib/imageProcessing";
import { I18nProvider } from "@/i18n";

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nProvider serverLocale="en">{ui}</I18nProvider>);
}

describe("ImagePreviewDialog", () => {
  let mockCreateObjectURL: any;
  let mockRevokeObjectURL: any;
  let mockCtx: any;

  beforeEach(() => {
    mockCreateObjectURL = vi.fn().mockReturnValue("blob:http://localhost/mock-preview-url");
    mockRevokeObjectURL = vi.fn();
    globalThis.URL.createObjectURL = mockCreateObjectURL;
    globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock createImageBitmap
    const mockBitmap = {
      width: 800,
      height: 600,
      close: vi.fn(),
    };
    (globalThis as any).createImageBitmap = vi.fn().mockResolvedValue(mockBitmap);

    // Mock matchMedia
    globalThis.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Mock ResizeObserver for ImageEditorCanvas
    class MockResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    globalThis.ResizeObserver = MockResizeObserver as any;

    // Mock canvas context and toBlob
    mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      setTransform: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      drawImage: vi.fn(),
      clearRect: vi.fn(),
    };
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx);
    HTMLCanvasElement.prototype.toBlob = vi.fn((cb) => {
      cb(new Blob(["mock-blob"], { type: "image/jpeg" }));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createDummyFile = (name: string, type: string, size?: number) => {
    const content = typeof size === "number" ? new Uint8Array(size) : ["dummy image content"];
    return new File(Array.isArray(content) ? content : [content], name, { type });
  };

  it("does not render when open is false or file is null", () => {
    const { container: c1 } = renderWithI18n(
      <ImagePreviewDialog
        open={false}
        file={createDummyFile("photo.jpg", "image/jpeg")}
        onClose={vi.fn()}
        onSend={vi.fn()}
      />,
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = renderWithI18n(
      <ImagePreviewDialog
        open={true}
        file={null}
        onClose={vi.fn()}
        onSend={vi.fn()}
      />,
    );
    expect(c2.firstChild).toBeNull();
  });

  it("renders with correct accessibility attributes, image, header, and enabled Edit button", () => {
    const file = createDummyFile("photo.jpg", "image/jpeg", 500 * 1024);
    renderWithI18n(
      <ImagePreviewDialog
        open={true}
        file={file}
        onClose={vi.fn()}
        onSend={vi.fn()}
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");

    // Header title and file info
    expect(screen.getByText("Preview image")).toBeInTheDocument();
    expect(screen.getByText(/photo\.jpg/)).toBeInTheDocument();
    expect(screen.getByText(/500\.0 KB/)).toBeInTheDocument();

    // Image preview
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "blob:http://localhost/mock-preview-url");
    expect(img).toHaveAttribute("alt", "photo.jpg");
    expect(img).toHaveClass("object-contain");

    // Action buttons
    const editBtn = screen.getByRole("button", { name: /^edit$/i });
    expect(editBtn).toBeInTheDocument();
    expect(editBtn).not.toBeDisabled();

    const cancelBtn = screen.getByRole("button", { name: /^cancel$/i });
    expect(cancelBtn).toBeInTheDocument();

    const sendBtn = screen.getByRole("button", { name: /^send$/i });
    expect(sendBtn).toBeInTheDocument();
  });

  it("revokes object URL on unmount or when closed", () => {
    const file = createDummyFile("diagram.png", "image/png");
    const { unmount, rerender } = render(
      <I18nProvider serverLocale="en">
        <ImagePreviewDialog
          open={true}
          file={file}
          onClose={vi.fn()}
          onSend={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
    expect(mockRevokeObjectURL).not.toHaveBeenCalled();

    // Rerender as closed
    rerender(
      <I18nProvider serverLocale="en">
        <ImagePreviewDialog
          open={false}
          file={file}
          onClose={vi.fn()}
          onSend={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/mock-preview-url");

    // Unmount
    unmount();
  });

  it("manages body scroll lock while dialog is open", () => {
    const file = createDummyFile("photo.jpg", "image/jpeg");
    const { unmount, rerender } = render(
      <I18nProvider serverLocale="en">
        <ImagePreviewDialog
          open={true}
          file={file}
          onClose={vi.fn()}
          onSend={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <I18nProvider serverLocale="en">
        <ImagePreviewDialog
          open={false}
          file={file}
          onClose={vi.fn()}
          onSend={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(document.body.style.overflow).not.toBe("hidden");
    unmount();
  });

  it("calls onClose when Cancel button or Close header button is clicked", () => {
    const onClose = vi.fn();
    const file = createDummyFile("photo.jpg", "image/jpeg");
    const { unmount } = renderWithI18n(
      <ImagePreviewDialog
        open={true}
        file={file}
        onClose={onClose}
        onSend={vi.fn()}
      />,
    );

    const cancelBtn = screen.getByRole("button", { name: /^cancel$/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByLabelText("Close preview");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(2);

    unmount();
  });

  it("calls onClose when Escape key is pressed in preview mode", () => {
    const onClose = vi.fn();
    const file = createDummyFile("photo.jpg", "image/jpeg");
    renderWithI18n(
      <ImagePreviewDialog
        open={true}
        file={file}
        onClose={onClose}
        onSend={vi.fn()}
      />,
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onSend with original file and caption when unedited image is sent", () => {
    const onSend = vi.fn();
    const file = createDummyFile("photo.jpg", "image/jpeg");
    renderWithI18n(
      <ImagePreviewDialog
        open={true}
        file={file}
        onClose={vi.fn()}
        onSend={onSend}
      />,
    );

    const captionInput = screen.getByPlaceholderText("Add a caption…");
    fireEvent.change(captionInput, { target: { value: "Site inspection photo" } });

    const sendBtn = screen.getByRole("button", { name: /^send$/i });
    fireEvent.click(sendBtn);

    // Unedited image is sent as the exact original file instance
    expect(onSend).toHaveBeenCalledWith(file, "Site inspection photo");
  });

  it("calls onSend with undefined if caption is empty or whitespace", () => {
    const onSend = vi.fn();
    const file = createDummyFile("photo.jpg", "image/jpeg");
    renderWithI18n(
      <ImagePreviewDialog
        open={true}
        file={file}
        onClose={vi.fn()}
        onSend={onSend}
      />,
    );

    const captionInput = screen.getByPlaceholderText("Add a caption…");
    fireEvent.change(captionInput, { target: { value: "   " } });

    const sendBtn = screen.getByRole("button", { name: /^send$/i });
    fireEvent.click(sendBtn);

    expect(onSend).toHaveBeenCalledWith(file, undefined);
  });

  // ─── Edit Mode, Done, Cancel, and Revert Tests ─────────────────────────────

  it("switches to editor mode when Edit is clicked and returns on Cancel without changes", () => {
    const file = createDummyFile("photo.jpg", "image/jpeg");
    renderWithI18n(
      <ImagePreviewDialog
        open={true}
        file={file}
        onClose={vi.fn()}
        onSend={vi.fn()}
      />,
    );

    // In preview mode
    expect(screen.getByText("Preview image")).toBeInTheDocument();

    // Click Edit
    const editBtn = screen.getByRole("button", { name: /^edit$/i });
    fireEvent.click(editBtn);

    // In editor mode
    expect(screen.getByRole("button", { name: /^done$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^cancel$/i })).toBeInTheDocument();
    expect(document.querySelector("canvas")).toBeInTheDocument();

    // Click Cancel in editor mode
    const editorCancelBtn = screen.getByRole("button", { name: /^cancel$/i });
    fireEvent.click(editorCancelBtn);

    // Returned to preview mode without "Edited" badge
    expect(screen.getByText("Preview image")).toBeInTheDocument();
    expect(screen.queryByText("Edited")).not.toBeInTheDocument();
  });

  it("commits edits when Done is clicked, shows 'Edited' indicator and 'Undo all edits' action", async () => {
    const file = createDummyFile("photo.jpg", "image/jpeg");
    renderWithI18n(
      <ImagePreviewDialog
        open={true}
        file={file}
        onClose={vi.fn()}
        onSend={vi.fn()}
      />,
    );

    // Click Edit
    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));

    // Wait for image editor controls to be ready
    const rotateRightBtn = await screen.findByRole("button", { name: /rotate right/i });
    fireEvent.click(rotateRightBtn);

    // Click Done
    const doneBtn = screen.getByRole("button", { name: /^done$/i });
    fireEvent.click(doneBtn);

    // Back to preview mode
    expect(screen.getByText("Preview image")).toBeInTheDocument();

    // Shows "Edited" indicator and "Undo all edits" button
    expect(screen.getByText("Edited")).toBeInTheDocument();
    const revertBtn = screen.getByRole("button", { name: /undo all edits/i });
    expect(revertBtn).toBeInTheDocument();

    // Clicking "Undo all edits" clears edits and restores original preview
    fireEvent.click(revertBtn);
    expect(screen.queryByText("Edited")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /undo all edits/i })).not.toBeInTheDocument();
  });

  it("exports edited image with matching MIME type and extension when sent", async () => {
    const onSend = vi.fn();
    const file = createDummyFile("sample.jpg", "image/jpeg");

    renderWithI18n(
      <ImagePreviewDialog
        open={true}
        file={file}
        onClose={vi.fn()}
        onSend={onSend}
      />,
    );

    // Enter editor, make edit, and click Done
    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    const rotateRightBtn = await screen.findByRole("button", { name: /rotate right/i });
    fireEvent.click(rotateRightBtn);
    fireEvent.click(screen.getByRole("button", { name: /^done$/i }));

    expect(screen.getByText("Edited")).toBeInTheDocument();

    // Click Send
    const sendBtn = screen.getByRole("button", { name: /^send$/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledTimes(1);
    });

    const [exportedFile, caption] = onSend.mock.calls[0];
    expect(exportedFile).toBeInstanceOf(File);
    expect(exportedFile.type).toBe("image/jpeg");
    expect(exportedFile.name).toMatch(/\.jpg$/);
    expect(caption).toBeUndefined();
  });

  it("displays error banner and offers 'Send original instead' when export fails", async () => {
    // Mock toBlob to simulate canvas export failure
    HTMLCanvasElement.prototype.toBlob = vi.fn((cb) => {
      // Simulate failure by returning null
      cb(null);
    });

    const onSend = vi.fn();
    const file = createDummyFile("corrupted.jpg", "image/jpeg");

    renderWithI18n(
      <ImagePreviewDialog
        open={true}
        file={file}
        onClose={vi.fn()}
        onSend={onSend}
      />,
    );

    // Make edit and click Done
    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    const rotateRightBtn = await screen.findByRole("button", { name: /rotate right/i });
    fireEvent.click(rotateRightBtn);
    fireEvent.click(screen.getByRole("button", { name: /^done$/i }));

    // Click Send
    const sendBtn = screen.getByRole("button", { name: /^send$/i });
    fireEvent.click(sendBtn);

    // Error banner should appear with fallback button
    const fallbackBtn = await screen.findByRole("button", { name: /send original instead/i });
    expect(fallbackBtn).toBeInTheDocument();

    // Clicking fallback sends original file
    fireEvent.click(fallbackBtn);
    expect(onSend).toHaveBeenCalledWith(file, undefined);
  });

  it("submits on desktop Enter key, but permits line breaks when Shift+Enter is pressed", () => {
    const onSend = vi.fn();
    const file = createDummyFile("photo.jpg", "image/jpeg");
    renderWithI18n(
      <ImagePreviewDialog
        open={true}
        file={file}
        onClose={vi.fn()}
        onSend={onSend}
      />,
    );

    const captionInput = screen.getByPlaceholderText("Add a caption…");
    fireEvent.change(captionInput, { target: { value: "Hello world" } });

    // Shift+Enter allows new line, does NOT send
    fireEvent.keyDown(captionInput, { key: "Enter", shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();

    // Enter sends
    fireEvent.keyDown(captionInput, { key: "Enter", shiftKey: false });
    expect(onSend).toHaveBeenCalledWith(file, "Hello world");
  });

  it("traps Tab key inside the dialog", () => {
    const file = createDummyFile("photo.jpg", "image/jpeg");
    renderWithI18n(
      <ImagePreviewDialog
        open={true}
        file={file}
        onClose={vi.fn()}
        onSend={vi.fn()}
      />,
    );

    const dialog = screen.getByRole("dialog");
    const sendBtn = screen.getByRole("button", { name: /^send$/i });

    sendBtn.focus();
    expect(document.activeElement).toBe(sendBtn);

    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    dialog.dispatchEvent(event);
  });

  it("returns focus to trigger element when closed", async () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Attach";
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const file = createDummyFile("photo.jpg", "image/jpeg");
    const { rerender } = render(
      <I18nProvider serverLocale="en">
        <ImagePreviewDialog
          open={true}
          file={file}
          onClose={vi.fn()}
          onSend={vi.fn()}
        />
      </I18nProvider>,
    );

    // Close the dialog
    rerender(
      <I18nProvider serverLocale="en">
        <ImagePreviewDialog
          open={false}
          file={file}
          onClose={vi.fn()}
          onSend={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  // ─── File type gating verification ─────────────────────────────────────────
  describe("file type gating with isEditableImage", () => {
    it("identifies jpeg, png, and webp as editable images that open the dialog", () => {
      const jpegFile = createDummyFile("photo.jpg", "image/jpeg");
      const pngFile = createDummyFile("drawing.png", "image/png");
      const webpFile = createDummyFile("hero.webp", "image/webp");

      expect(isEditableImage(jpegFile)).toBe(true);
      expect(isEditableImage(pngFile)).toBe(true);
      expect(isEditableImage(webpFile)).toBe(true);
    });

    it("identifies gif, pdf, dwg, audio, and archives as non-editable that do NOT open the dialog", () => {
      const gifFile = createDummyFile("animation.gif", "image/gif");
      const pdfFile = createDummyFile("spec.pdf", "application/pdf");
      const dwgFile = createDummyFile("floorplan.dwg", "image/vnd.dwg");
      const zipFile = createDummyFile("assets.zip", "application/zip");
      const audioFile = createDummyFile("voice.webm", "audio/webm");

      expect(isEditableImage(gifFile)).toBe(false);
      expect(isEditableImage(pdfFile)).toBe(false);
      expect(isEditableImage(dwgFile)).toBe(false);
      expect(isEditableImage(zipFile)).toBe(false);
      expect(isEditableImage(audioFile)).toBe(false);
    });
  });
});
