import { renderHook, act } from "@testing-library/react";
import { useToolPins } from "../useToolPins";

// localStorage モック
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

describe("useToolPins", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
  });

  it("初期値は空配列", () => {
    const { result } = renderHook(() => useToolPins());
    expect(result.current.pinnedToolIds).toEqual([]);
    expect(result.current.isInitialized).toBe(true);
  });

  it("localStorage から復元する", () => {
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify(["random", "jwt-decoder"])
    );

    const { result } = renderHook(() => useToolPins());
    expect(result.current.pinnedToolIds).toEqual(["random", "jwt-decoder"]);
  });

  it("togglePin でピン留め追加", () => {
    const { result } = renderHook(() => useToolPins());

    act(() => {
      result.current.togglePin("random");
    });

    expect(result.current.pinnedToolIds).toEqual(["random"]);
    expect(result.current.isPinned("random")).toBe(true);
  });

  it("togglePin でピン留め解除", () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(["random"]));

    const { result } = renderHook(() => useToolPins());

    act(() => {
      result.current.togglePin("random");
    });

    expect(result.current.pinnedToolIds).toEqual([]);
    expect(result.current.isPinned("random")).toBe(false);
  });

  it("isPinned が正しく判定する", () => {
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify(["random", "jwt-decoder"])
    );

    const { result } = renderHook(() => useToolPins());

    expect(result.current.isPinned("random")).toBe(true);
    expect(result.current.isPinned("jwt-decoder")).toBe(true);
    expect(result.current.isPinned("csv-editor")).toBe(false);
  });

  it("localStorage に保存される", () => {
    const { result } = renderHook(() => useToolPins());

    act(() => {
      result.current.togglePin("random");
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "necobox-pinned-tools",
      JSON.stringify(["random"])
    );
  });

  it("不正な JSON を graceful に処理する", () => {
    localStorageMock.getItem.mockReturnValue("invalid json");

    const { result } = renderHook(() => useToolPins());
    expect(result.current.pinnedToolIds).toEqual([]);
  });

  it("配列でないデータを無視する", () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({ key: "value" }));

    const { result } = renderHook(() => useToolPins());
    expect(result.current.pinnedToolIds).toEqual([]);
  });
});
