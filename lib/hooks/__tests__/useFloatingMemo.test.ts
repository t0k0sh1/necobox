import { renderHook, act, waitFor } from "@testing-library/react";
import { useFloatingMemo } from "../useFloatingMemo";

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

describe("useFloatingMemo", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() =>
      useFloatingMemo({ storageKey: "test-memo" })
    );

    expect(result.current.content).toBe("");
    expect(result.current.position).toEqual({ x: -1, y: -1 });
    expect(result.current.size).toEqual({ width: 320, height: 240 });
  });

  it("loads stored content from localStorage", () => {
    const storedData = JSON.stringify({
      content: "Stored content",
      position: { x: 100, y: 200 },
      size: { width: 400, height: 300 },
    });
    localStorageMock.getItem.mockReturnValue(storedData);

    const { result } = renderHook(() =>
      useFloatingMemo({ storageKey: "test-memo" })
    );

    expect(result.current.content).toBe("Stored content");
    expect(result.current.position).toEqual({ x: 100, y: 200 });
    expect(result.current.size).toEqual({ width: 400, height: 300 });
  });

  it("updates content", () => {
    const { result } = renderHook(() =>
      useFloatingMemo({ storageKey: "test-memo" })
    );

    act(() => {
      result.current.setContent("New content");
    });

    expect(result.current.content).toBe("New content");
  });

  it("updates position", () => {
    const { result } = renderHook(() =>
      useFloatingMemo({ storageKey: "test-memo" })
    );

    act(() => {
      result.current.updatePosition({ x: 150, y: 250 });
    });

    expect(result.current.position).toEqual({ x: 150, y: 250 });
  });

  it("updates size", () => {
    const { result } = renderHook(() =>
      useFloatingMemo({ storageKey: "test-memo" })
    );

    act(() => {
      result.current.updateSize({ width: 500, height: 400 });
    });

    expect(result.current.size).toEqual({ width: 500, height: 400 });
  });

  it("clears content", () => {
    const { result } = renderHook(() =>
      useFloatingMemo({ storageKey: "test-memo" })
    );

    act(() => {
      result.current.setContent("Some content");
    });

    expect(result.current.content).toBe("Some content");

    act(() => {
      result.current.clear();
    });

    expect(result.current.content).toBe("");
  });

  it("saves to localStorage with debounce", async () => {
    const { result } = renderHook(() =>
      useFloatingMemo({ storageKey: "test-memo" })
    );

    act(() => {
      result.current.setContent("Test content");
    });

    // デバウンス時間前
    expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
      "test-memo",
      expect.stringContaining("Test content")
    );

    // デバウンス時間（300ms）を待つ
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "test-memo",
        expect.stringContaining("Test content")
      );
    });
  });

  it("saves position and size to localStorage", async () => {
    const { result } = renderHook(() =>
      useFloatingMemo({ storageKey: "test-memo" })
    );

    act(() => {
      result.current.updatePosition({ x: 100, y: 200 });
      result.current.updateSize({ width: 400, height: 300 });
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const savedData = JSON.parse(
        localStorageMock.setItem.mock.calls[
          localStorageMock.setItem.mock.calls.length - 1
        ][1]
      );
      expect(savedData.position).toEqual({ x: 100, y: 200 });
      expect(savedData.size).toEqual({ width: 400, height: 300 });
    });
  });

  it("uses custom default position", () => {
    const { result } = renderHook(() =>
      useFloatingMemo({
        storageKey: "test-memo",
        defaultPosition: { x: 50, y: 50 },
      })
    );

    expect(result.current.position).toEqual({ x: 50, y: 50 });
  });

  it("uses custom default size", () => {
    const { result } = renderHook(() =>
      useFloatingMemo({
        storageKey: "test-memo",
        defaultSize: { width: 400, height: 300 },
      })
    );

    expect(result.current.size).toEqual({ width: 400, height: 300 });
  });

  it("handles invalid JSON in localStorage gracefully", () => {
    localStorageMock.getItem.mockReturnValue("invalid json");

    const { result } = renderHook(() =>
      useFloatingMemo({ storageKey: "test-memo" })
    );

    // デフォルト値が使用される
    expect(result.current.content).toBe("");
    expect(result.current.position).toEqual({ x: -1, y: -1 });
    expect(result.current.size).toEqual({ width: 320, height: 240 });
  });

  it("handles partially valid stored data", () => {
    const storedData = JSON.stringify({
      content: "Stored content",
      // position と size が欠落
    });
    localStorageMock.getItem.mockReturnValue(storedData);

    const { result } = renderHook(() =>
      useFloatingMemo({ storageKey: "test-memo" })
    );

    expect(result.current.content).toBe("Stored content");
    // デフォルト値が使用される
    expect(result.current.position).toEqual({ x: -1, y: -1 });
    expect(result.current.size).toEqual({ width: 320, height: 240 });
  });

  it("ignores stored position with negative values", () => {
    const storedData = JSON.stringify({
      content: "Stored content",
      position: { x: -10, y: -20 },
      size: { width: 400, height: 300 },
    });
    localStorageMock.getItem.mockReturnValue(storedData);

    const { result } = renderHook(() =>
      useFloatingMemo({ storageKey: "test-memo" })
    );

    // 負の値は無視されてデフォルト値が使用される
    expect(result.current.position).toEqual({ x: -1, y: -1 });
  });

  it("sets isInitialized to true after loading", () => {
    const { result } = renderHook(() =>
      useFloatingMemo({ storageKey: "test-memo" })
    );

    expect(result.current.isInitialized).toBe(true);
  });
});
