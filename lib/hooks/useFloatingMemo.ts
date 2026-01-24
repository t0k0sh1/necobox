import { useCallback, useEffect, useRef, useState } from "react";

interface FloatingMemoStorage {
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface UseFloatingMemoOptions {
  storageKey: string;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
}

const DEFAULT_POSITION = { x: -1, y: -1 }; // -1 は初期化前を示す
const DEFAULT_SIZE = { width: 320, height: 240 };
const DEBOUNCE_MS = 300;

// ローカルストレージから初期値を取得
function getInitialState(
  storageKey: string,
  defaultPosition: { x: number; y: number },
  defaultSize: { width: number; height: number }
) {
  if (typeof window === "undefined") {
    return { content: "", position: defaultPosition, size: defaultSize };
  }
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed: FloatingMemoStorage = JSON.parse(stored);
      return {
        content: parsed.content || "",
        position:
          parsed.position && parsed.position.x >= 0 && parsed.position.y >= 0
            ? parsed.position
            : defaultPosition,
        size: parsed.size || defaultSize,
      };
    }
  } catch {
    // パースエラーは無視
  }
  return { content: "", position: defaultPosition, size: defaultSize };
}

export function useFloatingMemo({
  storageKey,
  defaultPosition = DEFAULT_POSITION,
  defaultSize = DEFAULT_SIZE,
}: UseFloatingMemoOptions) {
  // プリミティブ値に分解して依存配列の安定性を確保
  const defaultX = defaultPosition.x;
  const defaultY = defaultPosition.y;
  const defaultWidth = defaultSize.width;
  const defaultHeight = defaultSize.height;

  // useRef で初期値をキャッシュして、ハイドレーション後に設定
  const initialStateRef = useRef<{
    content: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
  } | null>(null);

  const [content, setContent] = useState("");
  const [position, setPosition] = useState({ x: defaultX, y: defaultY });
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const [isInitialized, setIsInitialized] = useState(false);

  // クライアントサイドでのみ初期化を実行
  // ローカルストレージからの初期化は一度だけ行われるため、カスケードレンダリングは発生しない
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
    if (initial.content !== "") {
      setContent(initial.content);
    }
    if (initial.position.x !== defaultX || initial.position.y !== defaultY) {
      setPosition(initial.position);
    }
    if (initial.size.width !== defaultWidth || initial.size.height !== defaultHeight) {
      setSize(initial.size);
    }
    setIsInitialized(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storageKey, defaultX, defaultY, defaultWidth, defaultHeight]);

  // デバウンスしてローカルストレージに保存
  useEffect(() => {
    if (!isInitialized) return;

    const timeoutId = setTimeout(() => {
      try {
        const data: FloatingMemoStorage = {
          content,
          position,
          size,
        };
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch {
        // ストレージエラーは無視
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [content, position, size, storageKey, isInitialized]);

  const clear = useCallback(() => {
    setContent("");
  }, []);

  const updatePosition = useCallback((newPosition: { x: number; y: number }) => {
    setPosition(newPosition);
  }, []);

  const updateSize = useCallback((newSize: { width: number; height: number }) => {
    setSize(newSize);
  }, []);

  return {
    content,
    setContent,
    position,
    updatePosition,
    size,
    updateSize,
    clear,
    isInitialized,
  };
}
