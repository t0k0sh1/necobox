"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFloatingMemo } from "@/lib/hooks/useFloatingMemo";
import { Check, Copy, GripHorizontal, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  };
}

const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;
const MAX_WIDTH = 600;
const MAX_HEIGHT = 500;

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
  }, [isInitialized, isOpen, position.x, position.y, size.width, size.height, updatePosition]);

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
  }, [isDragging, dragOffset, size.width, size.height, updatePosition]);

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
  }, [isResizing, resizeStart, updateSize]);

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
        onMouseDown={handleHeaderMouseDown}
        className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-t-lg cursor-move border-b border-gray-700 shrink-0"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-sm">{translations.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!content}
            className="h-6 w-6 p-0 hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-30"
            title={isCopied ? translations.copied : translations.copy}
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 w-6 p-0 hover:bg-gray-700 text-gray-400 hover:text-white"
            title={translations.clear}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-gray-700 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* メモ入力エリア */}
      <div className="flex-1 p-2 min-h-0">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={translations.placeholder}
          className="h-full w-full bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 resize-none text-sm"
        />
      </div>

      {/* リサイズハンドル（右下コーナー） */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group"
      >
        <svg
          className="w-3 h-3 absolute bottom-0.5 right-0.5 text-gray-500 group-hover:text-gray-300"
          fill="currentColor"
          viewBox="0 0 10 10"
        >
          <path d="M9 1v8H1L9 1z" />
        </svg>
      </div>
    </div>
  );
}
