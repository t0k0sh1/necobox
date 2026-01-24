import type { ReactNode } from "react";
import { createElement } from "react";

/**
 * 正規表現の特殊文字をエスケープ
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 正規表現パターンから空の代替（alternation）を除去
 * `|for` → `for`, `for|` → `for`, `for||while` → `for|while`
 */
export function removeEmptyAlternations(pattern: string): string {
  // 連続する | を単一の | に置換し、先頭と末尾の | を除去
  return pattern
    .replace(/\|{2,}/g, "|")  // || → |
    .replace(/^\|+/, "")      // 先頭の | を除去
    .replace(/\|+$/, "");     // 末尾の | を除去
}

/**
 * 行が検索パターンに（空でない）マッチを持つかどうかを判定
 * `for|` や `|for` のような空文字列にもマッチする正規表現の場合、
 * 空でないマッチがあるかどうかをチェックする
 */
export function hasNonEmptyMatch(
  line: string,
  searchText: string,
  isRegex: boolean
): boolean {
  if (!searchText.trim()) {
    return true;
  }

  try {
    let pattern = isRegex ? searchText : escapeRegex(searchText);

    // 正規表現モードの場合、空の代替を除去
    if (isRegex) {
      pattern = removeEmptyAlternations(pattern);
      if (!pattern) {
        return false;
      }
    }

    const regex = new RegExp(pattern, "gi");

    let match: RegExpExecArray | null;
    while ((match = regex.exec(line)) !== null) {
      // 空でないマッチが見つかった
      if (match[0].length > 0) {
        return true;
      }
      // 空文字列マッチの場合は次へ進む
      regex.lastIndex++;
    }

    return false;
  } catch {
    return false;
  }
}

export interface HighlightMatch {
  text: string;
  isMatch: boolean;
}

/**
 * テキストをマッチ部分と非マッチ部分に分割
 */
export function splitByMatches(
  line: string,
  searchText: string,
  isRegex: boolean
): HighlightMatch[] {
  if (!searchText.trim()) {
    return [{ text: line, isMatch: false }];
  }

  try {
    const pattern = isRegex ? searchText : escapeRegex(searchText);
    const regex = new RegExp(`(${pattern})`, "gi");
    const parts = line.split(regex);

    if (parts.length === 1) {
      return [{ text: line, isMatch: false }];
    }

    return parts
      .filter((part) => part !== "")
      .map((part) => ({
        text: part,
        isMatch: regex.test(part) || new RegExp(pattern, "gi").test(part),
      }));
  } catch {
    // 正規表現が無効な場合は分割しない
    return [{ text: line, isMatch: false }];
  }
}

/**
 * マッチ部分をハイライト表示用にReactNodeに変換
 */
export function highlightMatches(
  line: string,
  searchText: string,
  isRegex: boolean
): ReactNode {
  if (!searchText.trim() || !line) {
    return line || "\u00A0";
  }

  try {
    let pattern = isRegex ? searchText : escapeRegex(searchText);

    // 正規表現モードの場合、空の代替を除去
    if (isRegex) {
      pattern = removeEmptyAlternations(pattern);
      if (!pattern) {
        return line;
      }
    }

    const regex = new RegExp(pattern, "gi");

    if (!regex.test(line)) {
      return line;
    }

    // リセットして再度マッチを取得
    regex.lastIndex = 0;

    const result: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let keyIndex = 0;

    while ((match = regex.exec(line)) !== null) {
      // 空文字列マッチはスキップ（例: `for|` の末尾 `|` による空マッチ）
      if (match[0].length === 0) {
        regex.lastIndex++;
        continue;
      }

      // マッチ前のテキストを追加
      if (match.index > lastIndex) {
        result.push(line.slice(lastIndex, match.index));
      }

      // マッチ部分をハイライト
      result.push(
        createElement(
          "mark",
          {
            key: `highlight-${keyIndex++}`,
            className: "bg-yellow-200 dark:bg-yellow-700 rounded px-0.5",
          },
          match[0]
        )
      );

      lastIndex = match.index + match[0].length;
    }

    // 残りのテキストを追加
    if (lastIndex < line.length) {
      result.push(line.slice(lastIndex));
    }

    return result.length > 0 ? result : line;
  } catch {
    // 正規表現が無効な場合はそのまま返す
    return line;
  }
}
