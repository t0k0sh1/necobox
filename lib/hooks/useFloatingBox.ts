import { useCallback, useEffect, useRef, useState } from "react";

interface FloatingBoxStorage {
  position: { x: number; y: number };
  size: { width: number; height: number };
  collapsedCategories?: string[];
}

interface UseFloatingBoxOptions {
  storageKey: string;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
}

const DEFAULT_POSITION = { x: -1, y: -1 }; // -1 は初期化前を示す
const DEFAULT_SIZE = { width: 600, height: 380 };
const DEBOUNCE_MS = 300;

// ローカルストレージから初期値を取得
function getInitialState(
  storageKey: string,
  defaultPosition: { x: number; y: number },
  defaultSize: { width: number; height: number }
) {
  if (typeof window === "undefined") {
    return { position: defaultPosition, size: defaultSize, collapsedCategories: [] as string[] };
  }
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed: FloatingBoxStorage = JSON.parse(stored);
      return {
        position:
          parsed.position && parsed.position.x >= 0 && parsed.position.y >= 0
            ? parsed.position
            : defaultPosition,
        size: parsed.size || defaultSize,
        collapsedCategories: parsed.collapsedCategories || [],
      };
    }
  } catch {
    // パースエラーは無視
  }
  return { position: defaultPosition, size: defaultSize, collapsedCategories: [] as string[] };
}

export function useFloatingBox({
  storageKey,
  defaultPosition = DEFAULT_POSITION,
  defaultSize = DEFAULT_SIZE,
}: UseFloatingBoxOptions) {
  // プリミティブ値に分解して依存配列の安定性を確保
  const defaultX = defaultPosition.x;
  const defaultY = defaultPosition.y;
  const defaultWidth = defaultSize.width;
  const defaultHeight = defaultSize.height;

  // useRef で初期値をキャッシュして、ハイドレーション後に設定
  const initialStateRef = useRef<{
    position: { x: number; y: number };
    size: { width: number; height: number };
    collapsedCategories: string[];
  } | null>(null);

  const [position, setPosition] = useState({ x: defaultX, y: defaultY });
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // クライアントサイドでのみ初期化を実行
  useEffect(() => {
    if (initialStateRef.current !== null) return;

    const initial = getInitialState(
      storageKey,
      { x: defaultX, y: defaultY },
      { width: defaultWidth, height: defaultHeight }
    );
    initialStateRef.current = initial;

    // 初期値と異なる場合のみ更新
    /* eslint-disable react-hooks/set-state-in-effect */
    if (initial.position.x !== defaultX || initial.position.y !== defaultY) {
      setPosition(initial.position);
    }
    if (initial.size.width !== defaultWidth || initial.size.height !== defaultHeight) {
      setSize(initial.size);
    }
    if (initial.collapsedCategories.length > 0) {
      setCollapsedCategories(initial.collapsedCategories);
    }
    setIsInitialized(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storageKey, defaultX, defaultY, defaultWidth, defaultHeight]);

  // デバウンスしてローカルストレージに保存
  useEffect(() => {
    if (!isInitialized) return;

    const timeoutId = setTimeout(() => {
      try {
        const data: FloatingBoxStorage = {
          position,
          size,
          collapsedCategories,
        };
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch {
        // ストレージエラーは無視
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [position, size, collapsedCategories, storageKey, isInitialized]);

  const updatePosition = useCallback((newPosition: { x: number; y: number }) => {
    setPosition(newPosition);
  }, []);

  const updateSize = useCallback((newSize: { width: number; height: number }) => {
    setSize(newSize);
  }, []);

  const toggleCategoryCollapsed = useCallback((category: string) => {
    setCollapsedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }, []);

  const isCategoryCollapsed = useCallback((category: string) => {
    return collapsedCategories.includes(category);
  }, [collapsedCategories]);

  return {
    position,
    updatePosition,
    size,
    updateSize,
    collapsedCategories,
    toggleCategoryCollapsed,
    isCategoryCollapsed,
    isInitialized,
  };
}
