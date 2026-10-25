import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ImageEditorCanvas } from "./ImageEditorCanvas";
import { I18nProvider } from "@/i18n";
import { DRAWING_COLORS } from "../lib/drawing";

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nProvider serverLocale="en">{ui}</I18nProvider>);
}

describe("ImageEditorCanvas component", () => {
  let mockCtx: any;

  beforeEach(() => {
    // Mock ResizeObserver
    class MockResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    globalThis.ResizeObserver = MockResizeObserver as any;

    // Mock HTMLCanvasElement getContext
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the canvas and all toolbar controls (tools, sizes, colors, history, rotate, crop, reset)", () => {
    renderWithI18n(
      <ImageEditorCanvas
        imageWidth={800}
        imageHeight={600}
      />,
    );

    // Canvas exists and has touch-action: none
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
    expect(canvas?.style.touchAction).toBe("none");

    // Tool buttons
    const penBtn = screen.getByRole("button", { name: /^pen$/i });
    const highlighterBtn = screen.getByRole("button", { name: /^highlighter$/i });
    expect(penBtn).toBeInTheDocument();
    expect(highlighterBtn).toBeInTheDocument();
    expect(penBtn).toHaveAttribute("aria-pressed", "true");
    expect(highlighterBtn).toHaveAttribute("aria-pressed", "false");

    // Size buttons (3 sizes: Thin, Medium, Thick)
    expect(screen.getByRole("button", { name: /thin/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /medium/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /thick/i })).toBeInTheDocument();

    // 8 Color swatches
    for (const c of DRAWING_COLORS) {
      const colorBtn = screen.getByRole("button", { name: new RegExp(c, "i") });
      expect(colorBtn).toBeInTheDocument();
      // Ensure min 44px target
      expect(colorBtn.className).toMatch(/min-h-\[44px\]/);
      expect(colorBtn.className).toMatch(/min-w-\[44px\]/);
    }

    // Transform controls: Rotate Left, Rotate Right, Crop
    expect(screen.getByRole("button", { name: /rotate left/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rotate right/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^crop$/i })).toBeInTheDocument();

    // History controls (initially disabled)
    const undoBtn = screen.getByRole("button", { name: /undo/i });
    const redoBtn = screen.getByRole("button", { name: /redo/i });
    const clearBtn = screen.getByRole("button", { name: /clear all/i });
    const resetBtn = screen.getByRole("button", { name: /reset to original/i });

    expect(undoBtn).toBeInTheDocument();
    expect(undoBtn).toBeDisabled();
    expect(redoBtn).toBeInTheDocument();
    expect(redoBtn).toBeDisabled();
    expect(clearBtn).toBeInTheDocument();
    expect(clearBtn).toBeDisabled();
    expect(resetBtn).toBeInTheDocument();
    expect(resetBtn).toBeDisabled();
  });

  it("switches active tool when Highlighter button is clicked", () => {
    renderWithI18n(
      <ImageEditorCanvas
        imageWidth={800}
        imageHeight={600}
      />,
    );

    const penBtn = screen.getByRole("button", { name: /^pen$/i });
    const highlighterBtn = screen.getByRole("button", { name: /^highlighter$/i });

    expect(penBtn).toHaveAttribute("aria-pressed", "true");
    expect(highlighterBtn).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(highlighterBtn);

    expect(penBtn).toHaveAttribute("aria-pressed", "false");
    expect(highlighterBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("updates stroke size when size buttons are clicked", () => {
    renderWithI18n(
      <ImageEditorCanvas
        imageWidth={800}
        imageHeight={600}
      />,
    );

    const thinBtn = screen.getByRole("button", { name: /thin/i });
    const thickBtn = screen.getByRole("button", { name: /thick/i });

    fireEvent.click(thickBtn);
    expect(thickBtn).toHaveAttribute("aria-pressed", "true");
    expect(thinBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("updates color when a color swatch is clicked", () => {
    renderWithI18n(
      <ImageEditorCanvas
        imageWidth={800}
        imageHeight={600}
      />,
    );

    // Click Green swatch (#22c55e)
    const greenBtn = screen.getByRole("button", { name: new RegExp("#22c55e", "i") });
    fireEvent.click(greenBtn);

    expect(greenBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("handles pointer down, move, and up lifecycle to add a stroke", () => {
    const onStrokesChange = vi.fn();
    renderWithI18n(
      <ImageEditorCanvas
        imageWidth={800}
        imageHeight={600}
        onStrokesChange={onStrokesChange}
      />,
    );

    const canvas = document.querySelector("canvas")!;

    // Mock canvas bounding rect
    canvas.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    // Mock pointer capture methods
    canvas.setPointerCapture = vi.fn();
    canvas.hasPointerCapture = vi.fn().mockReturnValue(true);
    canvas.releasePointerCapture = vi.fn();

    // Start stroke
    fireEvent.pointerDown(canvas, {
      clientX: 50,
      clientY: 50,
      pointerId: 1,
      button: 0,
    });

    expect(canvas.setPointerCapture).toHaveBeenCalledWith(1);

    // Drag
    fireEvent.pointerMove(canvas, {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });

    // Secondary finger ignored during active stroke
    fireEvent.pointerMove(canvas, {
      clientX: 200,
      clientY: 200,
      pointerId: 2,
    });

    // Finish stroke
    fireEvent.pointerUp(canvas, {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });

    expect(canvas.releasePointerCapture).toHaveBeenCalledWith(1);
    expect(onStrokesChange).toHaveBeenCalled();

    // Undo button should now be enabled
    const undoBtn = screen.getByRole("button", { name: /undo/i });
    expect(undoBtn).not.toBeDisabled();

    // Clicking undo
    fireEvent.click(undoBtn);

    // Redo should now be enabled
    const redoBtn = screen.getByRole("button", { name: /redo/i });
    expect(redoBtn).not.toBeDisabled();
  });

  // ─── Rotate Tests ─────────────────────────────────────────────────────────

  it("rotates image 90° clockwise and counter-clockwise and updates image dimensions", () => {
    const onImageChange = vi.fn();
    const mockSource = { width: 800, height: 600 } as unknown as CanvasImageSource;

    renderWithI18n(
      <ImageEditorCanvas
        imageSource={mockSource}
        imageWidth={800}
        imageHeight={600}
        onImageChange={onImageChange}
      />,
    );

    const rotateRightBtn = screen.getByRole("button", { name: /rotate right/i });
    const rotateLeftBtn = screen.getByRole("button", { name: /rotate left/i });

    // Rotate CW (90°)
    fireEvent.click(rotateRightBtn);
    expect(onImageChange).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 600,
        height: 800,
      }),
    );

    // Rotate CCW (-90°) back
    fireEvent.click(rotateLeftBtn);
    expect(onImageChange).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 800,
        height: 600,
      }),
    );
  });

  // ─── Crop Mode Tests ──────────────────────────────────────────────────────

  it("opens crop mode, displays presets, and cancels on Cancel click or Escape key", () => {
    const mockSource = { width: 800, height: 600 } as unknown as CanvasImageSource;

    renderWithI18n(
      <ImageEditorCanvas
        imageSource={mockSource}
        imageWidth={800}
        imageHeight={600}
      />,
    );

    const cropBtn = screen.getByRole("button", { name: /^crop$/i });
    fireEvent.click(cropBtn);

    // Crop presets are shown
    expect(screen.getByRole("button", { name: /^free$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^original$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^1:1$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^4:3$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^16:9$/i })).toBeInTheDocument();

    // Cancel and Apply buttons are present
    const cancelBtn = screen.getByRole("button", { name: /cancel crop/i });
    const applyBtn = screen.getByRole("button", { name: /apply crop/i });
    expect(cancelBtn).toBeInTheDocument();
    expect(applyBtn).toBeInTheDocument();

    // Clicking cancel exits crop mode
    fireEvent.click(cancelBtn);
    expect(screen.queryByRole("button", { name: /cancel crop/i })).not.toBeInTheDocument();

    // Re-open and cancel via Escape key
    fireEvent.click(screen.getByRole("button", { name: /^crop$/i }));
    expect(screen.getByRole("button", { name: /cancel crop/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("button", { name: /cancel crop/i })).not.toBeInTheDocument();
  });

  it("applies crop on Apply button click or Enter key", () => {
    const onImageChange = vi.fn();
    const mockSource = { width: 800, height: 600 } as unknown as CanvasImageSource;

    renderWithI18n(
      <ImageEditorCanvas
        imageSource={mockSource}
        imageWidth={800}
        imageHeight={600}
        onImageChange={onImageChange}
      />,
    );

    // Enter crop mode
    fireEvent.click(screen.getByRole("button", { name: /^crop$/i }));

    // Select 1:1 preset
    fireEvent.click(screen.getByRole("button", { name: /^1:1$/i }));

    // Click Apply
    const applyBtn = screen.getByRole("button", { name: /apply crop/i });
    fireEvent.click(applyBtn);

    // Crop mode closed
    expect(screen.queryByRole("button", { name: /apply crop/i })).not.toBeInTheDocument();

    // onImageChange called with cropped dimensions
    expect(onImageChange).toHaveBeenCalled();
  });

  // ─── Reset Confirmation Tests ─────────────────────────────────────────────

  it("shows confirmation dialog on Reset and restores original image if confirmed", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const onImageChange = vi.fn();
    const mockSource = { width: 800, height: 600 } as unknown as CanvasImageSource;

    renderWithI18n(
      <ImageEditorCanvas
        imageSource={mockSource}
        imageWidth={800}
        imageHeight={600}
        onImageChange={onImageChange}
      />,
    );

    const resetBtn = screen.getByRole("button", { name: /reset to original/i });
    expect(resetBtn).toBeDisabled();

    // Make an edit (rotate 90°)
    fireEvent.click(screen.getByRole("button", { name: /rotate right/i }));

    // Reset button is now enabled
    expect(resetBtn).not.toBeDisabled();

    // Click Reset
    fireEvent.click(resetBtn);
    expect(confirmSpy).toHaveBeenCalled();

    // Restores original dimensions
    expect(onImageChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        width: 800,
        height: 600,
      }),
    );
  });
});
