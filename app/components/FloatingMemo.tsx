"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFloatingMemo } from "@/lib/hooks/useFloatingMemo";
import { Check, Copy, GripHorizontal, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface FloatingMemoProps {
  storageKey: string;
  isOpen: boolean;
  onClose: () => void;
  translations: {
    title: string;
    placeholder: string;
    clear: string;
    clearConfirm: string;
    copy: string;
    copied: string;
    close: string;
    resize: string;
  };
}

const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;
const MAX_WIDTH = 600;
const MAX_HEIGHT = 500;
const KEYBOARD_MOVE_STEP = 10;
const KEYBOARD_RESIZE_STEP = 10;

export function FloatingMemo({
  storageKey,
  isOpen,
  onClose,
  translations,
}: FloatingMemoProps) {
  const {
    content,
    setContent,
    position,
    updatePosition,
    size,
    updateSize,
    clear,
    isInitialized,
  } = useFloatingMemo({ storageKey });

  const boxRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // ドラッグ状態
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // リサイズ状態
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // コピー状態
  const [isCopied, setIsCopied] = useState(false);

  // 初期位置の設定（画面右下付近）
  useEffect(() => {
    if (!isInitialized || !isOpen) return;
    if (position.x < 0 || position.y < 0) {
      // 初期位置を計算（画面右下から少し内側）
      const x = Math.max(50, window.innerWidth - size.width - 50);
      const y = Math.max(50, window.innerHeight - size.height - 100);
      updatePosition({ x, y });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- updatePosition is stable (empty deps useCallback)
  }, [isInitialized, isOpen, position.x, position.y, size.width, size.height]);

  // ウィンドウリサイズ時の位置制約
  useEffect(() => {
    if (!isInitialized || !isOpen) return;

    const handleWindowResize = () => {
      // 現在の位置がビューポート外にある場合は調整
      const maxX = Math.max(0, window.innerWidth - size.width);
      const maxY = Math.max(0, window.innerHeight - size.height);

      if (position.x > maxX || position.y > maxY) {
        updatePosition({
          x: Math.min(position.x, maxX),
          y: Math.min(position.y, maxY),
        });
      }
    };

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- updatePosition is stable (empty deps useCallback)
  }, [isInitialized, isOpen, position.x, position.y, size.width, size.height]);

  // ドラッグ処理
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - size.width));
      const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - size.height));
      updatePosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- updatePosition is stable (empty deps useCallback)
  }, [isDragging, dragOffset, size.width, size.height]);

  // リサイズ処理
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStart.width + deltaX));
      const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, resizeStart.height + deltaY));

      updateSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- updateSize is stable (empty deps useCallback)
  }, [isResizing, resizeStart]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (boxRef.current) {
      const rect = boxRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
    setIsResizing(true);
  };

  // キーボードによる移動
  const handleMoveKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.shiftKey) return; // Shift キーはリサイズ用

    let newX = position.x;
    let newY = position.y;

    switch (e.key) {
      case "ArrowUp":
        newY = Math.max(0, position.y - KEYBOARD_MOVE_STEP);
        break;
      case "ArrowDown":
        newY = Math.min(window.innerHeight - size.height, position.y + KEYBOARD_MOVE_STEP);
        break;
      case "ArrowLeft":
        newX = Math.max(0, position.x - KEYBOARD_MOVE_STEP);
        break;
      case "ArrowRight":
        newX = Math.min(window.innerWidth - size.width, position.x + KEYBOARD_MOVE_STEP);
        break;
      default:
        return;
    }

    e.preventDefault();
    updatePosition({ x: newX, y: newY });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- updatePosition is stable (empty deps useCallback)
  }, [position.x, position.y, size.width, size.height]);

  // キーボードによるリサイズ
  const handleResizeKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!e.shiftKey) return; // Shift キーが必要

    let newWidth = size.width;
    let newHeight = size.height;

    switch (e.key) {
      case "ArrowUp":
        newHeight = Math.max(MIN_HEIGHT, size.height - KEYBOARD_RESIZE_STEP);
        break;
      case "ArrowDown":
        newHeight = Math.min(MAX_HEIGHT, size.height + KEYBOARD_RESIZE_STEP);
        break;
      case "ArrowLeft":
        newWidth = Math.max(MIN_WIDTH, size.width - KEYBOARD_RESIZE_STEP);
        break;
      case "ArrowRight":
        newWidth = Math.min(MAX_WIDTH, size.width + KEYBOARD_RESIZE_STEP);
        break;
      default:
        return;
    }

    e.preventDefault();
    updateSize({ width: newWidth, height: newHeight });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- updateSize is stable (empty deps useCallback)
  }, [size.width, size.height]);

  // ヘッダーのキーボードハンドラ（移動とリサイズの両方）
  const handleHeaderKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.shiftKey) {
      handleResizeKeyDown(e);
    } else {
      handleMoveKeyDown(e);
    }
  }, [handleMoveKeyDown, handleResizeKeyDown]);

  const handleClear = () => {
    if (window.confirm(translations.clearConfirm)) {
      clear();
    }
  };

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // コピー失敗時は何もしない
    }
  };

  if (!isOpen || !isInitialized) return null;

  return (
    <div
      ref={boxRef}
      role="dialog"
      aria-labelledby="floating-memo-title"
      aria-modal="false"
      style={{
        left: position.x >= 0 ? position.x : undefined,
        top: position.y >= 0 ? position.y : undefined,
        width: size.width,
        height: size.height,
      }}
      className="fixed bg-gray-900 text-white rounded-lg shadow-2xl z-50 flex flex-col select-none"
    >
      {/* ヘッダー（ドラッグハンドル） */}
      <div
        ref={headerRef}
        role="group"
        aria-label="Drag to move memo, use arrow keys to move, Shift+arrow keys to resize"
        aria-roledescription="draggable region"
        tabIndex={0}
        onMouseDown={handleHeaderMouseDown}
        onKeyDown={handleHeaderKeyDown}
        className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-t-lg cursor-move border-b border-gray-700 shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-gray-400" aria-hidden="true" />
          <span id="floating-memo-title" className="font-semibold text-sm">{translations.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!content}
            className="h-6 w-6 p-0 hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-30"
            title={isCopied ? translations.copied : translations.copy}
            aria-label={isCopied ? translations.copied : translations.copy}
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-green-400" aria-hidden="true" />
            ) : (
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 w-6 p-0 hover:bg-gray-700 text-gray-400 hover:text-white"
            title={translations.clear}
            aria-label={translations.clear}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-gray-700 text-gray-400 hover:text-white"
            title={translations.close}
            aria-label={translations.close}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* メモ入力エリア */}
      <div className="flex-1 p-2 min-h-0">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={translations.placeholder}
          aria-label={translations.title}
          className="h-full w-full bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 resize-none text-sm"
        />
      </div>

      {/* リサイズハンドル（右下コーナー） */}
      <div
        role="group"
        title={translations.resize}
        aria-label={translations.resize}
        aria-roledescription="resize handle"
        tabIndex={0}
        onMouseDown={handleResizeMouseDown}
        onKeyDown={handleResizeKeyDown}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <svg
          className="w-3 h-3 absolute bottom-0.5 right-0.5 text-gray-500 group-hover:text-gray-300 group-focus:text-blue-400"
          fill="currentColor"
          viewBox="0 0 10 10"
          aria-hidden="true"
        >
          <path d="M9 1v8H1L9 1z" />
        </svg>
      </div>
    </div>
  );
}
