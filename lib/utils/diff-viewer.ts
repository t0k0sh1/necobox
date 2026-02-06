/**
 * diff ビューアユーティリティ
 * 2テキストの差分計算、統計、フォーマット
 */

import { diffLines, diffWords } from "diff";

export type DiffLineType = "added" | "removed" | "unchanged";

export interface WordDiff {
  type: "added" | "removed" | "unchanged";
  value: string;
}

export interface DiffLine {
  type: DiffLineType;
  lineNumberBefore?: number;
  lineNumberAfter?: number;
  content: string;
  wordDiffs?: WordDiff[];
}

export interface DiffStats {
  addedLines: number;
  removedLines: number;
  unchangedLines: number;
}

export interface DiffResult {
  lines: DiffLine[];
  stats: DiffStats;
}

/**
 * 2テキストの差分を計算
 */
export function computeDiff(before: string, after: string): DiffResult {
  const changes = diffLines(before, after);
  const lines: DiffLine[] = [];
  let lineNumberBefore = 1;
  let lineNumberAfter = 1;

  for (const change of changes) {
    // 末尾の改行を除去してから行分割
    const content = change.value.endsWith("\n")
      ? change.value.slice(0, -1)
      : change.value;
    const splitLines = content.split("\n");

    for (const line of splitLines) {
      if (change.added) {
        lines.push({
          type: "added",
          lineNumberAfter: lineNumberAfter++,
          content: line,
        });
      } else if (change.removed) {
        lines.push({
          type: "removed",
          lineNumberBefore: lineNumberBefore++,
          content: line,
        });
      } else {
        lines.push({
          type: "unchanged",
          lineNumberBefore: lineNumberBefore++,
          lineNumberAfter: lineNumberAfter++,
          content: line,
        });
      }
    }
  }

  // 隣接する removed/added 行ペアに対して単語レベル差分を計算
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].type === "removed" && lines[i + 1].type === "added") {
      const wordDiffsRemoved: WordDiff[] = [];
      const wordDiffsAdded: WordDiff[] = [];
      const diffs = diffWords(lines[i].content, lines[i + 1].content);

      for (const d of diffs) {
        if (d.added) {
          wordDiffsAdded.push({ type: "added", value: d.value });
        } else if (d.removed) {
          wordDiffsRemoved.push({ type: "removed", value: d.value });
        } else {
          wordDiffsRemoved.push({ type: "unchanged", value: d.value });
          wordDiffsAdded.push({ type: "unchanged", value: d.value });
        }
      }

      lines[i].wordDiffs = wordDiffsRemoved;
      lines[i + 1].wordDiffs = wordDiffsAdded;
    }
  }

  const stats: DiffStats = {
    addedLines: lines.filter((l) => l.type === "added").length,
    removedLines: lines.filter((l) => l.type === "removed").length,
    unchangedLines: lines.filter((l) => l.type === "unchanged").length,
  };

  return { lines, stats };
}

/**
 * 単語レベルの差分を計算
 */
export function computeWordDiff(before: string, after: string): WordDiff[] {
  const diffs = diffWords(before, after);
  return diffs.map((d) => ({
    type: d.added ? "added" : d.removed ? "removed" : "unchanged",
    value: d.value,
  }));
}

/**
 * 統一形式(Unified diff)にフォーマット
 */
export function formatUnifiedDiff(result: DiffResult): string {
  const output: string[] = [];
  let i = 0;

  while (i < result.lines.length) {
    // unchanged行をスキップして、次の変更箇所を見つける
    if (result.lines[i].type === "unchanged") {
      i++;
      continue;
    }

    // コンテキスト行数（変更箇所の前後3行）
    const contextLines = 3;
    const hunkStart = Math.max(0, i - contextLines);
    let hunkEnd = i;

    // 連続する変更行と近いコンテキストをまとめる
    while (hunkEnd < result.lines.length) {
      if (result.lines[hunkEnd].type !== "unchanged") {
        hunkEnd++;
      } else {
        // 次の変更箇所が近ければまとめる
        let nextChange = hunkEnd;
        while (
          nextChange < result.lines.length &&
          result.lines[nextChange].type === "unchanged"
        ) {
          nextChange++;
        }
        if (nextChange < result.lines.length && nextChange - hunkEnd <= contextLines * 2) {
          hunkEnd = nextChange;
        } else {
          hunkEnd = Math.min(result.lines.length, hunkEnd + contextLines);
          break;
        }
      }
    }

    // ハンクヘッダーを計算
    const hunkLines = result.lines.slice(hunkStart, hunkEnd);
    const beforeStart =
      hunkLines.find((l) => l.lineNumberBefore !== undefined)?.lineNumberBefore ?? 1;
    const afterStart =
      hunkLines.find((l) => l.lineNumberAfter !== undefined)?.lineNumberAfter ?? 1;
    const beforeCount = hunkLines.filter(
      (l) => l.type === "unchanged" || l.type === "removed"
    ).length;
    const afterCount = hunkLines.filter(
      (l) => l.type === "unchanged" || l.type === "added"
    ).length;

    output.push(`@@ -${beforeStart},${beforeCount} +${afterStart},${afterCount} @@`);

    for (const line of hunkLines) {
      switch (line.type) {
        case "added":
          output.push(`+${line.content}`);
          break;
        case "removed":
          output.push(`-${line.content}`);
          break;
        default:
          output.push(` ${line.content}`);
          break;
      }
    }

    i = hunkEnd;
  }

  return output.join("\n");
}
