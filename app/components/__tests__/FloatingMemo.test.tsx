import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { FloatingMemo } from "../FloatingMemo";

// Mock clipboard API
const mockWriteText = jest.fn();
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
});

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, "confirm", {
  value: mockConfirm,
  writable: true,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

const defaultTranslations = {
  title: "Memo",
  placeholder: "Enter notes...",
  clear: "Clear",
  clearConfirm: "Clear the memo?",
  copy: "Copy",
  copied: "Copied",
};

describe("FloatingMemo", () => {
  beforeEach(() => {
    mockWriteText.mockClear();
    mockWriteText.mockResolvedValue(undefined);
    mockConfirm.mockClear();
    mockConfirm.mockReturnValue(true);
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders nothing when isOpen is false", () => {
    render(
      <FloatingMemo
        storageKey="test-memo"
        isOpen={false}
        onClose={jest.fn()}
        translations={defaultTranslations}
      />
    );

    expect(screen.queryByText("Memo")).not.toBeInTheDocument();
  });

  it("renders the memo box when isOpen is true", () => {
    render(
      <FloatingMemo
        storageKey="test-memo"
        isOpen={true}
        onClose={jest.fn()}
        translations={defaultTranslations}
      />
    );

    expect(screen.getByText("Memo")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter notes...")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = jest.fn();
    render(
      <FloatingMemo
        storageKey="test-memo"
        isOpen={true}
        onClose={onClose}
        translations={defaultTranslations}
      />
    );

    // 閉じるボタンは最後のボタン（X アイコン）
    const buttons = screen.getAllByRole("button");
    const closeButton = buttons[buttons.length - 1];
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("allows text input in the textarea", () => {
    render(
      <FloatingMemo
        storageKey="test-memo"
        isOpen={true}
        onClose={jest.fn()}
        translations={defaultTranslations}
      />
    );

    const textarea = screen.getByPlaceholderText("Enter notes...");
    fireEvent.change(textarea, { target: { value: "Test memo content" } });

    expect(textarea).toHaveValue("Test memo content");
  });

  it("copies text to clipboard when copy button is clicked", async () => {
    render(
      <FloatingMemo
        storageKey="test-memo"
        isOpen={true}
        onClose={jest.fn()}
        translations={defaultTranslations}
      />
    );

    const textarea = screen.getByPlaceholderText("Enter notes...");
    fireEvent.change(textarea, { target: { value: "Test memo content" } });

    // コピーボタンは最初のボタン
    const copyButton = screen.getAllByRole("button")[0];

    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(mockWriteText).toHaveBeenCalledWith("Test memo content");
  });

  it("shows check icon after copying", async () => {
    render(
      <FloatingMemo
        storageKey="test-memo"
        isOpen={true}
        onClose={jest.fn()}
        translations={defaultTranslations}
      />
    );

    const textarea = screen.getByPlaceholderText("Enter notes...");
    fireEvent.change(textarea, { target: { value: "Test memo content" } });

    const copyButton = screen.getAllByRole("button")[0];

    await act(async () => {
      fireEvent.click(copyButton);
    });

    await waitFor(() => {
      expect(copyButton).toHaveAttribute("title", "Copied");
    });
  });

  it("reverts copy button state after 2 seconds", async () => {
    render(
      <FloatingMemo
        storageKey="test-memo"
        isOpen={true}
        onClose={jest.fn()}
        translations={defaultTranslations}
      />
    );

    const textarea = screen.getByPlaceholderText("Enter notes...");
    fireEvent.change(textarea, { target: { value: "Test memo content" } });

    const copyButton = screen.getAllByRole("button")[0];

    await act(async () => {
      fireEvent.click(copyButton);
    });

    await waitFor(() => {
      expect(copyButton).toHaveAttribute("title", "Copied");
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(copyButton).toHaveAttribute("title", "Copy");
    });
  });

  it("disables copy button when textarea is empty", () => {
    render(
      <FloatingMemo
        storageKey="test-memo"
        isOpen={true}
        onClose={jest.fn()}
        translations={defaultTranslations}
      />
    );

    const copyButton = screen.getAllByRole("button")[0];
    expect(copyButton).toBeDisabled();
  });

  it("clears content when clear button is clicked and confirmed", () => {
    render(
      <FloatingMemo
        storageKey="test-memo"
        isOpen={true}
        onClose={jest.fn()}
        translations={defaultTranslations}
      />
    );

    const textarea = screen.getByPlaceholderText("Enter notes...");
    fireEvent.change(textarea, { target: { value: "Test memo content" } });

    // クリアボタンは2番目のボタン
    const clearButton = screen.getAllByRole("button")[1];
    fireEvent.click(clearButton);

    expect(mockConfirm).toHaveBeenCalledWith("Clear the memo?");
    expect(textarea).toHaveValue("");
  });

  it("does not clear content when clear is cancelled", () => {
    mockConfirm.mockReturnValue(false);

    render(
      <FloatingMemo
        storageKey="test-memo"
        isOpen={true}
        onClose={jest.fn()}
        translations={defaultTranslations}
      />
    );

    const textarea = screen.getByPlaceholderText("Enter notes...");
    fireEvent.change(textarea, { target: { value: "Test memo content" } });

    const clearButton = screen.getAllByRole("button")[1];
    fireEvent.click(clearButton);

    expect(mockConfirm).toHaveBeenCalledWith("Clear the memo?");
    expect(textarea).toHaveValue("Test memo content");
  });

  it("saves content to localStorage with debounce", async () => {
    render(
      <FloatingMemo
        storageKey="test-memo"
        isOpen={true}
        onClose={jest.fn()}
        translations={defaultTranslations}
      />
    );

    const textarea = screen.getByPlaceholderText("Enter notes...");
    fireEvent.change(textarea, { target: { value: "Test memo content" } });

    // デバウンス時間（300ms）を待つ
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "test-memo",
        expect.stringContaining("Test memo content")
      );
    });
  });

  it("loads content from localStorage on mount", () => {
    const storedData = JSON.stringify({
      content: "Stored memo content",
      position: { x: 100, y: 100 },
      size: { width: 320, height: 240 },
    });
    localStorageMock.getItem.mockReturnValue(storedData);

    render(
      <FloatingMemo
        storageKey="test-memo"
        isOpen={true}
        onClose={jest.fn()}
        translations={defaultTranslations}
      />
    );

    const textarea = screen.getByPlaceholderText("Enter notes...");
    expect(textarea).toHaveValue("Stored memo content");
  });

  it("handles drag on header", () => {
    render(
      <FloatingMemo
        storageKey="test-memo"
        isOpen={true}
        onClose={jest.fn()}
        translations={defaultTranslations}
      />
    );

    const header = screen.getByText("Memo").parentElement!.parentElement!;

    // ドラッグ開始
    fireEvent.mouseDown(header, { clientX: 100, clientY: 100 });

    // ドラッグ中
    fireEvent.mouseMove(document, { clientX: 200, clientY: 200 });

    // ドラッグ終了
    fireEvent.mouseUp(document);

    // ドラッグ後、localStorage に位置が保存されることを確認
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("handles resize from corner", () => {
    render(
      <FloatingMemo
        storageKey="test-memo"
        isOpen={true}
        onClose={jest.fn()}
        translations={defaultTranslations}
      />
    );

    // リサイズハンドル（SVG を含む div）を取得
    const memoBox = screen.getByText("Memo").closest(".fixed");
    const resizeHandle = memoBox?.querySelector(".cursor-se-resize");

    expect(resizeHandle).toBeInTheDocument();

    // リサイズ開始
    fireEvent.mouseDown(resizeHandle!, { clientX: 320, clientY: 240 });

    // リサイズ中
    fireEvent.mouseMove(document, { clientX: 400, clientY: 300 });

    // リサイズ終了
    fireEvent.mouseUp(document);

    // リサイズ後、localStorage にサイズが保存されることを確認
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("respects minimum size constraints during resize", () => {
    render(
      <FloatingMemo
        storageKey="test-memo"
        isOpen={true}
        onClose={jest.fn()}
        translations={defaultTranslations}
      />
    );

    const memoBox = screen.getByText("Memo").closest(".fixed") as HTMLElement;
    const resizeHandle = memoBox?.querySelector(".cursor-se-resize");

    // リサイズ開始
    fireEvent.mouseDown(resizeHandle!, { clientX: 320, clientY: 240 });

    // 非常に小さいサイズにリサイズしようとする
    fireEvent.mouseMove(document, { clientX: 50, clientY: 50 });

    // リサイズ終了
    fireEvent.mouseUp(document);

    // 最小サイズ（200x150）より小さくならないことを確認
    const style = memoBox.style;
    const width = parseInt(style.width);
    const height = parseInt(style.height);

    expect(width).toBeGreaterThanOrEqual(200);
    expect(height).toBeGreaterThanOrEqual(150);
  });

  it("respects maximum size constraints during resize", () => {
    render(
      <FloatingMemo
        storageKey="test-memo"
        isOpen={true}
        onClose={jest.fn()}
        translations={defaultTranslations}
      />
    );

    const memoBox = screen.getByText("Memo").closest(".fixed") as HTMLElement;
    const resizeHandle = memoBox?.querySelector(".cursor-se-resize");

    // リサイズ開始
    fireEvent.mouseDown(resizeHandle!, { clientX: 320, clientY: 240 });

    // 非常に大きいサイズにリサイズしようとする
    fireEvent.mouseMove(document, { clientX: 1000, clientY: 1000 });

    // リサイズ終了
    fireEvent.mouseUp(document);

    // 最大サイズ（600x500）より大きくならないことを確認
    const style = memoBox.style;
    const width = parseInt(style.width);
    const height = parseInt(style.height);

    expect(width).toBeLessThanOrEqual(600);
    expect(height).toBeLessThanOrEqual(500);
  });

  it("handles clipboard error gracefully", async () => {
    mockWriteText.mockRejectedValue(new Error("Clipboard error"));

    render(
      <FloatingMemo
        storageKey="test-memo"
        isOpen={true}
        onClose={jest.fn()}
        translations={defaultTranslations}
      />
    );

    const textarea = screen.getByPlaceholderText("Enter notes...");
    fireEvent.change(textarea, { target: { value: "Test memo content" } });

    const copyButton = screen.getAllByRole("button")[0];

    // エラーが発生してもクラッシュしないことを確認
    await act(async () => {
      fireEvent.click(copyButton);
    });

    // コピーボタンの状態が変わらないことを確認
    expect(copyButton).toHaveAttribute("title", "Copy");
  });

  it("handles invalid localStorage data gracefully", () => {
    localStorageMock.getItem.mockReturnValue("invalid json");

    // エラーが発生してもクラッシュしないことを確認
    render(
      <FloatingMemo
        storageKey="test-memo"
        isOpen={true}
        onClose={jest.fn()}
        translations={defaultTranslations}
      />
    );

    expect(screen.getByText("Memo")).toBeInTheDocument();
  });
});
