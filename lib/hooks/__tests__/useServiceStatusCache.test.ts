import { renderHook, act, waitFor } from "@testing-library/react";
import { useServiceStatusCache } from "../useServiceStatusCache";

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

// fetch モック
global.fetch = jest.fn();

const mockStatuses = [
  {
    id: "aws",
    name: "AWS",
    category: "cloud-vendor",
    status: "operational",
    url: "https://aws.amazon.com",
    statusUrl: "https://status.aws.amazon.com",
    lastChecked: "2025-01-01T00:00:00.000Z",
    responseTimeMs: 120,
  },
  {
    id: "github",
    name: "GitHub",
    category: "dev-tools",
    status: "operational",
    url: "https://github.com",
    statusUrl: "https://www.githubstatus.com",
    lastChecked: "2025-01-01T00:00:00.000Z",
    responseTimeMs: 85,
  },
];

function createValidCache(cachedAt?: number) {
  const ts = cachedAt ?? Date.now();
  const cache: Record<string, { data: (typeof mockStatuses)[number]; cachedAt: number }> = {};
  for (const s of mockStatuses) {
    cache[s.id] = { data: s, cachedAt: ts };
  }
  return JSON.stringify(cache);
}

describe("useServiceStatusCache", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    (global.fetch as jest.Mock).mockReset();
  });

  it("キャッシュなし → APIから取得", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockStatuses }),
    });

    const { result } = renderHook(() => useServiceStatusCache());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/v1/service-status");
    expect(result.current.statuses).toHaveLength(2);
    expect(result.current.statuses[0].id).toBe("aws");
  });

  it("有効なキャッシュ（30分以内）→ APIを叩かずキャッシュから復元", async () => {
    localStorageMock.getItem.mockReturnValue(createValidCache());

    const { result } = renderHook(() => useServiceStatusCache());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.statuses).toHaveLength(2);
    expect(result.current.statuses.map((s) => s.id)).toContain("aws");
    expect(result.current.statuses.map((s) => s.id)).toContain("github");
  });

  it("期限切れキャッシュ（30分超過）→ APIから再取得", async () => {
    const expiredTime = Date.now() - 31 * 60 * 1000;
    localStorageMock.getItem.mockReturnValue(createValidCache(expiredTime));

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockStatuses }),
    });

    const { result } = renderHook(() => useServiceStatusCache());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/v1/service-status");
  });

  it("handleRefreshAll → 全サービスAPI再取得＆キャッシュ全更新", async () => {
    localStorageMock.getItem.mockReturnValue(createValidCache());

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockStatuses }),
    });

    const { result } = renderHook(() => useServiceStatusCache());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // キャッシュから復元時はAPIを叩いていない
    expect(global.fetch).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleRefreshAll();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/v1/service-status");
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "necobox-service-status-cache",
      expect.any(String)
    );
  });

  it("handleRefreshService → 該当サービスのみAPI再取得＆キャッシュ更新", async () => {
    localStorageMock.getItem.mockReturnValue(createValidCache());

    const updatedAws = { ...mockStatuses[0], status: "degraded" };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: updatedAws }),
    });

    const { result } = renderHook(() => useServiceStatusCache());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleRefreshService("aws");
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/v1/service-status/aws");
    const aws = result.current.statuses.find((s) => s.id === "aws");
    expect(aws?.status).toBe("degraded");
  });

  it("不正JSON → graceful にフォールバック", async () => {
    localStorageMock.getItem.mockReturnValue("invalid json {{{");

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockStatuses }),
    });

    const { result } = renderHook(() => useServiceStatusCache());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // パースエラー時はAPIから取得
    expect(global.fetch).toHaveBeenCalledWith("/api/v1/service-status");
    expect(result.current.statuses).toHaveLength(2);
  });

  it("APIエラー時 → エラーハンドリング", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Internal Server Error" }),
    });

    const consoleError = jest.spyOn(console, "error").mockImplementation();

    const { result } = renderHook(() => useServiceStatusCache());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.statuses).toHaveLength(0);
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it("空のキャッシュオブジェクト → APIから取得", async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({}));

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockStatuses }),
    });

    const { result } = renderHook(() => useServiceStatusCache());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/v1/service-status");
  });

  it("配列がキャッシュに保存されている場合 → APIから取得", async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([]));

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ statuses: mockStatuses }),
    });

    const { result } = renderHook(() => useServiceStatusCache());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/v1/service-status");
  });

  it("refreshing 状態が正しく遷移する", async () => {
    localStorageMock.getItem.mockReturnValue(createValidCache());

    let resolvePromise: (value: unknown) => void;
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
    );

    const { result } = renderHook(() => useServiceStatusCache());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // refreshAll を開始
    let refreshPromise: Promise<void>;
    act(() => {
      refreshPromise = result.current.handleRefreshAll();
    });

    expect(result.current.refreshing).toBe(true);

    // レスポンスを解決
    await act(async () => {
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ statuses: mockStatuses }),
      });
      await refreshPromise!;
    });

    expect(result.current.refreshing).toBe(false);
  });
});
