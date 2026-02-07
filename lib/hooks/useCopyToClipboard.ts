"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/**
 * クリップボードへのコピー機能を提供するhook
 * 複数アイテムに対応し、コピー後に一定時間で状態をリセットする
 */
export function useCopyToClipboard(timeout = 2000) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string, id: string) => {
      try {
        await navigator.clipboard.writeText(text);
        if (timerRef.current) clearTimeout(timerRef.current);
        setCopiedId(id);
        timerRef.current = setTimeout(() => setCopiedId(null), timeout);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    },
    [timeout]
  );

  const isCopied = useCallback(
    (id: string) => copiedId === id,
    [copiedId]
  );

  return { copiedId, copy, isCopied };
}
