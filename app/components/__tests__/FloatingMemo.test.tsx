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
  close: "Close",
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

  // キーボードアクセシビリティのテスト
  describe("keyboard accessibility", () => {
    it("all buttons have title and aria-label attributes", () => {
      render(
        <FloatingMemo
          storageKey="test-memo"
          isOpen={true}
          onClose={jest.fn()}
          translations={defaultTranslations}
        />
      );

      // コピーボタン
      const copyButton = screen.getByTitle("Copy");
      expect(copyButton).toHaveAttribute("aria-label", "Copy");

      // クリアボタン
      const clearButton = screen.getByTitle("Clear");
      expect(clearButton).toHaveAttribute("aria-label", "Clear");

      // 閉じるボタン
      const closeButton = screen.getByTitle("Close");
      expect(closeButton).toHaveAttribute("aria-label", "Close");
    });

    it("has proper ARIA attributes", () => {
      render(
        <FloatingMemo
          storageKey="test-memo"
          isOpen={true}
          onClose={jest.fn()}
          translations={defaultTranslations}
        />
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-labelledby", "floating-memo-title");

      const header = screen.getByRole("group", { name: /drag to move memo/i });
      expect(header).toBeInTheDocument();
      expect(header).toHaveAttribute("tabindex", "0");
      expect(header).toHaveAttribute("aria-roledescription", "draggable region");

      const resizeHandle = screen.getByRole("group", { name: /resize memo/i });
      expect(resizeHandle).toBeInTheDocument();
      expect(resizeHandle).toHaveAttribute("tabindex", "0");
      expect(resizeHandle).toHaveAttribute("aria-roledescription", "resize handle");
    });

    it("moves memo with arrow keys", () => {
      const storedData = JSON.stringify({
        content: "",
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

      const header = screen.getByRole("group", { name: /drag to move memo/i });

      // 上矢印キーで上に移動
      fireEvent.keyDown(header, { key: "ArrowUp" });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // localStorage に保存されることを確認
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it("moves memo down with ArrowDown key", () => {
      const storedData = JSON.stringify({
        content: "",
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

      const header = screen.getByRole("group", { name: /drag to move memo/i });

      fireEvent.keyDown(header, { key: "ArrowDown" });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it("moves memo left with ArrowLeft key", () => {
      const storedData = JSON.stringify({
        content: "",
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

      const header = screen.getByRole("group", { name: /drag to move memo/i });

      fireEvent.keyDown(header, { key: "ArrowLeft" });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it("moves memo right with ArrowRight key", () => {
      const storedData = JSON.stringify({
        content: "",
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

      const header = screen.getByRole("group", { name: /drag to move memo/i });

      fireEvent.keyDown(header, { key: "ArrowRight" });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it("resizes memo with Shift+arrow keys from header", () => {
      const storedData = JSON.stringify({
        content: "",
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

      const header = screen.getByRole("group", { name: /drag to move memo/i });

      // Shift+ArrowRight でリサイズ
      fireEvent.keyDown(header, { key: "ArrowRight", shiftKey: true });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it("resizes memo with Shift+arrow keys from resize handle", () => {
      const storedData = JSON.stringify({
        content: "",
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

      const resizeHandle = screen.getByRole("group", { name: /resize memo/i });

      // Shift+ArrowDown でリサイズ
      fireEvent.keyDown(resizeHandle, { key: "ArrowDown", shiftKey: true });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it("does not move when Shift is pressed (reserved for resize)", () => {
      const storedData = JSON.stringify({
        content: "",
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

      const header = screen.getByRole("group", { name: /drag to move memo/i });

      // 位置は変わらずサイズが変わることを確認
      fireEvent.keyDown(header, { key: "ArrowUp", shiftKey: true });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // localStorage に保存されたデータを確認
      const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
      if (lastCall) {
        const savedData = JSON.parse(lastCall[1]);
        // 位置は変わらず、サイズが変わる
        expect(savedData.position).toEqual({ x: 100, y: 100 });
        expect(savedData.size.height).toBeLessThan(240); // 高さが減る
      }
    });

    it("respects minimum size when resizing with keyboard", () => {
      const storedData = JSON.stringify({
        content: "",
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 }, // 最小サイズ
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

      const memoBox = screen.getByRole("dialog") as HTMLElement;
      const header = screen.getByRole("group", { name: /drag to move memo/i });

      // さらに小さくしようとする
      fireEvent.keyDown(header, { key: "ArrowUp", shiftKey: true });

      // 最小サイズを下回らないことを確認
      const style = memoBox.style;
      const height = parseInt(style.height);
      expect(height).toBeGreaterThanOrEqual(150);
    });

    it("respects maximum size when resizing with keyboard", () => {
      const storedData = JSON.stringify({
        content: "",
        position: { x: 100, y: 100 },
        size: { width: 600, height: 500 }, // 最大サイズ
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

      const memoBox = screen.getByRole("dialog") as HTMLElement;
      const header = screen.getByRole("group", { name: /drag to move memo/i });

      // さらに大きくしようとする
      fireEvent.keyDown(header, { key: "ArrowDown", shiftKey: true });

      // 最大サイズを超えないことを確認
      const style = memoBox.style;
      const height = parseInt(style.height);
      expect(height).toBeLessThanOrEqual(500);
    });

    it("ignores non-arrow keys", () => {
      const storedData = JSON.stringify({
        content: "",
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

      const header = screen.getByRole("group", { name: /drag to move memo/i });

      // 非矢印キーを押す
      fireEvent.keyDown(header, { key: "a" });
      fireEvent.keyDown(header, { key: "Enter" });
      fireEvent.keyDown(header, { key: "Space" });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // localStorage への保存が発生しないことを確認（初期化時のみ）
      const calls = localStorageMock.setItem.mock.calls.filter(
        (call: [string, string]) => call[0] === "test-memo"
      );
      // 初期化時の保存のみ
      expect(calls.length).toBeLessThanOrEqual(1);
    });
  });

  // ウィンドウリサイズ時の位置制約テスト
  describe("window resize constraints", () => {
    it("constrains position when window becomes smaller", () => {
      // メモを画面右端近くに配置
      const storedData = JSON.stringify({
        content: "",
        position: { x: 700, y: 500 },
        size: { width: 320, height: 240 },
      });
      localStorageMock.getItem.mockReturnValue(storedData);

      // 初期ウィンドウサイズを設定
      Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
      Object.defineProperty(window, "innerHeight", { value: 768, writable: true });

      render(
        <FloatingMemo
          storageKey="test-memo"
          isOpen={true}
          onClose={jest.fn()}
          translations={defaultTranslations}
        />
      );

      localStorageMock.setItem.mockClear();

      // ウィンドウを小さくする（メモがはみ出すサイズ）
      Object.defineProperty(window, "innerWidth", { value: 800, writable: true });
      Object.defineProperty(window, "innerHeight", { value: 600, writable: true });

      // リサイズイベントを発火
      act(() => {
        window.dispatchEvent(new Event("resize"));
      });

      // デバウンスを待つ
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // 位置が調整されて localStorage に保存されることを確認
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
      const savedData = JSON.parse(lastCall[1]);

      // x は 800 - 320 = 480 以下に制約される
      expect(savedData.position.x).toBeLessThanOrEqual(480);
      // y は 600 - 240 = 360 以下に制約される
      expect(savedData.position.y).toBeLessThanOrEqual(360);
    });

    it("does not adjust position when window is large enough", () => {
      const storedData = JSON.stringify({
        content: "",
        position: { x: 100, y: 100 },
        size: { width: 320, height: 240 },
      });
      localStorageMock.getItem.mockReturnValue(storedData);

      Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
      Object.defineProperty(window, "innerHeight", { value: 768, writable: true });

      render(
        <FloatingMemo
          storageKey="test-memo"
          isOpen={true}
          onClose={jest.fn()}
          translations={defaultTranslations}
        />
      );

      // 初期状態の保存を待つ
      act(() => {
        jest.advanceTimersByTime(300);
      });

      localStorageMock.setItem.mockClear();

      // ウィンドウサイズを変更するが、メモは範囲内
      // maxX = 900 - 320 = 580 > 100, maxY = 700 - 240 = 460 > 100
      Object.defineProperty(window, "innerWidth", { value: 900, writable: true });
      Object.defineProperty(window, "innerHeight", { value: 700, writable: true });

      act(() => {
        window.dispatchEvent(new Event("resize"));
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // 位置が変わらないので updatePosition は呼ばれず、localStorage への保存も発生しない
      // （または保存されても位置は同じ）
      if (localStorageMock.setItem.mock.calls.length > 0) {
        const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
        const savedData = JSON.parse(lastCall[1]);
        // 位置が変わっていないことを確認
        expect(savedData.position).toEqual({ x: 100, y: 100 });
      }
    });

    it("handles window smaller than memo size", () => {
      const storedData = JSON.stringify({
        content: "",
        position: { x: 100, y: 100 },
        size: { width: 320, height: 240 },
      });
      localStorageMock.getItem.mockReturnValue(storedData);

      Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
      Object.defineProperty(window, "innerHeight", { value: 768, writable: true });

      render(
        <FloatingMemo
          storageKey="test-memo"
          isOpen={true}
          onClose={jest.fn()}
          translations={defaultTranslations}
        />
      );

      localStorageMock.setItem.mockClear();

      // ウィンドウをメモより小さくする
      Object.defineProperty(window, "innerWidth", { value: 200, writable: true });
      Object.defineProperty(window, "innerHeight", { value: 150, writable: true });

      act(() => {
        window.dispatchEvent(new Event("resize"));
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
      const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
      const savedData = JSON.parse(lastCall[1]);

      // maxX = max(0, 200-320) = 0, maxY = max(0, 150-240) = 0
      expect(savedData.position.x).toBe(0);
      expect(savedData.position.y).toBe(0);
    });

    it("removes resize listener when component unmounts", () => {
      const storedData = JSON.stringify({
        content: "",
        position: { x: 100, y: 100 },
        size: { width: 320, height: 240 },
      });
      localStorageMock.getItem.mockReturnValue(storedData);

      Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
      Object.defineProperty(window, "innerHeight", { value: 768, writable: true });

      const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

      const { unmount } = render(
        <FloatingMemo
          storageKey="test-memo"
          isOpen={true}
          onClose={jest.fn()}
          translations={defaultTranslations}
        />
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });

    it("does not register resize listener when memo is closed", () => {
      const addEventListenerSpy = jest.spyOn(window, "addEventListener");

      render(
        <FloatingMemo
          storageKey="test-memo"
          isOpen={false}
          onClose={jest.fn()}
          translations={defaultTranslations}
        />
      );

      // resize イベントリスナーが登録されないことを確認
      const resizeCalls = addEventListenerSpy.mock.calls.filter(
        call => call[0] === "resize"
      );
      expect(resizeCalls.length).toBe(0);

      addEventListenerSpy.mockRestore();
    });
  });
});
