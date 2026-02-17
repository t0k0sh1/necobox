import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "necobox-pinned-tools";

/**
 * ピン留め状態を localStorage で管理するフック
 */
export function useToolPins() {
  const [pinnedToolIds, setPinnedToolIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializedRef = useRef(false);

  // クライアントサイドでのみ localStorage から初期値を復元する。
  // SSR では localStorage にアクセスできないため、マウント後の effect で setState する必要がある。
  // initializedRef で二重実行を防止しており、初回マウント時のみ実行される。
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- 初回マウント時の localStorage 復元
          setPinnedToolIds(parsed);
        }
      }
    } catch {
      // パースエラーは無視
    }
    setIsInitialized(true);
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

  const reorderPins = useCallback((fromIndex: number, toIndex: number) => {
    setPinnedToolIds((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length) return prev;
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      if (fromIndex === toIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  return { pinnedToolIds, isPinned, togglePin, reorderPins, isInitialized };
}
