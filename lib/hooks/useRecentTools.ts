import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "necobox-recent-tools";
const MAX_RECENT = 6;

/**
 * 使用履歴を localStorage で管理するフック
 */
export function useRecentTools() {
  const [recentToolIds, setRecentToolIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializedRef = useRef(false);

  // クライアントサイドでのみ初期化
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        /* eslint-disable react-hooks/set-state-in-effect */
        if (Array.isArray(parsed)) {
          setRecentToolIds(parsed.slice(0, MAX_RECENT));
        }
      }
    } catch {
      // パースエラーは無視
    }
    setIsInitialized(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // 状態変更時に localStorage に保存
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentToolIds));
    } catch {
      // ストレージエラーは無視
    }
  }, [recentToolIds, isInitialized]);

  const recordUsage = useCallback((toolId: string) => {
    setRecentToolIds((prev) => {
      const filtered = prev.filter((id) => id !== toolId);
      return [toolId, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);

  return { recentToolIds, recordUsage, isInitialized };
}
