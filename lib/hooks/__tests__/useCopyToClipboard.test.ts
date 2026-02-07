import { renderHook, act } from "@testing-library/react";
import { useCopyToClipboard } from "../useCopyToClipboard";

describe("useCopyToClipboard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (navigator.clipboard.writeText as jest.Mock).mockClear();
    (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("初期状態では copiedId が null", () => {
    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current.copiedId).toBeNull();
  });

  it("copy を呼ぶとクリップボードに書き込み、copiedId が更新される", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("test text", "item-1");
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test text");
    expect(result.current.copiedId).toBe("item-1");
    expect(result.current.isCopied("item-1")).toBe(true);
    expect(result.current.isCopied("item-2")).toBe(false);
  });

  it("timeout 後に copiedId がリセットされる", async () => {
    const { result } = renderHook(() => useCopyToClipboard(1000));

    await act(async () => {
      await result.current.copy("test", "item-1");
    });

    expect(result.current.copiedId).toBe("item-1");

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.copiedId).toBeNull();
    expect(result.current.isCopied("item-1")).toBe(false);
  });

  it("連続コピーで前のタイマーがクリアされる", async () => {
    const { result } = renderHook(() => useCopyToClipboard(2000));

    await act(async () => {
      await result.current.copy("text1", "item-1");
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.copiedId).toBe("item-1");

    await act(async () => {
      await result.current.copy("text2", "item-2");
    });

    expect(result.current.copiedId).toBe("item-2");

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    // item-2 のタイマーはまだ残っている（2000ms経過していない）
    expect(result.current.copiedId).toBe("item-2");

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.copiedId).toBeNull();
  });

  it("クリップボードAPIがエラーの場合、copiedId は更新されない", async () => {
    (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(
      new Error("Clipboard error")
    );
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("test", "item-1");
    });

    expect(result.current.copiedId).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("デフォルトの timeout は 2000ms", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("test", "item-1");
    });

    act(() => {
      jest.advanceTimersByTime(1999);
    });

    expect(result.current.copiedId).toBe("item-1");

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current.copiedId).toBeNull();
  });
});
