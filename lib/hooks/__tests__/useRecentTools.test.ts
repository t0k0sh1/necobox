import { renderHook, act } from "@testing-library/react";
import { useRecentTools } from "../useRecentTools";

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

describe("useRecentTools", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
  });

  it("初期値は空配列", () => {
    const { result } = renderHook(() => useRecentTools());
    expect(result.current.recentToolIds).toEqual([]);
    expect(result.current.isInitialized).toBe(true);
  });

  it("localStorage から復元する", () => {
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify(["random", "jwt-decoder"])
    );

    const { result } = renderHook(() => useRecentTools());
    expect(result.current.recentToolIds).toEqual(["random", "jwt-decoder"]);
  });

  it("recordUsage で先頭に追加する", () => {
    const { result } = renderHook(() => useRecentTools());

    act(() => {
      result.current.recordUsage("random");
    });

    expect(result.current.recentToolIds).toEqual(["random"]);

    act(() => {
      result.current.recordUsage("jwt-decoder");
    });

    expect(result.current.recentToolIds).toEqual(["jwt-decoder", "random"]);
  });

  it("重複を排除して先頭に移動する", () => {
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify(["jwt-decoder", "random", "csv-editor"])
    );

    const { result } = renderHook(() => useRecentTools());

    act(() => {
      result.current.recordUsage("random");
    });

    expect(result.current.recentToolIds).toEqual([
      "random",
      "jwt-decoder",
      "csv-editor",
    ]);
  });

  it("最大6件に制限する", () => {
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify(["a", "b", "c", "d", "e", "f"])
    );

    const { result } = renderHook(() => useRecentTools());

    act(() => {
      result.current.recordUsage("g");
    });

    expect(result.current.recentToolIds).toHaveLength(6);
    expect(result.current.recentToolIds[0]).toBe("g");
    expect(result.current.recentToolIds).not.toContain("f");
  });

  it("localStorage に保存される", () => {
    const { result } = renderHook(() => useRecentTools());

    act(() => {
      result.current.recordUsage("random");
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "necobox-recent-tools",
      JSON.stringify(["random"])
    );
  });

  it("不正な JSON を graceful に処理する", () => {
    localStorageMock.getItem.mockReturnValue("invalid json");

    const { result } = renderHook(() => useRecentTools());
    expect(result.current.recentToolIds).toEqual([]);
  });

  it("配列でないデータを無視する", () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({ key: "value" }));

    const { result } = renderHook(() => useRecentTools());
    expect(result.current.recentToolIds).toEqual([]);
  });

  it("localStorage の件数が6件を超えていた場合に切り詰める", () => {
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify(["a", "b", "c", "d", "e", "f", "g", "h"])
    );

    const { result } = renderHook(() => useRecentTools());
    expect(result.current.recentToolIds).toHaveLength(6);
  });
});
