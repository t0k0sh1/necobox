"use client";

import { CopyButton } from "@/app/components/CopyButton";
import { FloatingMemo } from "@/app/components/FloatingMemo";
import { HttpStatusReference } from "@/app/components/HttpStatusReference";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getColumnFilterPattern,
  getHighlightColumns,
  highlightColumnsWithSearch,
  isColumnFilterMode,
  matchesColumnFilters,
  parseColumnFilter,
  splitLineToColumns,
} from "@/lib/utils/column-filter";
import { decompressGz, isGzipFile } from "@/lib/utils/gz-decompressor";
import { hasNonEmptyMatch, highlightMatches } from "@/lib/utils/text-highlight";
import { decompressZip, isBinaryContent, isZipFile, type ExtractedFile } from "@/lib/utils/zip-decompressor";
import { Check, ChevronDown, Copy, FileText, Hash, HelpCircle, Pin, Search, StickyNote, Upload, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Virtuoso } from "react-virtuoso";

/**
 * UUID を生成（crypto.randomUUID が使えない環境ではフォールバック）
 */
function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // フォールバック: Math.random ベースの UUID 生成
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 正規表現パターンの検証
 */
function validateRegex(pattern: string): {
  isValid: boolean;
  error?: string;
  regex?: RegExp;
} {
  if (!pattern.trim()) {
    return { isValid: true, error: undefined };
  }

  try {
    const regex = new RegExp(pattern);
    return { isValid: true, regex };
  } catch (error) {
    return {
      isValid: false,
      error:
        error instanceof Error
          ? error.message
          : "Invalid regular expression",
    };
  }
}

// 区切り文字の選択肢
type DelimiterType = "none" | "space" | "tab" | "comma" | "custom";

// 表示行数の選択肢（ビューポートの高さを決定）
const VISIBLE_LINES_OPTIONS = [10, 20, 30, 50] as const;
type VisibleLinesOption = (typeof VISIBLE_LINES_OPTIONS)[number];

// 1行あたりの高さ（px）
// 注意: この値は行折り返しが無効の場合のみ正確。折り返し有効時は行の高さが可変になるため、
// 仮想スクロールを無効にして max-height によるスクロールを使用する
const LINE_HEIGHT = 24;

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  lines: string[];
  searchText: string;
  isRegex: boolean;
  delimiterType: DelimiterType;
  customDelimiter: string;
  alias: string;  // 別名（空文字の場合は元の名前を使用）
  pinnedLines: number[];  // ピン止めされた行のoriginalIndex（ピン順序を維持）
}

// 選択状態の型
interface SelectionState {
  anchorIndex: number | null; // 選択開始点（originalIndex）
  focusIndex: number | null;  // 選択終了点（originalIndex）
}

// テキスト選択状態
interface TextSelectionState {
  text: string;
  position: { x: number; y: number };
}

// 行コンポーネントのProps
interface LineRowProps {
  line: string;
  originalIndex: number;
  wrapLines: boolean;
  isSelected: boolean;
  hasSelection: boolean;
  onLineNumberMouseDown: (originalIndex: number, shiftKey: boolean) => void;
  onLineNumberMouseEnter: (originalIndex: number) => void;
  onLineNumberKeyDown: (originalIndex: number, e: React.KeyboardEvent) => void;
  isDraggingLineSelection: boolean;
  renderLineContent: (line: string) => ReactNode;
  isPinned: boolean;
  onTogglePin: (originalIndex: number) => void;
  pinLabel: string;
  unpinLabel: string;
}

// メモ化された行コンポーネント
const LineRow = React.memo(function LineRow({
  line,
  originalIndex,
  wrapLines,
  isSelected,
  hasSelection,
  onLineNumberMouseDown,
  onLineNumberMouseEnter,
  onLineNumberKeyDown,
  isDraggingLineSelection,
  renderLineContent,
  isPinned,
  onTogglePin,
  pinLabel,
  unpinLabel,
}: LineRowProps) {
  const handleLineNumberMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault(); // テキスト選択を防ぐ
      onLineNumberMouseDown(originalIndex, e.shiftKey);
    },
    [originalIndex, onLineNumberMouseDown]
  );

  const handleLineNumberMouseEnter = useCallback(() => {
    if (isDraggingLineSelection) {
      onLineNumberMouseEnter(originalIndex);
    }
  }, [originalIndex, onLineNumberMouseEnter, isDraggingLineSelection]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      onLineNumberKeyDown(originalIndex, e);
    },
    [originalIndex, onLineNumberKeyDown]
  );

  const handleTogglePin = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onTogglePin(originalIndex);
    },
    [originalIndex, onTogglePin]
  );

  return (
    <div
      className={`group flex ${
        wrapLines ? "" : "whitespace-nowrap"
      } ${
        isSelected
          ? "bg-blue-100 dark:bg-blue-900/30"
          : isPinned
            ? "bg-amber-50 dark:bg-amber-900/20"
            : ""
      }`}
      role="row"
      aria-selected={isSelected}
    >
      {/* ピンボタン - 行選択中は非表示（エリアは維持） */}
      <span className={`flex-shrink-0 select-none transition-opacity ${
        hasSelection ? "opacity-0" : isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      }`}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${isPinned ? "text-amber-500" : ""}`}
          onClick={handleTogglePin}
          aria-label={isPinned ? unpinLabel : pinLabel}
        >
          <Pin className={`w-4 h-4 ${isPinned ? "fill-current" : ""}`} />
        </Button>
      </span>
      {/* コピーボタン - 行選択中は非表示（エリアは維持） */}
      <span className={`flex-shrink-0 select-none transition-opacity ${
        hasSelection ? "opacity-0" : "opacity-0 group-hover:opacity-100"
      }`}>
        <CopyButton
          text={line}
          className="h-6 w-6 p-0"
        />
      </span>
      {/* ホバーインジケーター（>） */}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 w-4 text-gray-400 dark:text-gray-500 select-none text-center">
        &gt;
      </span>
      {/* 行番号（クリック・ドラッグ・キーボードで行選択） */}
      <span
        role="gridcell"
        tabIndex={0}
        aria-label={`Line ${originalIndex + 1}`}
        className={`select-none text-gray-400 dark:text-gray-600 pr-4 text-right min-w-[4rem] cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
          isSelected ? "bg-blue-200 dark:bg-blue-800/50" : ""
        }`}
        onMouseDown={handleLineNumberMouseDown}
        onMouseEnter={handleLineNumberMouseEnter}
        onKeyDown={handleKeyDown}
      >
        {originalIndex + 1}
      </span>
      {/* テキストコンテンツ（テキスト選択可能） */}
      <span
        className={`flex-1 select-text ${
          wrapLines ? "break-all" : ""
        }`}
        data-line-index={originalIndex}
      >
        {renderLineContent(line)}
      </span>
    </div>
  );
}, (prevProps, nextProps) => {
  // renderLineContent は毎回新しい関数なので、比較から除外
  // pinLabel, unpinLabel は翻訳文字列で実行中に変わらないため比較から除外
  return (
    prevProps.line === nextProps.line &&
    prevProps.originalIndex === nextProps.originalIndex &&
    prevProps.wrapLines === nextProps.wrapLines &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.hasSelection === nextProps.hasSelection &&
    prevProps.isDraggingLineSelection === nextProps.isDraggingLineSelection &&
    prevProps.isPinned === nextProps.isPinned
  );
});

export default function TextViewerPage() {
  const t = useTranslations("textViewer");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 表示オプション
  const [wrapLines, setWrapLines] = useState(false);
  const [visibleLines, setVisibleLines] = useState<VisibleLinesOption>(20);

  // 行選択状態
  const [selection, setSelection] = useState<SelectionState>({
    anchorIndex: null,
    focusIndex: null,
  });
  const [isDraggingLineSelection, setIsDraggingLineSelection] = useState(false);
  const [selectionCopied, setSelectionCopied] = useState(false);

  // コールバックの参照安定化のための ref
  // state 変更時もコールバック参照を維持し、LineRow のメモ化を有効に保つ
  const selectionRef = useRef(selection);
  const isDraggingLineSelectionRef = useRef(isDraggingLineSelection);

  // ref を state と同期
  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  useEffect(() => {
    isDraggingLineSelectionRef.current = isDraggingLineSelection;
  }, [isDraggingLineSelection]);

  // テキスト選択状態（ポップアップ用）
  const [textSelection, setTextSelection] = useState<TextSelectionState | null>(null);
  const [textSelectionCopied, setTextSelectionCopied] = useState(false);
  const textViewerRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // スクロール位置管理（タブ切り替え時の位置保持用）
  // スクロール位置はrefで管理し、頻繁な再レンダリングを防ぐ
  // タブ切り替え時のみstateに同期して復元に使用
  // Virtuoso用スクロール位置（fileId -> startIndex）
  const scrollPositionsRef = useRef<Map<string, number>>(new Map());
  const [scrollPositions, setScrollPositions] = useState<Map<string, number>>(new Map());
  // 通常スクロール用位置（fileId -> scrollTop）
  const scrollTopsRef = useRef<Map<string, number>>(new Map());
  // 通常スクロールコンテナのref（fileIdごとに管理）
  const scrollContainerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 正規表現ヘルプボックスの状態
  const [showRegexHelp, setShowRegexHelp] = useState(false);

  // 選択ヘルプツールチップの状態（クリックで即時表示用）
  const [showSelectionHelp, setShowSelectionHelp] = useState(false);

  // フローティングメモの状態
  const [showMemo, setShowMemo] = useState(false);
  // HTTPステータスコードリファレンスの状態
  const [showHttpStatusRef, setShowHttpStatusRef] = useState(false);
  const [helpBoxPosition, setHelpBoxPosition] = useState({ x: 100, y: 100 });
  const [isDraggingHelp, setIsDraggingHelp] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const helpBoxRef = useRef<HTMLDivElement>(null);

  // 別名編集状態
  const [editingAliasFileId, setEditingAliasFileId] = useState<string | null>(null);
  const [aliasInputPosition, setAliasInputPosition] = useState({ x: 0, y: 0 });
  const aliasInputRef = useRef<HTMLInputElement>(null);

  // ドラッグ処理
  useEffect(() => {
    if (!isDraggingHelp) return;

    const handleMouseMove = (e: MouseEvent) => {
      setHelpBoxPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDraggingHelp(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingHelp, dragOffset]);

  const handleHelpBoxMouseDown = (e: React.MouseEvent) => {
    if (helpBoxRef.current) {
      const rect = helpBoxRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDraggingHelp(true);
    }
  };

  // 選択中のファイル
  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeFileId) || null;
  }, [files, activeFileId]);

  // 選択中のファイルの行
  const lines = useMemo(() => {
    return activeFile?.lines || [];
  }, [activeFile]);

  // 選択中のファイルの検索テキスト
  const searchText = activeFile?.searchText || "";

  // 選択中のファイルの正規表現フラグ
  const isRegex = activeFile?.isRegex || false;

  // 正規表現のバリデーション結果
  const regexValidation = useMemo(() => {
    if (!isRegex || !searchText.trim()) {
      return { isValid: true, error: undefined };
    }
    return validateRegex(searchText);
  }, [isRegex, searchText]);

  // ファイルごとの検索テキストを更新
  const updateSearchText = useCallback((fileId: string, newSearchText: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, searchText: newSearchText } : f
      )
    );
  }, []);

  // ファイルごとの正規表現フラグを更新
  const updateIsRegex = useCallback((fileId: string, newIsRegex: boolean) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, isRegex: newIsRegex } : f
      )
    );
  }, []);

  // ファイルごとの区切り文字タイプを更新
  const updateDelimiterType = useCallback((fileId: string, newType: DelimiterType) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, delimiterType: newType } : f
      )
    );
  }, []);

  // ファイルごとのカスタム区切り文字を更新
  const updateCustomDelimiter = useCallback((fileId: string, newDelimiter: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, customDelimiter: newDelimiter } : f
      )
    );
  }, []);

  // ファイルごとの別名を更新
  const updateAlias = useCallback((fileId: string, newAlias: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, alias: newAlias } : f
      )
    );
  }, []);

  // 別名編集を開始
  const startEditingAlias = useCallback((fileId: string, tabElement: HTMLElement) => {
    const rect = tabElement.getBoundingClientRect();
    const editorWidth = 220; // 概算のエディタ幅
    const editorHeight = 50; // 概算のエディタ高さ

    // ビューポート境界チェック
    let x = rect.left;
    let y = rect.bottom + 4;

    // 右端からはみ出す場合は左にずらす
    if (x + editorWidth > window.innerWidth) {
      x = Math.max(8, window.innerWidth - editorWidth - 8);
    }

    // 下端からはみ出す場合は上に表示
    if (y + editorHeight > window.innerHeight) {
      y = rect.top - editorHeight - 4;
    }

    setAliasInputPosition({ x, y });
    setEditingAliasFileId(fileId);
    // 次のレンダリング後にフォーカス
    setTimeout(() => {
      aliasInputRef.current?.focus();
      aliasInputRef.current?.select();
    }, 0);
  }, []);

  // 別名編集を終了
  const finishEditingAlias = useCallback(() => {
    setEditingAliasFileId(null);
  }, []);

  // 区切り文字を取得
  const getDelimiter = useCallback((file: UploadedFile): string => {
    switch (file.delimiterType) {
      case "space":
        return " ";
      case "tab":
        return "\t";
      case "comma":
        return ",";
      case "custom":
        return file.customDelimiter;
      default:
        return "";
    }
  }, []);

  // ピン止めトグルハンドラ
  const handleTogglePin = useCallback((originalIndex: number) => {
    if (!activeFileId) return;

    setFiles(prev => prev.map(file => {
      if (file.id !== activeFileId) return file;

      const pinnedLines = [...file.pinnedLines];
      const index = pinnedLines.indexOf(originalIndex);

      if (index === -1) {
        pinnedLines.push(originalIndex);  // ピンを追加
      } else {
        pinnedLines.splice(index, 1);     // ピンを解除
      }

      return { ...file, pinnedLines };
    }));
  }, [activeFileId]);

  // ピン止めされた行のデータ（ピン順序を維持）
  const pinnedLinesData = useMemo(() => {
    const pinnedIndices = activeFile?.pinnedLines ?? [];
    return pinnedIndices
      .filter(index => index < lines.length)
      .map(index => ({ line: lines[index], originalIndex: index }));
  }, [lines, activeFile?.pinnedLines]);

  // ピン止めされた行のSetを作成（フィルタで除外用）
  const pinnedSet = useMemo(() => {
    return new Set(activeFile?.pinnedLines ?? []);
  }, [activeFile?.pinnedLines]);

  // フィルタされた行（ピン行を除外）
  const filteredLines = useMemo(() => {
    let baseFiltered: { line: string; originalIndex: number }[];

    if (!searchText.trim()) {
      baseFiltered = lines.map((line, index) => ({ line, originalIndex: index }));
    } else if (isRegex && !regexValidation.isValid) {
      // 正規表現モードで無効な正規表現の場合は全行を返す
      baseFiltered = lines.map((line, index) => ({ line, originalIndex: index }));
    } else {
      // 列フィルタの解析
      const parsedFilter = parseColumnFilter(searchText);
      const delimiter = activeFile ? getDelimiter(activeFile) : "";

      // 列フィルタモードの場合
      if (isColumnFilterMode(parsedFilter) && delimiter) {
        baseFiltered = lines
          .map((line, index) => ({ line, originalIndex: index }))
          .filter(({ line }) => {
            const columns = splitLineToColumns(line, delimiter);
            return matchesColumnFilters(columns, parsedFilter.columnFilters, isRegex);
          });
      } else {
        // 通常の全文検索
        const pattern = parsedFilter.generalPattern || searchText;
        // hasNonEmptyMatch を使用して空文字列マッチを除外
        baseFiltered = lines
          .map((line, index) => ({ line, originalIndex: index }))
          .filter(({ line }) => hasNonEmptyMatch(line, pattern, isRegex));
      }
    }

    // ピン行を除外
    return baseFiltered.filter(item => !pinnedSet.has(item.originalIndex));
  }, [lines, searchText, isRegex, regexValidation.isValid, activeFile, getDelimiter, pinnedSet]);

  // フィルタ変更時に選択を解除
  useEffect(() => {
    setSelection({ anchorIndex: null, focusIndex: null });
  }, [searchText, isRegex]);

  // ファイル切り替え時に選択を解除
  useEffect(() => {
    setSelection({ anchorIndex: null, focusIndex: null });
  }, [activeFileId]);

  // テキスト選択検出
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // テキストビューア内での選択のみ処理
      if (!textViewerRef.current?.contains(e.target as Node)) {
        return;
      }

      const sel = window.getSelection();
      if (sel && sel.toString().length > 0) {
        const text = sel.toString();
        // 選択範囲の位置を取得
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setTextSelection({
          text,
          position: {
            x: rect.left + rect.width / 2,
            y: rect.top - 8,
          },
        });
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // テキストビューア内でクリックした場合、既存のテキスト選択をクリア
      if (textViewerRef.current?.contains(e.target as Node)) {
        // コピーボタンをクリックした場合は選択をクリアしない
        const target = e.target as HTMLElement;
        if (target.closest('[data-text-copy-popup]')) {
          return;
        }
        setTextSelection(null);
      }
    };

    // ウィンドウがフォーカスを失った時にポップアップを閉じる
    const handleWindowBlur = () => {
      setTextSelection(null);
    };

    // Escapeキーでポップアップを閉じる
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTextSelection(null);
      }
    };

    // スクロール時にポップアップを閉じる（位置がずれるため）
    const handleScroll = () => {
      setTextSelection(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('scroll', handleScroll, { capture: true });

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, []);

  // テキスト選択をコピー
  const copyTextSelection = useCallback(async () => {
    if (!textSelection) return;

    try {
      await navigator.clipboard.writeText(textSelection.text);
      // コピー成功のフィードバック表示
      setTextSelectionCopied(true);
      // 選択をクリア
      window.getSelection()?.removeAllRanges();
      // 少し待ってからポップアップを消す
      setTimeout(() => {
        setTextSelectionCopied(false);
        setTextSelection(null);
      }, 1000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [textSelection]);

  // 選択された行のSet
  const selectedLines = useMemo(() => {
    const { anchorIndex, focusIndex } = selection;
    if (anchorIndex === null || focusIndex === null) {
      return new Set<number>();
    }

    const start = Math.min(anchorIndex, focusIndex);
    const end = Math.max(anchorIndex, focusIndex);

    // フィルタ後の行のoriginalIndexを取得
    const filteredIndices = new Set(filteredLines.map((l) => l.originalIndex));

    const selected = new Set<number>();
    for (let i = start; i <= end; i++) {
      if (filteredIndices.has(i)) {
        selected.add(i);
      }
    }
    return selected;
  }, [selection, filteredLines]);

  // 選択解除
  const clearSelection = useCallback(() => {
    setSelection({ anchorIndex: null, focusIndex: null });
  }, []);

  // 行番号マウスダウンハンドラ（ドラッグ開始）
  // ref を使用して依存配列を空にし、コールバック参照を安定化
  const handleLineNumberMouseDown = useCallback((originalIndex: number, shiftKey: boolean) => {
    if (shiftKey && selectionRef.current.anchorIndex !== null) {
      // Shift+クリック: 範囲選択
      setSelection((prev) => ({ ...prev, focusIndex: originalIndex }));
    } else {
      // 通常クリック: 新しい選択開始
      setSelection({ anchorIndex: originalIndex, focusIndex: originalIndex });
      setIsDraggingLineSelection(true);
    }
  }, []);

  // 行番号マウスエンターハンドラ（ドラッグ中）
  // ref を使用して依存配列を空にし、コールバック参照を安定化
  const handleLineNumberMouseEnter = useCallback((originalIndex: number) => {
    if (isDraggingLineSelectionRef.current) {
      setSelection((prev) => ({ ...prev, focusIndex: originalIndex }));
    }
  }, []);

  // 行番号キーボードハンドラ
  // ref を使用して selection 依存を除去し、コールバック参照を安定化
  // filteredLines は検索条件変更時に更新が必要なため依存配列に含める
  const handleLineNumberKeyDown = useCallback((originalIndex: number, e: React.KeyboardEvent) => {
    const currentFilteredIndex = filteredLines.findIndex(l => l.originalIndex === originalIndex);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentFilteredIndex < filteredLines.length - 1) {
          const nextLine = filteredLines[currentFilteredIndex + 1];
          if (e.shiftKey) {
            setSelection((prev) => ({
              anchorIndex: prev.anchorIndex ?? originalIndex,
              focusIndex: nextLine.originalIndex,
            }));
          } else {
            setSelection({
              anchorIndex: nextLine.originalIndex,
              focusIndex: nextLine.originalIndex,
            });
          }
          // フォーカスを次の行番号に移動
          const nextElement = document.querySelector(
            `[aria-label="Line ${nextLine.originalIndex + 1}"]`
          ) as HTMLElement;
          nextElement?.focus();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentFilteredIndex > 0) {
          const prevLine = filteredLines[currentFilteredIndex - 1];
          if (e.shiftKey) {
            setSelection((prev) => ({
              anchorIndex: prev.anchorIndex ?? originalIndex,
              focusIndex: prevLine.originalIndex,
            }));
          } else {
            setSelection({
              anchorIndex: prevLine.originalIndex,
              focusIndex: prevLine.originalIndex,
            });
          }
          // フォーカスを前の行番号に移動
          const prevElement = document.querySelector(
            `[aria-label="Line ${prevLine.originalIndex + 1}"]`
          ) as HTMLElement;
          prevElement?.focus();
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (e.shiftKey && selectionRef.current.anchorIndex !== null) {
          setSelection((prev) => ({ ...prev, focusIndex: originalIndex }));
        } else {
          setSelection({
            anchorIndex: originalIndex,
            focusIndex: originalIndex,
          });
        }
        break;
      case 'Escape':
        e.preventDefault();
        clearSelection();
        break;
      case 'a':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (filteredLines.length > 0) {
            setSelection({
              anchorIndex: filteredLines[0].originalIndex,
              focusIndex: filteredLines[filteredLines.length - 1].originalIndex,
            });
          }
        }
        break;
    }
  }, [filteredLines, clearSelection]);

  // ドラッグ終了ハンドラ
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDraggingLineSelection(false);
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // 選択範囲をコピー
  const copySelectedLines = useCallback(async () => {
    const selectedText = filteredLines
      .filter(({ originalIndex }) => selectedLines.has(originalIndex))
      .map(({ line }) => line)
      .join("\n");

    try {
      await navigator.clipboard.writeText(selectedText);
      // コピー成功のフィードバック表示
      setSelectionCopied(true);
      // 少し待ってから選択を解除
      setTimeout(() => {
        setSelectionCopied(false);
        clearSelection();
      }, 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [filteredLines, selectedLines, clearSelection]);

  // Ctrl+C グローバルショートカット（行選択時）
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedLines.size > 0) {
        // テキスト選択がない場合のみ行選択をコピー
        const sel = window.getSelection();
        if (!sel || sel.toString().length === 0) {
          e.preventDefault();
          copySelectedLines();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [selectedLines.size, copySelectedLines]);

  const handleFileSelect = useCallback(
    async (selectedFiles: FileList | null) => {
      if (!selectedFiles || selectedFiles.length === 0) return;

      setIsLoading(true);
      setError(null);

      try {
        // ファイルを並列で処理
        const filePromises = Array.from(selectedFiles).map(async (file): Promise<UploadedFile[]> => {
          try {
            // ZIPファイルの場合は複数ファイルを返す
            if (isZipFile(file)) {
              const extractedFiles: ExtractedFile[] = await decompressZip(file);
              return extractedFiles.map((extracted) => {
                const fileId = generateUUID();
                const fileLines = extracted.content.split(/\r?\n/);
                return {
                  id: fileId,
                  name: `${file.name}/${extracted.name}`,
                  size: new Blob([extracted.content]).size,
                  lines: fileLines,
                  searchText: "",
                  isRegex: false,
                  delimiterType: "none" as DelimiterType,
                  customDelimiter: "",
                  alias: "",
                  pinnedLines: [],
                };
              });
            }

            // GZファイルの場合は解凍して1ファイルとして返す
            if (isGzipFile(file)) {
              const content = await decompressGz(file);
              const fileId = generateUUID();
              const fileLines = content.split(/\r?\n/);
              // .gz を除いた名前を使用
              const displayName = file.name.replace(/\.gz$/i, "");
              return [{
                id: fileId,
                name: displayName,
                size: new Blob([content]).size,
                lines: fileLines,
                searchText: "",
                isRegex: false,
                delimiterType: "none" as DelimiterType,
                customDelimiter: "",
                alias: "",
                pinnedLines: [],
              }];
            }

            // 通常のテキストファイル
            const content = await file.text();

            // バイナリファイルチェック
            if (isBinaryContent(content)) {
              throw new Error("バイナリファイルは対応していません");
            }

            const fileId = generateUUID();
            const fileLines = content.split(/\r?\n/);
            return [{
              id: fileId,
              name: file.name,
              size: file.size,
              lines: fileLines,
              searchText: "",
              isRegex: false,
              delimiterType: "none" as DelimiterType,
              customDelimiter: "",
              alias: "",
              pinnedLines: [],
            }];
          } catch (fileError) {
            const errorMessage =
              fileError instanceof Error
                ? fileError.message
                : "Failed to process file";
            throw new Error(`${file.name}: ${errorMessage}`);
          }
        });

        const results = await Promise.all(filePromises);
        const newFiles = results.flat();
        setFiles((prev) => [...prev, ...newFiles]);

        // アップロードしたファイルの最初のファイルを自動的に選択
        if (newFiles.length > 0) {
          setActiveFileId(newFiles[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : tCommon("error"));
      } finally {
        setIsLoading(false);
      }
    },
    [tCommon]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => {
      const newFiles = prev.filter((f) => f.id !== fileId);

      // 削除されたファイルが選択中の場合、別のファイルを選択
      if (activeFileId === fileId) {
        if (newFiles.length > 0) {
          setActiveFileId(newFiles[0].id);
        } else {
          setActiveFileId(null);
        }
      }

      return newFiles;
    });

    // スクロール位置をクリーンアップ
    scrollPositionsRef.current.delete(fileId);
    setScrollPositions((prev) => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
    scrollTopsRef.current.delete(fileId);
    scrollContainerRefs.current.delete(fileId);
  };

  const handleClear = () => {
    setFiles([]);
    setActiveFileId(null);
    setError(null);
    clearSelection();
    // 全スクロール位置をクリア
    scrollPositionsRef.current.clear();
    setScrollPositions(new Map());
    scrollTopsRef.current.clear();
    scrollContainerRefs.current.clear();
  };

  // タブ切り替え処理（スクロール位置の保存・復元）
  const handleTabChange = useCallback((newFileId: string) => {
    // 現在のタブのスクロール位置を保存
    if (activeFileId) {
      // 通常スクロールコンテナの位置を保存（refから最新の値を取得して保存）
      const scrollContainer = scrollContainerRefs.current.get(activeFileId);
      if (scrollContainer) {
        scrollTopsRef.current.set(activeFileId, scrollContainer.scrollTop);
      }

      // Virtuosoのスクロール位置をstateに同期（復元用）
      const virtuosoPosition = scrollPositionsRef.current.get(activeFileId);
      if (virtuosoPosition !== undefined) {
        setScrollPositions((prev) => {
          const newMap = new Map(prev);
          newMap.set(activeFileId, virtuosoPosition);
          return newMap;
        });
      }
    }

    // タブを切り替え
    setActiveFileId(newFileId);

    // 新しいタブのスクロール位置を復元（次のレンダリング後に実行）
    setTimeout(() => {
      // 通常スクロールコンテナの位置を復元
      const scrollContainer = scrollContainerRefs.current.get(newFileId);
      const savedScrollTop = scrollTopsRef.current.get(newFileId);
      if (scrollContainer && savedScrollTop !== undefined) {
        scrollContainer.scrollTop = savedScrollTop;
      }

      // Virtuosoの位置は initialTopMostItemIndex で復元されるため、ここでは処理不要
    }, 0);
  }, [activeFileId]);

  // 「このテキストを検索する」機能
  const handleSearchInFile = useCallback((targetFileId: string, searchText: string) => {
    // 1. 対象ファイルの正規表現をオフ
    updateIsRegex(targetFileId, false);

    // 2. フィルタテキストを選択範囲に設定
    updateSearchText(targetFileId, searchText);

    // 3. タブを切り替え（スクロール位置の保存・復元を含む）
    if (targetFileId !== activeFileId) {
      handleTabChange(targetFileId);
    }

    // 4. テキスト選択をクリア
    setTextSelection(null);
    window.getSelection()?.removeAllRanges();
  }, [activeFileId, updateIsRegex, updateSearchText, handleTabChange]);

  // OR条件で検索に追加
  const handleAddOrCondition = useCallback((addText: string) => {
    if (!activeFileId || !activeFile) return;

    const currentSearch = activeFile.searchText.trim();
    let newSearch: string;

    if (currentSearch) {
      // 既存の検索がある場合は | で連結
      newSearch = `${currentSearch}|${addText}`;
    } else {
      // 既存の検索がない場合はそのまま
      newSearch = addText;
    }

    // OR条件のため正規表現モードを有効にする
    updateIsRegex(activeFileId, true);
    updateSearchText(activeFileId, newSearch);

    // テキスト選択をクリア
    setTextSelection(null);
    window.getSelection()?.removeAllRanges();
  }, [activeFileId, activeFile, updateIsRegex, updateSearchText]);

  // AND条件で検索に追加
  const handleAddAndCondition = useCallback((addText: string) => {
    if (!activeFileId || !activeFile) return;

    const currentSearch = activeFile.searchText.trim();
    let newSearch: string;

    if (currentSearch) {
      // 既存の検索がある場合は , で連結（列フィルタのAND条件と同じ）
      newSearch = `${currentSearch}, ${addText}`;
    } else {
      // 既存の検索がない場合はそのまま
      newSearch = addText;
    }

    // 正規表現モードは維持（変更しない）
    updateSearchText(activeFileId, newSearch);

    // テキスト選択をクリア
    setTextSelection(null);
    window.getSelection()?.removeAllRanges();
  }, [activeFileId, activeFile, updateSearchText]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <TooltipProvider>
      <div className="flex h-full items-start justify-center py-4 px-4">
        <div className="w-full">
          <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
          <div className="space-y-6 bg-white dark:bg-black rounded-lg p-6 border mt-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">{t("title")}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("description")}
            </p>
          </div>

          {/* ファイルアップロードエリア */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-gray-300 dark:border-gray-700"
            }`}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">{t("upload.title")}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t("upload.description")}
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <FileText className="w-4 h-4 mr-2" />
                {t("upload.selectFiles")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
                aria-label={t("upload.selectFiles")}
              />
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {t("upload.dragDrop")}
              </p>
            </div>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* ローディング状態 */}
          {isLoading && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tCommon("loading")}
              </p>
            </div>
          )}

          {/* ファイルタブ表示 */}
          {files.length > 0 && (
            <div className="space-y-4">
              {/* クリアボタン */}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleClear}>
                  {tCommon("clear")}
                </Button>
              </div>

              <Tabs
                value={activeFileId || undefined}
                onValueChange={handleTabChange}
              >
                {/* タブリスト */}
                <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-gray-100 dark:bg-gray-900 p-1">
                  {files.map((file) => (
                    <TabsTrigger
                      key={file.id}
                      value={file.id}
                      className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 max-w-[200px]"
                      onClick={(e) => {
                        // アクティブなタブをクリックしたら別名編集を開始
                        if (file.id === activeFileId) {
                          startEditingAlias(file.id, e.currentTarget);
                        }
                      }}
                    >
                      <span className="truncate" title={file.alias || file.name}>
                        {file.alias || file.name}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            e.preventDefault();
                            removeFile(file.id);
                          }
                        }}
                        className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-0.5 cursor-pointer"
                        aria-label={`Remove ${file.alias || file.name}`}
                      >
                        <X className="w-3 h-3" />
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* タブコンテンツ */}
                {files.map((file) => (
                  <TabsContent key={file.id} value={file.id} className="mt-4">
                    {/* ファイル情報 */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      {file.name} - {formatFileSize(file.size)} - {file.lines.length} lines
                    </div>

                    {/* フィルタと表示オプション */}
                    <div className="space-y-4 border-t pt-4">
                      {/* 区切り文字選択 */}
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm whitespace-nowrap">
                            {t("delimiter.label")}:
                          </Label>
                          <Select
                            value={file.delimiterType}
                            onValueChange={(value: DelimiterType) =>
                              updateDelimiterType(file.id, value)
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">{t("delimiter.none")}</SelectItem>
                              <SelectItem value="space">{t("delimiter.space")}</SelectItem>
                              <SelectItem value="tab">{t("delimiter.tab")}</SelectItem>
                              <SelectItem value="comma">{t("delimiter.comma")}</SelectItem>
                              <SelectItem value="custom">{t("delimiter.custom")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {file.delimiterType === "custom" && (
                          <Input
                            type="text"
                            placeholder={t("delimiter.customPlaceholder")}
                            value={file.customDelimiter}
                            onChange={(e) => updateCustomDelimiter(file.id, e.target.value)}
                            className="w-32"
                          />
                        )}
                      </div>

                      <div className="flex flex-col md:flex-row gap-4">
                        {/* 検索入力 */}
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex-1 relative">
                              <Input
                                type="text"
                                placeholder={
                                  file.delimiterType !== "none"
                                    ? t("filter.columnPlaceholder")
                                    : file.isRegex
                                      ? t("filter.regexPlaceholder")
                                      : t("filter.placeholder")
                                }
                                value={file.searchText}
                                onChange={(e) => updateSearchText(file.id, e.target.value)}
                                className={`pr-8 ${file.isRegex && !regexValidation.isValid && file.searchText ? "border-red-500" : ""}`}
                              />
                              {file.searchText && (
                                <button
                                  type="button"
                                  onClick={() => updateSearchText(file.id, "")}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      updateSearchText(file.id, "");
                                    }
                                  }}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  aria-label={tCommon("clear")}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`useRegex-${file.id}`}
                                checked={file.isRegex}
                                onCheckedChange={(checked) =>
                                  updateIsRegex(file.id, checked === true)
                                }
                              />
                              <Label htmlFor={`useRegex-${file.id}`} className="text-sm cursor-pointer whitespace-nowrap">
                                {t("filter.useRegex")}
                              </Label>
                              {/* 正規表現ヘルプボタン */}
                              <button
                                type="button"
                                onClick={() => setShowRegexHelp(!showRegexHelp)}
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                aria-label={t("filter.regexHelp.title")}
                              >
                                <HelpCircle className={`w-4 h-4 ${showRegexHelp ? "text-primary" : "text-gray-400"}`} />
                              </button>
                            </div>
                          </div>
                          {/* 正規表現エラーメッセージ */}
                          {file.isRegex && !regexValidation.isValid && file.searchText && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                              {t("filter.invalidRegex")}
                            </p>
                          )}
                        </div>

                        {/* 表示オプション */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="wrapLines"
                              checked={wrapLines}
                              onCheckedChange={(checked) =>
                                setWrapLines(checked === true)
                              }
                            />
                            <Label htmlFor="wrapLines" className="text-sm cursor-pointer">
                              {t("options.wrapLines")}
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* 表示行数の設定（ビューポートの高さ） */}
                      <div className="flex items-center gap-2">
                        <Label className="text-sm whitespace-nowrap">
                          {t("options.visibleLines")}:
                        </Label>
                        <Select
                          value={String(visibleLines)}
                          onValueChange={(value) => setVisibleLines(Number(value) as VisibleLinesOption)}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VISIBLE_LINES_OPTIONS.map((option) => (
                              <SelectItem key={option} value={String(option)}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 選択ツールバー（min-heightで領域確保、内容は条件付きレンダリング） */}
                      <div className="min-h-[2.5rem]">
                        {selectedLines.size > 0 && (
                          <div className="flex items-center gap-4 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
                            <span className="text-sm text-blue-700 dark:text-blue-300">
                              {t("selection.count", { count: selectedLines.size })}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={copySelectedLines}
                              disabled={selectionCopied}
                              className={`h-7 text-xs transition-colors ${
                                selectionCopied
                                  ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400"
                                  : ""
                              }`}
                            >
                              {selectionCopied ? (
                                <Check className="w-3.5 h-3.5 mr-1" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 mr-1" />
                              )}
                              {selectionCopied ? tCommon("copied") : t("selection.copy")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearSelection}
                              className="h-7 text-xs"
                            >
                              {t("selection.clear")}
                            </Button>
                            <Tooltip open={showSelectionHelp} onOpenChange={setShowSelectionHelp}>
                              <TooltipTrigger asChild>
                                <span
                                  className="cursor-help"
                                  onClick={() => setShowSelectionHelp(true)}
                                >
                                  <HelpCircle className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t("selection.helpTooltip")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                      </div>

                      {/* フィルタ結果カウントとツールボタン */}
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {t("filter.resultsCount", {
                            filtered: filteredLines.length,
                            total: lines.length,
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowHttpStatusRef(!showHttpStatusRef)}
                            className="h-7 text-xs"
                          >
                            <Hash className="w-3.5 h-3.5 mr-1" />
                            {showHttpStatusRef ? t("httpStatus.hide") : t("httpStatus.show")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowMemo(!showMemo)}
                            className="h-7 text-xs"
                          >
                            <StickyNote className="w-3.5 h-3.5 mr-1" />
                            {showMemo ? t("memo.hide") : t("memo.show")}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* テキスト表示エリア（仮想スクロール） */}
                    <div
                      ref={textViewerRef}
                      className={`border rounded-lg bg-gray-50 dark:bg-gray-900 mt-4 relative ${
                        wrapLines ? "" : "overflow-x-auto"
                      }`}
                    >
                      <div className="font-mono text-sm">
                        {(() => {
                          // 事前計算: mapの外で一度だけ計算（パフォーマンス最適化）
                          const delimiter = getDelimiter(file);
                          const parsedFilter = parseColumnFilter(searchText);
                          const useColumnFilter = isColumnFilterMode(parsedFilter) && delimiter;
                          const highlightCols = useColumnFilter
                            ? getHighlightColumns(parsedFilter.columnFilters)
                            : new Set<number>();
                          const columnPattern = useColumnFilter
                            ? getColumnFilterPattern(parsedFilter.columnFilters)
                            : "";

                          // 行の内容をレンダリングする関数
                          const renderLineContent = (line: string): ReactNode => {
                            if (!searchText.trim() || !regexValidation.isValid) {
                              return line || "\u00A0";
                            }

                            // 列フィルタモードで区切り文字がある場合
                            if (useColumnFilter) {
                              return highlightColumnsWithSearch(
                                line,
                                delimiter,
                                highlightCols,
                                columnPattern,
                                file.isRegex,
                                highlightMatches
                              );
                            }

                            // 通常のハイライト
                            return highlightMatches(line, searchText, file.isRegex);
                          };

                          // ピン止め行エリアの高さを計算（行の高さ + コンテナのパディング）
                          const pinnedAreaHeight =
                            pinnedLinesData.length > 0
                              ? pinnedLinesData.length * LINE_HEIGHT + 24 // p-4 pb-2 相当の垂直パディング (~24px)
                              : 0;

                          // ビューポートの高さを計算（ピン行エリアの高さを引く）
                          const baseViewportHeight = visibleLines * LINE_HEIGHT;
                          const adjustedViewportHeight = Math.max(
                            baseViewportHeight - pinnedAreaHeight,
                            LINE_HEIGHT * 3 // 最低3行分は確保
                          );

                          return (
                            <>
                              {/* ピン止めされた行（固定表示） */}
                              {pinnedLinesData.length > 0 && (
                                <div className="border-b border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4 pb-2">
                                  {pinnedLinesData.map(({ line, originalIndex }) => (
                                    <LineRow
                                      key={`pinned-${originalIndex}`}
                                      line={line}
                                      originalIndex={originalIndex}
                                      wrapLines={wrapLines}
                                      isSelected={selectedLines.has(originalIndex)}
                                      hasSelection={selectedLines.size > 0}
                                      onLineNumberMouseDown={handleLineNumberMouseDown}
                                      onLineNumberMouseEnter={handleLineNumberMouseEnter}
                                      onLineNumberKeyDown={handleLineNumberKeyDown}
                                      isDraggingLineSelection={isDraggingLineSelection}
                                      renderLineContent={renderLineContent}
                                      isPinned={true}
                                      onTogglePin={handleTogglePin}
                                      pinLabel={t("pin.pin")}
                                      unpinLabel={t("pin.unpin")}
                                    />
                                  ))}
                                </div>
                              )}

                              {/* スクロール可能なエリア */}
                              <div className="p-4">
                                {/* 仮想スクロール対応（表示行数より多い場合、かつ行折り返し無効時のみ） */}
                                {/* 行折り返し有効時は行の高さが可変になるため、仮想スクロールを使用せず max-height でスクロール */}
                                {filteredLines.length > visibleLines && !wrapLines ? (
                                  (() => {
                                    // 保存されたスクロール位置を取得（stateから復元用の値を取得）
                                    const savedScrollPosition = scrollPositions.get(file.id);

                                    return (
                                      <Virtuoso
                                        key={`${file.id}-${file.searchText}-${file.isRegex}-${pinnedLinesData.length}`}
                                        style={{ height: `${adjustedViewportHeight}px` }}
                                        totalCount={filteredLines.length}
                                        overscan={20}
                                        initialTopMostItemIndex={savedScrollPosition ?? 0}
                                        rangeChanged={({ startIndex }) => {
                                          // スクロール位置をrefに保存（頻繁な再レンダリングを防ぐ）
                                          scrollPositionsRef.current.set(file.id, startIndex);
                                        }}
                                        itemContent={(index) => {
                                          const { line, originalIndex } = filteredLines[index];
                                          return (
                                            <LineRow
                                              line={line}
                                              originalIndex={originalIndex}
                                              wrapLines={wrapLines}
                                              isSelected={selectedLines.has(originalIndex)}
                                              hasSelection={selectedLines.size > 0}
                                              onLineNumberMouseDown={handleLineNumberMouseDown}
                                              onLineNumberMouseEnter={handleLineNumberMouseEnter}
                                              onLineNumberKeyDown={handleLineNumberKeyDown}
                                              isDraggingLineSelection={isDraggingLineSelection}
                                              renderLineContent={renderLineContent}
                                              isPinned={false}
                                              onTogglePin={handleTogglePin}
                                              pinLabel={t("pin.pin")}
                                              unpinLabel={t("pin.unpin")}
                                            />
                                          );
                                        }}
                                      />
                                    );
                                  })()
                                ) : (
                                  (() => {
                                    // 行折り返し有効時、または少ない行数の場合は通常レンダリング
                                    // 行数が多い場合は max-height でスクロール
                                    const needsScroll = filteredLines.length > visibleLines;
                                    const containerStyle = needsScroll
                                      ? { maxHeight: `${adjustedViewportHeight}px`, overflowY: 'auto' as const }
                                      : undefined;

                                    return (
                                      <div
                                        ref={(ref) => {
                                          if (ref) {
                                            scrollContainerRefs.current.set(file.id, ref);
                                          }
                                        }}
                                        style={containerStyle}
                                        onScroll={(e) => {
                                          // 通常スクロールの位置をrefに保存（頻繁な再レンダリングを防ぐ）
                                          const target = e.target as HTMLDivElement;
                                          scrollTopsRef.current.set(file.id, target.scrollTop);
                                        }}
                                      >
                                        {filteredLines.map(({ line, originalIndex }) => (
                                          <LineRow
                                            key={originalIndex}
                                            line={line}
                                            originalIndex={originalIndex}
                                            wrapLines={wrapLines}
                                            isSelected={selectedLines.has(originalIndex)}
                                            hasSelection={selectedLines.size > 0}
                                            onLineNumberMouseDown={handleLineNumberMouseDown}
                                            onLineNumberMouseEnter={handleLineNumberMouseEnter}
                                            onLineNumberKeyDown={handleLineNumberKeyDown}
                                            isDraggingLineSelection={isDraggingLineSelection}
                                            renderLineContent={renderLineContent}
                                            isPinned={false}
                                            onTogglePin={handleTogglePin}
                                            pinLabel={t("pin.pin")}
                                            unpinLabel={t("pin.unpin")}
                                          />
                                        ))}
                                      </div>
                                    );
                                  })()
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}

          {/* 空の状態 */}
          {files.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t("emptyState")}</p>
            </div>
          )}
        </div>
      </div>

      {/* 検索ヘルプフローティングボックス */}
      {showRegexHelp && (
        <div
          ref={helpBoxRef}
          style={{
            left: helpBoxPosition.x,
            top: helpBoxPosition.y,
          }}
          className="fixed w-80 bg-gray-900 text-white text-xs rounded-lg shadow-2xl z-50 select-none"
        >
          {/* ヘッダー（ドラッグハンドル） */}
          <div
            onMouseDown={handleHelpBoxMouseDown}
            className="flex items-center justify-between p-2 bg-gray-800 rounded-t-lg cursor-move border-b border-gray-700"
          >
            <span className="font-semibold">{t("filter.searchHelp.title")}</span>
            <button
              type="button"
              onClick={() => setShowRegexHelp(false)}
              className="p-1 rounded hover:bg-gray-700 transition-colors"
              aria-label={t("filter.searchHelp.close")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* コンテンツ */}
          <div className="p-3">
            {/* 列フィルタヘルプ */}
            <div className="font-semibold mb-1">{t("filter.columnHelp.title")}</div>
            <div className="space-y-1 font-mono text-[11px] mb-3">
              <div>{t("filter.columnHelp.example1")}</div>
              <div>{t("filter.columnHelp.example2")}</div>
              <div>{t("filter.columnHelp.example3")}</div>
              <div>{t("filter.columnHelp.example4")}</div>
              <div>{t("filter.columnHelp.example5")}</div>
            </div>

            {/* 正規表現パターン */}
            <div className="font-semibold mb-1">{t("filter.regexHelp.title")}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
              <div>{t("filter.regexHelp.dot")}</div>
              <div>{t("filter.regexHelp.asterisk")}</div>
              <div>{t("filter.regexHelp.plus")}</div>
              <div>{t("filter.regexHelp.question")}</div>
              <div>{t("filter.regexHelp.caret")}</div>
              <div>{t("filter.regexHelp.dollar")}</div>
              <div>{t("filter.regexHelp.charClass")}</div>
              <div>{t("filter.regexHelp.negCharClass")}</div>
              <div>{t("filter.regexHelp.digit")}</div>
              <div>{t("filter.regexHelp.word")}</div>
              <div>{t("filter.regexHelp.space")}</div>
              <div>{t("filter.regexHelp.or")}</div>
              <div>{t("filter.regexHelp.group")}</div>
            </div>
            <div className="font-semibold mt-3 mb-1">{t("filter.regexHelp.examples")}</div>
            <div className="space-y-1 font-mono text-[11px]">
              <div>{t("filter.regexHelp.exampleError")}</div>
              <div>{t("filter.regexHelp.exampleIp")}</div>
              <div>{t("filter.regexHelp.exampleTime")}</div>
            </div>
          </div>
        </div>
      )}

      {/* テキスト選択コピーポップアップ */}
      {textSelection && (
        <div
          data-text-copy-popup
          style={{
            position: 'fixed',
            left: textSelection.position.x,
            top: textSelection.position.y,
            transform: 'translate(-50%, -100%)',
          }}
          className="z-50 flex gap-1"
        >
          {/* コピーボタン */}
          <Button
            variant={textSelectionCopied ? "outline" : "default"}
            size="sm"
            onClick={copyTextSelection}
            disabled={textSelectionCopied}
            className={`h-7 text-xs shadow-lg transition-colors ${
              textSelectionCopied
                ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400"
                : ""
            }`}
          >
            {textSelectionCopied ? (
              <Check className="w-3.5 h-3.5 mr-1" />
            ) : (
              <Copy className="w-3.5 h-3.5 mr-1" />
            )}
            {textSelectionCopied ? tCommon("copied") : t("selection.copyText")}
          </Button>

          {/* 検索ボタン（ドロップダウンメニュー） */}
          {files.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs shadow-lg"
                >
                  <Search className="w-3.5 h-3.5 mr-1" />
                  {t("selection.searchActions")}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {/* 単一ファイルの場合：直接検索/OR追加/AND追加 */}
                {files.length === 1 ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        if (activeFileId) {
                          handleSearchInFile(activeFileId, textSelection.text);
                        }
                      }}
                      className="text-xs"
                    >
                      {t("selection.searchThis")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleAddOrCondition(textSelection.text)}
                      className="text-xs"
                    >
                      {t("selection.addOr")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAddAndCondition(textSelection.text)}
                      className="text-xs"
                    >
                      {t("selection.addAnd")}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    {/* 複数ファイルの場合：ファイル選択 */}
                    {files.map((file) => (
                      <DropdownMenuItem
                        key={file.id}
                        onClick={() => handleSearchInFile(file.id, textSelection.text)}
                        className="text-xs"
                      >
                        <span className="truncate max-w-[200px]">
                          {file.alias ? `${file.alias} (${file.name})` : file.name}
                        </span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleAddOrCondition(textSelection.text)}
                      className="text-xs"
                    >
                      {t("selection.addOr")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAddAndCondition(textSelection.text)}
                      className="text-xs"
                    >
                      {t("selection.addAnd")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* フローティング別名編集 */}
      {editingAliasFileId && (() => {
        const editingFile = files.find(f => f.id === editingAliasFileId);
        return (
          <div
            style={{
              position: 'fixed',
              left: aliasInputPosition.x,
              top: aliasInputPosition.y,
            }}
            className="z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2"
          >
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap text-gray-600 dark:text-gray-400">
                {t("alias.label")}:
              </Label>
              <div className="relative">
                <Input
                  ref={aliasInputRef}
                  type="text"
                  placeholder={editingFile?.name || ""}
                  value={editingFile?.alias || ""}
                  onChange={(e) => updateAlias(editingAliasFileId, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      finishEditingAlias();
                    }
                  }}
                  onBlur={finishEditingAlias}
                  className="h-7 text-sm w-48 pr-7"
                />
                {editingFile?.alias && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // blur を防ぐ
                      updateAlias(editingAliasFileId, "");
                      aliasInputRef.current?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        updateAlias(editingAliasFileId, "");
                        aliasInputRef.current?.focus();
                      }
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={t("alias.clear")}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

        {/* フローティングメモ */}
        <FloatingMemo
          storageKey="necobox:floating-memo:text-viewer"
          isOpen={showMemo}
          onClose={() => setShowMemo(false)}
          translations={{
            title: t("memo.title"),
            placeholder: t("memo.placeholder"),
            clear: t("memo.clear"),
            clearConfirm: t("memo.clearConfirm"),
            copy: t("memo.copy"),
            copied: t("memo.copied"),
            close: t("memo.close"),
            resize: t("memo.resize"),
          }}
        />

        {/* HTTPステータスコードリファレンス */}
        <HttpStatusReference
          storageKey="necobox:http-status-ref:text-viewer"
          isOpen={showHttpStatusRef}
          onClose={() => setShowHttpStatusRef(false)}
          locale={locale}
          translations={{
            title: t("httpStatus.title"),
            close: t("httpStatus.close"),
            resize: t("httpStatus.resize"),
            search: t("httpStatus.search"),
            clearSearch: t("httpStatus.clearSearch"),
            copy: t("httpStatus.copy"),
            copied: t("httpStatus.copied"),
            noResults: t("httpStatus.noResults"),
            categories: {
              "1xx": t("httpStatus.categories.1xx"),
              "2xx": t("httpStatus.categories.2xx"),
              "3xx": t("httpStatus.categories.3xx"),
              "4xx": t("httpStatus.categories.4xx"),
              "5xx": t("httpStatus.categories.5xx"),
              non_standard: t("httpStatus.categories.non_standard"),
            },
          }}
        />
      </div>
    </TooltipProvider>
  );
}
