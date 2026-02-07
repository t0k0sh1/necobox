/**
 * テキスト処理ユーティリティ
 * テキストの統計、ケース変換、行操作などの純粋関数を提供
 */

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  nonEmptyLines: number;
  bytes: number;
}

export type CaseType =
  | "camelCase"
  | "snake_case"
  | "kebab-case"
  | "PascalCase"
  | "CONSTANT_CASE";

export type SortOrder = "asc" | "desc" | "reverse";

export type WrapPreset = "single-quote" | "double-quote" | "backtick" | "custom";

export type Delimiter = "tab" | "comma" | "space";

const DELIMITER_MAP: Record<Delimiter, string> = {
  tab: "\t",
  comma: ", ",
  space: " ",
};

const SPLIT_DELIMITER_MAP: Record<Delimiter, string> = {
  tab: "\t",
  comma: ",",
  space: " ",
};

/**
 * テキストの統計情報を計算する
 */
export function computeTextStats(text: string): TextStats {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const lines = text === "" ? 0 : text.split("\n").length;
  const nonEmptyLines =
    text === "" ? 0 : text.split("\n").filter((line) => line.trim() !== "").length;
  const bytes = new TextEncoder().encode(text).length;

  return { characters, charactersNoSpaces, words, lines, nonEmptyLines, bytes };
}

/**
 * テキストを単語に分割する
 * camelCase境界、_、-、スペースで分割し、連続大文字を正しく処理する
 * 例: "XMLParser" → ["XML", "Parser"]
 */
export function splitIntoWords(text: string): string[] {
  if (text.trim() === "") return [];

  // まず区切り文字（_、-、スペース）で分割
  const tokens = text.split(/[_\-\s]+/).filter((t) => t !== "");

  const words: string[] = [];
  for (const token of tokens) {
    // camelCase/PascalCase の境界で分割
    // 連続大文字: "XMLParser" → "XML" + "Parser"
    // 通常: "camelCase" → "camel" + "Case"
    const subWords = token
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1\0$2")
      .replace(/([a-z\d])([A-Z])/g, "$1\0$2")
      .split("\0");
    words.push(...subWords.filter((w) => w !== ""));
  }

  return words;
}

/**
 * テキストを指定のケースに変換する
 * 複数行テキストは各行を独立して変換する
 */
export function convertCase(text: string, targetCase: CaseType): string {
  if (text === "") return "";

  const lines = text.split("\n");
  return lines.map((line) => convertLineToCaseImpl(line, targetCase)).join("\n");
}

function convertLineToCaseImpl(line: string, targetCase: CaseType): string {
  if (line.trim() === "") return line;

  const words = splitIntoWords(line);
  if (words.length === 0) return line;

  switch (targetCase) {
    case "camelCase":
      return words
        .map((w, i) =>
          i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        .join("");
    case "snake_case":
      return words.map((w) => w.toLowerCase()).join("_");
    case "kebab-case":
      return words.map((w) => w.toLowerCase()).join("-");
    case "PascalCase":
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("");
    case "CONSTANT_CASE":
      return words.map((w) => w.toUpperCase()).join("_");
  }
}

/**
 * 各行の前後に文字列を付加する
 */
export function wrapLines(text: string, prefix: string, suffix: string): string {
  if (text === "") return "";
  const lines = text.split("\n");
  return lines.map((line) => `${prefix}${line}${suffix}`).join("\n");
}

/**
 * 複数行を区切り文字で1行に結合する
 */
export function joinLines(text: string, delimiter: Delimiter): string {
  if (text === "") return "";
  const sep = DELIMITER_MAP[delimiter];
  return text.split("\n").join(sep);
}

/**
 * 区切り文字で分割して複数行にする
 */
export function splitToLines(text: string, delimiter: Delimiter): string {
  if (text === "") return "";
  const sep = SPLIT_DELIMITER_MAP[delimiter];
  return text.split(sep).map((s) => s.trim()).join("\n");
}

/**
 * 重複行を除去する（最初の出現を残す）
 */
export function removeDuplicateLines(text: string): string {
  if (text === "") return "";
  const lines = text.split("\n");
  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    if (!seen.has(line)) {
      seen.add(line);
      result.push(line);
    }
  }

  return result.join("\n");
}

/**
 * 行をソートする
 */
export function sortLines(text: string, order: SortOrder): string {
  if (text === "") return "";
  const lines = text.split("\n");

  switch (order) {
    case "asc":
      return [...lines].sort((a, b) => a.localeCompare(b)).join("\n");
    case "desc":
      return [...lines].sort((a, b) => b.localeCompare(a)).join("\n");
    case "reverse":
      return [...lines].reverse().join("\n");
  }
}

/**
 * 各行の前後空白を除去する
 */
export function trimLines(text: string): string {
  if (text === "") return "";
  return text
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
}

/**
 * 空行を除去する（空白のみの行も空行として扱う）
 */
export function removeEmptyLines(text: string): string {
  if (text === "") return "";
  return text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .join("\n");
}
