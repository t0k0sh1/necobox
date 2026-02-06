"use client";

import type { DiffLine, DiffResult, WordDiff } from "@/lib/utils/diff-viewer";
import { formatUnifiedDiff } from "@/lib/utils/diff-viewer";

export type DiffViewMode = "side-by-side" | "inline" | "unified";

interface DiffDisplayProps {
  result: DiffResult;
  mode: DiffViewMode;
}

export function DiffDisplay({ result, mode }: DiffDisplayProps) {
  switch (mode) {
    case "side-by-side":
      return <SideBySideView lines={result.lines} />;
    case "inline":
      return <InlineView lines={result.lines} />;
    case "unified":
      return <UnifiedView result={result} />;
  }
}

// 単語差分のレンダリング
function WordDiffSpan({ diffs, type }: { diffs: WordDiff[]; type: "added" | "removed" }) {
  return (
    <>
      {diffs.map((d, i) => {
        if (d.type === "unchanged") {
          return <span key={i}>{d.value}</span>;
        }
        if (d.type === type) {
          return (
            <span
              key={i}
              className={
                type === "added"
                  ? "bg-green-300 dark:bg-green-700"
                  : "bg-red-300 dark:bg-red-700"
              }
            >
              {d.value}
            </span>
          );
        }
        return null;
      })}
    </>
  );
}

// 行のコンテンツ表示
function LineContent({ line }: { line: DiffLine }) {
  if (line.wordDiffs) {
    return (
      <WordDiffSpan
        diffs={line.wordDiffs}
        type={line.type === "added" ? "added" : "removed"}
      />
    );
  }
  return <>{line.content}</>;
}

// サイドバイサイド表示
function SideBySideView({ lines }: { lines: DiffLine[] }) {
  // removed/added をペアにして左右に配置
  const pairs: { left: DiffLine | null; right: DiffLine | null }[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.type === "unchanged") {
      pairs.push({ left: line, right: line });
      i++;
    } else if (line.type === "removed") {
      // removed の次に added がある場合はペアにする
      if (i + 1 < lines.length && lines[i + 1].type === "added") {
        pairs.push({ left: line, right: lines[i + 1] });
        i += 2;
      } else {
        pairs.push({ left: line, right: null });
        i++;
      }
    } else {
      // added のみ
      pairs.push({ left: null, right: line });
      i++;
    }
  }

  return (
    <div className="grid grid-cols-2 gap-0 border rounded-md overflow-hidden font-mono text-sm">
      {/* 左列ヘッダー */}
      <div className="bg-red-50 dark:bg-red-900/10 border-b border-r px-2 py-1 text-xs text-gray-500">
        Before
      </div>
      <div className="bg-green-50 dark:bg-green-900/10 border-b px-2 py-1 text-xs text-gray-500">
        After
      </div>

      {pairs.map((pair, idx) => (
        <div key={idx} className="contents">
          {/* 左 (before) */}
          <div
            className={`border-b border-r flex ${getLineBgClass(
              pair.left?.type ?? null
            )}`}
          >
            <span className="w-10 shrink-0 text-right pr-2 py-0.5 text-gray-400 select-none text-xs border-r bg-gray-50 dark:bg-gray-900">
              {pair.left?.lineNumberBefore ?? ""}
            </span>
            <span className="px-2 py-0.5 whitespace-pre-wrap break-all flex-1">
              {pair.left ? <LineContent line={pair.left} /> : ""}
            </span>
          </div>
          {/* 右 (after) */}
          <div
            className={`border-b flex ${getLineBgClass(
              pair.right?.type ?? null
            )}`}
          >
            <span className="w-10 shrink-0 text-right pr-2 py-0.5 text-gray-400 select-none text-xs border-r bg-gray-50 dark:bg-gray-900">
              {pair.right?.lineNumberAfter ?? ""}
            </span>
            <span className="px-2 py-0.5 whitespace-pre-wrap break-all flex-1">
              {pair.right ? <LineContent line={pair.right} /> : ""}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// インライン表示
function InlineView({ lines }: { lines: DiffLine[] }) {
  return (
    <div className="border rounded-md overflow-hidden font-mono text-sm">
      {lines.map((line, idx) => (
        <div
          key={idx}
          className={`flex border-b ${getLineBgClass(line.type)}`}
        >
          <span className="w-10 shrink-0 text-right pr-2 py-0.5 text-gray-400 select-none text-xs border-r bg-gray-50 dark:bg-gray-900">
            {line.lineNumberBefore ?? ""}
          </span>
          <span className="w-10 shrink-0 text-right pr-2 py-0.5 text-gray-400 select-none text-xs border-r bg-gray-50 dark:bg-gray-900">
            {line.lineNumberAfter ?? ""}
          </span>
          <span className="w-6 shrink-0 text-center py-0.5 text-gray-500 select-none">
            {line.type === "added"
              ? "+"
              : line.type === "removed"
                ? "-"
                : " "}
          </span>
          <span className="px-2 py-0.5 whitespace-pre-wrap break-all flex-1">
            <LineContent line={line} />
          </span>
        </div>
      ))}
    </div>
  );
}

// 統一形式表示
function UnifiedView({ result }: { result: DiffResult }) {
  const unified = formatUnifiedDiff(result);

  if (!unified) {
    return (
      <div className="border rounded-md p-4 text-center text-gray-500 text-sm font-mono">
        No differences
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden font-mono text-sm">
      {unified.split("\n").map((line, idx) => {
        let bgClass = "";
        if (line.startsWith("@@")) {
          bgClass = "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400";
        } else if (line.startsWith("+")) {
          bgClass = "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
        } else if (line.startsWith("-")) {
          bgClass = "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
        }

        return (
          <div
            key={idx}
            className={`px-3 py-0.5 border-b ${bgClass}`}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
}

function getLineBgClass(type: DiffLine["type"] | null): string {
  switch (type) {
    case "added":
      return "bg-green-50 dark:bg-green-900/20";
    case "removed":
      return "bg-red-50 dark:bg-red-900/20";
    default:
      return "";
  }
}
