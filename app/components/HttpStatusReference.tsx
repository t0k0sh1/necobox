"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CATEGORY_ORDER,
  getStatusCodesByCategory,
  type HttpStatusCategory,
  type HttpStatusCode,
} from "@/lib/data/http-status-codes";
import { useFloatingBox } from "@/lib/hooks/useFloatingBox";
import { Check, ChevronDown, ChevronRight, Copy, ExternalLink, GripHorizontal, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface HttpStatusReferenceProps {
  storageKey: string;
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  translations: {
    title: string;
    close: string;
    resize: string;
    search: string;
    clearSearch: string;
    copy: string;
    copied: string;
    noResults: string;
    categories: {
      "1xx": string;
      "2xx": string;
      "3xx": string;
      "4xx": string;
      "5xx": string;
      non_standard: string;
    };
  };
}

const MIN_WIDTH = 280;
const MIN_HEIGHT = 200;
const MAX_WIDTH = 600;
const MAX_HEIGHT = 600;
const KEYBOARD_MOVE_STEP = 10;
const KEYBOARD_RESIZE_STEP = 10;

export function HttpStatusReference({
  storageKey,
  isOpen,
  onClose,
  locale,
  translations,
}: HttpStatusReferenceProps) {
  const {
    position,
    updatePosition,
    size,
    updateSize,
    toggleCategoryCollapsed,
    isCategoryCollapsed,
    isInitialized,
  } = useFloatingBox({ storageKey });

  const boxRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ドラッグ状態
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // リサイズ状態
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // 検索状態
  const [searchQuery, setSearchQuery] = useState("");

  // コピー状態
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  // 初期位置設定済みフラグ（useRefで管理してuseEffect内のsetState呼び出しを回避）
  const hasSetInitialPositionRef = useRef(false);

  // 初期位置の設定（画面右下付近）- 一度だけ実行
  useEffect(() => {
    if (!isInitialized || !isOpen || hasSetInitialPositionRef.current) return;
    if (position.x < 0 || position.y < 0) {
      // 初期位置を計算（画面右下から少し内側）
      const x = Math.max(50, window.innerWidth - size.width - 50);
      const y = Math.max(50, window.innerHeight - size.height - 100);
      updatePosition({ x, y });
    }
    hasSetInitialPositionRef.current = true;
  }, [
    isInitialized,
    isOpen,
    position.x,
    position.y,
    size.width,
    size.height,
    updatePosition,
  ]);

  // ウィンドウリサイズ時の位置制約
  useEffect(() => {
    if (!isInitialized || !isOpen) return;

    const handleWindowResize = () => {
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

  // キーボードによる移動
  const handleMoveKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.shiftKey) return;

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
  }, [position.x, position.y, size.width, size.height, updatePosition]);

  // キーボードによるリサイズ
  const handleResizeKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!e.shiftKey) return;

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
  }, [size.width, size.height, updateSize]);

  // ヘッダーのキーボードハンドラ
  const handleHeaderKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.shiftKey) {
      handleResizeKeyDown(e);
    } else {
      handleMoveKeyDown(e);
    }
  }, [handleMoveKeyDown, handleResizeKeyDown]);

  // コードをコピー
  const handleCopyCode = async (code: HttpStatusCode) => {
    const text = `${code.code}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(code.code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // コピー失敗時は何もしない
    }
  };

  // カテゴリごとにグループ化されたコード
  const groupedCodes = useMemo(() => getStatusCodesByCategory(), []);

  // 検索フィルタ
  const filteredGroupedCodes = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedCodes;
    }

    const query = searchQuery.toLowerCase();
    const filtered = new Map<HttpStatusCategory, HttpStatusCode[]>();

    for (const [category, codes] of groupedCodes) {
      const matchingCodes = codes.filter((code) => {
        const codeStr = String(code.code);
        const nameEn = code.nameEn.toLowerCase();
        const nameJa = code.nameJa.toLowerCase();
        return (
          codeStr.includes(query) ||
          nameEn.includes(query) ||
          nameJa.includes(query)
        );
      });
      if (matchingCodes.length > 0) {
        filtered.set(category, matchingCodes);
      }
    }

    return filtered;
  }, [groupedCodes, searchQuery]);

  // 検索結果が空かどうか
  const hasResults = useMemo(() => {
    for (const codes of filteredGroupedCodes.values()) {
      if (codes.length > 0) return true;
    }
    return false;
  }, [filteredGroupedCodes]);

  // カテゴリ名を取得
  const getCategoryName = (category: HttpStatusCategory): string => {
    return translations.categories[category];
  };

  // MDN URLを生成（non_standardカテゴリは除外）
  const getMdnUrl = (code: HttpStatusCode): string | null => {
    if (code.category === "non_standard") {
      return null;
    }
    const mdnLocale = locale === "ja" ? "ja" : "en-US";
    return `https://developer.mozilla.org/${mdnLocale}/docs/Web/HTTP/Status/${code.code}`;
  };

  if (!isOpen || !isInitialized) return null;

  return (
    <div
      ref={boxRef}
      role="dialog"
      aria-labelledby="http-status-reference-title"
      aria-modal="false"
      style={{
        left: position.x >= 0 ? position.x : undefined,
        top: position.y >= 0 ? position.y : undefined,
        width: size.width,
        height: size.height,
      }}
      className="fixed bg-gray-900 text-white rounded-lg shadow-2xl z-[60] flex flex-col select-none"
    >
      {/* ヘッダー（ドラッグハンドル） */}
      <div
        ref={headerRef}
        role="group"
        aria-label="Drag to move, use arrow keys to move, Shift+arrow keys to resize"
        aria-roledescription="draggable region"
        tabIndex={0}
        onMouseDown={handleHeaderMouseDown}
        onKeyDown={handleHeaderKeyDown}
        className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-t-lg cursor-move border-b border-gray-700 shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-gray-400" aria-hidden="true" />
          <span id="http-status-reference-title" className="font-semibold text-sm">
            {translations.title}
          </span>
        </div>
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

      {/* 検索ボックス */}
      <div className="px-3 py-2 border-b border-gray-700 shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={translations.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-8 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 text-sm"
            aria-label={translations.search}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300"
              aria-label={translations.clearSearch}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ステータスコード一覧 */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2">
        {hasResults ? (
          <div className="space-y-2">
            {CATEGORY_ORDER.map((category) => {
              const codes = filteredGroupedCodes.get(category);
              if (!codes || codes.length === 0) return null;

              const isCollapsed = isCategoryCollapsed(category);
              const categoryName = getCategoryName(category);

              return (
                <div key={category}>
                  {/* カテゴリヘッダー */}
                  <button
                    type="button"
                    onClick={() => toggleCategoryCollapsed(category)}
                    className="flex items-center gap-1 w-full text-left py-1 px-1 rounded hover:bg-gray-800 transition-colors"
                    aria-expanded={!isCollapsed}
                    aria-label={categoryName}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" aria-hidden="true" />
                    )}
                    <span className="text-xs font-semibold text-gray-300">
                      {categoryName}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({codes.length})
                    </span>
                  </button>

                  {/* ステータスコード一覧 */}
                  {!isCollapsed && (
                    <div className="ml-5 space-y-0.5">
                      {codes.map((code) => {
                        const mdnUrl = getMdnUrl(code);
                        return (
                          <div
                            key={code.code}
                            className="flex items-center gap-2 w-full py-1 px-2 rounded hover:bg-gray-800 transition-colors group"
                            title={`${code.code} - ${code.nameEn} / ${code.nameJa}`}
                          >
                            {/* コード番号 */}
                            <span className="text-sm font-mono font-semibold text-blue-400 w-10 shrink-0">
                              {code.code}
                            </span>
                            {/* MDNリンク */}
                            {mdnUrl && (
                              <a
                                href={mdnUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 p-0.5 rounded hover:bg-gray-700 text-gray-500 hover:text-blue-400 transition-colors"
                                title="MDN"
                                aria-label={`MDN: ${code.code}`}
                              >
                                <ExternalLink className="w-3 h-3" aria-hidden="true" />
                              </a>
                            )}
                            {/* 名前 */}
                            <span className="text-xs text-gray-300 truncate flex-1">
                              {locale === "ja" ? (
                                <>
                                  <span className="text-gray-400">{code.nameEn}</span>
                                  <span className="text-gray-500 mx-1">/</span>
                                  <span>{code.nameJa}</span>
                                </>
                              ) : (
                                <>
                                  <span>{code.nameEn}</span>
                                  <span className="text-gray-500 mx-1">/</span>
                                  <span className="text-gray-400">{code.nameJa}</span>
                                </>
                              )}
                            </span>
                            {/* コピーボタン */}
                            <button
                              type="button"
                              onClick={() => handleCopyCode(code)}
                              className="shrink-0 p-0.5 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                              title={copiedCode === code.code ? translations.copied : translations.copy}
                              aria-label={`${translations.copy} ${code.code}`}
                            >
                              {copiedCode === code.code ? (
                                <Check className="w-3.5 h-3.5 text-green-400" aria-hidden="true" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4 text-sm">
            {translations.noResults}
          </div>
        )}
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
