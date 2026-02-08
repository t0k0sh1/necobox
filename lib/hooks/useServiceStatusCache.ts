import { useCallback, useEffect, useRef, useState } from "react";
import { ServiceStatusInfo } from "@/lib/utils/service-status";

const STORAGE_KEY = "necobox-service-status-cache";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30分

type ServiceStatusCache = Record<
  string,
  {
    data: ServiceStatusInfo;
    cachedAt: number;
  }
>;

interface UseServiceStatusCacheReturn {
  statuses: ServiceStatusInfo[];
  loading: boolean;
  refreshing: boolean;
  handleRefreshAll: () => Promise<void>;
  handleRefreshService: (serviceId: string) => Promise<void>;
}

function loadCache(): ServiceStatusCache | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as ServiceStatusCache;
  } catch {
    return null;
  }
}

function isCacheValid(cache: ServiceStatusCache): boolean {
  const entries = Object.values(cache);
  if (entries.length === 0) return false;
  const now = Date.now();
  return entries.every(
    (entry) => typeof entry.cachedAt === "number" && now - entry.cachedAt < CACHE_TTL_MS
  );
}

function saveToCache(statuses: ServiceStatusInfo[]): void {
  try {
    const now = Date.now();
    const cache: ServiceStatusCache = {};
    for (const status of statuses) {
      cache[status.id] = { data: status, cachedAt: now };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // ストレージエラーは無視
  }
}

function saveSingleToCache(status: ServiceStatusInfo): void {
  try {
    const existing = loadCache() ?? {};
    existing[status.id] = { data: status, cachedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // ストレージエラーは無視
  }
}

/**
 * サービスステータスを localStorage にキャッシュするフック。
 * 前回取得から30分以内はキャッシュから返し、APIリクエストを削減する。
 */
export function useServiceStatusCache(): UseServiceStatusCacheReturn {
  const [statuses, setStatuses] = useState<ServiceStatusInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const initializedRef = useRef(false);

  const fetchAllFromApi = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/service-status");
      if (!response.ok) {
        throw new Error("Failed to fetch service statuses");
      }
      const data = await response.json();
      const fetched: ServiceStatusInfo[] = data.statuses || [];
      setStatuses(fetched);
      saveToCache(fetched);
    } catch (error) {
      console.error("Error fetching service statuses:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 初回マウント時: キャッシュを確認し、有効ならAPIをスキップ
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const cache = loadCache();
    if (cache && isCacheValid(cache)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 初回マウント時のキャッシュ復元
      setStatuses(Object.values(cache).map((entry) => entry.data));
      setLoading(false);
    } else {
      fetchAllFromApi();
    }
  }, [fetchAllFromApi]);

  const handleRefreshAll = useCallback(async () => {
    setRefreshing(true);
    await fetchAllFromApi();
  }, [fetchAllFromApi]);

  const handleRefreshService = useCallback(
    async (serviceId: string) => {
      try {
        const response = await fetch(`/api/v1/service-status/${serviceId}`);
        if (!response.ok) {
          throw new Error("Failed to refresh service status");
        }
        const data = await response.json();
        if (data.status) {
          setStatuses((prev) =>
            prev.map((s) => (s.id === serviceId ? data.status : s))
          );
          saveSingleToCache(data.status);
        }
      } catch (error) {
        console.error(`Error refreshing service ${serviceId}:`, error);
      }
    },
    []
  );

  return { statuses, loading, refreshing, handleRefreshAll, handleRefreshService };
}
