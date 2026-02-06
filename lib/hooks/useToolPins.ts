import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "necobox-pinned-tools";

/**
 * ピン留め状態を localStorage で管理するフック
 */
export function useToolPins() {
  const [pinnedToolIds, setPinnedToolIds] = useState<string[]>([]);
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
          setPinnedToolIds(parsed);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedToolIds));
    } catch {
      // ストレージエラーは無視
    }
  }, [pinnedToolIds, isInitialized]);

  const isPinned = useCallback(
    (toolId: string) => pinnedToolIds.includes(toolId),
    [pinnedToolIds]
  );

  const togglePin = useCallback((toolId: string) => {
    setPinnedToolIds((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId]
    );
  }, []);

  return { pinnedToolIds, isPinned, togglePin, isInitialized };
}
